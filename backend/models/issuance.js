const pool = require("../config/db");
const auditLog = require("./auditLog");
const notification = require("./notification");

const issuance = {
  // =========================================================
  // ISSUE RESERVED INVENTORY
  //
  // INVENTORY INVARIANT
  //
  // Reservation already subtracts the reserved quantity from
  // items.current_stock.
  //
  // Therefore ISSUANCE MUST NEVER modify current_stock.
  //
  // Flow:
  //
  // APPROVAL
  //    ↓
  // RESERVATION
  //    ↓
  // current_stock decreases
  //    ↓
  // ISSUANCE
  //    ↓
  // quantity_issued increases
  // reservation.quantity_remaining decreases
  // reservation may become FULFILLED
  //   physical_stock decreases
  // issued_items created
  // ISSUE ledger created
  // audit log created
  //
  // Everything happens inside ONE database transaction.
  // =========================================================

  async issue({ requestId, requestItemId, quantity, issuedBy, dueDate }) {
    // -------------------------------------------------------
    // Basic input validation
    // -------------------------------------------------------

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("INVALID_ISSUE_QUANTITY");
    }

    if (!issuedBy) {
      throw new Error("ISSUED_BY_REQUIRED");
    }

    if (!requestId) {
      throw new Error("REQUEST_ID_REQUIRED");
    }

    if (!requestItemId) {
      throw new Error("REQUEST_ITEM_ID_REQUIRED");
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // =======================================================
      // 1. LOCK REQUEST
      // =======================================================

      const requestResult = await client.query(
        `
        SELECT
          id,
          requester_id,
          status
        FROM requests
        WHERE id = $1
        FOR UPDATE
        `,
        [requestId],
      );

      const foundRequest = requestResult.rows[0];

      if (!foundRequest) {
        throw new Error("REQUEST_NOT_FOUND");
      }

      if (
        foundRequest.status !== "APPROVED" &&
        foundRequest.status !== "PARTIALLY_APPROVED"
      ) {
        throw new Error("REQUEST_NOT_READY_FOR_ISSUANCE");
      }

      // =======================================================
      // 2. LOCK REQUEST ITEM
      //
      // This prevents two issuance operations from modifying
      // the same request item simultaneously.
      // =======================================================

      const requestItemResult = await client.query(
        `
        SELECT
          id,
          request_id,
          item_id,
          quantity_requested,
          quantity_approved,
          quantity_issued
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

      const quantityApproved = Number(requestItem.quantity_approved || 0);

      const quantityIssued = Number(requestItem.quantity_issued || 0);

      // =======================================================
      // 3. CALCULATE REMAINING APPROVED QUANTITY
      // =======================================================

      const remainingApproved = quantityApproved - quantityIssued;

      if (remainingApproved <= 0) {
        throw new Error("REQUEST_ITEM_ALREADY_ISSUED");
      }

      if (quantity > remainingApproved) {
        throw new Error("ISSUE_EXCEEDS_REMAINING_APPROVED");
      }

      // =======================================================
      // 4. VERIFY INVENTORY ITEM
      //
      // Issuance does NOT modify current_stock.
      //
      // Reservation already reduced current_stock.
      // =======================================================

      const itemResult = await client.query(
        `
        SELECT
          id,
          item_code,
          name,
          unit,
          is_asset,
          is_active,
          current_stock,
          physical_stock
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

      const currentStock = Number(item.current_stock);

      const physicalStock = Number(item.physical_stock);

      if (
        !Number.isInteger(currentStock) ||
        currentStock < 0 ||
        !Number.isInteger(physicalStock) ||
        physicalStock < 0 ||
        currentStock > physicalStock
      ) {
        throw new Error("INVENTORY_STATE_INCONSISTENT");
      }

      if (physicalStock < quantity) {
        throw new Error("INSUFFICIENT_PHYSICAL_STOCK");
      }

      const newPhysicalStock = physicalStock - quantity;

      await client.query(
        `
        UPDATE items
        SET
          physical_stock = $1,
          updated_at = NOW()
        WHERE id = $2
        `,
        [newPhysicalStock, item.id],
      );

      // =======================================================
      // 5. LOCK ACTIVE RESERVATIONS
      //
      // IMPORTANT:
      //
      // We use quantity_remaining, NOT quantity.
      //
      // quantity:
      //     Original amount reserved.
      //
      // quantity_remaining:
      //     Amount still reserved and available to issue.
      //
      // Example:
      //
      // quantity = 10
      // quantity_remaining = 4
      //
      // Only 4 can still be issued from this reservation.
      // =======================================================

      const reservationsResult = await client.query(
        `
        SELECT
          id,
          request_id,
          request_item_id,
          item_id,
          quantity,
          quantity_remaining,
          status,
          reserved_at
        FROM inventory_reservations
        WHERE request_item_id = $1
          AND request_id = $2
          AND item_id = $3
          AND status = 'RESERVED'
          AND quantity_remaining > 0
        ORDER BY reserved_at ASC, id ASC
        FOR UPDATE
        `,
        [requestItemId, requestId, requestItem.item_id],
      );

      const reservations = reservationsResult.rows;

      // =======================================================
      // 6. CALCULATE TOTAL RESERVED REMAINING
      // =======================================================

      const totalReservedRemaining = reservations.reduce(
        (total, reservation) => total + Number(reservation.quantity_remaining),
        0,
      );

      const reservedStockFromItems = physicalStock - currentStock;

      if (totalReservedRemaining !== reservedStockFromItems) {
        throw new Error("INVENTORY_STATE_INCONSISTENT");
      }

      if (quantity > reservedStockFromItems) {
        throw new Error("INSUFFICIENT_RESERVED_QUANTITY");
      }

      if (totalReservedRemaining < quantity) {
        throw new Error("INSUFFICIENT_RESERVED_QUANTITY");
      }

      const newQuantityIssued = quantityIssued + quantity;

      const requestItemUpdate = await client.query(
        `
          UPDATE request_items
          SET
            quantity_issued = $1
          WHERE id = $2
          `,
        [newQuantityIssued, requestItemId],
      );

      if (requestItemUpdate.rowCount !== 1) {
        throw new Error("REQUEST_ITEM_UPDATE_FAILED");
      }

      // =======================================================
      // 7. CREATE ISSUED ITEM
      // =======================================================

      const issuedResult = await client.query(
        `
        INSERT INTO issued_items (
          request_id,
          request_item_id,
          item_id,
          issued_to,
          issued_by,
          quantity,
          due_date
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )
        RETURNING
          id,
          request_id,
          request_item_id,
          item_id,
          issued_to,
          issued_by,
          quantity,
          issued_date,
          due_date,
          returned
        `,
        [
          requestId,
          requestItemId,
          requestItem.item_id,
          foundRequest.requester_id,
          issuedBy,
          quantity,
          dueDate || null,
        ],
      );

      const issuedItem = issuedResult.rows[0];

      // =======================================================
      // 8. UPDATE quantity_issued
      //
      // request_items is locked, so concurrent issuance cannot
      // bypass this calculation.
      // =======================================================

      if (newQuantityIssued > quantityApproved) {
        throw new Error("ISSUE_EXCEEDS_REMAINING_APPROVED");
      }

      await client.query(
        `
        UPDATE request_items
        SET
          quantity_issued = $1
        WHERE id = $2
        `,
        [newQuantityIssued, requestItemId],
      );

      // =======================================================
      // 9. CONSUME RESERVATIONS
      //
      // Reservations are consumed FIFO.
      //
      // Example:
      //
      // Reservation A:
      // quantity = 10
      // quantity_remaining = 6
      //
      // Reservation B:
      // quantity = 5
      // quantity_remaining = 5
      //
      // Issue 8:
      //
      // A becomes:
      // quantity_remaining = 0
      // status = FULFILLED
      //
      // B becomes:
      // quantity_remaining = 3
      // status = RESERVED
      //
      // This is now accurately represented in the database.
      // =======================================================

      let quantityToConsume = quantity;

      const consumedReservations = [];

      for (const reservation of reservations) {
        if (quantityToConsume <= 0) {
          break;
        }

        const reservationRemaining = Number(reservation.quantity_remaining);

        const quantityConsumed = Math.min(
          quantityToConsume,
          reservationRemaining,
        );

        const newQuantityRemaining = reservationRemaining - quantityConsumed;

        let newReservationStatus = reservation.status;

        let releasedAt = null;

        if (newQuantityRemaining === 0) {
          newReservationStatus = "FULFILLED";
          releasedAt = new Date();
        }

        await client.query(
          `
          UPDATE inventory_reservations
          SET
            quantity_remaining = $1,
            status = $2,
            released_at = $3
          WHERE id = $4
          `,
          [
            newQuantityRemaining,
            newReservationStatus,
            releasedAt,
            reservation.id,
          ],
        );

        consumedReservations.push({
          reservationId: reservation.id,
          quantityOriginal: Number(reservation.quantity),
          quantityRemainingBefore: reservationRemaining,
          quantityConsumed,
          quantityRemainingAfter: newQuantityRemaining,
          statusBefore: reservation.status,
          statusAfter: newReservationStatus,
        });

        quantityToConsume -= quantityConsumed;
      }

      // =======================================================
      // 10. SAFETY CHECK
      //
      // This should never fail because totalReservedRemaining
      // was verified above.
      //
      // Keep the check anyway because this is an inventory
      // integrity boundary.
      // =======================================================

      if (quantityToConsume > 0) {
        throw new Error("RESERVATION_CONSUMPTION_FAILED");
      }

      // =======================================================
      // 11. ISSUE INVENTORY LEDGER
      //
      // This records the physical issuance.
      //
      // CRITICAL:
      //
      // DO NOT UPDATE items.current_stock.
      //
      // Reservation already reduced current_stock.
      // =======================================================

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
          'ISSUE',
          $2,
          $3,
          $4,
          $5
        )
        `,
        [
          requestItem.item_id,
          quantity,
          requestId,
          "Inventory issued for approved request",
          issuedBy,
        ],
      );

      // =======================================================
      // 12. DETERMINE REQUEST FULFILLMENT
      //
      // The request becomes FULFILLED only when every request
      // item has had its entire approved quantity issued.
      //
      // IMPORTANT:
      //
      // We do NOT invent a separate "ISSUANCE_IN_PROGRESS"
      // or "APPROVAL_INCOMPLETE" status.
      //
      // APPROVED means:
      //     Administrator fully approved the requested item
      //     quantities.
      //
      // PARTIALLY_APPROVED means:
      //     Administrator approved less than requested.
      //
      // Neither status describes physical issuance progress.
      // =======================================================

      const fulfillmentResult = await client.query(
        `
          SELECT
            COUNT(*) AS total_items,

            COUNT(*) FILTER (
              WHERE quantity_issued >= quantity_approved
            ) AS fully_issued_items

          FROM request_items
          WHERE request_id = $1
          `,
        [requestId],
      );

      const fulfillment = fulfillmentResult.rows[0];

      const totalItems = Number(fulfillment.total_items);

      const fullyIssuedItems = Number(fulfillment.fully_issued_items);

      let newRequestStatus;

      if (totalItems > 0 && fullyIssuedItems === totalItems) {
        newRequestStatus = "FULFILLED";
      } else {
        // Keep the administrator's original decision.
        //
        // APPROVED remains APPROVED.
        // PARTIALLY_APPROVED remains PARTIALLY_APPROVED.
        //
        // Issuance progress is represented by
        // request_items.quantity_issued, not by inventing
        // another request status.
        newRequestStatus = foundRequest.status;
      }

      // =======================================================
      // 13. UPDATE REQUEST STATUS ONLY IF NECESSARY
      // =======================================================

      if (newRequestStatus !== foundRequest.status) {
        await client.query(
          `
          UPDATE requests
          SET
            status = $1,
            updated_at = NOW()
          WHERE id = $2
          `,
          [newRequestStatus, requestId],
        );
      }

      // =======================================================
      // 14. AUDIT LOG
      //
      // Audit logging is part of the SAME transaction.
      //
      // If audit logging fails:
      //
      // issuance
      // + reservation consumption
      // + ledger
      // + request status
      //
      // all roll back together.
      // =======================================================

      await auditLog.create({
        client,
        userId: issuedBy,
        action: "INVENTORY_ISSUED",
        entityName: "issued_items",
        entityId: issuedItem.id,

        oldData: {
          request_id: requestId,
          request_item_id: requestItemId,
          item_id: requestItem.item_id,
          quantity_issued: quantityIssued,
          request_status: foundRequest.status,
        },

        newData: {
          issued_item_id: issuedItem.id,
          request_id: requestId,
          request_item_id: requestItemId,
          item_id: requestItem.item_id,

          quantity_issued_before: quantityIssued,

          quantity_issued_this_transaction: quantity,

          quantity_issued_after: newQuantityIssued,

          request_status_before: foundRequest.status,

          request_status_after: newRequestStatus,

          consumed_reservations: consumedReservations,
        },
      });

      // =======================================================
      // 15. NOTIFICATIONS
      //
      // Notifications MUST use the SAME database transaction.
      //
      // If issuance rolls back:
      //     notification also rolls back.
      //
      // Therefore users never receive a success notification
      // for an issuance that did not actually commit.
      // =======================================================

      const itemName = item.name;
      const itemUnit = item.unit || "pcs";

      const remainingToIssue = quantityApproved - newQuantityIssued;

      // -------------------------------------------------------
      // REQUESTER NOTIFICATION
      //
      // Confirms that the requester's inventory operation
      // actually succeeded.
      // -------------------------------------------------------

      await notification.createWithClient({
        client,

        userId: foundRequest.requester_id,

        title:
          newRequestStatus === "FULFILLED"
            ? "Request fulfilled"
            : "Inventory issued",

        message:
          newRequestStatus === "FULFILLED"
            ? `Your request has been completely fulfilled. ${quantity} ${itemUnit} of ${itemName} was issued successfully.`
            : `${quantity} ${itemUnit} of ${itemName} was issued successfully. ${remainingToIssue} ${itemUnit} remains to be issued for this requested item.`,
      });

      // -------------------------------------------------------
      // ISSUER / ADMINISTRATOR NOTIFICATION
      //
      // Confirms that THEIR issuance operation succeeded.
      //
      // This is intentionally separate from the requester
      // notification because the two users need different
      // information.
      // -------------------------------------------------------

      await notification.createWithClient({
        client,

        userId: issuedBy,

        title: "Inventory issuance completed",

        message:
          newRequestStatus === "FULFILLED"
            ? `Issuance completed successfully. ${quantity} ${itemUnit} of ${itemName} was issued and request ${requestId} is now fully fulfilled.`
            : `Issuance completed successfully. ${quantity} ${itemUnit} of ${itemName} was issued for request ${requestId}. ${remainingToIssue} ${itemUnit} remains to be issued.`,
      });

      // =======================================================
      // 15. COMMIT EVERYTHING
      // =======================================================

      await client.query("COMMIT");

      // =======================================================
      // RETURN RESULT
      // =======================================================

      return {
        issuedItem,

        requestStatus: newRequestStatus,

        quantityApproved,

        quantityIssued: newQuantityIssued,

        remainingToIssue: quantityApproved - newQuantityIssued,

        consumedReservations,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  // =========================================================
  // GET ISSUANCES FOR REQUEST
  // =========================================================

  async findByRequestId(requestId) {
    const result = await pool.query(
      `
      SELECT
        ii.id,

        ii.request_id,
        ii.request_item_id,
        ii.item_id,

        i.item_code,
        i.name AS item_name,
        i.unit,

        ii.issued_to,
        recipient.full_name AS issued_to_name,

        ii.issued_by,
        issuer.full_name AS issued_by_name,

        ii.quantity,
        ii.issued_date,
        ii.due_date,
        ii.returned

      FROM issued_items ii

      JOIN items i
        ON i.id = ii.item_id

      JOIN users recipient
        ON recipient.id = ii.issued_to

      JOIN users issuer
        ON issuer.id = ii.issued_by

      WHERE ii.request_id = $1

      ORDER BY ii.issued_date ASC
      `,
      [requestId],
    );

    return result.rows;
  },

  // =========================================================
  // GET ALL CURRENTLY ISSUED INVENTORY
  //
  // Store Manager use.
  //
  // Returns issued inventory that has not been fully returned.
  //
  // Partial returns are included because issued_items.returned
  // remains FALSE until the entire issued quantity is returned.
  // =========================================================

  async findOutstandingIssuedItems() {
    const result = await pool.query(
      `
    SELECT
      ii.id,
      ii.request_id,
      ii.request_item_id,
      ii.item_id,

      i.item_code,
      i.name AS item_name,
      i.unit,

      d.name AS department_name,

      ii.issued_to,
      recipient.full_name AS issued_to_name,
      recipient.email AS issued_to_email,

      ii.issued_by,
      issuer.full_name AS issued_by_name,

      ii.quantity AS quantity_issued,
      ii.issued_date,
      ii.due_date,
      ii.returned,

      COALESCE(
        (
          SELECT
            SUM(ir.quantity_returned)
          FROM item_returns ir
          WHERE ir.issued_item_id = ii.id
        ),
        0
      ) AS quantity_returned

    FROM issued_items ii

    JOIN items i
      ON i.id = ii.item_id

    JOIN users recipient
      ON recipient.id = ii.issued_to

    JOIN users issuer
      ON issuer.id = ii.issued_by

    JOIN requests r
      ON r.id = ii.request_id

    JOIN departments d
      ON d.id = r.department_id  

    WHERE ii.returned = FALSE

    ORDER BY
      ii.issued_date ASC,
      ii.id ASC
    `,
    );

    return result.rows.map((row) => ({
      ...row,
      quantity_issued: Number(row.quantity_issued) || 0,
      quantity_returned: Number(row.quantity_returned) || 0,
      quantity_remaining:
        (Number(row.quantity_issued) || 0) -
        (Number(row.quantity_returned) || 0),
    }));
  },

  // =========================================================
  // GET MY OUTSTANDING ISSUED INVENTORY
  //
  // Staff use.
  //
  // Returns ONLY inventory issued to the authenticated user
  // that has not been fully returned.
  // =========================================================

  async findMyOutstandingIssuedItems(userId) {
    if (!userId) {
      throw new Error("USER_ID_REQUIRED");
    }

    const result = await pool.query(
      `
    SELECT
      ii.id,
      ii.request_id,
      ii.request_item_id,
      ii.item_id,

      i.item_code,
      i.name AS item_name,
      i.unit,

      d.name AS department_name,

      ii.issued_to,
      recipient.full_name AS issued_to_name,
      recipient.email AS issued_to_email,

      ii.issued_by,
      issuer.full_name AS issued_by_name,

      ii.quantity AS quantity_issued,
      ii.issued_date,
      ii.due_date,
      ii.returned,

      COALESCE(
        (
          SELECT
            SUM(ir.quantity_returned)
          FROM item_returns ir
          WHERE ir.issued_item_id = ii.id
        ),
        0
      ) AS quantity_returned

    FROM issued_items ii

    JOIN items i
      ON i.id = ii.item_id

    JOIN users recipient
      ON recipient.id = ii.issued_to

    JOIN users issuer
      ON issuer.id = ii.issued_by

    JOIN requests r
      ON r.id = ii.request_id

    JOIN departments d
      ON d.id = r.department_id

    WHERE
      ii.returned = FALSE
      AND ii.issued_to = $1

    ORDER BY
      ii.issued_date ASC,
      ii.id ASC
    `,
      [userId],
    );

    return result.rows.map((row) => ({
      ...row,

      quantity_issued: Number(row.quantity_issued) || 0,

      quantity_returned: Number(row.quantity_returned) || 0,

      quantity_remaining:
        (Number(row.quantity_issued) || 0) -
        (Number(row.quantity_returned) || 0),
    }));
  },
};

module.exports = issuance;
