import apiClient from "./apiClient";

export async function getInventoryItems() {
  const response = await apiClient.get("/api/inventory");

  return response.data.data;
}

export async function getInventoryItem(id) {
  const response = await apiClient.get(`/api/inventory/${id}`);

  return response.data.data;
}

export async function createInventoryItem({
  itemCode,
  name,
  categoryId,
  description,
  unit,
  minimumStock,
  initialQuantity,
  isAsset,
  vendor,
  referenceNo,
  remarks,
}) {
  const response = await apiClient.post("/api/inventory", {
    itemCode,
    name,
    categoryId,
    description,
    unit,
    minimumStock,
    initialQuantity,
    isAsset,
    vendor,
    referenceNo,
    remarks,
  });

  return response.data.data;
}

export async function receiveStock(itemId, payload) {
  const response = await apiClient.post(
    `/api/inventory/${itemId}/receive`,
    payload,
  );

  return response.data.data;
}

export async function adjustStockIn(itemId, payload) {
  const response = await apiClient.post(
    `/api/inventory/${itemId}/adjust-in`,
    payload,
  );

  return response.data.data;
}

export async function adjustStockOut(itemId, payload) {
  const response = await apiClient.post(
    `/api/inventory/${itemId}/adjust-out`,
    payload,
  );

  return response.data.data;
}

export async function writeOffStock(itemId, payload) {
  const response = await apiClient.post(
    `/api/inventory/${itemId}/write-off`,
    payload,
  );

  return response.data.data;
}
