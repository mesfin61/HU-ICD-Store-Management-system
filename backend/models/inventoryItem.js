const pool = require("../config/db");
const auditLog = require("./auditLog");
const notification = require("./notification");

const inventoryItem = {
  // =========================================================
  // GET ALL ACTIVE INVENTORY ITEMS
  // =========================================================

  async findAll() {
    const result = await pool.query(`
      SELECT
        i.id,
        i.item_code,
        i.name,
        i.description,
        i.unit,
        i.minimum_stock,
        i.current_stock,
        i.physical_stock,
        i.is_asset,
        i.is_active,
        c.id AS category_id,
        c.name AS category_name,
        i.created_at,
        i.updated_at
      FROM items i
      JOIN categories c
        ON c.id = i.category_id
      WHERE i.is_active = TRUE
      ORDER BY i.name ASC
    `);

    return result.rows;
  },

  // =========================================================
  // GET ITEM BY ID
  // =========================================================

  async findById(id) {
    const result = await pool.query(
      `
      SELECT
        i.id,
        i.item_code,
        i.name,
        i.description,
        i.unit,
        i.minimum_stock,
        i.current_stock,
        i.physical_stock,
        i.is_asset,
        i.is_active,
        c.id AS category_id,
        c.name AS category_name,
        i.created_at,
        i.updated_at
      FROM items i
      JOIN categories c
        ON c.id = i.category_id
      WHERE i.id = $1
      `,
      [id],
    );

    return result.rows[0] || null;
  },

  // =========================================================
  // CREATE INVENTORY ITEM
  //
  // Registers a new inventory item.
  //
  // If initialQuantity > 0, that quantity is treated as the
  // initial physical receipt and is recorded as a RECEIPT
  // transaction in the SAME database transaction.
  //
  // Therefore:
  //
  // item creation
  // + initial stock
  // + inventory ledger
  // + audit log
  // + notification
  //
  // all commit or all roll back together.
  // =========================================================

  async create({
    itemCode,
    name,
    categoryId,
    description,
    unit,
    minimumStock,
    initialQuantity = 0,
    isAsset = false,
    performedBy,
    vendor,
    referenceNo,
    remarks,
  }) {
    if (!performedBy) {
      throw new Error("PERFORMED_BY_REQUIRED");
    }

    if (typeof itemCode !== "string" || !itemCode.trim()) {
      throw new Error("ITEM_CODE_REQUIRED");
    }

    if (typeof name !== "string" || !name.trim()) {
      throw new Error("ITEM_NAME_REQUIRED");
    }

    if (!categoryId) {
      throw new Error("CATEGORY_REQUIRED");
    }

    if (!Number.isInteger(minimumStock) || minimumStock < 0) {
      throw new Error("INVALID_MINIMUM_STOCK");
    }

    if (!Number.isInteger(initialQuantity) || initialQuantity < 0) {
      throw new Error("INVALID_INITIAL_QUANTITY");
    }

    if (typeof isAsset !== "boolean") {
      throw new Error("INVALID_ASSET_FLAG");
    }

    const cleanItemCode = itemCode.trim();
    const cleanName = name.trim();
    const cleanDescription =
      typeof description === "string" && description.trim()
        ? description.trim()
        : null;

    const cleanUnit =
      typeof unit === "string" && unit.trim() ? unit.trim() : "pcs";

    const cleanVendor =
      typeof vendor === "string" && vendor.trim() ? vendor.trim() : null;

    const cleanReferenceNo =
      typeof referenceNo === "string" && referenceNo.trim()
        ? referenceNo.trim()
        : null;

    const cleanRemarks =
      typeof remarks === "string" && remarks.trim() ? remarks.trim() : null;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // =====================================================
      // 1. VERIFY CATEGORY
      // =====================================================

      const categoryResult = await client.query(
        `
        SELECT
          id,
          name
        FROM categories
        WHERE id = $1
        FOR SHARE
        `,
        [categoryId],
      );

      const category = categoryResult.rows[0];

      if (!category) {
        throw new Error("CATEGORY_NOT_FOUND");
      }

      // =====================================================
      // 2. ENSURE ITEM CODE DOES NOT ALREADY EXIST
      // =====================================================

      const existingItemResult = await client.query(
        `
          SELECT id
          FROM items
          WHERE item_code = $1
          FOR SHARE
          `,
        [cleanItemCode],
      );

      if (existingItemResult.rows.length > 0) {
        throw new Error("ITEM_CODE_ALREADY_EXISTS");
      }

      // =====================================================
      // 3. CREATE ITEM
      // =====================================================

      const itemResult = await client.query(
        `
        INSERT INTO items (
          category_id,
          item_code,
          name,
          description,
          unit,
          minimum_stock,
          current_stock,
          physical_stock,
          is_asset,
          is_active
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $7,
          $8,
          TRUE
        )
        RETURNING
          id,
          category_id,
          item_code,
          name,
          description,
          unit,
          minimum_stock,
          current_stock,
          physical_stock,
          is_asset,
          is_active,
          created_at,
          updated_at
        `,
        [
          category.id,
          cleanItemCode,
          cleanName,
          cleanDescription,
          cleanUnit,
          minimumStock,
          initialQuantity,
          isAsset,
        ],
      );

      const item = itemResult.rows[0];

      // =====================================================
      // 4. INITIAL RECEIPT LEDGER
      //
      // Registering an item with initial stock is a real stock
      // receipt, so it MUST appear in inventory_transactions.
      // =====================================================

      let inventoryTransaction = null;

      if (initialQuantity > 0) {
        const receiptRemarks = [
          "Initial inventory receipt during item registration.",
          cleanVendor ? `Vendor: ${cleanVendor}` : null,
          cleanRemarks ? `Remarks: ${cleanRemarks}` : null,
        ]
          .filter(Boolean)
          .join(" ");

        const transactionResult = await client.query(
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
              'RECEIPT',
              $2,
              $3,
              $4,
              $5
            )
            RETURNING
              id,
              item_id,
              transaction_type,
              quantity,
              reference_no,
              remarks,
              performed_by,
              transaction_date
            `,
          [
            item.id,
            initialQuantity,
            cleanReferenceNo,
            receiptRemarks,
            performedBy,
          ],
        );

        inventoryTransaction = transactionResult.rows[0];
      }

      await auditLog.create({
        client,
        userId: performedBy,
        action: "INVENTORY_ITEM_CREATED",
        entityName: "items",
        entityId: item.id,

        oldData: null,

        newData: {
          item_id: item.id,
          category_id: item.category_id,
          category_name: category.name,
          item_code: item.item_code,
          name: item.name,
          description: item.description,
          unit: item.unit,
          minimum_stock: item.minimum_stock,
          current_stock: item.current_stock,
          physical_stock: item.physical_stock,
          is_asset: item.is_asset,
          is_active: item.is_active,
          initial_quantity: initialQuantity,
          vendor: cleanVendor,
          reference_no: cleanReferenceNo,
          remarks: cleanRemarks,
          inventory_transaction_id: inventoryTransaction?.id || null,
        },
      });

      await notification.createWithClient({
        client,
        userId: performedBy,
        title: "Inventory item registered successfully",
        message:
          initialQuantity > 0
            ? `${item.name} (${item.item_code}) was registered successfully with ${initialQuantity} ${item.unit} initially received into inventory.`
            : `${item.name} (${item.item_code}) was registered successfully with zero initial stock.`,
      });

      await client.query("COMMIT");

      return item;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  // =========================================================
  // RECEIVE STOCK
  //
  // Physical stock enters the store.
  //
  // physical_stock: +quantity
  // current_stock:  +quantity
  // LEDGER: RECEIPT
  // =========================================================

  async receiveStock({ itemId, quantity, performedBy, referenceNo, remarks }) {
    return this.changeStock({
      itemId,
      quantity,
      performedBy,
      transactionType: "RECEIPT",
      referenceNo,
      remarks,
      direction: "IN",
    });
  },

  // =========================================================
  // ADJUST STOCK IN
  //
  // Physical stock is higher than the database indicates.
  //
  // physical_stock: +quantity
  // current_stock:  +quantity
  // LEDGER: ADJUSTMENT_IN
  // =========================================================

  async adjustStockIn({ itemId, quantity, performedBy, referenceNo, remarks }) {
    return this.changeStock({
      itemId,
      quantity,
      performedBy,
      transactionType: "ADJUSTMENT_IN",
      referenceNo,
      remarks,
      direction: "IN",
    });
  },

  // =========================================================
  // ADJUST STOCK OUT
  //
  // Physical stock is lower than the database indicates.
  //
  // physical_stock: -quantity
  // current_stock:  -quantity
  // LEDGER: ADJUSTMENT_OUT
  //
  // IMPORTANT:
  //
  // If the operation would consume stock already committed
  // to reservations, changeStock() will reject it unless
  // the conflict is explicitly handled by the override
  // workflow.
  // =========================================================

  async adjustStockOut({
    itemId,
    quantity,
    performedBy,
    referenceNo,
    remarks,
  }) {
    return this.changeStock({
      itemId,
      quantity,
      performedBy,
      transactionType: "ADJUSTMENT_OUT",
      referenceNo,
      remarks,
      direction: "OUT",
    });
  },

  // =========================================================
  // WRITE OFF STOCK
  //
  // Permanently removes unusable stock.
  //
  // physical_stock: -quantity
  // current_stock:  -quantity
  // LEDGER: WRITE_OFF
  //
  // A write-off cannot silently consume reserved inventory.
  // =========================================================

  async writeOffStock({ itemId, quantity, performedBy, referenceNo, remarks }) {
    return this.changeStock({
      itemId,
      quantity,
      performedBy,
      transactionType: "WRITE_OFF",
      referenceNo,
      remarks,
      direction: "OUT",
    });
  },

  // =========================================================
  // INTERNAL ATOMIC STOCK CHANGE
  //
  // ALL stock-changing operations pass through here.
  //
  // NORMAL OPERATION:
  //
  //   IN:
  //      physical_stock += quantity
  //      current_stock  += quantity
  //
  //   OUT:
  //      physical_stock -= quantity
  //      current_stock  -= quantity
  //
  // IMPORTANT INVENTORY MODEL:
  //
  // physical_stock:
  //   Physical quantity actually inside the store.
  //
  // current_stock:
  //   Quantity currently available for new allocation.
  //
  // Reservations reduce current_stock but do NOT reduce
  // physical_stock.
  //
  // Therefore:
  //
  //   physical_stock >= current_stock
  //
  // under normal operation.
  //
  // If an OUT operation exceeds current_stock, the difference
  // represents stock already committed to reservations.
  //
  // That situation MUST NOT silently proceed.
  //
  // The operation is rejected with RESERVATION_CONFLICT so
  // the authorization/notification override workflow can
  // explicitly handle it.
  //
  // EVERYTHING inside a successful operation commits together:
  //
  //   physical stock
  //   available stock
  //   inventory ledger
  //   audit log
  //
  // If anything fails, everything rolls back.
  // =========================================================

  async changeStock({
    itemId,
    quantity,
    performedBy,
    transactionType,
    referenceNo,
    remarks,
    direction,
  }) {
    // -------------------------------------------------------
    // BASIC VALIDATION
    // -------------------------------------------------------

    if (!itemId) {
      throw new Error("ITEM_ID_REQUIRED");
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("INVALID_STOCK_QUANTITY");
    }

    if (!performedBy) {
      throw new Error("PERFORMED_BY_REQUIRED");
    }

    // -------------------------------------------------------
    // Validate transaction type + direction.
    // -------------------------------------------------------

    const allowedOperations = {
      RECEIPT: "IN",
      ADJUSTMENT_IN: "IN",
      ADJUSTMENT_OUT: "OUT",
      WRITE_OFF: "OUT",
    };

    if (
      !Object.prototype.hasOwnProperty.call(allowedOperations, transactionType)
    ) {
      throw new Error("INVALID_STOCK_TRANSACTION_TYPE");
    }

    if (allowedOperations[transactionType] !== direction) {
      throw new Error("INVALID_STOCK_TRANSACTION_DIRECTION");
    }

    // -------------------------------------------------------
    // Normalize optional values.
    // -------------------------------------------------------

    const cleanReferenceNo =
      typeof referenceNo === "string" && referenceNo.trim()
        ? referenceNo.trim()
        : null;

    const cleanRemarks =
      typeof remarks === "string" && remarks.trim() ? remarks.trim() : null;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // =====================================================
      // 1. LOCK ITEM
      // =====================================================

      const itemResult = await client.query(
        `
        SELECT
          id,
          item_code,
          name,
          current_stock,
          physical_stock,
          minimum_stock,
          unit,
          is_active
        FROM items
        WHERE id = $1
        FOR UPDATE
        `,
        [itemId],
      );

      const item = itemResult.rows[0];

      if (!item) {
        throw new Error("ITEM_NOT_FOUND");
      }

      if (!item.is_active) {
        throw new Error("ITEM_INACTIVE");
      }

      // =====================================================
      // 2. READ OLD STOCK VALUES
      // =====================================================

      const oldCurrentStock = Number(item.current_stock || 0);

      const oldPhysicalStock = Number(item.physical_stock || 0);

      if (!Number.isInteger(oldCurrentStock) || oldCurrentStock < 0) {
        throw new Error("INVALID_CURRENT_STOCK");
      }

      if (!Number.isInteger(oldPhysicalStock) || oldPhysicalStock < 0) {
        throw new Error("INVALID_PHYSICAL_STOCK");
      }

      // -----------------------------------------------------
      // Fundamental invariant.
      //
      // Available stock cannot normally exceed physical stock.
      // -----------------------------------------------------

      if (oldCurrentStock > oldPhysicalStock) {
        throw new Error("INVENTORY_STATE_INCONSISTENT");
      }

      // =====================================================
      // 3. RESERVATION CONFLICT DETECTION
      //
      // Only OUT operations can consume already-reserved
      // physical inventory.
      //
      // Example:
      //
      // physical_stock = 10
      // current_stock  = 6
      //
      // Therefore 4 units are committed/reserved.
      //
      // Attempting OUT 7 means:
      //
      //   6 available
      //   1 reserved unit would be consumed
      //
      // That MUST NOT silently happen.
      // =====================================================

      let reservationConflict = null;

      if (direction === "OUT") {
        const availableStock = oldCurrentStock;

        if (quantity > availableStock) {
          const reservedQuantity = oldPhysicalStock - oldCurrentStock;

          const quantityAffectingReservations = quantity - availableStock;

          // -------------------------------------------------
          // Defensive consistency check.
          //
          // If the requested removal exceeds both available
          // and physically existing stock, it is not merely
          // a reservation conflict.
          // -------------------------------------------------

          if (quantity > oldPhysicalStock) {
            throw new Error("INSUFFICIENT_PHYSICAL_STOCK");
          }

          if (quantityAffectingReservations > reservedQuantity) {
            throw new Error("INVENTORY_STATE_INCONSISTENT");
          }

          reservationConflict = {
            itemId,
            itemCode: item.item_code,
            itemName: item.name,
            physicalStock: oldPhysicalStock,
            currentStock: oldCurrentStock,
            reservedQuantity,
            quantityRequested: quantity,
            quantityAffectingReservations,
          };

          // -------------------------------------------------
          // IMPORTANT:
          //
          // We deliberately roll back here.
          //
          // The caller must invoke the explicit override
          // workflow, which must:
          //
          //   1. authorize the override
          //   2. provide a reason
          //   3. notify the affected requester(s)
          //   4. create inventory reservation exceptions
          //   5. then perform the stock operation
          //
          // This model must NEVER silently destroy an existing
          // reservation.
          // -------------------------------------------------

          const error = new Error("RESERVATION_CONFLICT");

          error.code = "RESERVATION_CONFLICT";

          error.conflict = reservationConflict;

          throw error;
        }
      }

      // =====================================================
      // 4. CALCULATE NEW STOCK
      // =====================================================

      let newCurrentStock;
      let newPhysicalStock;

      if (direction === "IN") {
        newPhysicalStock = oldPhysicalStock + quantity;

        newCurrentStock = oldCurrentStock + quantity;
      } else {
        newPhysicalStock = oldPhysicalStock - quantity;

        newCurrentStock = oldCurrentStock - quantity;
      }

      // =====================================================
      // 5. PREVENT NEGATIVE STOCK
      // =====================================================

      if (newPhysicalStock < 0) {
        throw new Error("INSUFFICIENT_PHYSICAL_STOCK");
      }

      if (newCurrentStock < 0) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      // -----------------------------------------------------
      // Final consistency check.
      // -----------------------------------------------------

      if (newCurrentStock > newPhysicalStock) {
        throw new Error("INVENTORY_STATE_INCONSISTENT");
      }

      // =====================================================
      // 6. UPDATE STOCK
      //
      // Both quantities represent real inventory state.
      //
      // IN:
      //   physical_stock + quantity
      //   current_stock  + quantity
      //
      // OUT:
      //   physical_stock - quantity
      //   current_stock  - quantity
      //
      // Reservations are NOT modified here.
      // =====================================================

      const updateResult = await client.query(
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
          description,
          current_stock,
          physical_stock,
          minimum_stock,
          unit,
          is_asset,
          is_active,
          created_at,
          updated_at
        `,
        [newCurrentStock, newPhysicalStock, itemId],
      );

      const updatedItem = updateResult.rows[0];

      // =====================================================
      // 7. INVENTORY LEDGER
      //
      // Permanent inventory movement history.
      // =====================================================

      const transactionResult = await client.query(
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
            $2,
            $3,
            $4,
            $5,
            $6
          )
          RETURNING
            id,
            item_id,
            transaction_type,
            quantity,
            reference_no,
            remarks,
            performed_by
          `,
        [
          itemId,
          transactionType,
          quantity,
          cleanReferenceNo,
          cleanRemarks,
          performedBy,
        ],
      );

      const inventoryTransaction = transactionResult.rows[0];

      // =====================================================
      // 8. AUDIT LOG
      // =====================================================

      await auditLog.create({
        client,
        userId: performedBy,
        action: `INVENTORY_${transactionType}`,
        entityName: "items",
        entityId: itemId,

        oldData: {
          item_id: itemId,
          item_code: item.item_code,
          item_name: item.name,
          current_stock: oldCurrentStock,
          physical_stock: oldPhysicalStock,
        },

        newData: {
          item_id: itemId,
          item_code: item.item_code,
          item_name: item.name,

          current_stock: newCurrentStock,

          physical_stock: newPhysicalStock,

          quantity_changed: quantity,

          direction,

          transaction_type: transactionType,

          inventory_transaction_id: inventoryTransaction.id,

          reference_no: cleanReferenceNo,

          remarks: cleanRemarks,
        },
      });

      // =====================================================
      // 9. NOTIFICATION
      //
      // The operator who performed the successful inventory
      // operation receives confirmation.
      //
      // IMPORTANT:
      //
      // Notification uses the SAME database transaction.
      //
      // If the stock change, ledger entry, audit log, or
      // notification fails, the entire operation rolls back.
      //
      // Therefore the operator is never told that an operation
      // succeeded when the database actually rolled it back.
      // =====================================================

      let notificationTitle;
      let notificationMessage;

      switch (transactionType) {
        case "RECEIPT":
          notificationTitle = "Inventory received successfully";

          notificationMessage = `${quantity} ${updatedItem.unit} of ${updatedItem.name} was successfully received into inventory. Current available stock is ${newCurrentStock}.`;

          break;

        case "ADJUSTMENT_IN":
          notificationTitle = "Inventory adjustment completed";

          notificationMessage = `Inventory adjustment completed successfully. ${quantity} ${updatedItem.unit} of ${updatedItem.name} was added to inventory. Current available stock is ${newCurrentStock}.`;

          break;

        case "ADJUSTMENT_OUT":
          notificationTitle = "Inventory adjustment completed";

          notificationMessage = `Inventory adjustment completed successfully. ${quantity} ${updatedItem.unit} of ${updatedItem.name} was removed from inventory. Current available stock is ${newCurrentStock}.`;

          break;

        case "WRITE_OFF":
          notificationTitle = "Inventory write-off completed";

          notificationMessage = `${quantity} ${updatedItem.unit} of ${updatedItem.name} was successfully written off. Current available stock is ${newCurrentStock}.`;

          break;

        default:
          throw new Error("INVALID_STOCK_TRANSACTION_TYPE");
      }

      await notification.createWithClient({
        client,

        userId: performedBy,

        title: notificationTitle,

        message: notificationMessage,
      });

      // =====================================================
      // 9. COMMIT
      // =====================================================

      await client.query("COMMIT");

      // =====================================================
      // 10. RETURN UPDATED ITEM
      // =====================================================

      return updatedItem;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};

module.exports = inventoryItem;
