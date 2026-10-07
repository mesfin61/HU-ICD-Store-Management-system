import React from "react";

import Stats from "../components/dashboard/Stats";
import QuickActions from "../components/dashboard/QuickActions";
import RecentActivities from "../components/dashboard/RecentActivities";
import InventoryTrendsChart from "../components/dashboard/InventoryTrendsChart";
import StockCategory from "../components/dashboard/StockCategory";
import PageTransition from "../animated_motion/PageTransition";
import { useUser } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useUser();
  const isAdministrator = user?.role === "Administrator";

  return (
    <PageTransition>
      <div className="flex flex-col gap-5 px-4 py-4 md:px-6 md:py-5">
        <Stats />

        <QuickActions />

        {!isAdministrator && (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <InventoryTrendsChart />
            <StockCategory />
          </div>
        )}

        <RecentActivities />
      </div>
    </PageTransition>
  );
}
