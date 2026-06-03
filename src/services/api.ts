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

export default apiClient;

export const authService = {
  login: (credentials: { identifier: string; password: string }) =>
    apiClient.post('/auth/login', credentials),

  getProfile: () =>
    apiClient.get('/auth/profile'),
};