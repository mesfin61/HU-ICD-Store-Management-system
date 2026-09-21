import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import InventoryStats from "../components/inventory/InventoryStats";
import ItemLists from "../components/inventory/ItemLists";
import { getInventoryItems } from "../services/inventoryService";
import PageTransition from "../animated_motion/PageTransition";

function Inventory() {
  const location = useLocation();

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const savedItemName = location.state?.savedItemName;

  const savedItemCode = location.state?.savedItemCode;

  useEffect(() => {
    let mounted = true;

    const loadInventory = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getInventoryItems();

        if (mounted) {
          setItems(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("[Inventory] loadInventory:", error);

        if (mounted) {
          setErrorMessage(
            error.response?.data?.message || "Failed to load inventory.",
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadInventory();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PageTransition>
      {" "}
      <div className="flex flex-col gap-3">
        {savedItemName ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Success: {savedItemName}
            {savedItemCode ? ` (${savedItemCode})` : ""} was added to
            inventory.{" "}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <InventoryStats items={items} isLoading={isLoading} />

        <ItemLists items={items} isLoading={isLoading} />
      </div>
    </PageTransition>
  );
}

export default Inventory;
