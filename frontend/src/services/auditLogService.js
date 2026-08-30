import apiClient from "./apiClient";

// =========================================================
// GET AUDIT LOGS
// Administrator only
// =========================================================

export async function getAuditLogs({
  limit = 50,
  offset = 0,
  action = "",
  entityName = "",
  userId = "",
} = {}) {
  const params = {
    limit,
    offset,
  };

  if (action) {
    params.action = action;
  }

  if (entityName) {
    params.entityName = entityName;
  }

  if (userId) {
    params.userId = userId;
  }

  const response = await apiClient.get(
    "/api/audit-logs",
    { params },
  );

  return response.data.data;
}

// =========================================================
// GET ONE AUDIT LOG
// Administrator only
// =========================================================

export async function getAuditLog(id) {
  const response = await apiClient.get(
    `/api/audit-logs/${id}`,
  );

  return response.data.data;
}