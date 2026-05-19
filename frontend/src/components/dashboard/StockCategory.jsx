import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const data = [
  { category: "Computing Devices", value: 400 },
  { category: "Networking Hardware", value: 300 },
  { category: "Accessories", value: 300 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

function StockCategory() {
  return (
    <div className="flex flex-col p-4 bg-white rounded-lg shadow-lg ">
      <h2 className="text-slate-900 font-semibold">Stock by Category</h2>

      <div
        style={{ width: "100%", height: 220 }}
        className=" flex overflow-hidden"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="category"
              cx="50%"
              cy="40%"
              innerRadius={56}
              outerRadius={67}
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
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default StockCategory;
