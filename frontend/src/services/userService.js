import apiClient from "./apiClient";

export async function getUsers() {
  const response = await apiClient.get("/api/users");

  const users = response.data?.data;

  return Array.isArray(users) ? users : [];
}

export async function createUser({
  fullName,
  email,
  password,
  departmentId,
  roleId,
}) {
  const response = await apiClient.post("/api/users", {
    fullName,
    email,
    password,
    departmentId,
    roleId,
  });

  return response.data?.data;
}

export async function transferOwnership(id, currentPassword) {
  const response = await apiClient.patch(
    `/api/users/${id}/transfer-ownership`,
    { currentPassword },
  );

  return response.data;
}

export async function setUserActiveState(id, active) {
  const response = await apiClient.patch(
    `/api/users/${id}/${active ? "activate" : "deactivate"}`,
  );

  return response.data;
}
