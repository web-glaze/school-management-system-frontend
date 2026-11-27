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

  teacher?: {
    isActive: boolean;
  };

  student?: {
    id: string;
    isActive: boolean;
    status: "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED";
    phone?: string | null;
    email?: string | null;
  } | null;

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

type UserPayload = {
  name: string;
  userName: string;
  email?: string;
  phone?: string | null;
  password?: string;
  role?: string;
};

export interface FetchUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

interface UserState {
  users: User[];
  total: number;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deletingId: string | null;
  changingPasswordId: string | null;

  createUser: (data: UserPayload) => Promise<void>;
  updateUser: (id: string, data: UserPayload) => Promise<void>;
  updateMyProfile: (data: UserPayload) => Promise<ProfileUser>;
  fetchUsers: (params?: FetchUsersParams) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  changePassword: (id: string, newPassword: string) => Promise<void>;
  changeMyPassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

// Ignores slow, outdated responses (e.g. while typing in search)
let latestUsersRequest = 0;

export const useUserStore = create<UserState>((set) => ({
  users: [],
  total: 0,
  loading: false,
  creating: false,
  updating: false,
  deletingId: null,
  changingPasswordId: null,

  fetchUsers: async (params) => {
    const requestId = ++latestUsersRequest;

    try {
      set({ loading: true });
      const response = await userService.getAll(params);

      if (requestId !== latestUsersRequest) return;

      const result = response.data?.data ?? response.data;
      set({ users: result?.items || [], total: result?.total || 0 });
    } catch (error) {
      if (requestId !== latestUsersRequest) return;

      console.error("fetchUsers failed:", error);
      throw error;
    } finally {
      if (requestId === latestUsersRequest) {
        set({ loading: false });
      }
    }
  },

  createUser: async (data: UserPayload) => {
    try {
      set({ creating: true });
      await userService.create(data);
    } finally {
      set({ creating: false });
    }
  },

  updateUser: async (id: string, data: UserPayload) => {
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

  updateMyProfile: async (data: UserPayload) => {
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
