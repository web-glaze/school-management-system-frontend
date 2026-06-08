"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  Save,
  Shield,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

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
  description?: string | null;
  isSystem?: boolean; // protects the 6 built-in roles from deletion
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
  // New-role dialog state
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  // "Copy permissions from" — when set, the new role starts with the
  // same ticks as this source role. Useful for sub-heads inheriting
  // their Maintenance Manager's base permissions.
  const [copyFromRoleId, setCopyFromRoleId] = useState("");
  const [creatingRole, setCreatingRole] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);

  // Collapsible card state — which role IDs are currently expanded.
  // Default: only the first (top) role is expanded so the page is
  // readable on first paint instead of 15 sections deep.
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const toggleRoleExpanded = (id: string) =>
    setExpandedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const expandAll = () =>
    setExpandedRoles(new Set(roles.map((r) => r.id)));
  const collapseAll = () => setExpandedRoles(new Set());

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
      console.error("roles.page.fetch", error);
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => fetchData(), 0);
  }, []);

  /**
   * Create a brand-new role (e.g. HR_HEAD, ACADEMIC_HEAD). Backend
   * defaults `isSystem=false` so the new role can be deleted later.
   * After creating, reload so the new role card shows up.
   */
  const createRole = async () => {
    const name = newRoleName.trim().toUpperCase().replace(/\s+/g, "_");
    if (!name) {
      toast.error("Role name is required");
      return;
    }
    try {
      setCreatingRole(true);
      const token = localStorage.getItem("token");
      const createdRes = await axios.post(
        `${API_URL}/api/roles`,
        {
          name,
          description: newRoleDescription.trim() || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // If admin picked "Copy permissions from <existing role>", apply
      // that source role's permission set to the new role right away.
      // One follow-up PATCH — admin can still adjust before clicking Save
      // on the new card.
      const created = createdRes.data?.data ?? createdRes.data;
      const newId = created?.id ?? null;
      if (newId && copyFromRoleId) {
        const source = roles.find((r) => r.id === copyFromRoleId);
        if (source) {
          const codeToId = new Map<string, string>();
          for (const p of permissions) codeToId.set(p.code, p.id);
          const permissionIds: string[] = [];
          for (const code of source.permissions ?? []) {
            const pid = codeToId.get(code);
            if (pid) permissionIds.push(pid);
          }
          if (permissionIds.length > 0) {
            await axios.patch(
              `${API_URL}/api/roles/${newId}/permissions`,
              { permissionIds },
              { headers: { Authorization: `Bearer ${token}` } },
            );
          }
        }
      }

      toast.success(
        copyFromRoleId
          ? `Role "${name}" created with copied permissions`
          : `Role "${name}" created`,
      );
      setNewRoleName("");
      setNewRoleDescription("");
      setCopyFromRoleId("");
      setCreateOpen(false);
      await fetchData();
      // Auto-expand the brand-new role card so admin can immediately tweak.
      if (newId) {
        setExpandedRoles((prev) => {
          const next = new Set(prev);
          next.add(newId);
          return next;
        });
      }
    } catch (error) {
      console.error("roles.page.create", error);
      toast.error("Failed to create role");
    } finally {
      setCreatingRole(false);
    }
  };

  /**
   * Delete a custom role. Backend rejects deletion of system roles
   * (SUPER_ADMIN, ADMIN, MANAGER, TECHNICIAN, STAFF, USER) so we also
   * guard the button on the frontend.
   */
  const deleteRole = async (role: Role) => {
    if (role.isSystem) {
      toast.error("System roles cannot be deleted");
      return;
    }
    if (
      !confirm(
        `Delete role "${role.name}"? Users with this role will lose its permissions.`,
      )
    ) {
      return;
    }
    try {
      setDeletingRoleId(role.id);
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/roles/${role.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Deleted ${role.name}`);
      await fetchData();
    } catch (error) {
      console.error("roles.page.delete", error);
      toast.error("Failed to delete role");
    } finally {
      setDeletingRoleId(null);
    }
  };

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

      toast.success(`Saved ${role.name}`);
      await fetchData();
    } catch (error) {
      console.error("roles.page.save", error);
      toast.error("Failed to save role");
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

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Input
                  placeholder="Filter permissions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Expand / Collapse all — handy on long pages */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={
                  expandedRoles.size === roles.length ? collapseAll : expandAll
                }
                className="h-9 gap-1.5 shrink-0"
                disabled={roles.length === 0}
              >
                {expandedRoles.size === roles.length ? (
                  <>
                    <ChevronRight className="size-3.5" />
                    Collapse All
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3.5" />
                    Expand All
                  </>
                )}
              </Button>

              {/* + New Role — opens the create dialog */}
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shrink-0">
                    <Plus className="size-4" />
                    New Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[440px]">
                  <DialogHeader>
                    <DialogTitle>Create a new role</DialogTitle>
                    <DialogDescription>
                      Use UPPER_SNAKE_CASE for the name (e.g. HR_HEAD,
                      ACADEMIC_HEAD). It will appear immediately in the role
                      dropdown on the Users page. You can tick its
                      permissions right below after saving.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 py-2">
                    <div>
                      <Label className="text-xs">Role Name</Label>
                      <Input
                        autoFocus
                        placeholder="e.g. HR_HEAD"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        className="mt-1 uppercase"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Description (optional)</Label>
                      <Input
                        placeholder="What this role is for"
                        value={newRoleDescription}
                        onChange={(e) => setNewRoleDescription(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">
                        Copy permissions from (optional)
                      </Label>
                      <select
                        value={copyFromRoleId}
                        onChange={(e) => setCopyFromRoleId(e.target.value)}
                        className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 text-xs focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none bg-white pr-8 appearance-none bg-[length:14px_14px] bg-no-repeat bg-[right_0.6rem_center] bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%23667085%22><path fill-rule=%22evenodd%22 d=%22M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 011.08 1.04l-4.24 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z%22/></svg>')]"
                      >
                        <option value="">Start blank (no permissions)</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.permissions.length} perms)
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                        Pick a parent / similar role to pre-tick its
                        permissions. e.g. creating <code>ELECTRICAL_HEAD</code>?
                        Copy from <code>MAINTENANCE_MANAGER</code>, then add
                        the extras specific to electrical.
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost" type="button" disabled={creatingRole}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      onClick={createRole}
                      disabled={creatingRole || !newRoleName.trim()}
                      className="gap-2"
                    >
                      {creatingRole ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Creating…
                        </>
                      ) : (
                        <>
                          <Plus className="size-3.5" />
                          Create
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                  {/* Clickable header — toggles expand. Stops at the
                      action buttons on the right so clicking Save/Delete
                      doesn't also collapse the section. */}
                  <div onClick={() => toggleRoleExpanded(role.id)} className="w-full flex items-center justify-between px-5 py-4 border-b border-border/50 hover:bg-muted/30 transition text-left cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        {expandedRoles.has(role.id) ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </span>
                      <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="size-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground">
                            {role.name}
                          </h3>
                          {role.isSystem && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                              System
                            </span>
                          )}
                          {dirty && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                              Unsaved
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {localPerms.size} permission
                          {localPerms.size === 1 ? "" : "s"} selected
                          {role.description ? ` · ${role.description}` : ""}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Delete — hidden for system roles */}
                      {!role.isSystem && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRole(role)}
                          disabled={deletingRoleId === role.id}
                          className="size-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete role"
                        >
                          {deletingRoleId === role.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </Button>
                      )}

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
                  </div>

                  {/* Body — only mounted when the role is expanded. Hides
                      the (potentially long) permission grid on long pages. */}
                  {expandedRoles.has(role.id) && (
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
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
