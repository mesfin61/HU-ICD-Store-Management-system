const pool = require("../config/db");

// =========================================================
// GET INVENTORY MOVEMENT TRENDS
//
// Returns the last 30 calendar days of actual inventory
// transactions.
//
// Inbound:
//   RECEIPT
//   ADJUSTMENT_IN
//   RETURN
//
// Outbound:
//   ISSUE
//   ADJUSTMENT_OUT
//   WRITE_OFF
//
// RESERVATION is deliberately excluded because reservation
// changes available stock but does NOT physically move stock.
// =========================================================

const getInventoryMovementTrends = async (req, res) => {
  try {
    const result = await pool.query(`
      WITH calendar AS (
        SELECT
          generate_series(
            CURRENT_DATE - INTERVAL '29 days',
            CURRENT_DATE,
            INTERVAL '1 day'
          )::date AS movement_date
      ),

      daily_movements AS (
        SELECT
          transaction_date::date AS movement_date,

          COALESCE(
            SUM(
              CASE
                WHEN transaction_type IN (
                  'RECEIPT',
                  'ADJUSTMENT_IN',
                  'RETURN'
                )
                THEN quantity
                ELSE 0
              END
            ),
            0
          ) AS inbound,

          COALESCE(
            SUM(
              CASE
                WHEN transaction_type IN (
                  'ISSUE',
                  'ADJUSTMENT_OUT',
                  'WRITE_OFF'
                )
                THEN quantity
                ELSE 0
              END
            ),
            0
          ) AS outbound

        FROM inventory_transactions

        WHERE transaction_date >=
          CURRENT_DATE - INTERVAL '29 days'

        GROUP BY transaction_date::date
      )

      SELECT
        calendar.movement_date AS date,
        COALESCE(daily_movements.inbound, 0)::integer AS inbound,
        COALESCE(daily_movements.outbound, 0)::integer AS outbound

      FROM calendar

      LEFT JOIN daily_movements
        ON daily_movements.movement_date =
           calendar.movement_date

      ORDER BY calendar.movement_date ASC
    `);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error(
      "[InventoryTransactions] getInventoryMovementTrends error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

module.exports = {
  getInventoryMovementTrends,
};
