"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Loader2, Save, Shield, ShieldCheck } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logError } from "@/lib/api-helpers";
import { notify } from "@/lib/notify";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Backend shape (see roles.service.ts):
 *   GET /api/roles               → Role[] where role.permissions is string[]
 *                                  of permission CODES (not objects).
 *   GET /api/roles/permissions   → Permission[] with { id, code, module,
 *                                  description }.
 *   PATCH /api/roles/:id/permissions accepts { permissionIds: string[] }.
 *
 * We store the current selection as a Set<string> of permission IDs per
 * role and map back-and-forth from codes when seeding from the role list.
 */
interface Permission {
  id: string;
  code: string; // e.g. "ticket.create"
  module?: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[]; // permission CODES
}

/**
 * Admin / Super-admin page: tick which permissions each role gets.
 *
 *   GET  /api/roles                  → list of roles + current permissions
 *   GET  /api/roles/permissions      → full catalogue of available permissions
 *   PATCH /api/roles/:id/permissions → save the new permission set for a role
 *
 * The state is "dirty by role" — Save only fires for roles the user actually
 * changed, so a single PATCH per touched role (not one per checkbox).
 */
export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Local pending state: per-role set of permissionIds the user has ticked.
  // Initially populated from the server response. Diff against the server
  // copy to know which roles are "dirty".
  const [pending, setPending] = useState<Record<string, Set<string>>>({});
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [rolesRes, permsRes] = await Promise.all([
        axios.get(`${API_URL}/api/roles`, { headers }),
        axios.get(`${API_URL}/api/roles/permissions`, { headers }),
      ]);

      const rolesData: Role[] = Array.isArray(rolesRes.data)
        ? rolesRes.data
        : rolesRes.data?.data ?? [];
      const permsData: Permission[] = Array.isArray(permsRes.data)
        ? permsRes.data
        : permsRes.data?.data ?? [];

      setRoles(rolesData);
      setPermissions(permsData);

      // Seed the pending map: role.permissions is an array of permission
      // CODES, but we track by ID for save. Build a code→id lookup from
      // the catalogue, then translate each role's current codes into ids.
      const codeToId = new Map<string, string>();
      for (const p of permsData) codeToId.set(p.code, p.id);

      const seed: Record<string, Set<string>> = {};
      for (const role of rolesData) {
        const ids = new Set<string>();
        for (const code of role.permissions ?? []) {
          const id = codeToId.get(code);
          if (id) ids.add(id);
        }
        seed[role.id] = ids;
      }
      setPending(seed);
    } catch (error) {
      logError("roles.page.fetch", error);
      notify.error(error, "Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => fetchData(), 0);
  }, []);

  const togglePermission = (roleId: string, permissionId: string) => {
    setPending((prev) => {
      const next = { ...prev };
      const current = new Set(next[roleId] ?? []);
      if (current.has(permissionId)) current.delete(permissionId);
      else current.add(permissionId);
      next[roleId] = current;
      return next;
    });
  };

  const isDirty = (role: Role): boolean => {
    // Build the server set fresh each render — translate codes to ids
    // using the catalogue we already have in state.
    const codeToId = new Map<string, string>();
    for (const p of permissions) codeToId.set(p.code, p.id);
    const server = new Set<string>();
    for (const code of role.permissions ?? []) {
      const id = codeToId.get(code);
      if (id) server.add(id);
    }
    const local = pending[role.id] ?? new Set<string>();
    if (server.size !== local.size) return true;
    for (const id of local) if (!server.has(id)) return true;
    return false;
  };

  const saveRole = async (role: Role) => {
    try {
      setSavingRoleId(role.id);
      const token = localStorage.getItem("token");

      const permissionIds = Array.from(pending[role.id] ?? new Set<string>());

      await axios.patch(
        `${API_URL}/api/roles/${role.id}/permissions`,
        { permissionIds },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      notify.success(`Saved ${role.name}`);
      await fetchData();
    } catch (error) {
      logError("roles.page.save", error);
      notify.error(error, "Failed to save role");
    } finally {
      setSavingRoleId(null);
    }
  };

  // Group permissions by their backend `module` field (or the code prefix
  // if module is missing) so the matrix reads as "ticket: create, read,
  // assign, …" instead of one big list.
  const groups = useMemo(() => {
    const map = new Map<string, Permission[]>();
    const filtered = permissions.filter((p) => {
      if (!p || typeof p.code !== "string") return false;
      if (!search.trim()) return true;
      const needle = search.toLowerCase();
      return (
        p.code.toLowerCase().includes(needle) ||
        (p.module ?? "").toLowerCase().includes(needle) ||
        (p.description ?? "").toLowerCase().includes(needle)
      );
    });
    for (const perm of filtered) {
      const group =
        perm.module || perm.code.split(".")[0] || "other";
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(perm);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions, search]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-card rounded-md p-5 md:p-6 border border-border/60">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  Roles &amp; Permissions
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tick the permissions each role should have. Save changes per
                  role; nothing is applied until you click Save.
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Input
                placeholder="Filter permissions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Matrix */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : roles.length === 0 ? (
          <div className="bg-card rounded-md border border-border/60 p-10 text-center">
            <Shield className="size-10 text-muted-foreground/60 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No roles found. Seed your database first.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {roles.map((role) => {
              const dirty = isDirty(role);
              const saving = savingRoleId === role.id;
              const localPerms = pending[role.id] ?? new Set<string>();

              return (
                <div
                  key={role.id}
                  className="bg-card rounded-md border border-border/60 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="size-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          {role.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          {localPerms.size} permission
                          {localPerms.size === 1 ? "" : "s"} selected
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => saveRole(role)}
                      disabled={!dirty || saving}
                      className="h-9 gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="size-3.5" />
                          {dirty ? "Save" : "Saved"}
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="p-5 space-y-5">
                    {groups.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No permissions match your filter.
                      </p>
                    ) : (
                      groups.map(([groupName, perms]) => (
                        <div key={groupName} className="space-y-2">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {groupName}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {perms.map((perm) => {
                              const checked = localPerms.has(perm.id);
                              return (
                                <label
                                  key={perm.id}
                                  className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                    checked
                                      ? "border-primary/30 bg-primary/[0.04]"
                                      : "border-border/60 hover:bg-muted/30"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      togglePermission(role.id, perm.id)
                                    }
                                    className="mt-0.5 accent-primary cursor-pointer"
                                  />
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-foreground truncate">
                                      {perm.code}
                                    </div>
                                    {perm.description && (
                                      <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                                        {perm.description}
                                      </div>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
