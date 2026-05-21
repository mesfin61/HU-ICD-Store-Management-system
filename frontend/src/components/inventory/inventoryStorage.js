const INVENTORY_STORAGE_KEY = "hu-icd-inventory-items";

const defaultInventoryItems = [
  {
    id: "ITEM-001",
    itemName: "Laptop",
    itemCode: "ITEM-001",
    category: "Hardware",
    initialQty: 10,
    unit: "Units",
    minStock: 5,
    status: "In Stock",
    vendor: "Dell",
    modelNumber: "Latitude 5440",
    warranty: "12 Months",
    createdAt: "2026-05-21T00:00:00.000Z",
  },
];

function canUseLocalStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function deriveStatus(initialQty, minStock) {
  if (initialQty <= 0) {
    return "Out of Stock";
  }

  if (initialQty <= minStock) {
    return "Low Stock";
  }

  return "In Stock";
}

function getStoredInventoryItems() {
  if (!canUseLocalStorage()) {
    return defaultInventoryItems;
  }

  const rawItems = window.localStorage.getItem(INVENTORY_STORAGE_KEY);

  if (!rawItems) {
    return defaultInventoryItems;
  }

  try {
    const parsedItems = JSON.parse(rawItems);
    return Array.isArray(parsedItems) && parsedItems.length > 0
      ? parsedItems
      : defaultInventoryItems;
  } catch {
    return defaultInventoryItems;
  }
}

function saveStoredInventoryItems(items) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
}

function buildInventoryItem(form) {
  const itemCode =
    form.itemCode.trim() || `ITEM-${Date.now().toString().slice(-6)}`;
  const initialQty = Number(form.initialQty) || 0;
  const minStock = Number(form.minStock) || 0;

  return {
    id: itemCode,
    itemName: form.itemName.trim() || itemCode,
    itemCode,
    category: form.category,
    initialQty,
    unit: form.unit,
    minStock,
    status: deriveStatus(initialQty, minStock),
    vendor: form.vendor.trim(),
    modelNumber: form.modelNumber.trim(),
    warranty: form.warranty.trim(),
    createdAt: new Date().toISOString(),
  };
}

function getInventorySummary(items) {
  const uniqueCategories = new Set();

  return items.reduce(
    (summary, item) => {
      uniqueCategories.add(item.category);

      summary.totalItems += 1;

      if (item.status === "Low Stock") {
        summary.lowStockItems += 1;
      }

      if (item.status === "Out of Stock") {
        summary.outStockItems += 1;
      }

      summary.activeCategories = uniqueCategories.size;
      return summary;
    },
    {
      totalItems: 0,
      lowStockItems: 0,
      outStockItems: 0,
      activeCategories: 0,
    },
  );
}

export {
  INVENTORY_STORAGE_KEY,
  buildInventoryItem,
  defaultInventoryItems,
  getInventorySummary,
  getStoredInventoryItems,
  saveStoredInventoryItems,
};
