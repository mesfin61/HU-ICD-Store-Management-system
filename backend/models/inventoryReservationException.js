const pool = require("../config/db");
const auditLog = require("./auditLog");
const inventoryItem = require("./inventoryItem");
const notification = require("./notification");

const inventoryReservationException = {
  // =========================================================
  // CREATE EXCEPTIONS FROM A RESERVATION CONFLICT
  //
  // One conflict can affect multiple reservations.
  //
  // Example:
  //
  // physical_stock = 10
  // current_stock  = 3
  //
  // reserved = 7
  //
  // manager removes 5
  //
  // conflict = 2 units of reserved stock
  //
  // Those 2 units are assigned against existing reservations.
  // =========================================================

  async createFromConflict({
    client,
    itemId,
    quantityAffected,
    reason,
    authorizedBy,
  }) {
    if (!client) {
      throw new Error("DATABASE_CLIENT_REQUIRED");
    }

    if (
      !Number.isInteger(quantityAffected) ||
      quantityAffected <= 0
    ) {
      throw new Error("INVALID_EXCEPTION_QUANTITY");
    }

    if (!reason || !reason.trim()) {
      throw new Error("EXCEPTION_REASON_REQUIRED");
    }

    if (!authorizedBy) {
      throw new Error("AUTHORIZED_BY_REQUIRED");
    }

    // -------------------------------------------------------
    // Lock reservations for this item.
    //
    // Oldest reservation first.
    // This makes the allocation deterministic.
    // -------------------------------------------------------

    const reservationResult = await client.query(
      `
      SELECT
        id,
        request_id,
        request_item_id,
        item_id,
        quantity,
        quantity_remaining,
        status
      FROM inventory_reservations
      WHERE item_id = $1
        AND status = 'RESERVED'
        AND quantity_remaining > 0
      ORDER BY reserved_at ASC, id ASC
      FOR UPDATE
      `,
      [itemId],
    );

    const reservations = reservationResult.rows;

    let remaining = quantityAffected;
    const createdExceptions = [];

    for (const reservation of reservations) {
      if (remaining <= 0) {
        break;
      }

      const affected = Math.min(
        remaining,
        Number(reservation.quantity_remaining),
      );

      const result = await client.query(
        `
        INSERT INTO inventory_reservation_exceptions (
          reservation_id,
          item_id,
          quantity_affected,
          reason,
          authorized_by,
          status,
          decision
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          'OPEN',
          'PENDING'
        )
        RETURNING
          id,
          reservation_id,
          item_id,
          quantity_affected,
          reason,
          authorized_by,
          status,
          decision,
          created_at
        `,
        [
          reservation.id,
          itemId,
          affected,
          reason.trim(),
          authorizedBy,
        ],
      );

      createdExceptions.push(result.rows[0]);

      remaining -= affected;
    }

    // -------------------------------------------------------
    // There must be enough reserved inventory to explain
    // the conflict.
    // -------------------------------------------------------

    if (remaining > 0) {
      throw new Error(
        "RESERVATION_EXCEPTION_QUANTITY_UNRESOLVED",
      );
    }

    return createdExceptions;
  },

  // =========================================================
  // FIND ONE EXCEPTION
  // =========================================================

  async findById(id) {
    const result = await pool.query(
      `
      SELECT
        e.id,
        e.reservation_id,
        e.item_id,
        i.item_code,
        i.name AS item_name,

        e.quantity_affected,
        e.reason,

        e.authorized_by,
        authorizer.full_name AS authorized_by_name,

        e.status,
        e.decision,

        e.created_at,
        e.resolved_at,

        e.resolved_by,
        resolver.full_name AS resolved_by_name,

        e.resolution_notes

      FROM inventory_reservation_exceptions e

      JOIN items i
        ON i.id = e.item_id

      JOIN users authorizer
        ON authorizer.id = e.authorized_by

      LEFT JOIN users resolver
        ON resolver.id = e.resolved_by

      WHERE e.id = $1
      `,
      [id],
    );

    return result.rows[0] || null;
  },

  // =========================================================
  // FIND OPEN EXCEPTIONS
  // =========================================================

  async findOpen() {
    const result = await pool.query(
      `
      SELECT
        e.id,
        e.reservation_id,
        e.item_id,

        i.item_code,
        i.name AS item_name,

        e.quantity_affected,
        e.reason,

        e.authorized_by,
        authorizer.full_name AS authorized_by_name,

        e.status,
        e.decision,

        e.created_at

      FROM inventory_reservation_exceptions e

      JOIN items i
        ON i.id = e.item_id

      JOIN users authorizer
        ON authorizer.id = e.authorized_by

      WHERE e.status = 'OPEN'
        AND e.decision = 'PENDING'

      ORDER BY e.created_at ASC
      `,
    );

    return result.rows;
  },

  // =========================================================
  // APPROVE EXCEPTION
  //
  // THIS IS THE CRITICAL OVERRIDE OPERATION.
  //
  // Everything happens inside ONE transaction:
  //
  // exception approval
  // reservation adjustment
  // physical stock adjustment
  // current stock adjustment
  // inventory ledger
  // audit log
  //
  // If anything fails -> EVERYTHING rolls back.
  // =========================================================

  async approve({
    exceptionId,
    administratorId,
    resolutionNotes,
  }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // -----------------------------------------------------
      // Lock exception
      // -----------------------------------------------------

      const exceptionResult = await client.query(
        `
        SELECT
          id,
          reservation_id,
          item_id,
          quantity_affected,
          reason,
          status,
          decision
        FROM inventory_reservation_exceptions
        WHERE id = $1
        FOR UPDATE
        `,
        [exceptionId],
      );

      const exception =
        exceptionResult.rows[0];

      if (!exception) {
        throw new Error(
          "EXCEPTION_NOT_FOUND",
        );
      }

      if (exception.status !== "OPEN") {
        throw new Error(
          "EXCEPTION_ALREADY_RESOLVED",
        );
      }

      if (exception.decision !== "PENDING") {
        throw new Error(
          "EXCEPTION_ALREADY_DECIDED",
        );
      }

      // -----------------------------------------------------
      // Lock reservation
      // -----------------------------------------------------

      const reservationResult =
        await client.query(
          `
          SELECT
            id,
            item_id,
            quantity,
            quantity_remaining,
            status
          FROM inventory_reservations
          WHERE id = $1
          FOR UPDATE
          `,
          [exception.reservation_id],
        );

      const reservation =
        reservationResult.rows[0];

      if (!reservation) {
        throw new Error(
          "RESERVATION_NOT_FOUND",
        );
      }

      if (
        reservation.status !== "RESERVED"
      ) {
        throw new Error(
          "RESERVATION_NOT_ACTIVE",
        );
      }

      if (
        Number(reservation.quantity_remaining) <
        Number(exception.quantity_affected)
      ) {
        throw new Error(
          "RESERVATION_QUANTITY_INCONSISTENT",
        );
      }

      // -----------------------------------------------------
      // Lock inventory item
      // -----------------------------------------------------

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
        [exception.item_id],
      );

      const item = itemResult.rows[0];

      if (!item) {
        throw new Error("ITEM_NOT_FOUND");
      }

      if (!item.is_active) {
        throw new Error("ITEM_INACTIVE");
      }

      const quantity = Number(
        exception.quantity_affected,
      );

      const oldPhysicalStock = Number(
        item.physical_stock,
      );

      const oldCurrentStock = Number(
        item.current_stock,
      );

      if (quantity > oldPhysicalStock) {
        throw new Error(
          "INSUFFICIENT_PHYSICAL_STOCK",
        );
      }

      // -----------------------------------------------------
      // The affected quantity was reserved.
      //
      // current_stock has ALREADY excluded it.
      //
      // Therefore:
      //
      // current_stock stays unchanged.
      //
      // physical_stock decreases.
      //
      // reservation quantity_remaining decreases.
      // -----------------------------------------------------

      const newPhysicalStock =
        oldPhysicalStock - quantity;

      const newCurrentStock =
        oldCurrentStock;

      // -----------------------------------------------------
      // Update inventory.
      // -----------------------------------------------------

      await client.query(
        `
        UPDATE items
        SET
          physical_stock = $1,
          current_stock = $2,
          updated_at = NOW()
        WHERE id = $3
        `,
        [
          newPhysicalStock,
          newCurrentStock,
          item.id,
        ],
      );

      // -----------------------------------------------------
      // Update reservation.
      // -----------------------------------------------------

      const newRemaining =
        Number(
          reservation.quantity_remaining,
        ) - quantity;

      const newReservationStatus =
        newRemaining === 0
          ? "CANCELLED"
          : "RESERVED";

      await client.query(
        `
        UPDATE inventory_reservations
        SET
          quantity_remaining = $1,
          status = $2,
          released_at =
            CASE
              WHEN $2 = 'CANCELLED'
              THEN NOW()
              ELSE released_at
            END
        WHERE id = $3
        `,
        [
          newRemaining,
          newReservationStatus,
          reservation.id,
        ],
      );

      // -----------------------------------------------------
      // Inventory ledger.
      //
      // This is a physical stock OUT.
      // -----------------------------------------------------

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
          'RESERVATION_EXCEPTION_OUT',
          $2,
          $3,
          $4,
          $5
        )
        `,
        [
          item.id,
          quantity,
          exception.id,
          exception.reason,
          administratorId,
        ],
      );

      // -----------------------------------------------------
      // Resolve exception.
      // -----------------------------------------------------

      const resolvedResult =
        await client.query(
          `
          UPDATE inventory_reservation_exceptions
          SET
            decision = 'APPROVED',
            status = 'RESOLVED',
            resolved_at = NOW(),
            resolved_by = $1,
            resolution_notes = $2
          WHERE id = $3
          RETURNING
            id,
            reservation_id,
            item_id,
            quantity_affected,
            reason,
            authorized_by,
            status,
            decision,
            created_at,
            resolved_at,
            resolved_by,
            resolution_notes
          `,
          [
            administratorId,
            resolutionNotes?.trim() || null,
            exceptionId,
          ],
        );

      // -----------------------------------------------------
      // Audit.
      // -----------------------------------------------------

      await auditLog.create({
        client,
        userId: administratorId,
        action: "RESERVATION_EXCEPTION_APPROVED",
        entityName:
          "inventory_reservation_exceptions",
        entityId: exceptionId,

        oldData: {
          status: "OPEN",
          decision: "PENDING",
          reservation_id:
            reservation.id,
          quantity_affected: quantity,
        },

        newData: {
          status: "RESOLVED",
          decision: "APPROVED",
          reservation_id:
            reservation.id,
          quantity_affected: quantity,
          physical_stock_before:
            oldPhysicalStock,
          physical_stock_after:
            newPhysicalStock,
          reservation_quantity_remaining:
            newRemaining,
          reservation_status:
            newReservationStatus,
          resolved_by: administratorId,
          resolution_notes:
            resolutionNotes?.trim() || null,
        },
      });

      // =====================================================
      // NOTIFICATIONS
      //
      // The exception approval is part of the same database
      // transaction.
      //
      // Therefore both notifications roll back automatically
      // if the exception approval fails.
      //
      // We notify:
      //
      // 1. The requester whose reservation was affected.
      // 2. The administrator who successfully approved the
      //    exception.
      // =====================================================

      // -----------------------------------------------------
      // FIND REQUESTER
      // -----------------------------------------------------

      const requesterResult = await client.query(
        `
        SELECT
          r.id,
          r.requester_id,
          u.full_name AS requester_name
        FROM requests r
        JOIN users u
          ON u.id = r.requester_id
        WHERE r.id = (
          SELECT request_id
          FROM inventory_reservations
          WHERE id = $1
        )
        `,
        [reservation.id],
      );

      const requester =
        requesterResult.rows[0];

      if (!requester) {
        throw new Error(
          "REQUESTER_NOT_FOUND",
        );
      }

      // -----------------------------------------------------
      // REQUESTER NOTIFICATION
      //
      // The requester needs to know that part of their
      // reserved inventory was lost/removed because an
      // administrator approved the reservation exception.
      // -----------------------------------------------------

      await notification.createWithClient({
        client,

        userId:
          requester.requester_id,

        title:
          "Reserved inventory affected",

        message:
          `${quantity} ${item.unit || "pcs"} of ${item.name} ` +
          `from your reservation was affected by an approved ` +
          `inventory exception. ` +
          `Reason: ${exception.reason}. ` +
          `Remaining reserved quantity: ${newRemaining}.`,
      });

      // -----------------------------------------------------
      // ADMINISTRATOR NOTIFICATION
      //
      // Confirms that THEIR exception approval operation
      // succeeded.
      // -----------------------------------------------------

      await notification.createWithClient({
        client,

        userId:
          administratorId,

        title:
          "Reservation exception approved",

        message:
          `Reservation exception ${exception.id} was approved ` +
          `successfully. ${quantity} ${item.unit || "pcs"} of ` +
          `${item.name} was removed from physical inventory ` +
          `and the affected reservation was updated.`,
      });

      await client.query("COMMIT");

      return resolvedResult.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  // =========================================================
  // REJECT EXCEPTION
  //
  // Nothing happens to inventory.
  // Nothing happens to reservation.
  //
  // Only exception state changes.
  // =========================================================

  async reject({
    exceptionId,
    administratorId,
    resolutionNotes,
  }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `
        SELECT
          id,
          reservation_id,
          item_id,
          quantity_affected,
          status,
          decision
        FROM inventory_reservation_exceptions
        WHERE id = $1
        FOR UPDATE
        `,
        [exceptionId],
      );

      const exception = result.rows[0];

      if (!exception) {
        throw new Error(
          "EXCEPTION_NOT_FOUND",
        );
      }

      if (exception.status !== "OPEN") {
        throw new Error(
          "EXCEPTION_ALREADY_RESOLVED",
        );
      }

      if (exception.decision !== "PENDING") {
        throw new Error(
          "EXCEPTION_ALREADY_DECIDED",
        );
      }

      const resolved =
        await client.query(
          `
          UPDATE inventory_reservation_exceptions
          SET
            decision = 'REJECTED',
            status = 'RESOLVED',
            resolved_at = NOW(),
            resolved_by = $1,
            resolution_notes = $2
          WHERE id = $3
          RETURNING
            id,
            reservation_id,
            item_id,
            quantity_affected,
            reason,
            authorized_by,
            status,
            decision,
            created_at,
            resolved_at,
            resolved_by,
            resolution_notes
          `,
          [
            administratorId,
            resolutionNotes?.trim() || null,
            exceptionId,
          ],
        );

      await auditLog.create({
        client,
        userId: administratorId,
        action: "RESERVATION_EXCEPTION_REJECTED",
        entityName:
          "inventory_reservation_exceptions",
        entityId: exceptionId,

        oldData: {
          status: "OPEN",
          decision: "PENDING",
        },

        newData: {
          status: "RESOLVED",
          decision: "REJECTED",
          resolved_by: administratorId,
          resolution_notes:
            resolutionNotes?.trim() || null,
        },
      });

      await client.query("COMMIT");

      return resolved.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};

module.exports = inventoryReservationException;