import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { getStoredStockMovements } from "../stock-management/stockMovementStorage";

function InventoryTrendsChart() {
  const dataWithDay = useMemo(() => {
    const groupedByDate = getStoredStockMovements().reduce(
      (accumulator, movement) => {
        const dateKey =
          movement.date || movement.createdAt?.slice(0, 10) || "Unknown";

        if (!accumulator[dateKey]) {
          accumulator[dateKey] = {
            date: dateKey,
            inbound: 0,
            outbound: 0,
          };
        }

        if (movement.movementType === "Stock-In") {
          accumulator[dateKey].inbound += Number(movement.quantity) || 0;
        }

        if (movement.movementType === "Stock-Out") {
          accumulator[dateKey].outbound += Number(movement.quantity) || 0;
        }

        return accumulator;
      },
      {},
    );

    return Object.values(groupedByDate)
      .sort((left, right) => new Date(left.date) - new Date(right.date))
      .map((entry) => {
        const parsedDate = new Date(entry.date);
        return {
          ...entry,
          day: Number.isNaN(parsedDate.getTime())
            ? entry.date
            : parsedDate.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              }),
        };
      });
  }, []);

  return (
    <div
      className="rounded-lg bg-white border-black border-solid divide-black shadow-lg p-3 w-full"
      style={{ width: "100%", height: "clamp(280px, 45vw, 450px)" }}
    >
      {dataWithDay.length > 0 ? (
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
            <Bar
              dataKey="inbound"
              name="Inbound"
              fill="#4CAF50"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="outbound"
              name="Outbound"
              fill="#F44336"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center rounded-md border border-dashed border-slate-200 text-sm text-slate-500">
          No stock movement data yet.
        </div>
      )}
    </div>
  );
}

export default InventoryTrendsChart;
