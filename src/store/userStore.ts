import { create } from "zustand";
import { userService } from "@/services/user.service";

export interface User {
  id: string;
  name: string;
  userName?: string;
  email?: string;
  phone?: string;
  userCode?: string;
  createdAt: string;
  userRoles: {
    role: {
      name: string;
    };
  }[];
}

interface UserState {
  users: User[];
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deletingId: string | null;
  changingPasswordId: string | null;

  fetchUsers: () => Promise<void>;
  createUser: (data: any) => Promise<void>;
  updateUser: (id: string, data: any) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  changePassword: (id: string, newPassword: string) => Promise<void>;
  updateMyProfile: (data: any) => Promise<void>;
  changeMyPassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,
  creating: false,
  updating: false,
  deletingId: null,
  changingPasswordId: null,

  fetchUsers: async () => {
    try {
      set({ loading: true });
      const response = await userService.getAll();
      set({ users: response.data?.data?.items || response.data?.data || response.data || [] });
    } catch (error) {
      console.error("fetchUsers failed:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createUser: async (data) => {
    try {
      set({ creating: true });
      await userService.create(data);
    } catch (error) {
      console.error("createUser failed:", error);
      throw error;
    } finally {
      set({ creating: false });
    }
  },

  updateUser: async (id, data) => {
    try {
      set({ updating: true });
      await userService.update(id, data);
    } catch (error) {
      console.error("updateUser failed:", error);
      throw error;
    } finally {
      set({ updating: false });
    }
  },

  deleteUser: async (id) => {
    try {
      set({ deletingId: id });
      await userService.delete(id);
    } catch (error) {
      console.error("deleteUser failed:", error);
      throw error;
    } finally {
      set({ deletingId: null });
    }
  },

  changePassword: async (id, newPassword) => {
    try {
      set({ changingPasswordId: id });
      await userService.changePassword(id, newPassword);
    } catch (error) {
      console.error("changePassword failed:", error);
      throw error;
    } finally {
      set({ changingPasswordId: null });
    }
  },

  updateMyProfile: async (data: any) => {
    try {
      set({ updating: true });
      await userService.updateProfile(data);
    } catch (error) {
      console.error("updateMyProfile failed:", error);
      throw error;
    } finally {
      set({ updating: false });
    }
  },

  changeMyPassword: async (currentPassword: string, newPassword: string) => {
    try {
      set({ changingPasswordId: "self" });
      await userService.changeMyPassword(currentPassword, newPassword);
    } catch (error) {
      throw error;
    } finally {
      set({ changingPasswordId: null });
    }
  },
}));
