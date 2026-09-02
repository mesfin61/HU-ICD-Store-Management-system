import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

import apiClient from "../../services/apiClient";

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
];

function StockCategory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadInventory() {
      try {
        setLoading(true);
        setError("");

        const response = await apiClient.get("/api/inventory");

        const items = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        if (mounted) {
          setInventory(items);
        }
      } catch (loadError) {
        console.error(
          "[StockCategory] Failed to load inventory:",
          loadError,
        );

        if (mounted) {
          setError(
            loadError.response?.data?.message ||
              loadError.message ||
              "Failed to load inventory category data.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadInventory();

    return () => {
      mounted = false;
    };
  }, []);

  const data = useMemo(() => {
    const categoryMap = inventory.reduce((accumulator, item) => {
      const category =
        String(item.category || item.category_name || "Uncategorized").trim() ||
        "Uncategorized";

      const quantity = Number(item.current_stock) || 0;

      accumulator[category] =
        (accumulator[category] || 0) + quantity;

      return accumulator;
    }, {});

    return Object.entries(categoryMap)
      .map(([category, value]) => ({
        category,
        value,
      }))
      .sort((left, right) => right.value - left.value);
  }, [inventory]);

  return (
    <div className="flex w-full flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h2 className="font-semibold text-slate-900">
          Stock by Category
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Current inventory quantity grouped by category.
        </p>
      </div>

      <div
        className="mt-3 w-full overflow-hidden"
        style={{ height: "clamp(240px, 32vw, 300px)" }}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-slate-200 text-sm font-medium text-slate-500">
            Loading inventory data...
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center rounded-md border border-red-200 bg-red-50 px-4 text-center text-sm font-medium text-red-700">
            {error}
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="category"
                cx="50%"
                cy="45%"
                innerRadius={48}
                outerRadius={78}
                paddingAngle={3}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`stock-category-${entry.category}-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(value) => [
                  Number(value).toLocaleString(),
                  "Units",
                ]}
              />

              <Legend
                wrapperStyle={{
                  fontSize: 12,
                  paddingTop: 8,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-slate-200 text-sm text-slate-500">
            No inventory category data yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default StockCategory;