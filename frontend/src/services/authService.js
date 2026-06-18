import axios from "axios";
import API_URL from "../config/api";

const authService = axios.create({
  baseURL: API_URL,
});

authService.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default authService;
