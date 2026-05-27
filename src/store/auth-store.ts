"use client";

import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from "zustand/middleware";

export type AppRole =
  | "superadmin"
  | "admin"
  | "manager"
  | "technician"
  | "user";

export interface AuthUser {
  id: string;
  email: string;
  /** Derived "primary" role label for routing/branding. */
  role: AppRole;
  /** Raw role names from backend (e.g. SUPER_ADMIN, ADMIN). */
  roles: string[];
  /** Permission codes from backend (e.g. ticket.create, user.read). */
  permissions: string[];
}

interface AuthState {
  // ── State ────────────────────────────────────────────────
  token: string | null;
  user: AuthUser | null;
  /** True once Zustand has rehydrated from localStorage on client. */
  hydrated: boolean;

  // ── Actions ──────────────────────────────────────────────
  /** Save token + user after successful login. */
  login: (token: string, user: AuthUser) => void;
  /** Clear everything (logout). */
  logout: () => void;
  /** Update permissions / roles without re-login (e.g. after profile refresh). */
  refreshUser: (patch: Partial<AuthUser>) => void;
  /** Marked true by middleware once hydration completes — used to gate SSR. */
  _setHydrated: () => void;

  // ── Selectors (computed) ─────────────────────────────────
  isAuthenticated: () => boolean;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (...codes: string[]) => boolean;
  hasAllPermissions: (...codes: string[]) => boolean;
  hasRole: (role: AppRole) => boolean;
}

/**
 * SSR-safe storage that returns null on the server.
 * Prevents "window is not defined" during Next.js prerender.
 */
const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(name, value);
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // initial state
      token: null,
      user: null,
      hydrated: false,

      // actions
      login: (token, user) => set({ token, user }),

      logout: () => set({ token: null, user: null }),

      refreshUser: (patch) =>
        set((state) =>
          state.user ? { user: { ...state.user, ...patch } } : state,
        ),

      _setHydrated: () => set({ hydrated: true }),

      // selectors
      isAuthenticated: () => !!get().token && !!get().user,

      hasPermission: (code) =>
        get().user?.permissions?.includes(code) ?? false,

      hasAnyPermission: (...codes) =>
        codes.some((c) => get().user?.permissions?.includes(c)),

      hasAllPermissions: (...codes) =>
        codes.every((c) => get().user?.permissions?.includes(c)),

      hasRole: (role) => get().user?.role === role,
    }),
    {
      name: "ecole-auth", // localStorage key
      storage: createJSONStorage(() => safeLocalStorage),
      // Only persist these — selectors / hydrated should not be saved
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        // Called once after the persisted state is rehydrated client-side.
        state?._setHydrated();
      },
      version: 1,
    },
  ),
);

// ── Convenience hooks (selectors) ────────────────────────────
// These re-render the component ONLY when the specific slice changes,
// improving performance vs. picking the whole state.

export const useAuthUser = () => useAuthStore((s) => s.user);
export const useAuthToken = () => useAuthStore((s) => s.token);
export const useAuthHydrated = () => useAuthStore((s) => s.hydrated);
export const useAuthActions = () =>
  useAuthStore((s) => ({
    login: s.login,
    logout: s.logout,
    refreshUser: s.refreshUser,
  }));

// Permission helpers as direct functions (no React rerender)
export const checkPermission = (code: string): boolean =>
  useAuthStore.getState().hasPermission(code);

export const getToken = (): string | null =>
  useAuthStore.getState().token;
