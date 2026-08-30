import apiClient from "./apiClient";

// =========================================================
// GET CURRENT USER'S OWN ACTIVITY
// =========================================================

export async function getMyActivity({
  limit = 100,
  offset = 0,
} = {}) {
  const response =
    await apiClient.get(
      "/api/audit-logs/mine",
      {
        params: {
          limit,
          offset,
        },
      },
    );

  return response.data.data;
}