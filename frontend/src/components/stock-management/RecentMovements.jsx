import React from "react";

function RecentMovements() {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-primary">
          Recent Movements
        </h3>

        <p className="text-sm text-slate-500">
          Inventory transactions will be loaded from the database here.
        </p>
      </div>

      <div className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-slate-500">
        Transaction history is being loaded from the inventory ledger.
      </div>
    </div>
  );
}

export default RecentMovements;