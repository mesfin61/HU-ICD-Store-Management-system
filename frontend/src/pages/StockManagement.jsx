import React, { useState } from "react";
import StockOperations from "../components/stock-management/StockOperations";
import RecentMovements from "../components/stock-management/RecentMovements";

export default function Stock() {
  const [movements, setMovements] = useState([]);

  const handleProcessTransaction = (movement) => {
    setMovements((currentMovements) => [movement, ...currentMovements]);
  };

  return (
    <div className="flex flex-col gap-6">
      <StockOperations onProcessTransaction={handleProcessTransaction} />
      <RecentMovements movements={movements} />
    </div>
  );
}
