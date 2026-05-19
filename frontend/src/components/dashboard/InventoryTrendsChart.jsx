import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const data = [
  { date: "2026-01-15", inbound: 80, outbound: 15 },
  { date: "2026-01-16", inbound: 83, outbound: 32 },
  { date: "2026-01-17", inbound: 93, outbound: 12 },
  { date: "2026-05-18", inbound: 100, outbound: 20 },
  { date: "2026-05-19", inbound: 90, outbound: 10 },
];

const dataWithDay = data.map((d) => {
  const dt = new Date(d.date);
  const weekday = dt.toLocaleDateString(undefined, { weekday: "long" });
  return { ...d, day: weekday };
});

function InventoryTrendsChart() {
  return (
    <div
      className="rounded-lg bg-white border-black border-solid divide-black shadow"
      style={{ width: "60%", height: 300 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={dataWithDay}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="inbound" fill="#4CAF50" radius={[6, 6, 0, 0]} />
          <Bar dataKey="outbound" fill="#F44336" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default InventoryTrendsChart;
