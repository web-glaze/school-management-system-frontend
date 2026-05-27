"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
 * Client-side auth guard hook.
 *
 * - Reads token + user from localStorage.
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const raw =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;

    if (!token || !raw) {
      router.push(redirectTo);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as AuthUser;

      // Defensive defaults for older user objects without these fields.
      const safe: AuthUser = {
        ...parsed,
        roles: parsed.roles ?? [],
        permissions: parsed.permissions ?? [],
      };

      // Role gate
      if (allowedRoles.length > 0 && !allowedRoles.includes(safe.role)) {
        router.push(unauthorizedTo);
        return;
      }

      // Permission gate
      if (
        requiredPermissions.length > 0 &&
        !requiredPermissions.every((p) => safe.permissions.includes(p))
      ) {
        router.push(unauthorizedTo);
        return;
      }

      setUser(safe);
    } catch {
      router.push(redirectTo);
      return;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPermission = (code: string): boolean =>
    user?.permissions?.includes(code) ?? false;

  const hasAnyPermission = (...codes: string[]): boolean =>
    codes.some((c) => user?.permissions?.includes(c)) ?? false;

  const hasAllPermissions = (...codes: string[]): boolean =>
    codes.every((c) => user?.permissions?.includes(c)) ?? false;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push(redirectTo);
  };

  return {
    user,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    logout,
  };
}
