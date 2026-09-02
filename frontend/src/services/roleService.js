import apiClient from "./apiClient";

export async function getRoles() {
  const response = await apiClient.get("/api/roles");

  const roles = response.data?.data;

  return Array.isArray(roles)
    ? roles
    : [];
}