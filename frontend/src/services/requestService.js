import apiClient from "./apiClient";

export async function createRequest({
  purpose,
  items,
}) {
  const response = await apiClient.post(
    "/api/requests",
    {
      purpose,
      items,
    },
  );

  return response.data.data;
}

export async function getMyRequests() {
  const response = await apiClient.get(
    "/api/requests/mine",
  );

  return response.data.data;
}

export async function getAllRequests() {
  const response = await apiClient.get(
    "/api/requests",
  );

  return response.data.data;
}

export async function getRequestsForIssuance() {
  const response = await apiClient.get(
    "/api/requests/for-issuance",
  );

  return response.data.data;
}

export async function getRequest(id) {
  const response = await apiClient.get(
    `/api/requests/${id}`,
  );

  return response.data.data;
}

export async function approveRequest(
  requestId,
  approvedItems,
) {
  const response = await apiClient.patch(
    `/api/requests/${requestId}/approve`,
    {
      approvedItems,
    },
  );

  return response.data.data;
}

export async function rejectRequest(
  requestId,
  rejectionReason,
) {
  const response = await apiClient.patch(
    `/api/requests/${requestId}/reject`,
    {
      rejectionReason,
    },
  );

  return response.data.data;
}