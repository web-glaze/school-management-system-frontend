import apiClient from "./api";

export const roleService = {
  getRoles: () => apiClient.get("/roles"),

  getPermissions: () => apiClient.get("/roles/permissions"),

  createRole: (name: string, description?: string) =>
    apiClient.post("/roles", { name, description }),

  updateRolePermissions: (roleId: string, permissionIds: string[]) =>
    apiClient.patch(`/roles/${roleId}/permissions`, { permissionIds }),

  deleteRole: (roleId: string) =>
    apiClient.delete(`/roles/${roleId}`),
};
