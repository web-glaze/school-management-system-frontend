/**
 * User Management endpoints (admin / superadmin only).
 *
 *   api.users.list()
 *   api.users.create({ name, email, password, role })
 *   api.users.update(id, patch)
 *   api.users.changePassword(id, newPassword)
 *   api.users.remove(id)
 */

import { request } from "./client";

export interface User {
  id: string;
  userCode?: string;
  email: string;
  name?: string;
  role?: string;
  status?: string;
  createdAt: string;
}

export const users = {
  list() {
    return request.get<User[]>("/api/user-management");
  },
  get(id: string) {
    return request.get<User>(`/api/user-management/${id}`);
  },
  create(dto: {
    name?: string;
    email: string;
    password: string;
    role?: string;
  }) {
    return request.post<User>("/api/user-management", dto);
  },
  update(
    id: string,
    dto: { name?: string; email?: string; role?: string; status?: string },
  ) {
    return request.patch<User>(`/api/user-management/${id}`, dto);
  },
  changePassword(id: string, newPassword: string) {
    return request.patch<void>(`/api/user-management/${id}/password`, {
      newPassword,
    });
  },
  remove(id: string) {
    return request.delete<void>(`/api/user-management/${id}`);
  },
};
