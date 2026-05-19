import React from "react";
import Stats from "../components/dashboard/Stats";
import InventoryTrendsChart from "../components/dashboard/InventoryTrendsChart";
import QuickActions from "../components/dashboard/QuickActions";
import StockCategory from "../components/dashboard/StockCategory";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-3">
      <Stats />

      <div className="flex flex-row gap-3">
        <div className="flex flex-1 p-2 ">
          <InventoryTrendsChart />
        </div>
        <div className="flex flex-col gap-2">
          <QuickActions />
          <StockCategory />
        </div>
      </div>
      <div></div>
    </div>
  );
}
