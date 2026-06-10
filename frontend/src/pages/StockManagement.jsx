import React, { useState } from "react";
import StockOperations from "../components/stock-management/StockOperations";
import RecentMovements from "../components/stock-management/RecentMovements";
import PageTransition from "../animated_motion/PageTransition";
import { getStoredStockMovements } from "../components/stock-management/stockMovementStorage";

export default function Stock() {
  const [movements, setMovements] = useState(() => getStoredStockMovements());

  const handleProcessTransaction = (movement, nextMovements) => {
    if (Array.isArray(nextMovements)) {
      setMovements(nextMovements);
      return;
    }

    setMovements((currentMovements) => [movement, ...currentMovements]);
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-5">
        <StockOperations onProcessTransaction={handleProcessTransaction} />
        <RecentMovements movements={movements} />
      </div>
    </PageTransition>
  );
}
