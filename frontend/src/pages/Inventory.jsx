import React from "react";
import { useLocation } from "react-router-dom";
import InventoryStats from "../components/inventory/InventoryStats";
import ItemLists from "../components/inventory/ItemLists";

function Inventory() {
  const location = useLocation();
  const savedItemName = location.state?.savedItemName;
  const savedItemCode = location.state?.savedItemCode;

  return (
    <div className="flex flex-col gap-3">
      {savedItemName ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Success: {savedItemName}
          {savedItemCode ? ` (${savedItemCode})` : ""} was added to inventory.
        </div>
      ) : null}
      <InventoryStats />
      <ItemLists />
    </div>
  );
}

export default Inventory;
