import React, { useState } from "react";
import StockOperations from "../components/stock-management/StockOperations";
import RecentMovements from "../components/stock-management/RecentMovements";

export default function Stock() {
  const [movements, setMovements] = useState([]);

  const handleProcessTransaction = (movement) => {
    setMovements((currentMovements) => [movement, ...currentMovements]);
  };

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-5">
      <StockOperations onProcessTransaction={handleProcessTransaction} />
      <RecentMovements movements={movements} />
    </div>
  );
}
