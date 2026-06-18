import authService from "./authService";

export const updateProfile = async (data) => {
  const response = await authService.patch("api/auth/profile", data);
  return response.data.data;
};

export const uploadProfilePicture = async (formData) => {
  const response = await authService.patch(
    "/api/auth/profile-picture",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data.data;
};
