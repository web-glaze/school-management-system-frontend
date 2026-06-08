"use client";

/**
 * User Management — admin / super-admin only.
 *
 * Workflow:
 *   1. Admin picks a Role (Manager / Teacher / Staff / Technician / User)
 *      and a Department for the new user.
 *   2. Backend creates the User row, attaches the role, links the dept.
 *   3. Existing users below are grouped by department for clarity:
 *      • "System" card holds Super Admin + Admin (no department)
 *      • One card per real department (Maintenance, Hostel, Kitchen, …)
 *      • "Unassigned" card collects anyone we forgot to assign yet
 *
 * Password reset stays per-row; same endpoint as before.
 */

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Loader2, Plus, Search, ShieldCheck, Trash2, Users as UsersIcon } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** Roles that the admin can pick from the dropdown — sourced from the
 *  Roles & Permissions page. We hardcode the labels here only as a
 *  fallback in case /api/roles is empty; in practice the backend list
 *  drives the dropdown. */
const FALLBACK_ROLES = ["MANAGER", "TEACHER", "STAFF", "TECHNICIAN", "USER"];

interface RawRole {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  userName?: string;
  email?: string;
  phone?: string;
  userCode?: string;
  createdAt: string;
  userRoles: {
    role: {
      name: string;
    };
  }[];
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RawRole[]>([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");

  const [pwInputs, setPwInputs] = useState<Record<string, string>>({});
  const [pwSaving, setPwSaving] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [usersRes, rolesRes] = await Promise.all([
        axios.get(`${API_URL}/api/users`, { headers }),
        axios
          .get(`${API_URL}/api/roles`, { headers })
          .then((r) => (Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
          .catch(() => [] as RawRole[]),
      ]);

      setUsers(usersRes.data?.data?.items ?? []);

      setRoles(rolesRes);

      if (rolesRes.length > 0 && !role) {
        const safe = rolesRes.find((r: RawRole) => !["SUPER_ADMIN", "ADMIN"].includes(r.name)) ?? rolesRes[0];

        setRole(safe.name);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchAll();
    }, 0);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setCreating(true);

      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/api/users`,
        {
          name,
          userName,
          email,
          phone: phone || undefined,
          password,
          role,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setName("");
      setUserName("");
      setEmail("");
      setPassword("");
      setPhone("");

      toast.success("User created");

      await fetchAll();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const changePassword = async (userId: string) => {
    const newPassword = (pwInputs[userId] ?? "").trim();

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setPwSaving(userId);

      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_URL}/api/users/${userId}/password`,
        {
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPwInputs((prev) => ({
        ...prev,
        [userId]: "",
      }));

      toast.success("Password updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update password");
    } finally {
      setPwSaving(null);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(`${API_URL}/api/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("User deleted");

      await fetchAll();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete user");
    }
  };

  const grouped = [
    {
      id: "all-users",
      name: "Users",
      users: users.filter((u) => {
        const needle = search.toLowerCase();

        return !needle || u.email?.toLowerCase().includes(needle) || u.name?.toLowerCase().includes(needle) || u.userName?.toLowerCase().includes(needle);
      }),
    },
  ];

  const fieldBase = "h-10 px-3 rounded-lg border border-gray-200 text-xs focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition";

  const selectField = fieldBase + " bg-white pr-8 appearance-none";

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Simple header — same scale as the rest of the app, no hero card */}
        <div>
          <h1 className="text-xl font-bold text-gray-800">User Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Create login accounts. Only Super Admin &amp; Admin sit in the System card; everyone else belongs to a department.</p>
        </div>

        {/* Create form — fields + compact Create button on the right */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Plus className="size-4 text-primary" />
            Create New ID
          </h2>
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-2">
            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required className={`${fieldBase} flex-1 min-w-[140px]`} />
            <input type="text" placeholder="Username" value={userName} onChange={(e) => setUserName(e.target.value)} required className={`${fieldBase} flex-1 min-w-[140px]`} />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={`${fieldBase} flex-1 min-w-[180px]`} />
            <input type="text" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} maxLength={15} className={`${fieldBase} w-36`} />
            <input type="text" placeholder="Password (min 8)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required className={`${fieldBase} w-40`} />
            <select value={role} onChange={(e) => setRole(e.target.value)} required className={`${selectField} w-36`}>
              {(roles.length > 0 ? roles.map((r) => r.name) : FALLBACK_ROLES)
                // Don't let admin accidentally clone Super Admin here.
                .filter((n) => !["SUPER_ADMIN"].includes(n))
                .map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
            </select>
            <button type="submit" disabled={creating} className="ml-auto h-10 px-5 rounded-lg bg-[#00AEF2] text-white text-xs font-semibold hover:bg-[#0096D6] disabled:opacity-60 transition flex items-center gap-2">
              {creating ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  Create User
                </>
              )}
            </button>
          </form>

          {/* Helpful hint — explains the dynamic dropdowns */}
          <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
            Roles are loaded dynamically from the Roles page. Create or update roles in
            <span className="font-semibold text-gray-700"> /maintenance/roles </span>
            and they will appear here automatically.
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, role or department…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 text-xs focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Grouped list */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 flex items-center justify-center">
            <Loader2 className="size-5 animate-spin text-gray-400" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <UsersIcon className="size-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">No users yet</p>
            <p className="text-xs text-gray-500 mt-1">Use the form above to add your first user.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map((bucket) => (
              <div key={bucket.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                  <span className="size-7 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
                    <ShieldCheck className="size-4" />
                  </span>
                  <h3 className="text-sm font-bold text-gray-800">{bucket.name}</h3>
                  <span className="text-[11px] text-gray-500">
                    ({bucket.users.length} {bucket.users.length === 1 ? "user" : "users"})
                  </span>
                </div>

                <ul className="divide-y divide-gray-100">
                  {bucket.users.map((u) => {
                    const roleNames = (u.userRoles ?? []).map((r) => r.role.name);
                    const isSystemUser = roleNames.includes("SUPER_ADMIN") || roleNames.includes("ADMIN");
                    return (
                      <li key={u.id} className="px-5 py-3 flex flex-col xl:flex-row xl:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-gray-800 truncate">{u.userName || u.email}</p>
                            {roleNames.map((r) => (
                              <span key={r} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                {r}
                              </span>
                            ))}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {u.name ? `${u.name} · ` : ""}
                            {u.email ?? "no email"} · {u.userCode ?? "—"} · joined{" "}
                            {new Date(u.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="New password"
                            value={pwInputs[u.id] ?? ""}
                            onChange={(e) =>
                              setPwInputs((prev) => ({
                                ...prev,
                                [u.id]: e.target.value,
                              }))
                            }
                            className="h-8 px-3 rounded-full border border-gray-200 text-xs w-40 outline-none focus:border-primary"
                          />
                          <button
                            onClick={() => changePassword(u.id)}
                            disabled={pwSaving === u.id || !pwInputs[u.id]?.trim()}
                            className="h-8 px-3 rounded-full bg-[#00AEF2] text-white text-xs font-semibold hover:bg-[#0096D6] disabled:opacity-60 transition"
                          >
                            {pwSaving === u.id ? "Saving…" : "Change"}
                          </button>
                          {/* System users can't be deleted from the UI —
                              you can't accidentally remove your own admin. */}
                          {!isSystemUser && (
                            <button onClick={() => deleteUser(u.id)} className="size-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition" title="Delete user">
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
