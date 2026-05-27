import axios from "axios";
import toast from "react-hot-toast";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Attach JWT from localStorage on every request
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global error handling — 401 redirect to login, show toast otherwise
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
        // Token invalid / expired — clear & redirect
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (!window.location.pathname.startsWith("/login")) {
          toast.error("Session expired. Please login again.");
          window.location.href = "/login";
        }
      } else if (status === 403) {
        toast.error("You don't have permission for this action.");
      } else if (status >= 500) {
        toast.error("Server error. Please try again later.");
      }
      // 4xx other than 401/403: let caller decide whether to toast
      // (so create/update forms can show field-level errors)

      // Attach a normalized message to the error
      (error as { displayMessage?: string }).displayMessage = message;
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
