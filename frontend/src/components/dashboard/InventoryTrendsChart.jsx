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
      className="rounded-lg bg-white border-black border-solid divide-black shadow-lg p-3 w-full"
      style={{ width: "100%", height: "clamp(280px, 45vw, 450px)" }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={dataWithDay}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          barCategoryGap="20%"
        >
          <XAxis dataKey="day" tick={{ fontSize: 12 }} interval={0} />
          <YAxis tick={{ fontSize: 12 }} width={32} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="inbound" fill="#4CAF50" radius={[6, 6, 0, 0]} />
          <Bar dataKey="outbound" fill="#F44336" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default InventoryTrendsChart;
