import apiClient from "./apiClient";

export async function getCategories() {
  const response =
    await apiClient.get("/api/categories");

  return response.data.data;
}