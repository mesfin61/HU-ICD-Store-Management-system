import React from "react";
import Stats from "../components/dashboard/Stats";
import InventoryTrendsChart from "../components/dashboard/InventoryTrendsChart";
import QuickActions from "../components/dashboard/QuickActions";
import StockCategory from "../components/dashboard/StockCategory";
import RecentActivities from "../components/dashboard/RecentActivities";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:px-6 md:py-5">
      <Stats />

      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex flex-1 min-w-0">
          <InventoryTrendsChart />
        </div>
        <div className="flex flex-col gap-3 xl:w-[320px] w-full">
          <QuickActions />
          <StockCategory />
        </div>
      </div>
      <RecentActivities />
    </div>
  );
}
