import apiClient from "./apiClient";

export async function getCategories() {
  const response = await apiClient.get("/api/categories");

  return response.data.data;
}

export async function updateCategory(id, data) {
  const response = await apiClient.patch(`/api/categories/${id}`, data);

  return response.data.data;
}

export async function activateCategory(id) {
  const response = await apiClient.patch(`/api/categories/${id}/activate`);

  return response.data.data;
}

export async function deactivateCategory(id) {
  const response = await apiClient.patch(`/api/categories/${id}/deactivate`);

  return response.data.data;
}
