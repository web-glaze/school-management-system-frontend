"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AccessKey, canAccess, useRole } from "@/lib/rbac";

interface RoleGuardProps {
  /** The feature/page being gated. */
  access: AccessKey;
  /** Where to send users who don't have access. Defaults to /maintenance. */
  redirectTo?: string;
  /** Optional fallback while role hydrates (default: render nothing). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Gate a page or section by access key.
 *
 *   <RoleGuard access="users">
 *     <UserManagementPage />
 *   </RoleGuard>
 *
 * Renders children only if the current role has access. Otherwise
 * silently redirects to `redirectTo` so the user lands somewhere
 * reasonable instead of seeing a blank page or admin tools.
 *
 * The role is read from localStorage and is null during initial SSR /
 * client hydration; during that window we render the fallback (default
 * nothing) so the page stays blank rather than flashing.
 */
export function RoleGuard({
  access,
  redirectTo = "/maintenance",
  fallback = null,
  children,
}: RoleGuardProps) {
  const role = useRole();
  const router = useRouter();
  const allowed = canAccess(role, access);

  useEffect(() => {
    // Wait for role to hydrate. If once hydrated the role is missing or
    // the feature is not allowed, bounce them to a safe page.
    if (role === null) return;
    if (!allowed) router.replace(redirectTo);
  }, [role, allowed, redirectTo, router]);

  if (role === null) return <>{fallback}</>;
  if (!allowed) return <>{fallback}</>;

  return <>{children}</>;
}
