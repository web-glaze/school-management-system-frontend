/**
 * Centralised axios client used by every API module under src/lib/api.
 *
 * Pages never import axios directly. They call `api.complaints.list()` etc.
 * and this client handles:
 *
 *   1. baseURL from NEXT_PUBLIC_API_URL (works in dev / staging / prod)
 *   2. Bearer token injected from localStorage on every request
 *   3. Auto-unwrap of `{ data: ... }` envelope so callers see the inner value
 *   4. Automatic redirect to /login on 401 (token expired / revoked)
 *
 * Error handling is intentionally NOT done here — each API caller decides
 * whether to toast / log / swallow. See `notify.error(err)` for the standard
 * way to surface server messages.
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ── Request: attach Bearer token ─────────────────────────────────────────
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization =
        `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response: kick to /login on 401, otherwise pass error through ────────
http.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: AxiosError) => {
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      // Token is bad or expired — wipe and bounce to login. The component
      // that fired the request still sees the rejection so it can stop
      // any pending UI state.
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(err);
  },
);

/**
 * Unwrap the data envelope used by the NestJS backend. The shape is one of:
 *   - { success, data: T, ... }        (typical envelope)
 *   - T (raw value)                    (older endpoints)
 *
 * Always returns T. Use this so callers don't repeat the same branch.
 */
function unwrap<T>(res: AxiosResponse): T {
  const body = res.data;
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

/**
 * Thin typed helpers — every API module uses these instead of calling
 * http.get / http.post directly. Centralising means we can add retry,
 * caching, tracing etc. later without touching call sites.
 */
export const request = {
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const res = await http.get(url, { params });
    return unwrap<T>(res);
  },
  async post<T>(url: string, body?: unknown): Promise<T> {
    const res = await http.post(url, body);
    return unwrap<T>(res);
  },
  async patch<T>(url: string, body?: unknown): Promise<T> {
    const res = await http.patch(url, body);
    return unwrap<T>(res);
  },
  async put<T>(url: string, body?: unknown): Promise<T> {
    const res = await http.put(url, body);
    return unwrap<T>(res);
  },
  async delete<T>(url: string): Promise<T> {
    const res = await http.delete(url);
    return unwrap<T>(res);
  },
  /**
   * Multipart upload. Use for /uploads/image so we don't reset the JSON
   * Content-Type header globally.
   */
  async upload<T>(url: string, formData: FormData): Promise<T> {
    const res = await http.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap<T>(res);
  },
};

// Exported for the (rare) case a page needs the raw axios instance,
// e.g. to attach a custom cancel token or upload progress callback.
export { http };
