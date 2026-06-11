import { create } from "zustand";
import { roleService } from "@/services/role.service";

export interface Permission {
  id: string;
  code: string;
  module?: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  isSystem?: boolean;
  permissions: string[];
}

interface RoleState {
  roles: Role[];
  permissions: Permission[];
  loading: boolean;
  savingRoleId: string | null;
  deletingRoleId: string | null;
  creatingRole: boolean;

  fetchRolesAndPermissions: () => Promise<void>;
  createRole: (name: string, description?: string, copyFromRoleId?: string) => Promise<Role | null>;
  deleteRole: (id: string) => Promise<void>;
  updateRolePermissions: (roleId: string, permissionIds: string[]) => Promise<void>;
}

export const useRoleStore = create<RoleState>((set, get) => ({
  roles: [],
  permissions: [],
  loading: false,
  savingRoleId: null,
  deletingRoleId: null,
  creatingRole: false,

  fetchRolesAndPermissions: async () => {
    try {
      set({ loading: true });
      const [rolesRes, permsRes] = await Promise.all([
        roleService.getRoles(),
        roleService.getPermissions(),
      ]);

      const rolesData = Array.isArray(rolesRes.data) ? rolesRes.data : (rolesRes.data?.data ?? []);
      const permsData = Array.isArray(permsRes.data) ? permsRes.data : (permsRes.data?.data ?? []);

      set({ roles: rolesData, permissions: permsData });
    } catch (error) {
      console.error("fetchRolesAndPermissions failed:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createRole: async (name, description, copyFromRoleId) => {
    try {
      set({ creatingRole: true });
      const response = await roleService.createRole(name, description);
      const createdRole = response.data?.data ?? response.data;

      const newId = createdRole?.id;
      if (newId && copyFromRoleId) {
        const sourceRole = get().roles.find((r) => r.id === copyFromRoleId);
        if (sourceRole) {
          const codeToId = new Map<string, string>();
          for (const p of get().permissions) {
            codeToId.set(p.code, p.id);
          }
          const permissionIds: string[] = [];
          for (const code of sourceRole.permissions ?? []) {
            const pid = codeToId.get(code);
            if (pid) permissionIds.push(pid);
          }
          if (permissionIds.length > 0) {
            await roleService.updateRolePermissions(newId, permissionIds);
          }
        }
      }

      await get().fetchRolesAndPermissions();
      return createdRole;
    } catch (error) {
      console.error("createRole failed:", error);
      throw error;
    } finally {
      set({ creatingRole: false });
    }
  },

  deleteRole: async (id) => {
    try {
      set({ deletingRoleId: id });
      await roleService.deleteRole(id);
      await get().fetchRolesAndPermissions();
    } catch (error) {
      console.error("deleteRole failed:", error);
      throw error;
    } finally {
      set({ deletingRoleId: null });
    }
  },

  updateRolePermissions: async (roleId, permissionIds) => {
    try {
      set({ savingRoleId: roleId });
      await roleService.updateRolePermissions(roleId, permissionIds);
      await get().fetchRolesAndPermissions();
    } catch (error) {
      console.error("updateRolePermissions failed:", error);
      throw error;
    } finally {
      set({ savingRoleId: null });
    }
  },
}));
