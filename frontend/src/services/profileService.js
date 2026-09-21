import authService from "./authService";

export const updateProfile = async (data) => {
  const response = await authService.patch("api/auth/profile", data);
  return response.data.data;
};
