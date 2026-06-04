// services/api.ts

import axios from "axios";

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
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      return new Promise(() => {});
    }
    return Promise.reject(error);
  }
);

export default apiClient;

export const authService = {
  login: (credentials: { identifier: string; password: string }) =>
    apiClient.post('/auth/login', credentials),

  getProfile: () =>
    apiClient.get('/auth/profile'),
};