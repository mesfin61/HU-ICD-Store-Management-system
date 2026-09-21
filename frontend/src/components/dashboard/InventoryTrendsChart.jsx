import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

import apiClient from "../../services/apiClient";

// =========================================================
// HELPERS
// =========================================================

function formatChartDate(value) {
  const parsedDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// =========================================================
// INVENTORY TRENDS CHART
// =========================================================

function InventoryTrendsChart() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadMovementTrends() {
      try {
        setLoading(true);
        setError("");

        const response = await apiClient.get(
          "/api/inventory/transactions/trends",
        );

        const data = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        if (mounted) {
          setMovements(data);
        }
      } catch (loadError) {
        console.error(
          "[InventoryTrendsChart] Failed to load movement trends:",
          loadError,
        );

        if (mounted) {
          setError(
            loadError.response?.data?.message ||
              loadError.message ||
              "Failed to load inventory movement data.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadMovementTrends();

    return () => {
      mounted = false;
    };
  }, []);

  const chartData = useMemo(() => {
    return movements.map((entry) => ({
      date: entry.date,
      day: formatChartDate(entry.date),
      inbound: Number(entry.inbound) || 0,
      outbound: Number(entry.outbound) || 0,
    }));
  }, [movements]);

  return (
    <div className="w-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h2 className="font-semibold text-slate-900">
          Inventory Movement Trends
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Actual inbound and outbound inventory transactions over the last 30
          days.
        </p>
      </div>

      <div
        className="mt-4 w-full"
        style={{
          height: "clamp(280px, 45vw, 420px)",
        }}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-slate-200 text-sm font-medium text-slate-500">
            Loading inventory movement data...
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center rounded-md border border-red-200 bg-red-50 px-4 text-center text-sm font-medium text-red-700">
            {error}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-slate-200 text-sm text-slate-500">
            No inventory movement data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 45,
              }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="day"
                tick={{
                  fontSize: 11,
                }}
                interval={chartData.length > 14 ? 2 : 0}
                angle={-35}
                textAnchor="end"
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fontSize: 12,
                }}
                width={42}
              />

              <Tooltip
                formatter={(value, name) => [
                  Number(value).toLocaleString(),
                  name,
                ]}
                labelFormatter={(_, payload) => {
                  const rawDate = payload?.[0]?.payload?.date;

                  return rawDate ? formatChartDate(rawDate) : "Date";
                }}
              />

              <Legend
                wrapperStyle={{
                  fontSize: 12,
                }}
              />

              <Bar
                dataKey="inbound"
                name="Inbound"
                fill="#16a34a"
                radius={[5, 5, 0, 0]}
              />

              <Bar
                dataKey="outbound"
                name="Outbound"
                fill="#dc2626"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default InventoryTrendsChart;
