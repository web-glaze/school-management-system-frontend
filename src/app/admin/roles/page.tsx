"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface Permission {
  id: string;
  code: string;
  module: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[]; // permission codes
}

export default function RolesPermissionsPage() {
  const { user, loading: authLoading } = useAuth({
    requiredPermissions: ["role.manage"],
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Create role
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  // Edit permissions
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    try {
      const [rRes, pRes] = await Promise.all([
        api.get("/api/roles"),
        api.get("/api/roles/permissions"),
      ]);
      const rData = rRes.data?.data ?? rRes.data;
      const pData = pRes.data?.data ?? pRes.data;
      setRoles(Array.isArray(rData) ? rData : []);
      setPermissions(Array.isArray(pData) ? pData : []);
    } catch (err: unknown) {
      toast.error(
        (err as { displayMessage?: string })?.displayMessage ||
          "Failed to load roles & permissions",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user]);

  /** Group permissions by module for nice display. */
  const grouped = useMemo(() => {
    const map: Record<string, Permission[]> = {};
    for (const p of permissions) {
      if (!map[p.module]) map[p.module] = [];
      map[p.module].push(p);
    }
    return map;
  }, [permissions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Role name is required");
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/api/roles", {
        name: form.name.toUpperCase().replace(/\s+/g, "_"),
        description: form.description || undefined,
      });
      toast.success("Role created");
      setForm({ name: "", description: "" });
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(
        (err as { displayMessage?: string })?.displayMessage ||
          "Failed to create role",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    // Map permission codes back to IDs
    const codes = new Set(role.permissions);
    setSelectedPermIds(
      new Set(permissions.filter((p) => codes.has(p.code)).map((p) => p.id)),
    );
  };

  const togglePerm = (id: string) => {
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleModule = (modulePerms: Permission[], allSelected: boolean) => {
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      for (const p of modulePerms) {
        if (allSelected) next.delete(p.id);
        else next.add(p.id);
      }
      return next;
    });
  };

  const savePermissions = async () => {
    if (!editingRole) return;
    try {
      await api.patch(`/api/roles/${editingRole.id}/permissions`, {
        permissionIds: Array.from(selectedPermIds),
      });
      toast.success("Permissions updated");
      setEditingRole(null);
      fetchData();
    } catch (err: unknown) {
      toast.error(
        (err as { displayMessage?: string })?.displayMessage ||
          "Failed to update permissions",
      );
    }
  };

  const handleDelete = async (role: Role) => {
    if (role.isSystem) {
      toast.error("System roles cannot be deleted");
      return;
    }
    if (!confirm(`Delete role "${role.name}"? Users with only this role will lose access.`)) return;
    try {
      await api.delete(`/api/roles/${role.id}`);
      toast.success("Role deleted");
      fetchData();
    } catch (err: unknown) {
      toast.error(
        (err as { displayMessage?: string })?.displayMessage ||
          "Failed to delete role",
      );
    }
  };

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">Verifying access...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader
          kicker="Access Control"
          title="Roles & Permissions"
          subtitle="Create custom roles and toggle permissions module-by-module."
          accent="indigo"
          action={
            <button
              onClick={() => setShowForm((s) => !s)}
              className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-teal-700 transition shadow-md"
            >
              {showForm ? "✕ Close" : "+ Create Role"}
            </button>
          }
        />

        {/* Create form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-[2rem] p-8 shadow-lg border border-gray-100 space-y-6"
          >
            <h2 className="text-base font-bold text-gray-800">Create New Role</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-700">
                  Role Name * (will be uppercased)
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. SECURITY_GUARD"
                  className="w-full h-14 rounded-2xl border border-gray-200 bg-[#f8fafc] px-5 outline-none focus:border-teal-400 uppercase"
                  required
                />
              </div>
              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Gate security personnel"
                  className="w-full h-14 rounded-2xl border border-gray-200 bg-[#f8fafc] px-5 outline-none focus:border-teal-400"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              After creating, click on the role to assign permissions.
            </p>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-teal-600 to-purple-500 text-white px-8 py-4 rounded-2xl font-semibold disabled:opacity-50 shadow-lg"
              >
                {submitting ? "Creating..." : "Create Role"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-gray-200 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Roles list */}
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-4">
            All Roles{" "}
            <span className="text-base font-normal text-gray-500">
              ({roles.length})
            </span>
          </h2>

          {loading ? (
            <p className="text-gray-400 py-8 text-center">Loading...</p>
          ) : roles.length === 0 ? (
            <p className="text-gray-400 py-12 text-center">No roles yet</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {roles.map((r) => (
                <div
                  key={r.id}
                  className="border border-gray-100 rounded-2xl p-6 hover:shadow-md transition bg-gradient-to-br from-teal-50/30 to-purple-50/30"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {r.name}
                      </h3>
                      {r.isSystem && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-teal-100 text-teal-700 rounded-md text-xs font-bold">
                          SYSTEM
                        </span>
                      )}
                    </div>
                    {!r.isSystem && (
                      <button
                        onClick={() => handleDelete(r)}
                        className="text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg text-sm"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {r.description && (
                    <p className="text-sm text-gray-500 mb-4">
                      {r.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mb-4">
                    <b>{r.permissions.length}</b> permission
                    {r.permissions.length !== 1 ? "s" : ""}
                  </p>
                  <button
                    onClick={() => openEdit(r)}
                    className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition"
                  >
                    Manage Permissions
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit permissions modal */}
      {editingRole && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setEditingRole(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {editingRole.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Toggle permissions for this role. Click a module name to
                  select all in it.
                </p>
              </div>
              <button
                onClick={() => setEditingRole(null)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {Object.entries(grouped).map(([module, perms]) => {
                const allSelected = perms.every((p) =>
                  selectedPermIds.has(p.id),
                );
                const someSelected = perms.some((p) =>
                  selectedPermIds.has(p.id),
                );

                return (
                  <div
                    key={module}
                    className="border border-gray-100 rounded-2xl p-5 bg-gray-50/30"
                  >
                    <button
                      type="button"
                      onClick={() => toggleModule(perms, allSelected)}
                      className="flex items-center gap-3 mb-3 text-left w-full"
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                          allSelected
                            ? "bg-teal-600 border-teal-600"
                            : someSelected
                              ? "bg-teal-200 border-teal-400"
                              : "bg-white border-gray-300"
                        }`}
                      >
                        {allSelected && (
                          <span className="text-white text-xs">✓</span>
                        )}
                        {!allSelected && someSelected && (
                          <span className="text-teal-700 text-xs">–</span>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-800 uppercase text-sm tracking-wide">
                        {module}
                      </h4>
                      <span className="text-xs text-gray-500 ml-auto">
                        {perms.filter((p) => selectedPermIds.has(p.id)).length}/
                        {perms.length}
                      </span>
                    </button>
                    <div className="grid md:grid-cols-2 gap-2 pl-8">
                      {perms.map((p) => {
                        const checked = selectedPermIds.has(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition ${
                              checked
                                ? "bg-teal-50 border border-teal-200"
                                : "bg-white border border-gray-100 hover:border-teal-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePerm(p.id)}
                              className="mt-0.5 accent-teal-600"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-mono text-xs text-teal-700 font-semibold">
                                {p.code}
                              </p>
                              <p className="text-sm text-gray-600 mt-0.5">
                                {p.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50">
              <p className="text-sm text-gray-600">
                <b>{selectedPermIds.size}</b> permission
                {selectedPermIds.size !== 1 ? "s" : ""} selected
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingRole(null)}
                  className="px-6 h-12 rounded-2xl border border-gray-200 font-semibold hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={savePermissions}
                  className="px-8 h-12 rounded-2xl bg-teal-600 text-white font-semibold shadow-lg"
                >
                  Save Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
