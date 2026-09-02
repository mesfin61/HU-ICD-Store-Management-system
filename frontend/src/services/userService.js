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