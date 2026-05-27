import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth-store";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Attach JWT on every request — read from Zustand store (single source of truth)
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Global error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";

      if (status === 401) {
        // Token invalid / expired — clear store & redirect
        useAuthStore.getState().logout();
        if (!window.location.pathname.startsWith("/login")) {
          toast.error("Session expired. Please login again.");
          window.location.href = "/login";
        }
      } else if (status === 403) {
        toast.error("You don't have permission for this action.");
      } else if (status >= 500) {
        toast.error("Server error. Please try again later.");
      }

      (error as { displayMessage?: string }).displayMessage = message;
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
