import apiClient from "./apiClient";

export async function getDepartments() {
  const response = await apiClient.get("/api/departments");

  const departments = response.data?.data;

  return Array.isArray(departments)
    ? departments
    : [];
}