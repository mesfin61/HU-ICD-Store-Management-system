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

const fallbackData = [{ category: "Inventory", value: 1 }];

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

  const chartData = data.length > 0 ? data : fallbackData;

  return (
    <div className="flex flex-col p-4 bg-white rounded-lg shadow-lg w-full">
      <h2 className="text-slate-900 font-semibold">Stock by Category</h2>

      <div
        style={{ width: "100%", height: "clamp(200px, 32vw, 260px)" }}
        className="flex overflow-hidden"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="category"
              cx="50%"
              cy="40%"
              innerRadius={42}
              outerRadius={58}
              paddingAngle={3}
            >
              {chartData.map((entry, index) => (
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
      </div>
    </div>
  );
}

export default StockCategory;
