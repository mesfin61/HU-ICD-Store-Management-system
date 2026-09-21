const pool = require("../config/db");
const auditLog = require("./auditLog");

const inventoryReservation = {
  // =========================================================
  // INTERNAL RESERVATION OPERATION
  //
  // This performs the actual reservation using an existing
  // database client/transaction.
  //
  // IMPORTANT:
  // This should NOT be exposed directly as an HTTP endpoint.
  //
  // Administrator approval will call this operation so that:
  //
  // APPROVAL
  //   + STOCK REDUCTION
  //   + RESERVATION
  //   + INVENTORY LEDGER
  //   + AUDIT LOG
  //
  // all happen inside the same transaction.
  // =========================================================

  async reserveWithClient({
    client,
    requestId,
    requestItemId,
    quantity,
    performedBy,
  }) {
    if (!client) {
      throw new Error("DATABASE_CLIENT_REQUIRED");
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("INVALID_RESERVATION_QUANTITY");
    }

    if (!performedBy) {
      throw new Error("PERFORMED_BY_REQUIRED");
    }

    // -------------------------------------------------------
    // Lock request
    // -------------------------------------------------------

    const requestResult = await client.query(
      `
      SELECT
        id,
        status
      FROM requests
      WHERE id = $1
      FOR UPDATE
      `,
      [requestId],
    );

    const request = requestResult.rows[0];

    if (!request) {
      throw new Error("REQUEST_NOT_FOUND");
    }

    if (
      request.status !== "APPROVED" &&
      request.status !== "PARTIALLY_APPROVED"
    ) {
      throw new Error("REQUEST_NOT_APPROVED");
    }

    // -------------------------------------------------------
    // Lock request item
    // -------------------------------------------------------

    const requestItemResult = await client.query(
      `
      SELECT
        id,
        request_id,
        item_id,
        quantity_requested,
        quantity_approved
      FROM request_items
      WHERE id = $1
        AND request_id = $2
      FOR UPDATE
      `,
      [requestItemId, requestId],
    );

    const requestItem = requestItemResult.rows[0];

    if (!requestItem) {
      throw new Error("REQUEST_ITEM_NOT_FOUND");
    }

    if (quantity > requestItem.quantity_approved) {
      throw new Error("RESERVATION_EXCEEDS_APPROVED_QUANTITY");
    }

    // -------------------------------------------------------
    // Check existing RESERVED quantity
    //
    // Prevents reserving more than the approved quantity
    // when reserveWithClient is called again.
    // -------------------------------------------------------

    const reservedResult = await client.query(
      `
      SELECT
        COALESCE(SUM(quantity), 0) AS reserved_quantity
      FROM inventory_reservations
      WHERE request_item_id = $1
        AND status = 'RESERVED'
      `,
      [requestItemId],
    );

    const alreadyReserved = Number(reservedResult.rows[0].reserved_quantity);

    const remainingApproved = requestItem.quantity_approved - alreadyReserved;

    if (quantity > remainingApproved) {
      throw new Error("APPROVED_QUANTITY_ALREADY_RESERVED");
    }

    // -------------------------------------------------------
    // Lock inventory item
    //
    // This is the critical stock lock.
    //
    // Two concurrent transactions attempting to reserve the
    // same inventory item cannot both modify current_stock
    // at the same time.
    // -------------------------------------------------------

    const itemResult = await client.query(
      `
      SELECT
        id,
        item_code,
        name,
        current_stock,
        physical_stock,
        is_active
      FROM items
      WHERE id = $1
      FOR UPDATE
      `,
      [requestItem.item_id],
    );

    const item = itemResult.rows[0];

    if (!item) {
      throw new Error("ITEM_NOT_FOUND");
    }

    if (!item.is_active) {
      throw new Error("ITEM_INACTIVE");
    }

    // -------------------------------------------------------
    // Inventory invariant
    //
    // Physical stock must always be >= available stock.
    // Neither value may be negative.
    //
    // Reservations reduce current_stock but never physical_stock.
    // -------------------------------------------------------

    if (
      Number(item.current_stock) < 0 ||
      Number(item.physical_stock) < 0 ||
      Number(item.current_stock) > Number(item.physical_stock)
    ) {
      throw new Error("INVENTORY_STATE_INCONSISTENT");
    }

    // -------------------------------------------------------
    // Verify available stock
    // -------------------------------------------------------

    if (Number(item.current_stock) < quantity) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    // -------------------------------------------------------
    // Reduce available stock
    //
    // current_stock represents inventory still available
    // for allocation.
    //
    // Once reserved, this quantity is no longer available
    // to another request.
    // -------------------------------------------------------

    const newStock = item.current_stock - quantity;

    await client.query(
      `
      UPDATE items
      SET
        current_stock = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [newStock, item.id],
    );

    // -------------------------------------------------------
    // Create reservation
    // -------------------------------------------------------

    const reservationResult = await client.query(
      `
      INSERT INTO inventory_reservations (
        request_id,
        request_item_id,
        item_id,
        quantity,
        quantity_remaining,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $4,
        'RESERVED'
      )
      RETURNING
        id,
        request_id,
        request_item_id,
        item_id,
        quantity,
        quantity_remaining,
        status,
        reserved_at,
        released_at
      `,
      [requestId, requestItemId, item.id, quantity],
    );

    const reservation = reservationResult.rows[0];

    // -------------------------------------------------------
    // AUDIT LOG
    //
    // This is NOT an inventory transaction.
    //
    // The audit log records:
    //   WHO performed the action
    //   WHAT entity was affected
    //   WHICH reservation was created
    //   WHAT data was created
    //
    // Because this uses the same client, the audit record is
    // part of the same database transaction.
    // -------------------------------------------------------

    await auditLog.create({
      client,
      userId: performedBy,
      action: "INVENTORY_RESERVED",
      entityName: "inventory_reservations",
      entityId: reservation.id,

      oldData: {
        item_id: item.id,
        current_stock: item.current_stock,
      },

      newData: {
        reservation_id: reservation.id,
        request_id: requestId,
        request_item_id: requestItemId,
        item_id: item.id,
        quantity,
        status: "RESERVED",
        current_stock: newStock,
      },
    });

    // -------------------------------------------------------
    // Permanent inventory ledger
    //
    // RESERVATION is NOT an ISSUE.
    //
    // The stock has been committed to the request but the
    // physical item has not yet left the store.
    // -------------------------------------------------------

    await client.query(
      `
      INSERT INTO inventory_transactions (
        item_id,
        transaction_type,
        quantity,
        reference_no,
        remarks,
        performed_by
      )
      VALUES (
        $1,
        'RESERVATION',
        $2,
        $3,
        $4,
        $5
      )
      `,
      [
        item.id,
        quantity,
        requestId,
        "Inventory reserved for approved request",
        performedBy,
      ],
    );

    // -------------------------------------------------------
    // Return created reservation
    // -------------------------------------------------------

    return reservation;
  },

  // =========================================================
  // STANDALONE RESERVATION
  //
  // Kept for internal/backend use where a transaction is not
  // already open.
  //
  // DO NOT expose this through an HTTP route.
  // =========================================================

  async reserve({ requestId, requestItemId, quantity, performedBy }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const reservation = await this.reserveWithClient({
        client,
        requestId,
        requestItemId,
        quantity,
        performedBy,
      });

      await client.query("COMMIT");

      return reservation;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  // =========================================================
  // FIND RESERVATIONS FOR REQUEST
  // =========================================================

  async findByRequestId(requestId) {
    const result = await pool.query(
      `
      SELECT
        ir.id,
        ir.request_id,
        ir.request_item_id,
        ir.item_id,

        i.item_code,
        i.name AS item_name,
        i.unit,

        ir.quantity,
        ir.status,
        ir.reserved_at,
        ir.released_at

      FROM inventory_reservations ir

      JOIN items i
        ON i.id = ir.item_id

      WHERE ir.request_id = $1

      ORDER BY ir.reserved_at ASC
      `,
      [requestId],
    );

    return result.rows;
  },
};

module.exports = inventoryReservation;
