"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Building2, Loader2, Plus, Search, Trash2, Users as UsersIcon, Calendar, Pencil, MoreVertical, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Field, FieldGroup } from "@/components/ui/field";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePermission } from "@/hooks/usePermission";
import { useUserStore, User } from "@/store/userStore";
import { useRoleStore } from "@/store/roleStore";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const FALLBACK_ROLES = ["MANAGER", "TEACHER", "STAFF", "TECHNICIAN", "USER"];

function PageInitializer({ setCurrentPage }: { setCurrentPage: React.Dispatch<React.SetStateAction<number>> }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    setCurrentPage(Number(searchParams.get("page")) || 1);
  }, [searchParams, setCurrentPage]);

  return null;
}

export default function UserManagementPage() {
  const { users, total, loading, creating, updating, deletingId, fetchUsers, createUser, updateUser, deleteUser } = useUserStore();

  const { roles, fetchRolesAndPermissions } = useRoleStore();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const router = useRouter();
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const changePage = useCallback(
    (page: number) => {
      setCurrentPage(page);

      router.replace(`${pathname}?page=${page}`, {
        scroll: false,
      });
    },
    [router, pathname]
  );

  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form states for creation
  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");

  // Form states for editing
  const [editName, setEditName] = useState("");
  const [editUserName, setEditUserName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("");

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const totalPages = Math.ceil(total / pageSize) || 1;

  const loadUsers = useCallback(
    () =>
      fetchUsers({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
      }).catch(() => toast.error("Failed to load users")),
    [fetchUsers, currentPage, pageSize, debouncedSearch, roleFilter]
  );

  // Fetch users whenever page, page size, search or role filter changes
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Fetch roles once
  useEffect(() => {
    fetchRolesAndPermissions().catch(() => {});
  }, [fetchRolesAndPermissions]);

  // Debounce search, then go back to page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      const value = search.trim();

      if (value !== debouncedSearch) {
        setDebouncedSearch(value);
        changePage(1);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search, debouncedSearch, changePage]);

  // If the current page no longer exists (e.g. last user on it was deleted), go to the last page
  useEffect(() => {
    if (!loading && total > 0 && currentPage > totalPages) {
      changePage(totalPages);
    }
  }, [loading, total, currentPage, totalPages, changePage]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormErrors({});

    try {
      await createUser({
        name: name.trim(),
        userName: userName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role,
      });

      setName("");
      setUserName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setAddUserOpen(false);

      if (currentPage === 1) {
        loadUsers();
      } else {
        changePage(1);
      }

      toast.success("User created");
    } catch (error: unknown) {
      const response = (
        error as {
          response?: {
            data?: {
              errors?: Record<string, string>;
              message?: string;
            };
          };
        }
      ).response;

      if (response?.data?.errors) {
        setFormErrors(response.data.errors);
        return;
      }

      toast.error("Failed to create user", {
        description: response?.data?.message || "Something went wrong",
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    setEditErrors({});

    if (!editingUser) return;

    try {
      const payload: {
        name: string;
        userName: string;
        email: string;
        phone: string | null;
        role: string;
        password?: string;
      } = {
        name: editName.trim(),
        userName: editUserName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() || null,
        role: editRole,
      };

      if (editPassword.trim()) {
        payload.password = editPassword;
      }

      await updateUser(editingUser.id, payload);

      setEditUserOpen(false);
      setEditingUser(null);

      toast.success("User updated");
    } catch (error: unknown) {
      const errors = error instanceof Error ? (error as Error & { response?: { data?: { errors?: Record<string, string> } } }).response?.data?.errors : undefined;

      if (errors) {
        setEditErrors(errors);
        return;
      }
      toast.error("Failed to update user", {
        description:
          (
            error as {
              response?: {
                data?: {
                  message?: string;
                };
              };
            }
          ).response?.data?.message || "Something went wrong",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      loadUsers();
      setDeleteUserOpen(false);
      setDeletingUser(null);
      toast.success(deletingUser?.student ? "Student deactivated successfully" : deletingUser?.userRoles?.some((r) => r.role.name === "TEACHER") ? "Teacher deactivated successfully" : "User deleted successfully");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const clearEditError = (field: string) => {
    setEditErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const grouped = useMemo(() => [{ id: "all-users", name: "Users", users }], [users]);

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditName(user.name || "");
    setEditUserName(user.userName || "");
    setEditEmail(user.email || user.student?.email || "");
    setEditPhone(user.phone || user.student?.phone || "");
    setEditRole(user.userRoles?.[0]?.role?.name || "");
    setEditPassword("");
    setEditUserOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setDeletingUser(user);
    setDeleteUserOpen(true);
  };

  const clearError = (field: string) => {
    setFormErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const authorized = usePermission("user.read");

  if (authorized === null) {
    return null;
  }

  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <PageInitializer setCurrentPage={setCurrentPage} />
      </Suspense>
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

            <DialogContent className="sm:max-w-115 p-0 overflow-hidden">
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
                    <Input
                      id="full-name"
                      placeholder="Juan Dela Cruz"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        clearError("name");
                      }}
                    />
                    {formErrors.name && <p className="text-sm text-red-500 -mt-2"> {formErrors.name}</p>}
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="juandc"
                      value={userName}
                      onChange={(e) => {
                        setUserName(e.target.value);
                        clearError("userName");
                      }}
                    />
                    {formErrors.userName && <p className="text-sm text-red-500 -mt-2"> {formErrors.userName}</p>}
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      placeholder="juandc@school.edu"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearError("email");
                      }}
                    />
                    {formErrors.email && <p className="text-sm text-red-500 -mt-2"> {formErrors.email}</p>}
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="09123456789"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        clearError("phone");
                      }}
                    />
                    {formErrors.phone && <p className="text-sm text-red-500 -mt-2"> {formErrors.phone}</p>}
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearError("password");
                      }}
                    />
                    {formErrors.password && <p className="text-sm text-red-500 -mt-2"> {formErrors.password}</p>}
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={role}
                      onValueChange={(value) => {
                        setRole(value);
                        clearError("role");
                      }}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Choose a role" />
                      </SelectTrigger>

                      <SelectContent>
                        {(roles.length > 0 ? roles.map((r) => r.name) : FALLBACK_ROLES)
                          .filter((n) => n !== "SUPER_ADMIN" && n !== "STUDENT")
                          .map((n) => (
                            <SelectItem key={n} value={n}>
                              {n}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {formErrors.role && <p className="text-sm text-red-500 -mt-2"> {formErrors.role}</p>}
                  </Field>
                </FieldGroup>

                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </DialogClose>

                  <Button type="submit" disabled={creating} className="min-w-32.5 gap-2 px-5">
                    {creating ? (
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
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <div className="relative w-full lg:w-87.5 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11" />
              </div>

              <Select
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value);
                  changePage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-37.5">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {(roles.length > 0 ? roles.map((r) => r.name) : ["SUPER_ADMIN", "ADMIN", ...FALLBACK_ROLES, "STUDENT"]).map((roleName) => (
                    <SelectItem key={roleName} value={roleName}>
                      {roleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex w-full lg:w-auto justify-end">
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  changePage(1);
                }}
              >
                <SelectTrigger className="w-27.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 rows</SelectItem>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="25">25 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grouped list */}
          {loading && users.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 flex items-center justify-center">
              <Loader2 className="size-5 animate-spin text-gray-400" />
            </div>
          ) : grouped.length === 0 || (grouped.length > 0 && grouped[0].users.length === 0) ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <UsersIcon className="size-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700">{debouncedSearch || roleFilter !== "all" ? "No matching users" : "No users yet"}</p>
              <p className="text-xs text-gray-500 mt-1">{debouncedSearch || roleFilter !== "all" ? "Check your search or reset the filters." : "Use the form above to add your first user."}</p>
            </div>
          ) : (
            <div className="relative w-full overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 border-b border-border/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-45">Name</TableHead>

                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-45">Role</TableHead>

                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-30 hidden lg:table-cell">Created At</TableHead>

                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 text-right min-w-12.5 sticky right-0 bg-gray-50 shadow-lg md:shadow-none">
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
                            <div className="space-y-1 max-w-62.5">
                              <p className="font-semibold text-foreground">{u.name || u.userName}</p>

                              <p className="text-sm text-muted-foreground">{u.email ?? u.student?.email ?? "No Email"}</p>

                              {(u.phone ?? u.student?.phone) && <p className="text-sm text-muted-foreground">{u.phone ?? u.student?.phone}</p>}

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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-10 rounded-lg text-muted-foreground hover:bg-blue-300/10 hover:text-blue-700 transition-all"
                                title="Edit User"
                                onClick={() => openEditDialog(u)}
                              >
                                <Pencil className="size-5" />
                              </Button>

                              {!isSystemUser && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                                  title={u.student ? "Deactivate Student" : roleNames.includes("TEACHER") ? "Deactivate Teacher" : "Delete User"}
                                  onClick={() => openDeleteDialog(u)}
                                >
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
                                    <DropdownMenuItem onClick={() => openDeleteDialog(u)} className="text-destructive">
                                      <Trash2 className="mr-2 size-4" />
                                      {u.student ? "Deactivate Student" : roleNames.includes("TEACHER") ? "Deactivate Teacher" : "Delete User"}
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

        {/* Pagination Footers Controls */}
        {total > 0 && (
          <div className="bg-card rounded-lg p-5 border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm font-medium text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-semibold text-foreground">{Math.min(currentPage * pageSize, total)}</span> of{" "}
              <span className="font-semibold text-foreground">{total}</span> users
            </div>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => changePage(1)} disabled={currentPage === 1} className="size-8">
                <ChevronsLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => changePage(Math.max(currentPage - 1, 1))} disabled={currentPage === 1} className="size-8">
                <ChevronLeft className="size-4" />
              </Button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  if (Math.abs(currentPage - pageNum) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return (
                        <span key={pageNum} className="text-muted-foreground/60 text-xs px-1 select-none">
                          ..
                        </span>
                      );
                    }
                    return null;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      onClick={() => changePage(pageNum)}
                      className={cn("size-8 font-bold text-xs", currentPage === pageNum ? "bg-sky-600 text-white" : "")}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button variant="outline" size="icon" onClick={() => changePage(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages} className="size-8">
                <ChevronRight className="size-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => changePage(totalPages)} disabled={currentPage === totalPages} className="size-8">
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent className="sm:max-w-115 p-0 overflow-hidden">
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
                <Input
                  id="full-name"
                  placeholder="Juan Dela Cruz"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    clearEditError("name");
                  }}
                />
                {editErrors.name && <p className="text-sm text-red-500 -mt-2"> {editErrors.name}</p>}
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="juandc"
                  value={editUserName}
                  onChange={(e) => {
                    setEditUserName(e.target.value);
                    clearEditError("userName");
                  }}
                />
                {editErrors.userName && <p className="text-sm text-red-500 -mt-2"> {editErrors.userName}</p>}
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="juandc@school.edu"
                  value={editEmail}
                  onChange={(e) => {
                    setEditEmail(e.target.value);
                    clearEditError("email");
                  }}
                />
                {editErrors.email && <p className="text-sm text-red-500 -mt-2"> {editErrors.email}</p>}
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="09123456789"
                  value={editPhone}
                  onChange={(e) => {
                    setEditPhone(e.target.value);
                    clearEditError("phone");
                  }}
                />
                {editErrors.phone && <p className="text-sm text-red-500 -mt-2"> {editErrors.phone}</p>}
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  placeholder="Leave blank to keep unchanged"
                  value={editPassword}
                  onChange={(e) => {
                    setEditPassword(e.target.value);
                    clearEditError("password");
                  }}
                />
                {editErrors.password && <p className="text-sm text-red-500 -mt-2"> {editErrors.password}</p>}
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <Label htmlFor="role">Role</Label>
                <Select value={editRole} onValueChange={setEditRole} disabled={!!editingUser?.student}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>

                  <SelectContent>
                    {(roles.length > 0 ? roles.map((r) => r.name) : FALLBACK_ROLES)
                      .filter((n) => n !== "SUPER_ADMIN" && (n !== "STUDENT" || !!editingUser?.student))
                      .map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {editErrors.role && <p className="text-sm text-red-500 -mt-2"> {editErrors.role}</p>}
              </Field>
            </FieldGroup>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>

              <Button type="submit" disabled={updating} className="min-w-32.5 gap-2 px-5">
                {updating ? (
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
        <AlertDialogContent className="sm:max-w-105">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="size-6 text-destructive" />
            </div>

            <AlertDialogTitle className="w-full text-center text-xl">
              {deletingUser?.student
                ? deletingUser.student.isActive
                  ? "Deactivate Student?"
                  : "Student Already Deactivated"
                : deletingUser?.userRoles?.some((r) => r.role.name === "TEACHER")
                  ? deletingUser.teacher?.isActive
                    ? "Deactivate Teacher?"
                    : "Teacher Already Deactivated"
                  : "Delete User?"}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-center text-sm">
              {deletingUser?.student ? (
                deletingUser.student.isActive ? (
                  <>
                    This will deactivate the student and block their login. Attendance, marks, and report cards will be preserved.
                    <span className="font-semibold text-foreground"> {deletingUser?.name}</span>.
                  </>
                ) : (
                  <span className="block w-full text-center">
                    <span className="font-semibold text-foreground">{deletingUser?.name}</span>
                    &rsquo;s profile is already deactivated.
                  </span>
                )
              ) : deletingUser?.userRoles?.some((r) => r.role.name === "TEACHER") ? (
                deletingUser?.teacher?.isActive ? (
                  <>
                    This will deactivate the teacher account. All attendance, timetable, and academic history will be preserved.
                    <span className="font-semibold text-foreground"> {deletingUser?.name}</span>.
                  </>
                ) : (
                  <span className="block w-full text-center">
                    <span className="font-semibold text-foreground">{deletingUser?.name}</span>
                    &rsquo;s profile is already deactivated.
                  </span>
                )
              ) : (
                <>
                  This action cannot be undone. This will permanently remove
                  <span className="font-semibold text-foreground"> {deletingUser?.name}</span>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>

            <AlertDialogAction
              disabled={deletingUser?.student ? !deletingUser.student.isActive : deletingUser?.userRoles?.some((r) => r.role.name === "TEACHER") && !deletingUser?.teacher?.isActive}
              onClick={() => {
                if (deletingUser) {
                  handleDelete(deletingUser.id);
                }
              }}
              className="h-11 w-40 bg-destructive text-white hover:bg-destructive/90"
            >
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : deletingUser?.student && !deletingUser.student.isActive ? (
                "Deactivate Student"
              ) : !deletingUser?.student && deletingUser?.userRoles?.some((r) => r.role.name === "TEACHER") && !deletingUser?.teacher?.isActive ? (
                "Deactivate Teacher"
              ) : (
                <>
                  <Trash2 className="mr-2 size-4" />
                  {deletingUser?.student ? "Deactivate Student" : deletingUser?.userRoles?.some((r) => r.role.name === "TEACHER") ? "Deactivate Teacher" : "Delete User"}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
