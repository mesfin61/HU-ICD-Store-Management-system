import React from "react";
import Stats from "../components/dashboard/Stats";
import InventoryTrendsChart from "../components/dashboard/InventoryTrendsChart";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-3">
      <Stats />

      <div>
        <InventoryTrendsChart />
      </div>
      <div></div>
    </div>
  );
}
