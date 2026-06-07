const STOCK_MOVEMENT_STORAGE_KEY = "hu-icd-stock-movements";

function canUseLocalStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function cloneMovements(movements) {
  return movements.map((movement) => ({ ...movement }));
}

function getStoredStockMovements() {
  if (!canUseLocalStorage()) {
    return [];
  }

  const rawMovements = window.localStorage.getItem(STOCK_MOVEMENT_STORAGE_KEY);
  if (!rawMovements) {
    return [];
  }

  try {
    const parsedMovements = JSON.parse(rawMovements);
    return Array.isArray(parsedMovements)
      ? cloneMovements(parsedMovements)
      : [];
  } catch {
    return [];
  }
}

function saveStoredStockMovements(movements) {
  if (!canUseLocalStorage()) {
    return;
  }

  const toSave = Array.isArray(movements)
    ? movements.map((movement) => ({ ...movement }))
    : [];

  window.localStorage.setItem(
    STOCK_MOVEMENT_STORAGE_KEY,
    JSON.stringify(toSave),
  );
}

function buildStockMovement(form, selectedItem) {
  const movementType = form.mode === "outbound" ? "Stock-Out" : "Stock-In";

  return {
    id: `MOV-${Date.now().toString().slice(-6)}`,
    movementType,
    itemId: selectedItem?.id || form.itemId,
    item: selectedItem?.itemName || form.itemLabel,
    itemCode: selectedItem?.itemCode || "",
    category: selectedItem?.category || "Uncategorized",
    quantity: Number(form.quantity) || 0,
    date: form.date || new Date().toISOString().slice(0, 10),
    source: form.source.trim(),
    reference: form.reference.trim(),
    remarks: form.remarks.trim(),
    status: movementType === "Stock-In" ? "Received" : "Issued",
    createdAt: new Date().toISOString(),
  };
}

function addStoredStockMovement(movement) {
  const movements = getStoredStockMovements();
  const nextMovements = [movement, ...movements];
  saveStoredStockMovements(nextMovements);
  return nextMovements;
}

function getStockMovementSummary(movements) {
  return movements.reduce(
    (summary, movement) => {
      summary.totalMovements += 1;
      summary.totalInbound += movement.movementType === "Stock-In" ? 1 : 0;
      summary.totalOutbound += movement.movementType === "Stock-Out" ? 1 : 0;
      summary.totalQuantity += Number(movement.quantity) || 0;
      return summary;
    },
    {
      totalMovements: 0,
      totalInbound: 0,
      totalOutbound: 0,
      totalQuantity: 0,
    },
  );
}

export {
  STOCK_MOVEMENT_STORAGE_KEY,
  addStoredStockMovement,
  buildStockMovement,
  getStockMovementSummary,
  getStoredStockMovements,
  saveStoredStockMovements,
};
