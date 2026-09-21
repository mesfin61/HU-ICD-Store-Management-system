const pool = require("../config/db");
const auditLog = require("./auditLog");
const notification = require("./notification");

const itemReturn = {
  // =========================================================
  // RETURN ISSUED INVENTORY
  //
  // RETURN:
  //   1. Lock issued item
  //   2. Lock inventory item
  //   3. Calculate already-returned quantity
  //   4. Prevent returning more than was issued
  //   5. Increase current_stock and physical_stock
  //   6. Record item_returns history
  //   7. Record RETURN inventory transaction
  //   8. Mark issued_items.returned = TRUE when fully returned
  //   9. Create audit log
  //
  // EVERYTHING happens inside ONE transaction.
  // =========================================================

  async create({
    issuedItemId,
    quantityReturned,
    conditionStatus,
    remarks,
    performedBy,
  }) {
    // -------------------------------------------------------
    // BASIC VALIDATION
    // -------------------------------------------------------

    if (!issuedItemId) {
      throw new Error("ISSUED_ITEM_ID_REQUIRED");
    }

    if (!Number.isInteger(quantityReturned) || quantityReturned <= 0) {
      throw new Error("INVALID_RETURN_QUANTITY");
    }

    if (!performedBy) {
      throw new Error("PERFORMED_BY_REQUIRED");
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // =======================================================
      // 1. LOCK ISSUED ITEM
      //
      // This prevents two simultaneous return operations from
      // calculating the same remaining quantity.
      // =======================================================

      const issuedResult = await client.query(
        `
        SELECT
          id,
          request_id,
          request_item_id,
          item_id,
          issued_to,
          issued_by,
          quantity,
          returned,
          issued_date,
          due_date
        FROM issued_items
        WHERE id = $1
        FOR UPDATE
        `,
        [issuedItemId],
      );

      const issuedItem = issuedResult.rows[0];

      if (!issuedItem) {
        throw new Error("ISSUED_ITEM_NOT_FOUND");
      }

      // =======================================================
      // 2. LOCK INVENTORY ITEM
      //
      // Returning inventory increases current_stock, therefore
      // the item row must be locked before calculating the new
      // stock value.
      // =======================================================

      const itemResult = await client.query(
        `
        SELECT
          id,
          item_code,
          name,
          unit,
          current_stock,
          physical_stock,
          is_active
        FROM items
        WHERE id = $1
        FOR UPDATE
        `,
        [issuedItem.item_id],
      );

      const item = itemResult.rows[0];

      if (!item) {
        throw new Error("ITEM_NOT_FOUND");
      }

      const oldCurrentStock = Number(item.current_stock);

      const oldPhysicalStock = Number(item.physical_stock);

      if (
        !Number.isInteger(oldCurrentStock) ||
        oldCurrentStock < 0 ||
        !Number.isInteger(oldPhysicalStock) ||
        oldPhysicalStock < 0 ||
        oldCurrentStock > oldPhysicalStock
      ) {
        throw new Error("INVENTORY_STATE_INCONSISTENT");
      }

      // -------------------------------------------------------
      // Do not silently return inventory for a deleted/missing
      // item. An inactive item still exists, so returning it is
      // allowed because the physical inventory can legitimately
      // come back into the store even if the item is no longer
      // active for new requests.
      // -------------------------------------------------------
      //
      // Therefore we intentionally DO NOT reject inactive items
      // here.

      // =======================================================
      // 3. CALCULATE ALREADY RETURNED QUANTITY
      // =======================================================

      const returnedResult = await client.query(
        `
        SELECT
          COALESCE(SUM(quantity_returned), 0) AS returned_quantity
        FROM item_returns
        WHERE issued_item_id = $1
        `,
        [issuedItemId],
      );

      const alreadyReturned = Number(
        returnedResult.rows[0].returned_quantity || 0,
      );

      const issuedQuantity = Number(issuedItem.quantity || 0);

      // -------------------------------------------------------
      // Defensive validation
      // -------------------------------------------------------

      if (issuedQuantity <= 0) {
        throw new Error("INVALID_ISSUED_QUANTITY");
      }

      if (alreadyReturned > issuedQuantity) {
        throw new Error("RETURN_HISTORY_EXCEEDS_ISSUED_QUANTITY");
      }

      const remainingQuantity = issuedQuantity - alreadyReturned;

      // =======================================================
      // 4. PREVENT DUPLICATE / EXCESSIVE RETURN
      // =======================================================

      if (remainingQuantity <= 0) {
        throw new Error("ISSUED_ITEM_ALREADY_RETURNED");
      }

      if (quantityReturned > remainingQuantity) {
        throw new Error("RETURN_EXCEEDS_ISSUED_QUANTITY");
      }

      // =======================================================
      // 5. CALCULATE NEW RETURN TOTAL
      // =======================================================

      const totalReturned = alreadyReturned + quantityReturned;

      const fullyReturned = totalReturned === issuedQuantity;

      const newQuantityRemaining = issuedQuantity - totalReturned;

      // =======================================================
      // 6.RESTORE INVENTORY STOCK
      //
      // IMPORTANT INVENTORY INVARIANT:
      //
      // Reservation reduced current_stock.
      // Issuance did NOT reduce current_stock.
      //
      // Therefore RETURN adds the returned quantity back.
      // =======================================================

      const newCurrentStock = oldCurrentStock + quantityReturned;

      const newPhysicalStock = oldPhysicalStock + quantityReturned;

      const updateItemResult = await client.query(
        `
        UPDATE items
        SET
          current_stock = $1,
          physical_stock = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING
          id,
          item_code,
          name,
          current_stock,
          physical_stock,
          minimum_stock,
          unit
        `,
        [newCurrentStock, newPhysicalStock, item.id],
      );

      const updatedItem = updateItemResult.rows[0];

      if (updateItemResult.rowCount !== 1) {
        throw new Error("INVENTORY_UPDATE_FAILED");
      }

      // =======================================================
      // 7. RECORD RETURN HISTORY
      // =======================================================

      const cleanConditionStatus =
        typeof conditionStatus === "string" && conditionStatus.trim()
          ? conditionStatus.trim()
          : null;

      const cleanRemarks =
        typeof remarks === "string" && remarks.trim() ? remarks.trim() : null;

      const returnResult = await client.query(
        `
        INSERT INTO item_returns (
          issued_item_id,
          quantity_returned,
          condition_status,
          remarks
        )
        VALUES (
          $1,
          $2,
          $3,
          $4
        )
        RETURNING
          id,
          issued_item_id,
          quantity_returned,
          return_date,
          condition_status,
          remarks
        `,
        [issuedItemId, quantityReturned, cleanConditionStatus, cleanRemarks],
      );

      const returnRecord = returnResult.rows[0];

      // =======================================================
      // 8. UPDATE ISSUED ITEM RETURN STATUS
      //
      // returned = TRUE ONLY when the entire issued quantity
      // has been returned.
      //
      // For partial returns it remains FALSE.
      // =======================================================

      if (fullyReturned) {
        await client.query(
          `
          UPDATE issued_items
          SET
            returned = TRUE
          WHERE id = $1
          `,
          [issuedItemId],
        );
      }

      // =======================================================
      // 9. INVENTORY LEDGER
      //
      // This records the physical inventory returning to stock.
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
          'RETURN',
          $2,
          $3,
          $4,
          $5
        )
        `,
        [
          item.id,
          quantityReturned,
          issuedItemId,
          cleanRemarks || "Inventory returned from issued item",
          performedBy,
        ],
      );

      // =======================================================
      // 10. AUDIT LOG
      //
      //
      // =======================================================

      await auditLog.create({
        client,
        userId: performedBy,
        action: "INVENTORY_RETURNED",
        entityName: "item_returns",
        entityId: returnRecord.id,

        oldData: {
          issued_item_id: issuedItemId,
          item_id: issuedItem.item_id,
          issued_quantity: issuedQuantity,
          quantity_previously_returned: alreadyReturned,
          quantity_remaining_before_return: remainingQuantity,
          issued_item_returned: Boolean(issuedItem.returned),

          current_stock: oldCurrentStock,

          physical_stock: oldPhysicalStock,
        },

        newData: {
          return_id: returnRecord.id,
          issued_item_id: issuedItemId,
          item_id: issuedItem.item_id,

          quantity_returned: quantityReturned,

          total_quantity_returned: totalReturned,

          quantity_remaining_after_return: newQuantityRemaining,

          issued_item_returned: fullyReturned,

          current_stock: newCurrentStock,

          physical_stock: newPhysicalStock,

          condition_status: cleanConditionStatus,

          remarks: cleanRemarks,
        },
      });

      await notification.createWithClient({
        client,
        userId: issuedItem.issued_to,
        title: fullyReturned
          ? "Inventory fully returned"
          : "Inventory partially returned",
        message: fullyReturned
          ? `${quantityReturned} ${item.unit || "pcs"} of ${item.name} was returned successfully. The issued item has been fully returned.`
          : `${quantityReturned} ${item.unit || "pcs"} of ${item.name} was returned successfully. ${newQuantityRemaining} ${item.unit || "pcs"} remains outstanding.`,
      });

      // =======================================================
      // 11. COMMIT EVERYTHING
      //
      // If ANY operation above fails:
      //
      //   stock update
      //   return history
      //   issued item update
      //   inventory ledger
      //   audit log
      //
      // all roll back together.
      // =======================================================

      await client.query("COMMIT");

      // =======================================================
      // 12. RETURN RESULT
      // =======================================================

      return {
        returnRecord,

        issuedItemId,

        item: updatedItem,

        quantityIssued: issuedQuantity,

        quantityPreviouslyReturned: alreadyReturned,

        quantityReturned,

        quantityRemaining: newQuantityRemaining,

        fullyReturned,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  // =========================================================
  // GET RETURNS FOR AN ISSUED ITEM
  // =========================================================

  async findByIssuedItemId(issuedItemId) {
    const result = await pool.query(
      `
      SELECT
        ir.id,
        ir.issued_item_id,
        ir.quantity_returned,
        ir.return_date,
        ir.condition_status,
        ir.remarks,

        ii.request_id,
        ii.request_item_id,
        ii.item_id,
        ii.issued_to,
        ii.issued_by,

        r.requester_id,

        requester.full_name AS requester_name,
        requester.email AS requester_email

      FROM item_returns ir

      JOIN issued_items ii
        ON ii.id = ir.issued_item_id

      JOIN requests r
        ON r.id = ii.request_id

      JOIN users requester
        ON requester.id = r.requester_id

      WHERE ir.issued_item_id = $1

      ORDER BY ir.return_date ASC
      `,
      [issuedItemId],
    );

    return result.rows;
  },
};

module.exports = itemReturn;
