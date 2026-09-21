import apiClient from "./apiClient";

export async function getDepartments() {
  const response = await apiClient.get(
    "/api/departments?includeInactive=true",
  );

  const departments = response.data?.data;

  return Array.isArray(departments) ? departments : [];
}

export async function updateDepartment(id, data) {
  const response = await apiClient.patch(`/api/departments/${id}`, data);

  return response.data.data;
}

export async function activateDepartment(id) {
  const response = await apiClient.patch(`/api/departments/${id}/activate`);

  return response.data.data;
}

export async function deactivateDepartment(id) {
  const response = await apiClient.patch(`/api/departments/${id}/deactivate`)

  return response.data.data;
}