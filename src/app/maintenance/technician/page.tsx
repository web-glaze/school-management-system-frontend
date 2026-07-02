"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar, Loader2, MailIcon, Pencil, Phone, Plus, Search, Trash2, User, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field, FieldGroup } from "@/components/ui/field";
import { usePermission } from "@/hooks/usePermission";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useTechnicianStore, useDepartmentStore } from "@/store/maintenanceStore";

interface Technician {
  id: string;
  technicianCode: string;
  email?: string | null;
  name: string;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  department?: {
    id: string;
    name: string;
    departmentCode?: string;
  };
}

export default function TechnicianPage() {
  const { technicians, loading, fetchTechnicians, createTechnician, updateTechnician, deleteTechnician } = useTechnicianStore();
  const { departments, fetchDepartments } = useDepartmentStore();

  const [addTechnicianOpen, setAddTechnicianOpen] = useState(false);
  const [editTechnicianOpen, setEditTechnicianOpen] = useState(false);
  const [deleteTechnicianOpen, setDeleteTechnicianOpen] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");

  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [deletingTechnician, setDeletingTechnician] = useState<Technician | null>(null);

  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTechnicians();
    fetchDepartments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createTechnician(name, phone, email, departmentId);

      setName("");
      setPhone("");
      setEmail("");
      setDepartmentId("");
      setAddTechnicianOpen(false);

      toast.success("Technician added successfully!");
    } catch (error) {
      console.log(error);
      toast.error("Failed to add technician");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTechnician) return;

    try {
      await updateTechnician(editingTechnician.id, editName, editPhone, editEmail, editDepartmentId);

      setEditTechnicianOpen(false);
      setEditingTechnician(null);
      setEditName("");
      setEditPhone("");
      setEditEmail("");
      setEditDepartmentId("");

      toast.success("Technician updated successfully!");
    } catch (error) {
      console.log(error);
      toast.error("Failed to update technician");
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!deletingTechnician) return;

    try {
      setDeletingId(deletingTechnician.id);
      await deleteTechnician(deletingTechnician.id);

      setDeleteTechnicianOpen(false);
      setDeletingTechnician(null);
      toast.success("Technician deleted successfully!");
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete technician");
    } finally {
      setDeletingId(null);
    }
  };

  const openEditDialog = (technician: Technician) => {
    setEditingTechnician(technician);

    setEditName(technician.name || "");
    setEditPhone(technician.phone || "");
    setEditEmail(technician.email || "");
    setEditDepartmentId(technician.department?.id || "");

    setEditTechnicianOpen(true);
  };

  const openDeleteDialog = (technician: Technician) => {
    setDeletingTechnician(technician);
    setDeleteTechnicianOpen(true);
  };

  const filteredTechnicians = technicians.filter((technician) => [technician.name, technician.phone, technician.department?.name].filter(Boolean).some((field) => field!.toLowerCase().includes(search.toLowerCase())));

  const authorized = usePermission("technician.read");

  if (authorized === null) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex md:flex-row flex-col md:items-center items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Technicians</h1>
            <p className="text-muted-foreground">Manage and track technicians</p>
          </div>
          <Dialog open={addTechnicianOpen} onOpenChange={setAddTechnicianOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 px-5">
                <Plus className="size-4" />
                Add Technician
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-115 p-0 overflow-hidden">
              <div className="border-b px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User className="size-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">Create Technician</DialogTitle>
                    <DialogDescription>Add a new maintenance technician</DialogDescription>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 p-6">
                <FieldGroup>
                  <Field>
                    <Label htmlFor="technician-name">Name</Label>
                    <Input id="technician-name" type="text" placeholder="Technician Name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <Label htmlFor="technician-phone">Phone</Label>
                    <Input id="technician-phone" type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} maxLength={10} />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <Label htmlFor="technician-email">Email</Label>
                    <Input id="technician-email" type="email" placeholder="Enter Your Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <Label htmlFor="department-id">Department</Label>
                    <Select onValueChange={setDepartmentId} value={departmentId} required>
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

                  <Button type="submit" disabled={loading} className="min-w-32.5 gap-2 px-5">
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
            <div className="relative w-full lg:w-87.5 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input type="text" placeholder="Search technicians..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11" />
            </div>
          </div>
          {loading && technicians.length === 0 ? (
            <div className="space-y-4">
              <div className="flex gap-4 border-b border-border/50 pb-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-6 bg-muted rounded flex-1 animate-pulse" />
                ))}
              </div>
              {[1, 2, 3, 4].map((row) => (
                <div key={row} className="flex gap-4 py-2 border-b border-border/20">
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
              <h3 className="text-lg font-bold text-foreground">No technicians found.</h3>
              <p className="text-muted-foreground mt-1.5 max-w-sm">No matching technicians were found. Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="relative w-full overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 border-b border-border/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-45">Name</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-45 hidden md:table-cell">Contact</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-30 hidden md:table-cell">Created At</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 text-right min-w-12.5 sticky right-0 bg-gray-50 shadow-lg md:shadow-none">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/30">
                  {filteredTechnicians.map((technician) => {
                    return (
                      <TableRow key={technician.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="py-4 align-top">
                          <div className="space-y-1 max-w-45">
                            <p className="font-semibold text-foreground text-base leading-tight hover:text-primary transition-colors truncate" title={technician.name}>
                              {technician.name.length > 20 ? `${technician.name.slice(0, 20)}...` : technician.name}
                            </p>
                            <p className="text-sm text-foreground/50">
                              {technician.technicianCode} | {technician.department?.name ? (technician.department.name.length > 15 ? `${technician.department.name.slice(0, 15)}...` : technician.department.name) : "NA"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 align-top hidden md:table-cell">
                          <div className="space-y-1 max-w-45 ">
                            <p className="text-foreground text-sm leading-tight hover:text-primary transition-colors">
                              <span className="flex gap-1">
                                <Phone size={18} />
                                <span>{technician.phone || "-"}</span>
                              </span>
                            </p>
                            <p className="text-foreground text-sm leading-tight hover:text-primary transition-colors">
                              <span className="flex gap-1">
                                <MailIcon size={18} />
                                <span title={technician.email || ""}>{technician.email ? (technician.email.length > 22 ? `${technician.email.slice(0, 22)}...` : technician.email) : "-"}</span>
                              </span>
                            </p>
                          </div>
                        </TableCell>

                        {/* Created At */}
                        <TableCell className="py-4 text-xs font-medium text-muted-foreground hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-5 text-muted-foreground/80" />
                            <span className="text-sm">
                              {new Date(technician.createdAt).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-4 text-right align-top max-w-12.5 sticky right-0 bg-card shadow-lg md:shadow-none">
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
                                <Button variant="ghost" size="icon" className="size-9">
                                  <MoreVertical className="size-5" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(technician)}>
                                  <Pencil className="mr-2 size-4" />
                                  Edit
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => openDeleteDialog(technician)} className="text-destructive">
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
            </div>
          )}
        </div>
      </div>

      <Dialog open={editTechnicianOpen} onOpenChange={setEditTechnicianOpen}>
        <DialogContent className="sm:max-w-115 p-0 overflow-hidden">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pencil className="size-5 text-primary" />
              </div>

              <div>
                <DialogTitle className="text-lg">Edit Technician</DialogTitle>

                <DialogDescription>Update technician details</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4 p-6">
            <FieldGroup>
              <Field>
                <Label htmlFor="edit-technician-name">Name</Label>

                <Input id="edit-technician-name" type="text" placeholder="Technician Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <Label htmlFor="edit-technician-phone">Phone</Label>

                <Input id="edit-technician-phone" type="tel" placeholder="Phone Number" value={editPhone} onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ""))} maxLength={10} />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <Label htmlFor="edit-technician-email">Email</Label>

                <Input id="edit-technician-email" type="text" placeholder="Technician Email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <Label>Department</Label>

                <Select onValueChange={setEditDepartmentId} value={editDepartmentId}>
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

              <Button type="submit" disabled={loading} className="min-w-32.5 gap-2 px-5">
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

      <AlertDialog open={deleteTechnicianOpen} onOpenChange={setDeleteTechnicianOpen}>
        <AlertDialogContent className="sm:max-w-105">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="size-6 text-destructive" />
            </div>

            <AlertDialogTitle className="w-full text-center text-xl">Delete Technician?</AlertDialogTitle>

            <AlertDialogDescription className="text-center">
              This action cannot be undone. This will permanently remove 
              <span className="font-semibold text-foreground"> {deletingTechnician?.name && (deletingTechnician.name.length > 20 ? `${deletingTechnician.name.slice(0, 20)}...` : deletingTechnician.name)}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>

            <AlertDialogAction onClick={handleDelete} disabled={!!deletingId} className="h-11 bg-destructive text-white hover:bg-destructive/90">
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
    </DashboardLayout>
  );
}