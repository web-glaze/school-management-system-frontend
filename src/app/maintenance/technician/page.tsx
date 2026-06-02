"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
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
  Calendar,
  Loader2,
  MailIcon,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  MoreVertical,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Department {
  id: string;
  name: string;
  departmentCode?: string;
}

interface Technician {
  id: string;
  technicianCode: string;
  email: string;
  name: string;
  phone?: string;
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
  const [departmentId, setDepartmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>(
    [],
  );

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(
    null,
  );
  const [deletingTechnician, setDeletingTechnician] =
    useState<Technician | null>(null);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
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
      console.log(error);
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
      console.log(error);
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
      [technician.name, technician.phone, technician.department?.name]
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
      setDepartmentId("");
      setOpen(false);

      await fetchTechnicians();
      setLoading(false);
    } catch (error) {
      console.log(error);

      toast.error("Failed to add technician");
    } finally {
      toast.success("Technician added successfully!");
    }
  };

  const openEditDialog = (technician: Technician) => {
    setEditingTechnician(technician);

    setEditName(technician.name || "");
    setEditPhone(technician.phone || "");
    setEditDepartmentId(technician.department?.id || "");

    setEditOpen(true);
  };

  const openDeleteDialog = (technician: Technician) => {
    setDeletingTechnician(technician);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingTechnician) return;

    await handleDelete(deletingTechnician.id);

    setDeleteOpen(false);
    setDeletingTechnician(null);
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
      setEditDepartmentId("");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      toast.success("Technician updated successfully!");
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
      console.log(error);
    } finally {
      setDeletingId(null);

      toast.success("Technician deleted successfully!");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex md:flex-row flex-col md:items-center items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Technicians</h1>
            <p className="text-muted-foreground">
              Manage and track technicians
            </p>
          </div>
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
                      placeholder="Enter Your Email"
                      // value={email}
                      // onChange={(e) => setEmail(e.target.value)}
                      required
                    />
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
                <TableHeader className="bg-gray-50 border-b border-border/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-[180px]">
                      Name
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-[180px]">
                      Contact
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-[120px] hidden lg:table-cell">
                      Created At
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 text-right min-w-[50px] sticky right-0 bg-gray-50 shadow-lg md:shadow-none">
                      <span className="hidden md:block">Actions</span>
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
                        <TableCell className="py-4 align-top">
                          <div className="space-y-1 max-w-[180px]">
                            <p className="font-semibold text-foreground text-base leading-tight hover:text-primary transition-colors">
                              {technician.name}
                            </p>
                            <p className="text-sm text-foreground/50">
                              {technician.technicianCode} |{" "}
                              {technician.department?.name || "NA"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 align-top">
                          <div className="space-y-1 max-w-[180px]">
                            <p className="text-foreground text-sm leading-tight hover:text-primary transition-colors">
                              <span className="flex gap-1">
                                <Phone size={18} />
                                <span>{technician.phone || "-"}</span>
                              </span>
                            </p>
                            <p className="text-foreground text-sm leading-tight hover:text-primary transition-colors">
                              <span className="flex gap-1">
                                <MailIcon size={18} />
                                <span>
                                  {/* {technician.email || "-"} */}
                                  info@example.com
                                </span>
                              </span>
                            </p>
                          </div>
                        </TableCell>

                        {/* Created At */}
                        <TableCell className="py-4 text-xs font-medium text-muted-foreground align-top hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-5 text-muted-foreground/80" />
                            <span className="text-sm">
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

                        {/* Actions */}
                        <TableCell className="py-4 text-right align-top max-w-[50px] sticky right-0 bg-card shadow-lg md:shadow-none">
                          <div className="hidden md:flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-10 rounded-lg text-muted-foreground hover:bg-blue-300/10 hover:text-blue-700 transition-all"
                              title="Edit Technician"
                              onClick={() => openEditDialog(technician)}
                            >
                              <Pencil className="size-5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                              title="Delete Technician"
                              onClick={() => openDeleteDialog(technician)}
                            >
                              <Trash2 className="size-5" />
                            </Button>
                          </div>
                          <div className="md:hidden flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-9"
                                >
                                  <MoreVertical className="size-5" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openEditDialog(technician)}
                                >
                                  <Pencil className="mr-2 size-4" />
                                  Edit
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(technician)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 size-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
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

                  <form onSubmit={handleUpdate} className="space-y-4 p-6">
                    <FieldGroup>
                      <Field>
                        <Label htmlFor="edit-technician-name">Name</Label>

                        <Input
                          id="edit-technician-name"
                          type="text"
                          placeholder="Technician Name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                        />
                      </Field>
                    </FieldGroup>

                    <FieldGroup>
                      <Field>
                        <Label htmlFor="edit-technician-phone">Phone</Label>

                        <Input
                          id="edit-technician-phone"
                          type="tel"
                          placeholder="Phone Number"
                          value={editPhone}
                          onChange={(e) =>
                            setEditPhone(e.target.value.replace(/\D/g, ""))
                          }
                          maxLength={10}
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
              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="sm:max-w-[420px]">
                  <AlertDialogHeader>
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
                      <Trash2 className="size-6 text-destructive" />
                    </div>

                    <AlertDialogTitle className="w-full text-center text-xl">
                      Delete Technician?
                    </AlertDialogTitle>

                    <AlertDialogDescription className="text-center">
                      This action cannot be undone. This will permanently remove
                      <span className="font-semibold text-foreground">
                        {" "}
                        {deletingTechnician?.name}
                      </span>
                      .
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel className="h-11">
                      Cancel
                    </AlertDialogCancel>

                    <AlertDialogAction
                      onClick={confirmDelete}
                      disabled={!!deletingId}
                      className="h-11 bg-destructive text-white hover:bg-destructive/90"
                    >
                      {deletingId ? (
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
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
