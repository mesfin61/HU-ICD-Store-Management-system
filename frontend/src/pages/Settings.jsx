import React from "react";
import {
  getInventorySummary,
  getStoredInventoryItems,
} from "../components/inventory/inventoryStorage";
import {
  getStoredCurrentUser,
  getDisplayUserName,
} from "../components/user managent/userStorage";

export default function Settings() {
  const currentUser = getStoredCurrentUser();
  const inventorySummary = getInventorySummary(getStoredInventoryItems());

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div>
        <h2 className="text-2xl font-semibold mb-2 text-primary">Settings</h2>
        <p className="text-secondary font-semibold">
          Application settings and preferences for{" "}
          {getDisplayUserName(currentUser)}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Signed in as
          </div>
          <div className="mt-2 text-lg font-semibold text-slate-900">
            {currentUser?.role || "System Administrator"}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Current user
          </div>
          <div className="mt-2 text-lg font-semibold text-slate-900">
            {getDisplayUserName(currentUser)}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Inventory items
          </div>
          <div className="mt-2 text-lg font-semibold text-slate-900">
            {inventorySummary.totalItems}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Low stock alerts
          </div>
          <div className="mt-2 text-lg font-semibold text-slate-900">
            {inventorySummary.lowStockItems}
          </div>
        </div>
      </div>
    </div>
  );
}
