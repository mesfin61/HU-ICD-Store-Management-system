import React from "react";
import { useLocation } from "react-router-dom";
import InventoryStats from "../components/inventory/InventoryStats";
import ItemLists from "../components/inventory/ItemLists";
import { dedupeStoredInventoryItems } from "../components/inventory/inventoryStorage";
import { useEffect } from "react";
import PageTransition from "../animated_motion/PageTransition";

function Inventory() {
  const location = useLocation();
  const savedItemName = location.state?.savedItemName;
  const savedItemCode = location.state?.savedItemCode;

  useEffect(() => {
    try {
      const res = dedupeStoredInventoryItems();
      if (res && res.fixed) {
        console.info(
          "[Inventory] dedupeStoredInventoryItems fixed duplicates",
          res.items.length,
        );
      }
    } catch (err) {
      console.error("[Inventory] dedupe call failed", err);
    }
  }, []);

  return (
    <PageTransition>
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
    </PageTransition>
  );
}

export default Inventory;
