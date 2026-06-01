"use client";
import { logError } from "@/lib/api-helpers";
import { notify } from "@/lib/notify";


import DashboardLayout from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Building2,
  Calendar,
  Eye,
  Inbox,
  Loader2,
  KeyRound,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";

import { Field, FieldGroup } from "@/components/ui/field";

import axios from "axios";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Department {
  id: string;
  name: string;
  departmentCode?: string;
}

interface Technician {
  id: string;
  // Backend field is `technicianCode` (e.g. "TECH-001"). The old `code`
  // alias is kept so older API responses also render.
  technicianCode?: string;
  code?: string;
  name: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  department?: {
    id: string;
    name: string;
    departmentCode?: string;
  };
}

export default function TechnicianPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  // Per-row state for the inline "change password" input on each tech.
  const [pwInputs, setPwInputs] = useState<Record<string, string>>({});
  const [pwSaving, setPwSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>(
    [],
  );

  const [editOpen, setEditOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(
    null,
  );

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");

  /* FETCH TECHNICIANS */
  const fetchTechnicians = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/api/technicians`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];

      setTechnicians(data);
      setFilteredTechnicians(data);
    } catch (error) {
      logError("technician.page", error);
    } finally {
      setLoading(false);
    }
  };

  /* FETCH DEPARTMENTS */
  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/departments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDepartments(
        Array.isArray(response.data) ? response.data : response.data.data || [],
      );
    } catch (error) {
      logError("technician.page", error);
    }
  };

  useEffect(() => {
    fetchTechnicians();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredTechnicians(technicians);
      return;
    }

    const filtered = technicians.filter((technician) =>
      [
        technician.name,
        technician.technicianCode ?? technician.code,
        technician.phone,
        technician.email,
        technician.department?.name,
      ]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(search.toLowerCase())),
    );

    setFilteredTechnicians(filtered);
  }, [search, technicians]);

  /* CREATE */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/technicians`,
        {
          name,
          phone,
          email: email || undefined,
          // Optional password — if provided, backend also creates the
          // matching User account with TECHNICIAN role so this person
          // can log in immediately.
          password: password.trim() ? password.trim() : undefined,
          departmentId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setName("");
      setPhone("");
      setEmail("");
      setPassword("");
      setDepartmentId("");
      setOpen(false);

      await fetchTechnicians();
      setLoading(false);
    } catch (error) {
      logError("technician.page", error);

      notify.error("Failed to add technician");
    }
  };

  /**
   * Set or reset the password for the User account linked to this
   * technician. Backend creates the User if it doesn't exist yet, so the
   * very first call here turns a no-login profile into a login-ready one.
   */
  const changeTechnicianPassword = async (technicianId: string) => {
    const newPassword = (pwInputs[technicianId] ?? "").trim();
    if (newPassword.length < 6) {
      notify.error("Password must be at least 6 characters");
      return;
    }
    try {
      setPwSaving(technicianId);
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_URL}/api/technicians/${technicianId}/password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setPwInputs((prev) => ({ ...prev, [technicianId]: "" }));
      notify.success("Password updated");
    } catch (error) {
      logError("technician.page.changePassword", error);
      notify.error(error, "Failed to update password");
    } finally {
      setPwSaving(null);
    }
  };

  const openEditDialog = (technician: Technician) => {
    setEditingTechnician(technician);

    setEditName(technician.name || "");
    setEditPhone(technician.phone || "");
    setEditEmail(technician.email || "");
    setEditDepartmentId(technician.department?.id || "");

    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTechnician) return;

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_URL}/api/technicians/${editingTechnician.id}`,
        {
          name: editName,
          phone: editPhone,
          email: editEmail || undefined,
          departmentId: editDepartmentId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await fetchTechnicians();

      setEditOpen(false);
      setEditingTechnician(null);

      setEditName("");
      setEditPhone("");
      setEditEmail("");
      setEditDepartmentId("");
    } catch (error) {
      logError("technician.page", error);
    } finally {
      setLoading(false);
    }
  };

  /* DELETE */
  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);

      const token = localStorage.getItem("token");

      await axios.delete(`${API_URL}/api/technicians/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchTechnicians();
    } catch (error) {
      logError("technician.page", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="bg-card rounded-md p-5 md:p-6 border border-border/60  space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:w-[350px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Search technicians..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11"
              />
            </div>
            <div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 px-5">
                    <Plus className="size-4" />
                    Add Technician
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden">
                  <div className="border-b px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <User className="size-5 text-primary" />
                      </div>
                      <div>
                        <DialogTitle className="text-lg">
                          Create Technician
                        </DialogTitle>
                        <DialogDescription>
                          Add a new maintenance technician
                        </DialogDescription>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleCreate} className="space-y-4 p-6">
                    <FieldGroup>
                      <Field>
                        <Label htmlFor="technician-name">Name</Label>
                        <Input
                          id="technician-name"
                          type="text"
                          placeholder="Technician Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </Field>
                    </FieldGroup>
                    <FieldGroup>
                      <Field>
                        <Label htmlFor="technician-phone">Phone</Label>
                        <Input
                          id="technician-phone"
                          type="tel"
                          placeholder="Phone Number"
                          value={phone}
                          onChange={(e) =>
                            setPhone(e.target.value.replace(/\D/g, ""))
                          }
                          maxLength={10}
                        />
                      </Field>
                    </FieldGroup>
                    <FieldGroup>
                      <Field>
                        <Label htmlFor="technician-email">Email</Label>
                        <Input
                          id="technician-email"
                          type="email"
                          placeholder="Enter email (also used for login)"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </Field>
                    </FieldGroup>
                    <FieldGroup>
                      <Field>
                        <Label htmlFor="technician-password">
                          Password (optional — for login)
                        </Label>
                        <Input
                          id="technician-password"
                          type="text"
                          placeholder="Min 6 chars. Leave blank to skip login setup."
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          minLength={6}
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Filling password creates a User account with this
                          email so the technician can sign in immediately.
                        </p>
                      </Field>
                    </FieldGroup>

                    <FieldGroup>
                      <Field>
                        <Label htmlFor="department-id">Department</Label>
                        <Select
                          onValueChange={setDepartmentId}
                          value={departmentId}
                          required
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select department..." />
                          </SelectTrigger>
                          <SelectContent position={"popper"}>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
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

                      <Button
                        type="submit"
                        disabled={loading}
                        className="min-w-[130px] gap-2 px-5"
                      >
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
          </div>
          {loading ? (
            <div className="space-y-4">
              <div className="flex gap-4 border-b border-border/50 pb-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-6 bg-muted rounded flex-1 animate-pulse"
                  />
                ))}
              </div>
              {[1, 2, 3, 4].map((row) => (
                <div
                  key={row}
                  className="flex gap-4 py-2 border-b border-border/20"
                >
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                </div>
              ))}
            </div>
          ) : filteredTechnicians.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 md:p-16 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground/75">
                <User className="size-6 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                No technicians found.
              </h3>
              <p className="text-muted-foreground mt-1.5 max-w-sm">
                No matching technicians were found. Try adjusting your search or
                filters.
              </p>
            </div>
          ) : (
            <div className="relative w-full overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40 dark:bg-muted/15 border-b border-border/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pl-6 text-foreground/80 min-w-[100px]">
                      # ID
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pl-6 text-foreground/80 min-w-[180px]">
                      Name
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-[120px]">
                      Phone Number
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-[120px]">
                      Email
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-[120px]">
                      Department
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-[120px]">
                      Created At
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pr-6 text-foreground/80 text-right min-w-[80px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/30">
                  {filteredTechnicians.map((technician) => {
                    return (
                      <TableRow
                        key={technician.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <TableCell className="py-4 pl-6 align-top">
                          <div className="space-y-1 max-w-[100px]">
                            <p className="font-semibold text-foreground text-sm leading-tight hover:text-primary transition-colors">
                              {technician.technicianCode ?? technician.code ?? "-"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="py-4 pl-6 align-top">
                          <div className="space-y-1 max-w-[180px]">
                            <p className="font-semibold text-foreground text-sm leading-tight hover:text-primary transition-colors">
                              {technician.name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 align-top">
                          <div className="space-y-1 max-w-[120px]">
                            <p className="font-semibold text-foreground text-sm leading-tight hover:text-primary transition-colors">
                              {technician.phone || "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 align-top">
                          <div className="space-y-1 max-w-[120px]">
                            <p className="font-semibold text-foreground text-sm leading-tight hover:text-primary transition-colors">
                              {technician.email || "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 align-top">
                          <div className="space-y-1 max-w-[120px]">
                            <p className="font-semibold text-foreground text-sm leading-tight hover:text-primary transition-colors">
                              {technician.department?.name || "NA"}
                            </p>
                          </div>
                        </TableCell>

                        {/* Created At */}
                        <TableCell className="py-4 text-xs font-medium text-muted-foreground align-top">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-5 text-muted-foreground/80" />
                            <span className="text-base">
                             {new Date(technician.createdAt).toLocaleString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                        </TableCell>

                        {/* Actions — compact icon row. Password reset
                            lives in a popover so it doesn't squash the
                            date column on narrow screens. */}
                        <TableCell className="py-4 pr-6 align-top">
                          <div className="flex items-center justify-end gap-1">
                            {/* Password reset popover */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={!technician.email}
                                  className="size-9 rounded-lg text-muted-foreground hover:bg-amber-100/40 hover:text-amber-700 transition-all"
                                  title={
                                    technician.email
                                      ? "Set or reset password"
                                      : "Add email first to enable login"
                                  }
                                >
                                  <KeyRound className="size-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[420px]">
                                <DialogHeader>
                                  <DialogTitle>
                                    Set login password
                                  </DialogTitle>
                                  <DialogDescription>
                                    Sets the password for the User account
                                    matching{" "}
                                    <span className="font-semibold text-foreground">
                                      {technician.email}
                                    </span>
                                    . If no User account exists yet, one is
                                    created with the TECHNICIAN role.
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-3 py-2">
                                  <Input
                                    type="text"
                                    placeholder="New password (min 6 chars)"
                                    value={pwInputs[technician.id] ?? ""}
                                    onChange={(e) =>
                                      setPwInputs((prev) => ({
                                        ...prev,
                                        [technician.id]: e.target.value,
                                      }))
                                    }
                                    className="h-10 text-sm"
                                  />
                                </div>

                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="ghost" type="button">
                                      Cancel
                                    </Button>
                                  </DialogClose>
                                  <Button
                                    disabled={
                                      pwSaving === technician.id ||
                                      !(pwInputs[technician.id]?.trim())
                                    }
                                    onClick={() =>
                                      changeTechnicianPassword(technician.id)
                                    }
                                    className="gap-2"
                                  >
                                    {pwSaving === technician.id ? (
                                      <>
                                        <Loader2 className="size-3.5 animate-spin" />
                                        Saving…
                                      </>
                                    ) : (
                                      <>
                                        <KeyRound className="size-3.5" />
                                        Save Password
                                      </>
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                          <Dialog open={editOpen} onOpenChange={setEditOpen}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(technician)}
                              className="size-9 rounded-lg text-muted-foreground hover:bg-blue-300/10 hover:text-blue-700 transition-all"
                              title="Edit Technician"
                            >
                              <Pencil className="size-4" />
                            </Button>

                            <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden">
                              <div className="border-b px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Pencil className="size-5 text-primary" />
                                  </div>

                                  <div>
                                    <DialogTitle className="text-lg">
                                      Edit Technician
                                    </DialogTitle>

                                    <DialogDescription>
                                      Update technician details
                                    </DialogDescription>
                                  </div>
                                </div>
                              </div>

                              <form
                                onSubmit={handleUpdate}
                                className="space-y-4 p-6"
                              >
                                <FieldGroup>
                                  <Field>
                                    <Label htmlFor="edit-technician-name">
                                      Name
                                    </Label>

                                    <Input
                                      id="edit-technician-name"
                                      type="text"
                                      placeholder="Technician Name"
                                      value={editName}
                                      onChange={(e) =>
                                        setEditName(e.target.value)
                                      }
                                      required
                                    />
                                  </Field>
                                </FieldGroup>

                                <FieldGroup>
                                  <Field>
                                    <Label htmlFor="edit-technician-phone">
                                      Phone
                                    </Label>

                                    <Input
                                      id="edit-technician-phone"
                                      type="tel"
                                      placeholder="Phone Number"
                                      value={editPhone}
                                      onChange={(e) =>
                                        setEditPhone(
                                          e.target.value.replace(/\D/g, ""),
                                        )
                                      }
                                      maxLength={10}
                                    />
                                  </Field>
                                </FieldGroup>

                                <FieldGroup>
                                  <Field>
                                    <Label htmlFor="edit-technician-email">
                                      Email
                                    </Label>

                                    <Input
                                      id="edit-technician-email"
                                      type="email"
                                      placeholder="Enter Email"
                                      value={editEmail}
                                      onChange={(e) =>
                                        setEditEmail(e.target.value)
                                      }
                                    />
                                  </Field>
                                </FieldGroup>

                                <FieldGroup>
                                  <Field>
                                    <Label>Department</Label>

                                    <Select
                                      onValueChange={setEditDepartmentId}
                                      value={editDepartmentId}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select department..." />
                                      </SelectTrigger>

                                      <SelectContent position="popper">
                                        {departments.map((dept) => (
                                          <SelectItem
                                            key={dept.id}
                                            value={dept.id}
                                          >
                                            {dept.name}
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

                                  <Button
                                    type="submit"
                                    disabled={loading}
                                    className="min-w-[130px] gap-2 px-5"
                                  >
                                    {loading ? (
                                      <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Updating...
                                      </>
                                    ) : (
                                      <>
                                        <Pencil className="size-4" />
                                        Update
                                      </>
                                    )}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                                title="Delete Technician"
                              >
                                <Trash2 className="size-5" />
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent className="sm:max-w-[420px]">
                              <AlertDialogHeader>
                                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
                                  <Trash2 className="size-6 text-destructive" />
                                </div>

                                <AlertDialogTitle className="w-full text-center text-xl">
                                  Delete Technician?
                                </AlertDialogTitle>

                                <AlertDialogDescription className="text-center">
                                  This action cannot be undone. This will
                                  permanently remove
                                  <span className="font-semibold text-foreground">
                                    {" "}
                                    {technician.name}
                                  </span>
                                  .
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <AlertDialogFooter className="mt-4">
                                <AlertDialogCancel className="h-11">
                                  Cancel
                                </AlertDialogCancel>

                                <AlertDialogAction
                                  onClick={() => handleDelete(technician.id)}
                                  disabled={deletingId === technician.id}
                                  className="h-11 bg-destructive text-white hover:bg-destructive/90"
                                >
                                  {deletingId === technician.id ? (
                                    <>
                                      <Loader2 className="mr-2 size-4 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="mr-2 size-4" />
                                      Delete Technician
                                    </>
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
