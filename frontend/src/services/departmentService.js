import API_URL from "../config/api";

export async function getDepartments() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/departments`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to retrieve departments."
    );
  }

  return data.data;
}