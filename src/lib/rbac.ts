/**
 * Role-based access control for the maintenance UI.
 *
 * One source of truth for what each role can see and do.
 * Pages call `useRole()` to read the current role and `canAccess(role, key)`
 * to decide whether to render content or redirect.
 *
 * Roles (matches the backend RBAC catalogue):
 *   superadmin — sees everything across all schools.
 *   admin      — sees everything in their school.
 *   manager    — manages tickets but not staff/locations/users.
 *   technician — sees only tickets assigned to them.
 *   user       — raises tickets, sees only their own complaints.
 */

import { useEffect, useState } from "react";

export type Role =
  | "superadmin"
  | "admin"
  | "manager"
  | "technician"
  | "user";

/**
 * Page/feature keys used by the UI. Add new ones here when introducing
 * a new page; never sprinkle role string-checks across components.
 */
export type AccessKey =
  | "overview" // /maintenance — dashboard
  | "tickets.list" // /maintenance/tickets — full list
  | "tickets.create" // /maintenance/tickets/create
  | "tickets.detail" // /maintenance/tickets/[id]
  | "tickets.assign" // assign technician
  | "tickets.update" // change status / priority / description
  | "my-complaints" // /maintenance/my-complaints
  | "departments" // /maintenance/departments — CRUD
  | "technicians" // /maintenance/technician — CRUD
  | "locations" // /maintenance/location — CRUD
  | "users" // /maintenance/user — CRUD
  | "roles"; // /maintenance/roles — permission matrix

/**
 * Allow-list per role. Anything not in the list is denied.
 * Keep this small and explicit — easier to audit than negative rules.
 */
const ACCESS: Record<Role, AccessKey[]> = {
  superadmin: [
    "overview",
    "tickets.list",
    "tickets.create",
    "tickets.detail",
    "tickets.assign",
    "tickets.update",
    "my-complaints",
    "departments",
    "technicians",
    "locations",
    "users",
    "roles",
  ],
  admin: [
    "overview",
    "tickets.list",
    "tickets.create",
    "tickets.detail",
    "tickets.assign",
    "tickets.update",
    "my-complaints",
    "departments",
    "technicians",
    "locations",
    "users",
    "roles",
  ],
  manager: [
    "overview",
    "tickets.list",
    "tickets.create",
    "tickets.detail",
    "tickets.assign",
    "tickets.update",
    "my-complaints",
  ],
  technician: [
    "overview",
    "tickets.list",
    "tickets.detail",
    "tickets.update",
    "my-complaints",
  ],
  user: ["overview", "tickets.create", "my-complaints"],
};

/** Pure check — true if the role has access to the feature. */
export function canAccess(role: Role | null | undefined, key: AccessKey): boolean {
  if (!role) return false;
  return (ACCESS[role] ?? []).includes(key);
}

/** Map an unknown string to a Role, defaulting to "user". */
export function normaliseRole(raw: unknown): Role {
  if (typeof raw !== "string") return "user";
  if (raw === "superadmin" || raw === "admin" || raw === "manager" ||
      raw === "technician" || raw === "user") {
    return raw;
  }
  return "user";
}

/**
 * Reactive role read from localStorage. SSR-safe — returns null on the
 * server then hydrates client-side. Pages should treat `null` as "still
 * loading, render nothing yet".
 */
export function useRole(): Role | null {
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return setRole(null);
      const parsed = JSON.parse(raw);
      setRole(normaliseRole(parsed?.role));
    } catch {
      setRole(null);
    }
  }, []);

  return role;
}
