import apiClient from "./apiClient";

export async function issueInventory({
  requestId,
  requestItemId,
  quantity,
  dueDate,
}) {
  const response = await apiClient.post(
    `/api/issuance/request/${requestId}`,
    {
      requestItemId,
      quantity,
      dueDate: dueDate || null,
    },
  );

  return response.data.data;
}

export async function getIssuancesByRequest(
  requestId,
) {
  const response = await apiClient.get(
    `/api/issuance/request/${requestId}`,
  );

  return response.data.data;
}

export async function getOutstandingIssuedItems() {
  const response = await apiClient.get(
    "/api/issuance/outstanding",
  );

  return response.data.data;
}

export async function getMyOutstandingIssuedItems() {
  const response = await apiClient.get(
    "/api/issuance/my-outstanding",
  );

  return response.data.data;
}