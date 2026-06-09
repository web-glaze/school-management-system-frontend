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

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/services/api";
import { Loader2, Plus, Search, ShieldCheck, Trash2, Users as UsersIcon, X } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";

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
  const [searchReady, setSearchReady] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [usersRes, rolesRes] = await Promise.all([
        apiClient.get("/users"),
        apiClient
          .get("/roles")
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
    fetchAll();
    // Chrome autofills after ~200ms — force-clear everything after it fires
    const t1 = setTimeout(() => setSearchReady(true), 200);
    const t2 = setTimeout(() => {
      setSearch("");
      setName("");
      setUserName("");
      setEmail("");
      setPassword("");
      setPhone("");
    }, 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setCreating(true);

      await apiClient.post("/users", {
        name,
        userName,
        email,
        phone: phone || undefined,
        password,
        role,
      });

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

      await apiClient.patch(`/users/${userId}/password`, { newPassword });

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
      await apiClient.delete(`/users/${id}`);

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

  const fieldBase = "h-10 px-3 rounded-lg shadow-sm text-xs focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition";

  const selectField = fieldBase + " bg-white pr-8 appearance-none";

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Simple header — same scale as the rest of the app, no hero card */}
        <div>
          <h1 className="text-xl font-bold text-gray-800">User Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Create login accounts. Only Super Admin &amp; Admin sit in the System card; everyone else belongs to a department.</p>
        </div>

        {/* Create form */}
        <div className="bg-card rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="size-3.5 text-primary" />
            </div>
            <h2 className="text-sm font-extrabold text-foreground">Create New User</h2>
          </div>
          <form onSubmit={handleCreate} autoComplete="off" className="p-5 space-y-3">
            {/* Hidden decoy inputs absorb browser autofill before the real fields */}
            <input type="text" style={{ display: "none" }} autoComplete="username" />
            <input type="password" style={{ display: "none" }} autoComplete="new-password" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="off" className={`${fieldBase} w-full`} />
              <input type="text" placeholder="Username" value={userName} onChange={(e) => setUserName(e.target.value)} required autoComplete="off" className={`${fieldBase} w-full`} />
              <input type="text" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" className={`${fieldBase} w-full`} />
              <input type="text" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} maxLength={15} autoComplete="off" className={`${fieldBase} w-full`} />
              <input type="password" placeholder="Password (min 8)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required autoComplete="new-password" className={`${fieldBase} w-full`} />
              <select value={role} onChange={(e) => setRole(e.target.value)} required className={`${selectField} w-full`}>
                <option value="" disabled>Select role…</option>
                {(roles.length > 0 ? roles.map((r) => r.name) : FALLBACK_ROLES)
                  .filter((n) => !["SUPER_ADMIN"].includes(n))
                  .map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
              </select>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Roles are loaded from <span className="font-semibold text-foreground">/maintenance/roles</span>
              </p>
              <button type="submit" disabled={creating} className="h-9 px-5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-60 transition flex items-center gap-2 shrink-0">
                {creating ? <><Loader2 className="size-3.5 animate-spin" />Creating…</> : <><Plus className="size-3.5" />Create User</>}
              </button>
            </div>
          </form>
        </div>

        {/* Search */}
        <div className="bg-card rounded-xl border border-slate-100 shadow-sm px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, role or department…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              readOnly={!searchReady}
              onFocus={() => setSearchReady(true)}
              autoComplete="off"
              name="search-query"
              className="w-full h-9 pl-10 pr-9 rounded-lg bg-muted/30 text-sm border-0 outline-none focus:ring-1 focus:ring-primary/30 focus:bg-white transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 size-5 rounded-full bg-muted hover:bg-slate-200 flex items-center justify-center transition"
              >
                <X className="size-3 text-muted-foreground" />
              </button>
            )}
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

                <ul className="divide-y divide-slate-100">
                  {bucket.users.map((u) => {
                    const roleNames = (u.userRoles ?? []).map((r) => r.role.name);
                    const isSystemUser = roleNames.includes("SUPER_ADMIN") || roleNames.includes("ADMIN");
                    const initials = (u.name || u.email || "?").slice(0, 2).toUpperCase();
                    return (
                      <li key={u.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-primary/[0.02] transition-colors group">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary font-black text-xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{u.userName || u.email}</p>
                              {roleNames.map((r) => (
                                <span key={r} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  {r}
                                </span>
                              ))}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                              {u.email} · {u.userCode ?? "—"} · joined {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="password"
                            placeholder="New password"
                            value={pwInputs[u.id] ?? ""}
                            onChange={(e) => setPwInputs((prev) => ({ ...prev, [u.id]: e.target.value }))}
                            className="h-8 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs w-36 outline-none focus:ring-1 focus:ring-primary/30 focus:bg-white transition"
                          />
                          <button
                            onClick={() => changePassword(u.id)}
                            disabled={pwSaving === u.id || !pwInputs[u.id]?.trim()}
                            className="h-8 px-3.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition shrink-0"
                          >
                            {pwSaving === u.id ? "Saving…" : "Change"}
                          </button>
                          <button
                            onClick={() => !isSystemUser && deleteUser(u.id)}
                            className={`size-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition shrink-0 ${isSystemUser ? "invisible pointer-events-none" : ""}`}
                            title="Delete user"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
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
