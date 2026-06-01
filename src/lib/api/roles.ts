/**
 * Role & Permission endpoints (admin / superadmin only).
 *
 *   api.roles.list()                                → roles + their permissions
 *   api.roles.permissions()                         → full permission catalogue
 *   api.roles.create({ name })
 *   api.roles.updatePermissions(roleId, ids)
 *   api.roles.remove(id)
 */

import { request } from "./client";

/**
 * Matches the backend shape (roles.service.ts):
 *   listPermissions() returns the raw Permission rows with id/code/module.
 *   findAll() returns Role[] where `permissions` is an array of permission
 *   CODES (strings), not nested objects.
 */
export interface Permission {
  id: string;
  code: string;
  module?: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  permissions: string[]; // permission codes
}

export const roles = {
  list() {
    return request.get<Role[]>("/api/roles");
  },
  permissions() {
    return request.get<Permission[]>("/api/roles/permissions");
  },
  create(dto: { name: string }) {
    return request.post<Role>("/api/roles", dto);
  },
  updatePermissions(roleId: string, permissionIds: string[]) {
    return request.patch<Role>(`/api/roles/${roleId}/permissions`, {
      permissionIds,
    });
  },
  remove(id: string) {
    return request.delete<void>(`/api/roles/${id}`);
  },
};
