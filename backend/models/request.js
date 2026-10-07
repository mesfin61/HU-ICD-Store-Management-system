const pool = require("../config/db");
const inventoryReservation = require("./inventoryReservation");
const auditLog = require("./auditLog");
const notification = require("./notification");

const request = {
  // =========================================================
  // CREATE REQUEST
  // =========================================================

  async create({ requesterId, departmentId, purpose, items }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const requesterResult = await client.query(
        `
        SELECT
          id,
          department_id,
          is_active,
          role_id
        FROM users
        WHERE id = $1
        FOR SHARE
        `,
        [requesterId],
      );

      const requester = requesterResult.rows[0];

      if (!requester) {
        throw new Error("REQUESTER_NOT_FOUND");
      }

      if (!requester.is_active) {
        throw new Error("REQUESTER_INACTIVE");
      }

      if (
        !requester.department_id ||
        requester.department_id !== departmentId
      ) {
        throw new Error("INVALID_REQUEST_DEPARTMENT");
      }

      if (typeof purpose !== "string" || !purpose.trim()) {
        throw new Error("INVALID_REQUEST_PURPOSE");
      }

      const cleanPurpose = purpose.trim();

      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("REQUEST_ITEMS_REQUIRED");
      }

      const itemIds = items.map((item) => item.itemId);

      if (
        itemIds.some((id) => !id) ||
        new Set(itemIds).size !== itemIds.length
      ) {
        throw new Error("INVALID_REQUEST_ITEMS");
      }

      for (const item of items) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new Error("INVALID_REQUEST_QUANTITY");
        }

        const itemResult = await client.query(
          `
          SELECT
            id,
            is_active,
            current_stock
          FROM items
          WHERE id = $1
          FOR SHARE
          `,
          [item.itemId],
        );

        const inventoryItem = itemResult.rows[0];

        if (!inventoryItem) {
          throw new Error("ITEM_NOT_FOUND");
        }

        if (!inventoryItem.is_active) {
          throw new Error("ITEM_INACTIVE");
        }

        if (Number(inventoryItem.current_stock) < item.quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }
      }

      const requestResult = await client.query(
        `
        INSERT INTO requests (
          requester_id,
          department_id,
          status,
          purpose
        )
        VALUES (
          $1,
          $2,
          'PENDING',
          $3
        )
        RETURNING
          id,
          requester_id,
          department_id,
          status,
          purpose,
          requested_at,
          approved_by,
          approved_at,
          rejection_reason
        `,
        [requesterId, departmentId, cleanPurpose],
      );

      await auditLog.create({
        client,
        userId: requesterId,
        action: "REQUEST_CREATED",
        entityName: "requests",
        entityId: requestResult.rows[0].id,

        oldData: null,

        newData: {
          requester_id: requesterId,
          department_id: departmentId,
          status: "PENDING",
          purpose,
        },
      });

      const newRequest = requestResult.rows[0];

      for (const item of items) {
        await client.query(
          `
          INSERT INTO request_items (
            request_id,
            item_id,
            quantity_requested,
            quantity_approved
          )
          VALUES ($1, $2, $3, 0)
          `,
          [newRequest.id, item.itemId, item.quantity],
        );
      }

      // =======================================================
      // NOTIFICATIONS
      // =======================================================

      // -------------------------------------------------------
      // ACTOR CONFIRMATION
      //
      // The requester gets confirmation that their operation
      // succeeded.
      // -------------------------------------------------------

      await notification.createWithClient({
        client,
        userId: requesterId,
        title: "Request Submitted Successfully",
        message:
          `Your inventory request has been submitted successfully ` +
          `and is waiting for Administrator review.`,
      });

      // -------------------------------------------------------
      // ADMINISTRATOR ACTION REQUIRED
      //
      // Notify every active Administrator.
      //
      // Do NOT notify the requester again if the requester happens
      // to be an Administrator.
      // -------------------------------------------------------

      const administratorsResult = await client.query(
        `
        SELECT
          u.id
        FROM users u
        JOIN roles r
          ON r.id = u.role_id
        WHERE
          r.name IN ('Administrator', 'Directorate')
          AND u.is_active = TRUE
          AND u.id <> $1
        `,
        [requesterId],
      );

      for (const administrator of administratorsResult.rows) {
        await notification.createWithClient({
          client,
          userId: administrator.id,
          title: "New Request Requires Review",
          message:
            `${requester.full_name} submitted a new inventory ` +
            `request that requires your review.`,
        });
      }

      await client.query("COMMIT");

      return newRequest;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  // =========================================================
  // FIND REQUEST
  // =========================================================

  async findById(id) {
    const result = await pool.query(
      `
      SELECT
        r.id,

        r.requester_id,
        requester.full_name AS requester_name,
        requester.email AS requester_email,

        r.department_id,
        d.name AS department_name,

        r.status,
        r.purpose,
        r.requested_at,

        r.approved_by,
        approver.full_name AS approver_name,
        r.approved_at,

        r.rejection_reason

      FROM requests r

      JOIN users requester
        ON requester.id = r.requester_id

      JOIN departments d
        ON d.id = r.department_id

      LEFT JOIN users approver
        ON approver.id = r.approved_by

      WHERE r.id = $1
      `,
      [id],
    );

    return result.rows[0] || null;
  },

  // =========================================================
  // FIND REQUEST ITEMS
  // =========================================================

  async findItems(requestId) {
    const result = await pool.query(
      `
      SELECT
        ri.id,
        ri.request_id,
        ri.item_id,

        i.item_code,
        i.name AS item_name,
        i.unit,

        ri.quantity_requested,
        ri.quantity_approved,
        ri.quantity_issued

      FROM request_items ri

      JOIN items i
        ON i.id = ri.item_id

      WHERE ri.request_id = $1

      ORDER BY i.name ASC
      `,
      [requestId],
    );

    return result.rows;
  },

  // =========================================================
  // STAFF: FIND OWN REQUESTS
  // =========================================================

  async findByRequester(requesterId) {
    const result = await pool.query(
      `
      SELECT
        r.id,

        r.department_id,
        d.name AS department_name,

        r.status,
        r.purpose,
        r.requested_at,

        r.approved_by,
        approver.full_name AS approver_name,
        r.approved_at,

        r.rejection_reason

      FROM requests r

      JOIN departments d
        ON d.id = r.department_id

      LEFT JOIN users approver
        ON approver.id = r.approved_by

      WHERE r.requester_id = $1

      ORDER BY r.requested_at DESC
      `,
      [requesterId],
    );

    return result.rows;
  },

  // =========================================================
  // ADMINISTRATOR: FIND ALL REQUESTS
  // =========================================================

  async findAll() {
    const result = await pool.query(
      `
      SELECT
        r.id,

        r.requester_id,
        requester.full_name AS requester_name,
        requester.email AS requester_email,

        r.department_id,
        d.name AS department_name,

        r.status,
        r.purpose,
        r.requested_at,

        r.approved_by,
        approver.full_name AS approver_name,
        r.approved_at,

        r.rejection_reason

      FROM requests r

      JOIN users requester
        ON requester.id = r.requester_id

      JOIN departments d
        ON d.id = r.department_id

      LEFT JOIN users approver
        ON approver.id = r.approved_by

      ORDER BY r.requested_at DESC
      `,
    );

    return result.rows;
  },

  // =========================================================
  // STORE MANAGER: FIND REQUESTS READY FOR ISSUANCE
  // =========================================================

  async findReadyForIssuance() {
    const result = await pool.query(
      `
    SELECT
      r.id,

      r.requester_id,
      requester.full_name AS requester_name,
      requester.email AS requester_email,

      r.department_id,
      d.name AS department_name,

      r.status,
      r.purpose,
      r.requested_at,

      r.approved_by,
      approver.full_name AS approver_name,
      r.approved_at,

      r.rejection_reason,

      COALESCE(SUM(ri.quantity_approved), 0)::integer AS total_approved_quantity,
      COALESCE(SUM(ri.quantity_issued), 0)::integer AS total_issued_quantity,
      COALESCE(
        SUM(ri.quantity_approved - ri.quantity_issued),
        0
      )::integer AS total_remaining_quantity

    FROM requests r

    JOIN users requester
      ON requester.id = r.requester_id

    JOIN departments d
      ON d.id = r.department_id

    LEFT JOIN users approver
      ON approver.id = r.approved_by

    JOIN request_items ri
      ON ri.request_id = r.id

    WHERE r.status IN (
      'APPROVED',
      'PARTIALLY_APPROVED'
    )

    GROUP BY
      r.id,
      requester.full_name,
      requester.email,
      d.name,
      approver.full_name

    ORDER BY
      r.approved_at DESC NULLS LAST,
      r.requested_at DESC
    `,
    );

    return result.rows;
  },

  // =========================================================
  // ADMINISTRATOR: APPROVE REQUEST
  //
  // IMPORTANT:
  //
  // Approval and reservation happen inside ONE transaction.
  //
  // APPROVAL
  //    ↓
  // quantity_approved updated
  //    ↓
  // request status updated
  //    ↓
  // automatic reservation
  //    ↓
  // stock reduced
  //    ↓
  // inventory ledger written
  //    ↓
  // COMMIT
  //
  // If reservation fails, approval ALSO rolls back.
  // =========================================================

  async approve({ requestId, administratorId, approvedItems }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // -------------------------------------------------------
      // Lock request
      // -------------------------------------------------------

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

      if (foundRequest.requester_id === administratorId) {
        throw new Error("SELF_APPROVAL_FORBIDDEN");
      }

      if (foundRequest.status !== "PENDING") {
        throw new Error("REQUEST_ALREADY_DECIDED");
      }

      if (!Array.isArray(approvedItems) || approvedItems.length === 0) {
        throw new Error("APPROVED_ITEMS_REQUIRED");
      }

      // -------------------------------------------------------
      // Lock request items
      //
      // Lock in item_id order to reduce deadlock risk.
      // -------------------------------------------------------

      const requestItemsResult = await client.query(
        `
        SELECT
          ri.id,
          ri.item_id,
          ri.quantity_requested
        FROM request_items ri
        WHERE ri.request_id = $1
        ORDER BY ri.item_id ASC
        FOR UPDATE
        `,
        [requestId],
      );

      const requestItems = requestItemsResult.rows;

      const requestItemMap = new Map(
        requestItems.map((item) => [item.id, item]),
      );

      const approvedIds = approvedItems.map((item) => item.requestItemId);

      if (new Set(approvedIds).size !== approvedIds.length) {
        throw new Error("DUPLICATE_APPROVED_ITEM");
      }

      let totalApproved = 0;

      for (const approvedItem of approvedItems) {
        const requestItem = requestItemMap.get(approvedItem.requestItemId);

        if (!requestItem) {
          throw new Error("INVALID_REQUEST_ITEM");
        }

        if (
          !Number.isInteger(approvedItem.quantityApproved) ||
          approvedItem.quantityApproved < 0
        ) {
          throw new Error("INVALID_APPROVED_QUANTITY");
        }

        if (approvedItem.quantityApproved > requestItem.quantity_requested) {
          throw new Error("APPROVED_QUANTITY_EXCEEDS_REQUEST");
        }

        totalApproved += approvedItem.quantityApproved;
      }

      if (approvedItems.length !== requestItems.length) {
        throw new Error("ALL_REQUEST_ITEMS_MUST_BE_DECIDED");
      }

      // -------------------------------------------------------
      // Update approved quantities
      // -------------------------------------------------------

      for (const approvedItem of approvedItems) {
        await client.query(
          `
          UPDATE request_items
          SET
            quantity_approved = $1
          WHERE id = $2
          `,
          [approvedItem.quantityApproved, approvedItem.requestItemId],
        );
      }

      // -------------------------------------------------------
      // Determine request status
      // -------------------------------------------------------

      let status;

      if (totalApproved === 0) {
        status = "REJECTED";
      } else if (
        approvedItems.every((approvedItem) => {
          const original = requestItemMap.get(approvedItem.requestItemId);

          return approvedItem.quantityApproved === original.quantity_requested;
        })
      ) {
        status = "APPROVED";
      } else {
        status = "PARTIALLY_APPROVED";
      }

      // -------------------------------------------------------
      // If zero approved, this becomes rejection.
      // No reservation is created.
      // -------------------------------------------------------

      if (status === "REJECTED") {
        const updateResult = await client.query(
          `
          UPDATE requests
          SET
            status = 'REJECTED',
            approved_by = $1,
            approved_at = NOW(),
            rejection_reason = NULL
          WHERE id = $2
          RETURNING
            id,
            requester_id,
            department_id,
            status,
            purpose,
            requested_at,
            approved_by,
            approved_at,
            rejection_reason
          `,
          [administratorId, requestId],
        );

        await auditLog.create({
          client,
          userId: administratorId,
          action: "REQUEST_REJECTED",
          entityName: "requests",
          entityId: requestId,

          oldData: {
            status: "PENDING",
          },

          newData: {
            status: "REJECTED",
            approved_by: administratorId,
            rejection_reason: null,
          },
        });

        await client.query("COMMIT");

        return updateResult.rows[0];
      }

      // -------------------------------------------------------
      // Mark approved BEFORE calling reservation.
      //
      // reserveWithClient runs in the SAME transaction, so
      // it can see this status change.
      // -------------------------------------------------------

      const updateResult = await client.query(
        `
        UPDATE requests
        SET
          status = $1,
          approved_by = $2,
          approved_at = NOW(),
          rejection_reason = NULL
        WHERE id = $3
        RETURNING
          id,
          requester_id,
          department_id,
          status,
          purpose,
          requested_at,
          approved_by,
          approved_at,
          rejection_reason
        `,
        [status, administratorId, requestId],
      );

      // -------------------------------------------------------
      // AUTOMATIC RESERVATION
      //
      // The Administrator does NOT manually reserve.
      // The Store Manager does NOT manually reserve.
      //
      // The system reserves every approved quantity > 0.
      // -------------------------------------------------------

      const positiveApprovedItems = approvedItems
        .filter((item) => item.quantityApproved > 0)
        .sort((a, b) => {
          const itemA = requestItemMap.get(a.requestItemId);

          const itemB = requestItemMap.get(b.requestItemId);

          return itemA.item_id.localeCompare(itemB.item_id);
        });

      for (const approvedItem of positiveApprovedItems) {
        await inventoryReservation.reserveWithClient({
          client,
          requestId,
          requestItemId: approvedItem.requestItemId,
          quantity: approvedItem.quantityApproved,
          performedBy: administratorId,
        });
      }

      await auditLog.create({
        client,
        userId: administratorId,
        action:
          status === "PARTIALLY_APPROVED"
            ? "REQUEST_PARTIALLY_APPROVED"
            : "REQUEST_APPROVED",
        entityName: "requests",
        entityId: requestId,

        oldData: {
          status: "PENDING",
        },

        newData: {
          status,
          approved_by: administratorId,
        },
      });

      // =======================================================
      // APPROVAL NOTIFICATIONS
      // =======================================================

      // -------------------------------------------------------
      // ACTOR CONFIRMATION
      // -------------------------------------------------------

      if (status === "APPROVED") {
        await notification.createWithClient({
          client,
          userId: administratorId,
          title: "Request Fully Approved Successfully",
          message:
            "The request was fully approved successfully and " +
            "the approved inventory has been reserved.",
        });
      }

      // -------------------------------------------------------
      // REQUESTER NOTIFICATION
      // -------------------------------------------------------

      if (status === "APPROVED") {
        await notification.createWithClient({
          client,
          userId: foundRequest.requester_id,
          title: "Request Fully Approved",
          message:
            "Your inventory request has been fully approved. " +
            "The approved inventory has been reserved and is " +
            "available for the next issuance step.",
        });
      }

      // =======================================================
      // PARTIAL APPROVAL NOTIFICATIONS
      // =======================================================

      // -------------------------------------------------------
      // ACTOR CONFIRMATION
      // -------------------------------------------------------

      if (status === "PARTIALLY_APPROVED") {
        await notification.createWithClient({
          client,
          userId: administratorId,
          title: "Request Partially Approved Successfully",
          message:
            "The request was partially approved successfully. " +
            "The approved quantities have been reserved.",
        });
      }

      // -------------------------------------------------------
      // REQUESTER NOTIFICATION
      // -------------------------------------------------------

      if (status === "PARTIALLY_APPROVED") {
        await notification.createWithClient({
          client,
          userId: foundRequest.requester_id,
          title: "Request Partially Approved",
          message:
            "Your inventory request was partially approved. " +
            "Only the approved quantities have been reserved.",
        });
      }

      // -------------------------------------------------------
      // EVERYTHING COMMITTED TOGETHER
      // -------------------------------------------------------

      await client.query("COMMIT");

      return updateResult.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  // =========================================================
  // ADMINISTRATOR: REJECT REQUEST
  // =========================================================

  async reject({ requestId, administratorId, rejectionReason }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

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

      if (foundRequest.requester_id === administratorId) {
        throw new Error("SELF_REJECTION_FORBIDDEN");
      }

      if (foundRequest.status !== "PENDING") {
        throw new Error("REQUEST_ALREADY_DECIDED");
      }

      if (typeof rejectionReason !== "string" || !rejectionReason.trim()) {
        throw new Error("REJECTION_REASON_REQUIRED");
      }

      const result = await client.query(
        `
        UPDATE requests
        SET
          status = 'REJECTED',
          approved_by = $1,
          approved_at = NOW(),
          rejection_reason = $2
        WHERE id = $3
        RETURNING
          id,
          requester_id,
          department_id,
          status,
          purpose,
          requested_at,
          approved_by,
          approved_at,
          rejection_reason
        `,
        [administratorId, rejectionReason.trim(), requestId],
      );

      await auditLog.create({
        client,
        userId: administratorId,
        action: "REQUEST_REJECTED",
        entityName: "requests",
        entityId: requestId,

        oldData: {
          status: "PENDING",
        },

        newData: {
          status: "REJECTED",
          approved_by: administratorId,
          rejection_reason: rejectionReason.trim(),
        },
      });

      // =======================================================
      // REJECTION NOTIFICATIONS
      // =======================================================

      // -------------------------------------------------------
      // ACTOR CONFIRMATION
      // -------------------------------------------------------

      await notification.createWithClient({
        client,
        userId: administratorId,
        title: "Request Rejected Successfully",
        message: "The inventory request was rejected successfully.",
      });

      // -------------------------------------------------------
      // REQUESTER NOTIFICATION
      // -------------------------------------------------------

      await notification.createWithClient({
        client,
        userId: foundRequest.requester_id,
        title: "Request Rejected",
        message:
          `Your inventory request was rejected. ` +
          `Reason: ${rejectionReason.trim()}`,
      });

      await client.query("COMMIT");

      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};

module.exports = request;
