"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore, type AppRole } from "@/store/auth-store";

export type { AppRole, AuthUser } from "@/store/auth-store";

interface UseAuthOptions {
  /** Roles allowed on this page. If empty, any logged-in user passes. */
  allowedRoles?: AppRole[];
  /** Permission codes required. User must have ALL of these. */
  requiredPermissions?: string[];
  /** Redirect URL when not authenticated. Default: /login */
  redirectTo?: string;
  /** Where to send if role/permission check fails. Default: /dashboard */
  unauthorizedTo?: string;
}

/**
 * Client-side auth guard hook — backed by Zustand auth store.
 *
 * - Waits for Zustand hydration before checking (no flash of unauthenticated).
 * - Redirects to /login if no token.
 * - If allowedRoles is set, requires user's role to be in the list.
 * - If requiredPermissions is set, requires user to have ALL of them.
 *
 * Returns { user, loading, hasPermission(code), logout }.
 */
export function useAuth(options: UseAuthOptions = {}) {
  const {
    allowedRoles = [],
    requiredPermissions = [],
    redirectTo = "/login",
    unauthorizedTo = "/dashboard",
  } = options;

  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const storeLogout = useAuthStore((s) => s.logout);
  const hasPermissionStore = useAuthStore((s) => s.hasPermission);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for Zustand persistence to hydrate from localStorage
    if (!hydrated) return;

    if (!user) {
      router.push(redirectTo);
      return;
    }

    // Role gate
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      router.push(unauthorizedTo);
      return;
    }

    // Permission gate
    if (
      requiredPermissions.length > 0 &&
      !requiredPermissions.every((p) =>
        (user.permissions ?? []).includes(p),
      )
    ) {
      router.push(unauthorizedTo);
      return;
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user]);

  const logout = () => {
    storeLogout();
    router.push(redirectTo);
  };

  /** Reactive permission helper (re-runs on user change). */
  const hasPermission = (code: string): boolean =>
    user?.permissions?.includes(code) ?? false;

  const hasAnyPermission = (...codes: string[]): boolean =>
    codes.some((c) => user?.permissions?.includes(c));

  const hasAllPermissions = (...codes: string[]): boolean =>
    codes.every((c) => user?.permissions?.includes(c));

  return {
    user,
    loading: !hydrated || loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    logout,
    // Also expose store-level checker for convenience
    _checkPermission: hasPermissionStore,
  };
}
