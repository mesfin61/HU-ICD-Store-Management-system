const pool = require("../config/db");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value) {
  if (!DATE_PATTERN.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function validateDateRange(res, startDate, endDate) {
  if (startDate && !isValidDate(startDate)) {
    res.status(400).json({
      success: false,
      message: "startDate must use the YYYY-MM-DD format.",
    });
    return false;
  }

  if (endDate && !isValidDate(endDate)) {
    res.status(400).json({
      success: false,
      message: "endDate must use the YYYY-MM-DD format.",
    });
    return false;
  }

  if (startDate && endDate && startDate > endDate) {
    res.status(400).json({
      success: false,
      message: "startDate cannot be after endDate.",
    });
    return false;
  }

  return true;
}

function addDateConditions(values, column, startDate, endDate) {
  const conditions = [];

  if (startDate) {
    values.push(startDate);
    conditions.push(`${column} >= $${values.length}`);
  }

  if (endDate) {
    values.push(endDate);
    conditions.push(`${column} < ($${values.length}::date + INTERVAL '1 day')`);
  }

  return conditions;
}

// GET INVENTORY REPORT
// Returns current stock and movement totals for the requested period.
const getInventoryReport = async (req, res) => {
  const { startDate, endDate, categoryId, transactionType } = req.query;

  if (startDate && !isValidDate(startDate)) {
    return res.status(400).json({
      success: false,
      message: "startDate must use the YYYY-MM-DD format.",
    });
  }

  if (endDate && !isValidDate(endDate)) {
    return res.status(400).json({
      success: false,
      message: "endDate must use the YYYY-MM-DD format.",
    });
  }

  if (startDate && endDate && startDate > endDate) {
    return res.status(400).json({
      success: false,
      message: "startDate cannot be after endDate.",
    });
  }

  const values = [];
  const conditions = ["i.is_active = TRUE"];
  const addValue = (value) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (categoryId) {
    conditions.push(`i.category_id = ${addValue(categoryId)}`);
  }

  const transactionConditions = [];

  if (startDate) {
    transactionConditions.push(`it.transaction_date >= ${addValue(startDate)}`);
  }

  if (endDate) {
    transactionConditions.push(
      `it.transaction_date < (${addValue(endDate)}::date + INTERVAL '1 day')`,
    );
  }

  if (transactionType) {
    transactionConditions.push(`it.transaction_type = ${addValue(transactionType)}`);
  }

  const transactionFilter = transactionConditions.length
    ? `AND ${transactionConditions.join("\n          AND ")}`
    : "";

  try {
    const result = await pool.query(
      `
      WITH movement_totals AS (
        SELECT
          it.item_id,
          COALESCE(SUM(CASE
            WHEN it.transaction_type IN ('RECEIPT', 'ADJUSTMENT_IN', 'RETURN')
            THEN it.quantity ELSE 0 END), 0)::integer AS inbound_quantity,
          COALESCE(SUM(CASE
            WHEN it.transaction_type IN ('ISSUE', 'ADJUSTMENT_OUT', 'WRITE_OFF')
            THEN it.quantity ELSE 0 END), 0)::integer AS outbound_quantity,
          COUNT(it.id)::integer AS transaction_count
        FROM inventory_transactions it
        WHERE 1 = 1
          ${transactionFilter}
        GROUP BY it.item_id
      )
      SELECT
        i.id,
        i.item_code,
        i.name,
        i.unit,
        i.minimum_stock,
        i.current_stock,
        i.physical_stock,
        (i.current_stock <= i.minimum_stock) AS is_low_stock,
        c.id AS category_id,
        c.name AS category_name,
        COALESCE(mt.inbound_quantity, 0)::integer AS inbound_quantity,
        COALESCE(mt.outbound_quantity, 0)::integer AS outbound_quantity,
        COALESCE(mt.transaction_count, 0)::integer AS transaction_count
      FROM items i
      JOIN categories c ON c.id = i.category_id
      LEFT JOIN movement_totals mt ON mt.item_id = i.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY c.name ASC, i.name ASC
      `,
      values,
    );

    const summary = result.rows.reduce(
      (totals, row) => {
        totals.itemCount += 1;
        totals.totalCurrentStock += Number(row.current_stock) || 0;
        totals.totalPhysicalStock += Number(row.physical_stock) || 0;
        totals.lowStockCount += row.is_low_stock ? 1 : 0;
        totals.inboundQuantity += Number(row.inbound_quantity) || 0;
        totals.outboundQuantity += Number(row.outbound_quantity) || 0;
        totals.transactionCount += Number(row.transaction_count) || 0;
        return totals;
      },
      {
        itemCount: 0,
        totalCurrentStock: 0,
        totalPhysicalStock: 0,
        lowStockCount: 0,
        inboundQuantity: 0,
        outboundQuantity: 0,
        transactionCount: 0,
      },
    );

    return res.status(200).json({
      success: true,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        categoryId: categoryId || null,
        transactionType: transactionType || null,
      },
      summary,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("[Reports] getInventoryReport error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate inventory report.",
    });
  }
};

// GET INVENTORY TRANSACTION REPORT
const getTransactionReport = async (req, res) => {
  const { startDate, endDate, transactionType, itemId } = req.query;

  if (!validateDateRange(res, startDate, endDate)) return;

  const values = [];
  const conditions = addDateConditions(
    values,
    "it.transaction_date",
    startDate,
    endDate,
  );

  if (transactionType) {
    values.push(transactionType);
    conditions.push(`it.transaction_type = $${values.length}`);
  }

  if (itemId) {
    values.push(itemId);
    conditions.push(`it.item_id = $${values.length}`);
  }

  try {
    const result = await pool.query(
      `
      SELECT it.id, it.transaction_type, it.quantity, it.reference_no,
        it.remarks, it.transaction_date, i.id AS item_id, i.item_code,
        i.name AS item_name, c.name AS category_name, u.full_name AS performed_by
      FROM inventory_transactions it
      JOIN items i ON i.id = it.item_id
      JOIN categories c ON c.id = i.category_id
      JOIN users u ON u.id = it.performed_by
      ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
      ORDER BY it.transaction_date DESC
      `,
      values,
    );

    const summary = result.rows.reduce(
      (totals, row) => {
        totals.transactionCount += 1;
        totals.totalQuantity += Number(row.quantity) || 0;
        if (["RECEIPT", "ADJUSTMENT_IN", "RETURN"].includes(row.transaction_type)) {
          totals.inboundQuantity += Number(row.quantity) || 0;
        }
        if (["ISSUE", "ADJUSTMENT_OUT", "WRITE_OFF"].includes(row.transaction_type)) {
          totals.outboundQuantity += Number(row.quantity) || 0;
        }
        return totals;
      },
      { transactionCount: 0, totalQuantity: 0, inboundQuantity: 0, outboundQuantity: 0 },
    );

    return res.status(200).json({ success: true, filters: { startDate: startDate || null, endDate: endDate || null, transactionType: transactionType || null, itemId: itemId || null }, summary, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error("[Reports] getTransactionReport error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate transaction report." });
  }
};

// GET REQUEST REPORT
const getRequestReport = async (req, res) => {
  const { startDate, endDate, status, departmentId } = req.query;

  if (!validateDateRange(res, startDate, endDate)) return;

  const values = [];
  const conditions = addDateConditions(values, "r.requested_at", startDate, endDate);

  if (status) {
    values.push(status);
    conditions.push(`r.status = $${values.length}`);
  }
  if (departmentId) {
    values.push(departmentId);
    conditions.push(`r.department_id = $${values.length}`);
  }

  try {
    const result = await pool.query(
      `
      SELECT r.id, r.status, r.priority, r.purpose, r.requested_at,
        r.needed_by_date, d.name AS department_name, u.full_name AS requester,
        COUNT(ri.id)::integer AS item_count,
        COALESCE(SUM(ri.quantity_requested), 0)::integer AS quantity_requested,
        COALESCE(SUM(ri.quantity_approved), 0)::integer AS quantity_approved,
        COALESCE(SUM(ri.quantity_issued), 0)::integer AS quantity_issued
      FROM requests r
      JOIN departments d ON d.id = r.department_id
      JOIN users u ON u.id = r.requester_id
      LEFT JOIN request_items ri ON ri.request_id = r.id
      ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
      GROUP BY r.id, d.name, u.full_name
      ORDER BY r.requested_at DESC
      `,
      values,
    );

    const summary = result.rows.reduce(
      (totals, row) => {
        totals.requestCount += 1;
        totals.quantityRequested += Number(row.quantity_requested) || 0;
        totals.quantityApproved += Number(row.quantity_approved) || 0;
        totals.quantityIssued += Number(row.quantity_issued) || 0;
        return totals;
      },
      { requestCount: 0, quantityRequested: 0, quantityApproved: 0, quantityIssued: 0 },
    );

    return res.status(200).json({ success: true, filters: { startDate: startDate || null, endDate: endDate || null, status: status || null, departmentId: departmentId || null }, summary, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error("[Reports] getRequestReport error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate request report." });
  }
};

// GET ISSUANCE REPORT
const getIssuanceReport = async (req, res) => {
  const { startDate, endDate, returned, itemId } = req.query;

  if (!validateDateRange(res, startDate, endDate)) return;

  const values = [];
  const conditions = addDateConditions(values, "ii.issued_date", startDate, endDate);

  if (returned === "true" || returned === "false") {
    values.push(returned === "true");
    conditions.push(`ii.returned = $${values.length}`);
  }
  if (itemId) {
    values.push(itemId);
    conditions.push(`ii.item_id = $${values.length}`);
  }

  try {
    const result = await pool.query(
      `
      SELECT ii.id, ii.quantity, ii.issued_date, ii.due_date, ii.returned,
        i.item_code, i.name AS item_name, c.name AS category_name,
        recipient.full_name AS issued_to, issuer.full_name AS issued_by
      FROM issued_items ii
      JOIN items i ON i.id = ii.item_id
      JOIN categories c ON c.id = i.category_id
      JOIN users recipient ON recipient.id = ii.issued_to
      JOIN users issuer ON issuer.id = ii.issued_by
      ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
      ORDER BY ii.issued_date DESC
      `,
      values,
    );

    const summary = result.rows.reduce(
      (totals, row) => {
        totals.issuanceCount += 1;
        totals.quantityIssued += Number(row.quantity) || 0;
        totals.returnedCount += row.returned ? 1 : 0;
        return totals;
      },
      { issuanceCount: 0, quantityIssued: 0, returnedCount: 0 },
    );

    return res.status(200).json({ success: true, filters: { startDate: startDate || null, endDate: endDate || null, returned: returned || null, itemId: itemId || null }, summary, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error("[Reports] getIssuanceReport error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate issuance report." });
  }
};

// GET RETURN REPORT
const getReturnReport = async (req, res) => {
  const { startDate, endDate, conditionStatus, itemId } = req.query;

  if (!validateDateRange(res, startDate, endDate)) return;

  const values = [];
  const conditions = addDateConditions(values, "ir.return_date", startDate, endDate);

  if (conditionStatus) {
    values.push(conditionStatus);
    conditions.push(`ir.condition_status = $${values.length}`);
  }
  if (itemId) {
    values.push(itemId);
    conditions.push(`ii.item_id = $${values.length}`);
  }

  try {
    const result = await pool.query(
      `
      SELECT ir.id, ir.quantity_returned, ir.return_date, ir.condition_status,
        ir.remarks, i.item_code, i.name AS item_name,
        u.full_name AS issued_to
      FROM item_returns ir
      JOIN issued_items ii ON ii.id = ir.issued_item_id
      JOIN items i ON i.id = ii.item_id
      JOIN users u ON u.id = ii.issued_to
      ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
      ORDER BY ir.return_date DESC
      `,
      values,
    );

    const summary = result.rows.reduce(
      (totals, row) => {
        totals.returnCount += 1;
        totals.quantityReturned += Number(row.quantity_returned) || 0;
        return totals;
      },
      { returnCount: 0, quantityReturned: 0 },
    );

    return res.status(200).json({ success: true, filters: { startDate: startDate || null, endDate: endDate || null, conditionStatus: conditionStatus || null, itemId: itemId || null }, summary, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error("[Reports] getReturnReport error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate return report." });
  }
};

module.exports = {
  getInventoryReport,
  getTransactionReport,
  getRequestReport,
  getIssuanceReport,
  getReturnReport,
};