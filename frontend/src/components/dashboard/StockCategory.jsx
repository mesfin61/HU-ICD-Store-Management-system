import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { getStoredInventoryItems } from "../inventory/inventoryStorage";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

function StockCategory() {
  const storedItems = getStoredInventoryItems();
  const categoryMap = storedItems.reduce((accumulator, item) => {
    accumulator[item.category] = (accumulator[item.category] || 0) + 1;
    return accumulator;
  }, {});

  const data = Object.entries(categoryMap).map(([category, value]) => ({
    category,
    value,
  }));

  return (
    <div className="flex flex-col p-4 bg-white rounded-lg shadow-lg w-full">
      <h2 className="text-slate-900 font-semibold">Stock by Category</h2>

      <div
        style={{ width: "100%", height: "clamp(200px, 32vw, 260px)" }}
        className="flex overflow-hidden"
      >
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="category"
                cx="50%"
                cy="40%"
                innerRadius={42}
                outerRadius={58}
                paddingAngle={3}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, "Items"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex w-full items-center justify-center rounded-md border border-dashed border-slate-200 text-sm text-slate-500">
            No inventory categories yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default StockCategory;
