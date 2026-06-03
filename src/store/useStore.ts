import { create } from "zustand";
import { authService } from "@/services/api";
import axios from "axios";

interface GlobalState {
  user: any | null;
  setUser: (user: any) => void;
  logout: () => void;
}

interface UserData {
  id: string;
  email: string;
  role: string;
  roles: string[];
}

interface AuthState {
  user: UserData | null;
  loading: boolean;
  login: (credentials: { identifier: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}


export const useStore = create<GlobalState>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      set({ user: null });
    }
  },
}));

export const useAuthStore = create<AuthState>((set) => ({
  user: typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null,
  loading: false,

  login: async (credentials) => {
    try {
      set({ loading: true });
      const response = await authService.login(credentials);
      
      const user = response.data?.data?.user;
      const accessToken = response.data?.data?.accessToken;
      const roles = user?.roles || [];

      if (!user || !accessToken) throw new Error("Invalid response structural signature");

      // Role Parsing Logic
      let role = "user";
      if (roles.includes("SUPER_ADMIN")) {
        role = "superadmin";
      } else if (roles.includes("ADMIN")) {
        role = "admin";
      } else if (roles.includes("MANAGER")) {
        role = "manager";
      }

      const userData: UserData = {
        id: user.id,
        email: user.email,
        role,
        roles,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("token", accessToken);
        localStorage.setItem("user", JSON.stringify(userData));
      }

      set({ user: userData });
      return { success: true };
    } catch (error: unknown) {
      console.error(error);
      const message = axios.isAxiosError(error) ? error.response?.data?.message : null;
      return { success: false, error: typeof message === "string" ? message : "Login Failed" };
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    set({ user: null });
  },
}));