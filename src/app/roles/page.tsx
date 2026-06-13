"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Plus, Save, Search, Shield, ShieldAlert, ShieldCheck, Trash2, Check, RotateCcw, Info, Building2, AlertCircle } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRoleStore, Permission, Role } from "@/store/roleStore";
import { Field, FieldGroup } from "@/components/ui/field";

export default function RolesPage() {
  const { roles, permissions, loading, savingRoleId, deletingRoleId, creatingRole, fetchRolesAndPermissions, createRole, deleteRole, updateRolePermissions } = useRoleStore();

  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [localPermissions, setLocalPermissions] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState("");
  const [activeModule, setActiveModule] = useState<string>("all");

  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [copyFromRoleId, setCopyFromRoleId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    fetchRolesAndPermissions().catch(() => {
      toast.error("Failed to load roles and permissions");
    });
  }, [fetchRolesAndPermissions]);

  // Code-to-ID mapping
  const codeToId = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of permissions) {
      map.set(p.code, p.id);
    }
    return map;
  }, [permissions]);

  // Initialize selectedRoleId if empty
  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  // Initialize local permissions when role changes
  useEffect(() => {
    const selectedRole = roles.find((r) => r.id === selectedRoleId);
    if (selectedRole) {
      const ids = new Set<string>();
      for (const code of selectedRole.permissions ?? []) {
        const id = codeToId.get(code);
        if (id) ids.add(id);
      }
      setLocalPermissions(ids);
    } else {
      setLocalPermissions(new Set());
    }
  }, [selectedRoleId, roles, codeToId]);

  // Find active selected role object
  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId);
  }, [roles, selectedRoleId]);

  // Verify if there are unsaved edits
  const serverPermissionIds = useMemo(() => {
    const ids = new Set<string>();
    if (selectedRole) {
      for (const code of selectedRole.permissions ?? []) {
        const id = codeToId.get(code);
        if (id) ids.add(id);
      }
    }
    return ids;
  }, [selectedRole, codeToId]);

  const isDirty = useMemo(() => {
    if (serverPermissionIds.size !== localPermissions.size) return true;
    for (const id of localPermissions) {
      if (!serverPermissionIds.has(id)) return true;
    }
    return false;
  }, [serverPermissionIds, localPermissions]);

  // Handle single permission toggle
  const handleTogglePermission = (permissionId: string) => {
    setLocalPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  // List of all distinct modules
  const modules = useMemo(() => {
    const set = new Set<string>();
    for (const p of permissions) {
      const mod = p.module || p.code.split(".")[0] || "other";
      set.add(mod);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [permissions]);

  // Selected permission counts per module
  const moduleStats = useMemo(() => {
    const stats: Record<string, { total: number; selected: number }> = {};

    // Initialize stats
    for (const mod of modules) {
      stats[mod] = { total: 0, selected: 0 };
    }
    if (modules.length > 0 && !stats["other"]) {
      stats["other"] = { total: 0, selected: 0 };
    }

    for (const p of permissions) {
      const mod = p.module || p.code.split(".")[0] || "other";
      if (!stats[mod]) stats[mod] = { total: 0, selected: 0 };
      stats[mod].total++;
      if (localPermissions.has(p.id)) {
        stats[mod].selected++;
      }
    }
    return stats;
  }, [permissions, localPermissions, modules]);

  // Total permissions count
  const totalStats = useMemo(() => {
    return {
      total: permissions.length,
      selected: localPermissions.size,
    };
  }, [permissions, localPermissions]);

  // Filter permissions based on search query and active tab module
  const filteredPermissions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return permissions.filter((p) => {
      const mod = p.module || p.code.split(".")[0] || "other";

      // Module check
      if (activeModule !== "all" && mod !== activeModule) {
        return false;
      }

      // Query check
      if (!query) return true;
      return p.code.toLowerCase().includes(query) || (p.module ?? "").toLowerCase().includes(query) || (p.description ?? "").toLowerCase().includes(query);
    });
  }, [permissions, searchQuery, activeModule]);

  // Group filtered permissions by module
  const groupedPermissions = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of filteredPermissions) {
      const mod = p.module || p.code.split(".")[0] || "other";
      if (!map.has(mod)) {
        map.set(mod, []);
      }
      map.get(mod)!.push(p);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredPermissions]);

  // Handle module toggle select/clear all
  const handleToggleModule = (moduleName: string, checkAll: boolean) => {
    // Find all permission IDs belonging to this module
    const targetPerms = permissions.filter((p) => {
      const mod = p.module || p.code.split(".")[0] || "other";
      return mod === moduleName;
    });

    setLocalPermissions((prev) => {
      const next = new Set(prev);
      for (const p of targetPerms) {
        if (checkAll) {
          next.add(p.id);
        } else {
          next.delete(p.id);
        }
      }
      return next;
    });
  };

  // Store action triggers
  const handleCreateRole = async () => {
    const name = newRoleName.trim().toUpperCase().replace(/\s+/g, "_");
    if (!name) {
      toast.error("Role name is required");
      return;
    }
    try {
      const created = await createRole(name, newRoleDescription.trim() || undefined, copyFromRoleId || undefined);
      if (created) {
        toast.success(`Role "${name}" created`);
        setSelectedRoleId(created.id);
        setNewRoleName("");
        setNewRoleDescription("");
        setCopyFromRoleId("");
        setCreateOpen(false);
      }
    } catch (error) {
      toast.error("Failed to create role");
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    if (selectedRole.isSystem) {
      toast.error("System roles cannot be deleted");
      return;
    }
    if (!confirm(`Are you sure you want to delete "${selectedRole.name}"? Users assigned to this role will lose its permissions.`)) {
      return;
    }
    try {
      const name = selectedRole.name;
      await deleteRole(selectedRole.id);
      toast.success(`Deleted role "${name}"`);
      setSelectedRoleId(roles[0]?.id || "");
    } catch (error) {
      toast.error("Failed to delete role");
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedRoleId || !selectedRole) return;
    try {
      await updateRolePermissions(selectedRoleId, Array.from(localPermissions));
      toast.success(`Permissions saved for ${selectedRole.name}`);
    } catch (error) {
      toast.error("Failed to save permissions");
    }
  };

  const handleDiscardChanges = () => {
    setLocalPermissions(new Set(serverPermissionIds));
    toast.success("Changes discarded");
  };

  const authorized = usePermission("role.read");

  if (authorized === null) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex md:flex-row flex-col md:items-center items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Roles & Permissions</h1>
            <p className="text-muted-foreground">Manage system access levels, create custom roles, and assign granular resource permissions</p>
          </div>

          <div className="flex gap-2">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 px-5">
                  <Plus className="size-4" />
                  New Role
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden">
                <div className="border-b px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Shield className="size-5 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg">Create Role</DialogTitle>
                      <DialogDescription>Create a new role</DialogDescription>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  <FieldGroup>
                    <Field>
                      <Label htmlFor="role-name">Role Name</Label>
                      <Input id="role-name" autoFocus placeholder="e.g. MAINTENANCE_SUPERVISOR" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value.toUpperCase())} />
                    </Field>
                  </FieldGroup>

                  <FieldGroup>
                    <Field>
                      <Label htmlFor="role-description">Description (optional)</Label>
                      <Input id="role-description" placeholder="Brief details about what this role manages" value={newRoleDescription} onChange={(e) => setNewRoleDescription(e.target.value)} />
                    </Field>
                  </FieldGroup>

                  <FieldGroup>
                    <Field>
                      <Label>Copy permissions from (optional)</Label>
                      <Select value={copyFromRoleId || "none"} onValueChange={(value) => setCopyFromRoleId(value === "none" ? "" : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Start blank (no permissions)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Start blank (no permissions)</SelectItem>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name} ({r.permissions.length} permissions)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldGroup>

                  <DialogFooter className="gap-2">
                    <DialogClose asChild>
                      <Button variant="outline" type="button" disabled={creatingRole}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button onClick={handleCreateRole} disabled={creatingRole || !newRoleName.trim()} className="min-w-[130px] gap-2 px-5">
                      {creatingRole ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="size-4" />
                          Create Role
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-card rounded-md p-5 md:p-6 border border-border/60  space-y-4">
          <div className="space-y-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="role-select" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Selected Role
              </Label>
              <div className="flex flex-row items-center gap-3">
                {loading && roles.length === 0 ? (
                  <div className="w-[280px] h-11 bg-muted animate-pulse rounded-xl" />
                ) : (
                  <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                    <SelectTrigger id="role-select" className="w-[150px]">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id} className="font-medium">
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {selectedRole && (
                  <div className="flex items-center gap-2">
                    {selectedRole.isSystem ? (
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-none font-bold uppercase tracking-wider text-[12px] px-2.5 py-3 rounded-full">
                        System Role
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-sky-500/10 text-sky-700 font-bold uppercase tracking-wider text-[12px] px-2.5 py-3 rounded-full border-none">
                        Custom Role
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {selectedRole && !selectedRole.isSystem && (
                <Button variant="outline" size="sm" onClick={handleDeleteRole} disabled={!!deletingRoleId} className="gap-2 px-4 py-4 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30">
                  {deletingRoleId === selectedRole.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete
                </Button>
              )}
            </div>
          </div>
          <div className="h-px bg-border/60 w-full" />

          {/* Stats badges */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 rounded-md px-3 py-1.5 border border-border/30">
              <ShieldCheck className="size-4 text-primary" />
              <span className="font-semibold text-foreground">{localPermissions.size}</span>
              <span>of {permissions.length} total permissions active</span>
            </div>
          </div>
        </div>

        {/* Loading and empty states */}
        {loading && roles.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="space-y-6">
              <div className="h-24 bg-muted rounded-md animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        ) : roles.length === 0 ? (
          <div className="bg-card rounded-md border border-border/60 p-12 text-center max-w-md mx-auto">
            <ShieldAlert className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">No roles loaded</h3>
            <p className="text-sm text-muted-foreground mt-2">Seed your database or create a new role using the button above.</p>
          </div>
        ) : !selectedRole ? (
          <div className="bg-card rounded-md border border-border/60 p-12 text-center max-w-md mx-auto">
            <Info className="size-12 text-primary/60 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">No role selected</h3>
            <p className="text-sm text-muted-foreground mt-2">Select a role from the dropdown selector above to continue configuration.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] lg:grid-cols-[280px_1fr] gap-4 items-start">
              <div className="md:sticky top-28 bg-card border border-border/60 rounded-md p-4 space-y-2 max-h-[calc(100vh-140px)] overflow-y-auto">
                <h3 className="text-[12px] font-bold text-muted-foreground tracking-wider uppercase px-3 py-2">Modules</h3>

                <button
                  onClick={() => setActiveModule("all")}
                  className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-semibold transition-all duration-150 ${
                    activeModule === "all" ? "bg-sky-600 text-primary-foreground" : "text-muted-foreground hover:bg-gray-200 hover:text-foreground"
                  }`}
                >
                  <span>All Modules</span>
                  <Badge variant="outline" className={`border-none text-[10px] font-bold py-0 h-5 px-2 rounded-full ${activeModule === "all" ? "bg-white text-black" : "bg-muted text-muted-foreground"}`}>
                    {totalStats.selected} / {totalStats.total}
                  </Badge>
                </button>

                <div className="h-px bg-border/60 my-2" />

                <div className="space-y-1">
                  {modules.map((mod) => {
                    const stats = moduleStats[mod] || { total: 0, selected: 0 };
                    const isActive = activeModule === mod;

                    return (
                      <button
                        key={mod}
                        onClick={() => setActiveModule(mod)}
                        className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-semibold capitalize transition-all duration-150 ${
                          isActive ? "bg-sky-600 text-primary-foreground" : "text-muted-foreground hover:bg-gray-200 hover:text-foreground"
                        }`}
                      >
                        <span className="truncate">{mod}</span>
                        <Badge variant="outline" className={`border-none text-[10px] font-bold py-0 h-5 px-2 rounded-full ${isActive ? "bg-white text-black" : "bg-muted text-muted-foreground"}`}>
                          {stats.selected} / {stats.total}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-card rounded-md border border-border/60 p-4 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-full group flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input type="text" placeholder="Filter permissions by code or details..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-11 h-11 rounded-md bg-muted/30 border-border/80 focus:bg-background" />
                  </div>
                </div>
                {isDirty && (
                  <div className="sticky top-24 z-10 flex flex-col gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-2">
                      <Badge className="bg-orange-500 hover:bg-orange-500 text-white shrink-0">Unsaved Changes</Badge>

                      <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>You have unsaved changes. Save them before leaving this page.</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleDiscardChanges} disabled={savingRoleId === selectedRoleId} className="px-4 py-4">
                        <RotateCcw className="h-4 w-4" />
                        Discard Changes
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveChanges}
                        disabled={!isDirty || savingRoleId === selectedRoleId}
                        className={`gap-2 px-4 py-4 transition-all duration-300 ${isDirty ? "bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.01]" : "bg-primary text-primary-foreground"}`}
                      >
                        {savingRoleId === selectedRoleId ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="size-4" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {groupedPermissions.length === 0 ? (
                  <div className="bg-card border border-border/60 rounded-md p-10 text-center">
                    <Search className="size-10 text-muted-foreground/60 mx-auto mb-3" />
                    <h4 className="font-bold text-foreground">No permissions found</h4>
                    <p className="text-xs text-muted-foreground mt-1">Try resetting your search query or choosing a different module domain.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupedPermissions.map(([groupName, perms]) => {
                      const stats = moduleStats[groupName] || { total: 0, selected: 0 };
                      const allChecked = perms.every((p) => localPermissions.has(p.id));
                      const someChecked = perms.some((p) => localPermissions.has(p.id));

                      return (
                        <div key={groupName} className="bg-card border border-border/60 rounded-md p-6 space-y-4 transition-all duration-300">
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/55 pb-3">
                            <div>
                              <h4 className="text-sm font-bold uppercase tracking-wide text-foreground flex items-center gap-2">
                                <span className="capitalize">{groupName}</span>
                              </h4>
                              <p className="text-[12px] text-muted-foreground mt-0.5">
                                {stats.selected} of {stats.total} permission codes active.
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="default" onClick={() => handleToggleModule(groupName, !allChecked)}>
                                {allChecked ? "Clear All" : "Select All"}
                              </Button>
                            </div>
                          </div>

                          {/* Permissions Cards Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {perms.map((perm) => {
                              const checked = localPermissions.has(perm.id);
                              return (
                                <div
                                  key={perm.id}
                                  onClick={() => handleTogglePermission(perm.id)}
                                  className={`flex items-start justify-between gap-3 p-4 rounded-md border cursor-pointer select-none transition-all duration-200 ${
                                    checked ? "border-sky-600/60 bg-sky-50/50" : "border-border/60 hover:border-border hover:bg-muted/30"
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-bold text-foreground" title={perm.code}>
                                      {perm.code}
                                    </div>
                                    {perm.description && (
                                      <div className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2" title={perm.description}>
                                        {perm.description}
                                      </div>
                                    )}
                                  </div>

                                  <div className="shrink-0 pt-0.5">
                                    <div className={`w-8 h-5 rounded-full relative transition-colors duration-200 ${checked ? "bg-sky-600" : "bg-muted-foreground/30"}`}>
                                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 left-0.75 transition-transform duration-200 ${checked ? "translate-x-3.25" : ""}`} />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
