/**
 * Authentication endpoints.
 *
 *   api.auth.login({ identifier, password })   → { accessToken, refreshToken, user }
 *   api.auth.me()                              → current user
 *   api.auth.logout()                          → invalidate refresh token
 *   api.auth.changePassword({ oldPassword, newPassword })
 */

import { request } from "./client";

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

export const auth = {
  login(payload: { identifier: string; password: string }) {
    return request.post<LoginResponse>("/api/auth/login", payload);
  },
  me() {
    return request.get<AuthUser>("/api/auth/me");
  },
  logout() {
    return request.post<void>("/api/auth/logout");
  },
  changePassword(payload: { oldPassword: string; newPassword: string }) {
    return request.post<void>("/api/auth/change-password", payload);
  },
};
