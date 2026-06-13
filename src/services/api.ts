import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const apiClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
});

apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        useAuthStore.getState().logout();
        window.location.replace("/login");
      }
      return new Promise(() => {});
    }

    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        useAuthStore.getState().logout();
        window.location.replace("/login");
      }
      return new Promise(() => {});
    }

    if (error.response?.status === 403) {
      if (typeof window !== "undefined") {
        window.location.replace("/403");
      }
      return new Promise(() => {});
    }

    return Promise.reject(error);
  }
);

export default apiClient;

export const authService = {
  login: (credentials: { identifier: string; password: string }) =>
    apiClient.post("/auth/login", credentials),

  getProfile: () => apiClient.get("/auth/profile"),
};