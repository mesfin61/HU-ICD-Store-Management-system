import API_URL from "../config/api";

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function getUsers() {
  const response = await fetch(`${API_URL}/api/users`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to retrieve users.",
    );
  }

  return data.data;
}

export async function createUser({
  fullName,
  email,
  password,
  departmentId,
  roleId,
}) {
  const response = await fetch(`${API_URL}/api/users`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      fullName,
      email,
      password,
      departmentId,
      roleId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to create user.",
    );
  }

  return data.data;
}