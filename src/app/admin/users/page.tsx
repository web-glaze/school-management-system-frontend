"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface UserRole {
  role: { id: string; name: string };
}

interface User {
  id: string;
  email: string | null;
  phone: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | string;
  createdAt: string;
  userRoles: UserRole[];
}

interface Role {
  id: string;
  name: string;
  description?: string | null;
  hierarchy?: number;
}

export default function UsersManagementPage() {
  const { user: currentUser, loading: authLoading, hasPermission } = useAuth({
    requiredPermissions: ["user.read"],
  });

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    phone: "",
    password: "",
    roleIds: [] as string[],
  });

  // Edit roles modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRoleIds, setEditRoleIds] = useState<string[]>([]);

  const canCreate = hasPermission("user.create");
  const canUpdate = hasPermission("user.update");

  const fetchData = async () => {
    try {
      const [uRes, rRes] = await Promise.all([
        api.get("/api/users", { params: { limit: 100 } }),
        api.get("/api/roles"),
      ]);
      const uData = uRes.data?.data ?? uRes.data;
      const rData = rRes.data?.data ?? rRes.data;
      // Pagination response: { items, total, page, limit }
      setUsers(Array.isArray(uData?.items) ? uData.items : Array.isArray(uData) ? uData : []);
      setRoles(Array.isArray(rData) ? rData : []);
    } catch (err: unknown) {
      const msg =
        (err as { displayMessage?: string })?.displayMessage ||
        "Failed to load users";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && currentUser) fetchData();
  }, [authLoading, currentUser]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const userRoleNames = u.userRoles?.map((r) => r.role.name) ?? [];
      const matchesRole = roleFilter === "ALL" || userRoleNames.includes(roleFilter);
      const matchesSearch =
        (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (u.phone ?? "").toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email && !form.phone) {
      toast.error("Email or phone is required");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (form.roleIds.length === 0) {
      toast.error("Select at least one role");
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/api/users", {
        email: form.email || undefined,
        phone: form.phone || undefined,
        password: form.password,
        roleIds: form.roleIds,
      });
      toast.success("User created");
      setForm({ email: "", phone: "", password: "", roleIds: [] });
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { displayMessage?: string })?.displayMessage ||
        "Failed to create user";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (id: string, next: "ACTIVE" | "INACTIVE") => {
    try {
      await api.patch(`/api/users/${id}/status`, { status: next });
      toast.success(`User ${next.toLowerCase()}`);
      fetchData();
    } catch (err: unknown) {
      toast.error(
        (err as { displayMessage?: string })?.displayMessage ||
          "Failed to update status",
      );
    }
  };

  const openEditRoles = (u: User) => {
    setEditingUser(u);
    setEditRoleIds(u.userRoles?.map((r) => r.role.id) ?? []);
  };

  const saveRoles = async () => {
    if (!editingUser) return;
    try {
      await api.patch(`/api/users/${editingUser.id}/roles`, {
        roleIds: editRoleIds,
      });
      toast.success("Roles updated");
      setEditingUser(null);
      fetchData();
    } catch (err: unknown) {
      toast.error(
        (err as { displayMessage?: string })?.displayMessage ||
          "Failed to update roles",
      );
    }
  };

  if (authLoading || !currentUser) {
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
        {/* Hero */}
        <div className="bg-gradient-to-r from-rose-600 via-pink-500 to-orange-400 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="uppercase tracking-[0.3em] text-sm text-white/80">
                ADMIN · USER MANAGEMENT
              </p>
              <h1 className="text-5xl font-bold mt-4">Users & Roles</h1>
              <p className="mt-4 text-lg text-white/90 max-w-2xl">
                Create accounts and assign dynamic roles. Powered by foundation
                RBAC — roles defined in Roles & Permissions.
              </p>
            </div>
            {canCreate && (
              <button
                onClick={() => setShowForm((s) => !s)}
                className="bg-white text-rose-600 px-6 py-4 rounded-2xl font-semibold hover:bg-rose-50 transition shadow-lg"
              >
                {showForm ? "✕ Close Form" : "+ Add New User"}
              </button>
            )}
          </div>
        </div>

        {showForm && canCreate && (
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-[2rem] p-8 shadow-lg border border-gray-100 space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-800">
              Create New User
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                placeholder="rahul@school.local"
              />
              <Input
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                placeholder="+91 98765 43210"
              />
              <Input
                label="Password * (min 8 chars)"
                type="password"
                value={form.password}
                onChange={(v) => setForm((f) => ({ ...f, password: v }))}
                placeholder="••••••••"
                required
              />
              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-700">
                  Roles *
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 border border-gray-200 rounded-2xl bg-[#f8fafc]">
                  {roles.length === 0 ? (
                    <p className="text-sm text-amber-600">
                      No roles found. Create roles in Roles & Permissions first.
                    </p>
                  ) : (
                    roles.map((r) => {
                      const checked = form.roleIds.includes(r.id);
                      return (
                        <label
                          key={r.id}
                          className={`px-3 py-1.5 rounded-xl text-sm font-medium cursor-pointer transition border ${
                            checked
                              ? "bg-rose-600 text-white border-rose-600"
                              : "bg-white border-gray-200 hover:border-rose-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                roleIds: e.target.checked
                                  ? [...f.roleIds, r.id]
                                  : f.roleIds.filter((id) => id !== r.id),
                              }))
                            }
                            className="hidden"
                          />
                          {r.name}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Provide email OR phone (or both). Password is required.
            </p>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-rose-600 via-pink-500 to-orange-400 text-white px-8 py-4 rounded-2xl font-semibold disabled:opacity-50 shadow-lg"
              >
                {submitting ? "Creating..." : "Create User"}
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

        {/* Filters */}
        <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100 flex flex-col lg:flex-row gap-4 justify-between">
          <input
            type="text"
            placeholder="Search by email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-rose-400 w-full lg:w-96"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-rose-400"
          >
            <option value="ALL">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800">
              All Users{" "}
              <span className="text-base font-normal text-gray-500">
                ({filtered.length})
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f5f7fb]">
                <tr className="text-left text-sm">
                  <th className="p-5">Identity</th>
                  <th className="p-5">Roles</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Created</th>
                  {canUpdate && <th className="p-5">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => {
                    const roleNames =
                      u.userRoles?.map((r) => r.role.name) ?? [];
                    const isSelf = u.id === currentUser.id;
                    return (
                      <tr
                        key={u.id}
                        className="border-t hover:bg-gray-50 transition"
                      >
                        <td className="p-5">
                          <p className="font-semibold text-gray-800">
                            {u.email ?? "—"}
                          </p>
                          {u.phone && (
                            <p className="text-sm text-gray-500">{u.phone}</p>
                          )}
                        </td>
                        <td className="p-5">
                          <div className="flex gap-1 flex-wrap">
                            {roleNames.length === 0 ? (
                              <span className="text-gray-400 text-sm">
                                No roles
                              </span>
                            ) : (
                              roleNames.map((rn) => (
                                <span
                                  key={rn}
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    rn === "SUPER_ADMIN"
                                      ? "bg-pink-100 text-pink-700"
                                      : rn === "ADMIN"
                                        ? "bg-red-100 text-red-700"
                                        : rn === "MANAGER"
                                          ? "bg-purple-100 text-purple-700"
                                          : rn === "TECHNICIAN"
                                            ? "bg-cyan-100 text-cyan-700"
                                            : "bg-green-100 text-green-700"
                                  }`}
                                >
                                  {rn}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="p-5">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              u.status === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="p-5 text-gray-500 text-sm">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        {canUpdate && (
                          <td className="p-5">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditRoles(u)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                              >
                                Roles
                              </button>
                              {!isSelf && (
                                <button
                                  onClick={() =>
                                    handleStatus(
                                      u.id,
                                      u.status === "ACTIVE"
                                        ? "INACTIVE"
                                        : "ACTIVE",
                                    )
                                  }
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                                    u.status === "ACTIVE"
                                      ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                      : "bg-green-50 text-green-700 hover:bg-green-100"
                                  }`}
                                >
                                  {u.status === "ACTIVE"
                                    ? "Deactivate"
                                    : "Activate"}
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit roles modal */}
      {editingUser && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
          onClick={() => setEditingUser(null)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-800">Edit Roles</h3>
            <p className="text-gray-500 mt-2 text-sm">
              {editingUser.email ?? editingUser.phone}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {roles.map((r) => {
                const checked = editRoleIds.includes(r.id);
                return (
                  <label
                    key={r.id}
                    className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition border ${
                      checked
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white border-gray-200 hover:border-blue-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setEditRoleIds((prev) =>
                          e.target.checked
                            ? [...prev, r.id]
                            : prev.filter((id) => id !== r.id),
                        )
                      }
                      className="hidden"
                    />
                    {r.name}
                  </label>
                );
              })}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveRoles}
                className="flex-1 h-12 rounded-2xl bg-blue-600 text-white font-semibold"
              >
                Save Roles
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 h-12 rounded-2xl border border-gray-200 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block mb-3 text-sm font-semibold text-gray-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full h-14 rounded-2xl border border-gray-200 bg-[#f8fafc] px-5 outline-none focus:border-rose-400 transition"
      />
    </div>
  );
}
