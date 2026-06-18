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

export interface ProfileUser {
  id: string;
  name: string;
  userName: string;
  email?: string;
  phone?: string;
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
  updateMyProfile: (data: any) => Promise<ProfileUser>;
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
      const response = await userService.create(data);
      const newUser = response.data?.data || response.data;
      set((state) => ({
        users: [newUser, ...state.users],
      }));
    } finally {
      set({ creating: false });
    }
  },

  updateUser: async (id, data) => {
    try {
      set({ updating: true });
      const response = await userService.update(id, data);
      const updatedUser = response.data?.data || response.data;
      set((state) => ({
        users: state.users.map((user) => (user.id === id ? updatedUser : user)),
      }));
    } finally {
      set({ updating: false });
    }
  },

  deleteUser: async (id) => {
    try {
      set({ deletingId: id });
      await userService.delete(id);
      set((state) => ({
        users: state.users.filter((user) => user.id !== id),
      }));
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

  // Only for My Profile

  updateMyProfile: async (data: any) => {
    try {
      set({ updating: true });

      const response = await userService.updateProfile(data);

      return response.data?.data || response.data;
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
