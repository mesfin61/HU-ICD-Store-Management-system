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
    if (Array.isArray(parsedItems) && parsedItems.length > 0) {
      return parsedItems.map((it) => ({ ...it }));
    }

    return defaultInventoryItems.map((it) => ({ ...it }));
  } catch {
    return defaultInventoryItems.map((it) => ({ ...it }));
  }
}

function saveStoredInventoryItems(items) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    const toSave = Array.isArray(items) ? items.map((it) => ({ ...it })) : [];

    // detect duplicates within the provided items
    const counts = toSave.reduce((m, it) => {
      m[it.id] = (m[it.id] || 0) + 1;
      return m;
    }, {});

    const duplicates = Object.keys(counts).filter((k) => counts[k] > 1);
    if (duplicates.length > 0) {
      console.warn(
        "[Inventory] saveStoredInventoryItems: duplicate ids in provided items:",
        duplicates,
      );
    }

    // detect collisions with existing stored items
    const existing = getStoredInventoryItems();
    const combined = [...existing, ...toSave];
    const combinedCounts = combined.reduce((m, it) => {
      m[it.id] = (m[it.id] || 0) + 1;
      return m;
    }, {});

    const collisions = Object.keys(combinedCounts).filter(
      (k) => combinedCounts[k] > 1,
    );
    if (collisions.length > 0) {
      console.warn(
        "[Inventory] saveStoredInventoryItems: id collisions with existing storage:",
        collisions,
      );
    }

    window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error("[Inventory] saveStoredInventoryItems error:", err);
  }
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

function dedupeStoredInventoryItems() {
  if (!canUseLocalStorage()) {
    return { fixed: false, message: "localStorage unavailable" };
  }

  const raw = window.localStorage.getItem(INVENTORY_STORAGE_KEY);
  if (!raw) {
    return { fixed: false, message: "no items in storage" };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return { fixed: false, message: "corrupt storage" };
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { fixed: false, message: "nothing to dedupe" };
  }

  const seen = new Map();
  let changed = false;

  const result = parsed.map((it) => {
    const id = it.id || it.itemCode || "";
    if (!seen.has(id)) {
      seen.set(id, 1);
      return { ...it };
    }

    // duplicate: generate a unique suffix
    changed = true;
    let suffixIndex = seen.get(id) + 1;
    let newId;
    do {
      newId = `${id}-dup-${suffixIndex}`;
      suffixIndex += 1;
    } while (
      parsed.some((o) => (o.id || o.itemCode) === newId) ||
      seen.has(newId)
    );

    seen.set(id, seen.get(id) + 1);
    seen.set(newId, 1);

    const newItem = { ...it, id: newId, itemCode: newId };
    console.info(`[Inventory] dedupe: ${id} -> ${newId}`);
    return newItem;
  });

  if (changed) {
    try {
      window.localStorage.setItem(
        INVENTORY_STORAGE_KEY,
        JSON.stringify(result),
      );
      return { fixed: true, items: result };
    } catch (err) {
      console.error("[Inventory] dedupe: failed to write storage", err);
      return { fixed: false, message: "write_failed" };
    }
  }

  return { fixed: false, message: "no_duplicates" };
}

export {
  INVENTORY_STORAGE_KEY,
  buildInventoryItem,
  defaultInventoryItems,
  getInventorySummary,
  getStoredInventoryItems,
  deriveStatus,
  saveStoredInventoryItems,
  dedupeStoredInventoryItems,
};
