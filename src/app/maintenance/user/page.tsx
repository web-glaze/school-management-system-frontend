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
import { toast } from "sonner";
import axios from "axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Building2, Loader2, Plus, Search, ShieldCheck, Trash2, Users as UsersIcon, Calendar, Inbox, Pencil, MoreVertical } from "lucide-react";
import { Field, FieldGroup } from "@/components/ui/field";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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

  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");

  const [editName, setEditName] = useState("");
  const [editUserName, setEditUserName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("");

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
      setAddUserOpen(false);

      toast.success("User created");

      await fetchAll();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleDelete = async (id: string) => {
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

  const openEditDialog = (user: User) => {
    setEditingUser(user);

    setEditName(user.name || "");
    setEditUserName(user.userName || "");
    setEditEmail(user.email || "");
    setEditPhone(user.phone || "");
    setEditRole(user.userRoles[0].role.name);

    setEditUserOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setDeletingUser(user);
    setDeleteUserOpen(true);
  };

  const fieldBase = "h-10 px-3 rounded-lg border border-gray-200 text-xs focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition";

  const selectField = fieldBase + " bg-white pr-8 appearance-none";

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex md:flex-row flex-col md:items-center items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Maintain system users</p>
          </div>
          <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 px-5">
                <Plus className="size-4" />
                Add User
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden">
              <div className="border-b px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="size-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">Add User</DialogTitle>
                    <DialogDescription>Add a new user</DialogDescription>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 p-6">
                <FieldGroup>
                  <Field>
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input id="full-name" placeholder="Juan Dela Cruz" value={name} onChange={(e) => setName(e.target.value)} required />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" placeholder="juandc" value={userName} onChange={(e) => setUserName(e.target.value)} required />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" placeholder="juandc@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="09123456789" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>

                      <SelectContent>
                        {(roles.length > 0 ? roles.map((r) => r.name) : FALLBACK_ROLES)
                          .filter((n) => n !== "SUPER_ADMIN")
                          .map((n) => (
                            <SelectItem key={n} value={n}>
                              {n}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>

                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </DialogClose>

                  <Button type="submit" disabled={loading} className="min-w-[130px] gap-2 px-5">
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="size-4" />
                        Create
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="bg-card rounded-md p-5 md:p-6 border border-border/60  space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:w-[350px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11" />
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
            <div className="relative w-full overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 border-b border-border/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-[180px]">Name</TableHead>

                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-[180px]">Role</TableHead>

                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-[120px] hidden lg:table-cell">Created At</TableHead>

                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 text-right min-w-[50px] sticky right-0 bg-gray-50 shadow-lg md:shadow-none">
                      <span className="hidden md:block">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-border/30">
                  {grouped.flatMap((bucket) =>
                    bucket.users.map((u) => {
                      const roleNames = (u.userRoles ?? []).map((r) => r.role.name);
                      const isSystemUser = roleNames.includes("SUPER_ADMIN") || roleNames.includes("ADMIN");

                      return (
                        <TableRow key={u.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="py-4 align-top">
                            <div className="space-y-1 max-w-[250px]">
                              <p className="font-semibold text-foreground">{u.userName || u.email}</p>

                              <p className="text-sm text-muted-foreground">
                                {u.name ? `${u.name} · ` : ""}
                                {u.email ?? "No Email"}
                              </p>

                              <p className="text-xs text-muted-foreground">{u.userCode ?? "—"}</p>
                            </div>
                          </TableCell>

                          <TableCell className="py-4 align-top">
                            <div className="flex flex-wrap gap-1">
                              {roleNames.map((role) => (
                                <Badge key={role} variant="secondary">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>

                          <TableCell className="py-4 hidden lg:table-cell">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="size-4" />
                              {new Date(u.createdAt).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </TableCell>

                          <TableCell className="py-4 text-right align-top sticky right-0 bg-card shadow-lg md:shadow-none">
                            <div className="hidden md:flex justify-end gap-2">
                              {/* <Input
                                type="text"
                                placeholder="New password"
                                value={pwInputs[u.id] ?? ""}
                                onChange={(e) =>
                                  setPwInputs((prev) => ({
                                    ...prev,
                                    [u.id]: e.target.value,
                                  }))
                                }
                                className="h-9 w-40"
                              />

                              <Button size="sm" onClick={() => changePassword(u.id)} disabled={pwSaving === u.id || !pwInputs[u.id]?.trim()}>
                                {pwSaving === u.id ? "Saving..." : "Change"}
                              </Button> */}

                              <Button variant="ghost" size="icon" className="size-10 rounded-lg text-muted-foreground hover:bg-blue-300/10 hover:text-blue-700 transition-all" title="Edit User" onClick={() => openEditDialog(u)}>
                                <Pencil className="size-5" />
                              </Button>

                              {!isSystemUser && (
                                <Button variant="ghost" size="icon" className="size-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all" title="Delete User" onClick={() => openDeleteDialog(u)}>
                                  <Trash2 className="size-5" />
                                </Button>
                              )}
                            </div>

                            {/* Mobile */}
                            <div className="md:hidden flex justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="size-5" />
                                  </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditDialog(u)}>
                                    <Pencil className="mr-2 size-4" />
                                    Edit
                                  </DropdownMenuItem>

                                  {!isSystemUser && (
                                    <DropdownMenuItem onClick={() => handleDelete(u.id)} className="text-destructive">
                                      <Trash2 className="mr-2 size-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">Edit User</DialogTitle>
                <DialogDescription>Update user details</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4 p-6">
            <FieldGroup>
              <Field>
                <Label htmlFor="full-name">Full Name</Label>
                <Input id="full-name" placeholder="Juan Dela Cruz" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="juandc" value={editUserName} onChange={(e) => setEditUserName(e.target.value)} required />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="juandc@school.edu" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="09123456789" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} required />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <Label htmlFor="password">Password</Label>
                <Input id="password" placeholder="••••••••" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} required />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <Label htmlFor="role">Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>

                  <SelectContent>
                    {(roles.length > 0 ? roles.map((r) => r.name) : FALLBACK_ROLES)
                      .filter((n) => n !== "SUPER_ADMIN")
                      .map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>

              <Button type="submit" disabled={loading} className="min-w-[130px] gap-2 px-5">
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Update
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteUserOpen} onOpenChange={setDeleteUserOpen}>
        <AlertDialogContent className="sm:max-w-[420px]">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="size-6 text-destructive" />
            </div>

            <AlertDialogTitle className="w-full text-center text-xl">Delete User?</AlertDialogTitle>

            <AlertDialogDescription className="text-center">
              This action cannot be undone. This will permanently remove
              <span className="font-semibold text-foreground"> {deletingUser?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>

            <AlertDialogAction onClick={() => handleDelete(deletingUser?.id!)} disabled={!!deletingId} className="h-11 bg-destructive text-white hover:bg-destructive/90">
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 size-4" />
                  Delete User
                </>)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
