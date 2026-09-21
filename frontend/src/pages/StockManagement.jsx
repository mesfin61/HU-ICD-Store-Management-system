import React from "react";

import StockOperations from "../components/stock-management/StockOperations";
import RecentMovements from "../components/stock-management/RecentMovements";
import PageTransition from "../animated_motion/PageTransition";

export default function Stock() {
  const handleProcessTransaction = async () => {
    /*
     * StockOperations already processes the
     * transaction through the backend and reloads
     * the real inventory.
     *
     * Keep this callback available for RecentMovements
     * or future refresh logic.
     */
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-5">
        <StockOperations onProcessTransaction={handleProcessTransaction} />

        <RecentMovements />
      </div>
    </PageTransition>
  );
}
