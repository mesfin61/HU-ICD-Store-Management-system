const REQUEST_STORAGE_KEY = "hu-icd-request-items";

function canUseLocalStorage() {
  try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function getStoredRequestItems() {
  if (!canUseLocalStorage()) {
    return [];
  }

  const rawItems = window.localStorage.getItem(REQUEST_STORAGE_KEY);

  if (!rawItems) {
    return [];
  }

  try {
    const parsedItems = JSON.parse(rawItems);
    return Array.isArray(parsedItems)
      ? parsedItems.map((item) => ({ ...item }))
      : [];
  } catch {
    return [];
  }
}

function saveStoredRequestItems(items) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    const toSave = Array.isArray(items)
      ? items.map((item) => ({ ...item }))
      : [];
    window.localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error("[Request] saveStoredRequestItems error:", err);
  }
}

function updateStoredRequestStatus(requestId, status) {
  if (!canUseLocalStorage()) {
    return [];
  }

  const currentRequests = getStoredRequestItems();
  const updatedRequests = currentRequests.map((request) =>
    request.id === requestId || request.requestId === requestId
      ? { ...request, status }
      : request,
  );

  saveStoredRequestItems(updatedRequests);
  return updatedRequests;
}

function buildRequestItem(form) {
  const requestId = `REQ-${Date.now().toString().slice(-6)}`;

  return {
    id: requestId,
    requestId,
    requester: form.requester.trim(),
    department: form.department.trim(),
    itemCategory: form.itemCategory.trim(),
    item: form.itemName.trim(),
    quantity: Number(form.quantity) || 0,
    priorityLevel: form.priorityLevel.trim(),
    purpose: form.purpose.trim(),
    neededByDate: form.neededByDate,
    supportingDocumentName: form.supportingDocumentName.trim(),
    supportingDocumentUrl: form.supportingDocumentUrl || "",
    supportingDocumentType: form.supportingDocumentType || "",
    date: form.neededByDate || new Date().toISOString().split("T")[0],
    status: "Pending",
    createdAt: new Date().toISOString(),
  };
}

export {
  REQUEST_STORAGE_KEY,
  buildRequestItem,
  getStoredRequestItems,
  updateStoredRequestStatus,
  saveStoredRequestItems,
};
