"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { Building2, Calendar, Inbox, Loader2, Pencil, Plus, Search, Trash2, MoreVertical } from "lucide-react";

import { useEffect, useState } from "react";
import { Field, FieldGroup } from "@/components/ui/field";
import { toast } from "sonner";

interface Department {
  id: string;
  name: string;
  departmentCode?: string;
  createdAt: string;
}

import { useDepartmentStore } from "@/store/maintenanceStore";

export default function DepartmentPage() {
  const { departments, loading, fetchDepartments, createDepartment, updateDepartment, deleteDepartment } = useDepartmentStore();

  const [name, setName] = useState("");
  const [editName, setEditName] = useState("");

  const [addDepartmentOpen, setAddDepartmentOpen] = useState(false);
  const [editDepartmentOpen, setEditDepartmentOpen] = useState(false);
  const [deleteDepartmentOpen, setDeleteDepartmentOpen] = useState(false);

  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);

  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createDepartment(name);

      setName("");
      setAddDepartmentOpen(false);

      toast.success("Department created successfully");
    } catch {
      toast.error("Failed to create department");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingDepartment) return;

    const id = editingDepartment.id;

    try {
      await updateDepartment(id, editName);

      setEditDepartmentOpen(false);
      setEditingDepartment(null);

      toast.success("Department updated successfully");
    } catch {
      toast.error("Failed to update department");
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!deletingDepartment) return;

    try {
      setDeletingId(deletingDepartment.id);

      await deleteDepartment(deletingDepartment.id);

      setDeleteDepartmentOpen(false);
      setDeletingDepartment(null);

      toast.success("Department deleted successfully");
    } catch {
      toast.error("Failed to delete department");
    } finally {
      setDeletingId(null);
    }
  };

  const openEditDialog = (department: Department) => {
    setEditingDepartment(department);
    setEditName(department.name);
    setEditDepartmentOpen(true);
  };

  const openDeleteDialog = (department: Department) => {
    setDeletingDepartment(department);
    setDeleteDepartmentOpen(true);
  };

  const filteredDepartments = departments.filter((department) => department.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex md:flex-row flex-col md:items-center items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Departments</h1>
            <p className="text-muted-foreground text-sm">Manage maintenance departments</p>
          </div>
          <Dialog open={addDepartmentOpen} onOpenChange={setAddDepartmentOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 px-5">
                <Plus className="size-4" />
                Add Department
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden">
              <div className="border-b px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="size-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">Create Department</DialogTitle>
                    <DialogDescription>Add a new maintenance department</DialogDescription>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreate} className="space-y-6 p-6">
                <FieldGroup>
                  <Field>
                    <Label htmlFor="department-name">Department Name</Label>
                    <Input id="department-name" placeholder="Electrical, Plumbing, IT..." value={name} onChange={(e) => setName(e.target.value)} required className="mt-2" />
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
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
            <div className="relative flex-1 max-w-sm group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input type="text" placeholder="Search by department name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9 text-sm bg-muted/30 border-0 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary/30" />
            </div>
          </div>
          {loading && departments.length === 0 ? (
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
          ) : filteredDepartments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 md:p-16 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground/75">
                <Inbox className="size-6 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-foreground">No departments created yet.</h3>
              <p className="text-muted-foreground mt-1.5 max-w-sm">No matching records were found in the database. Check search queries or reset parameters.</p>
            </div>
          ) : (
            <div className="relative w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-slate-50/80 border-b border-slate-200/80">
                    <TableHead className="font-extrabold text-[11px] uppercase tracking-widest py-3.5 px-5 text-slate-500 min-w-[200px]">Department</TableHead>
                    <TableHead className="font-extrabold text-[11px] uppercase tracking-widest py-3.5 text-slate-500 min-w-[160px] hidden lg:table-cell">Created At</TableHead>
                    <TableHead className="font-extrabold text-[11px] uppercase tracking-widest py-3.5 pr-5 text-slate-500 text-right min-w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepartments.map((department, index) => (
                    <TableRow key={department.id} className="hover:bg-primary/[0.025] transition-colors border-b border-slate-100 group">
                      <TableCell className="py-4 px-5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                            <Building2 className="size-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{department.name}</p>
                            <p className="text-[11px] text-muted-foreground/60 font-semibold mt-0.5">{department.departmentCode}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 align-middle hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Calendar className="size-3.5 shrink-0" />
                          <span>{new Date(department.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 pr-5 text-right align-middle">
                        <div className="hidden md:flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:bg-blue-50 hover:text-blue-600 transition-all" onClick={() => openEditDialog(department)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all" onClick={() => openDeleteDialog(department)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        <div className="md:hidden flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8"><MoreVertical className="size-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(department)}><Pencil className="mr-2 size-4" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDeleteDialog(department)} className="text-destructive"><Trash2 className="mr-2 size-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={editDepartmentOpen} onOpenChange={setEditDepartmentOpen}>
        <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pencil className="size-5 text-primary" />
              </div>

              <div>
                <DialogTitle className="text-lg">Edit Department</DialogTitle>

                <DialogDescription>Update department details</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6 p-6">
            <FieldGroup>
              <Field>
                <Label htmlFor="edit-department-name">Department Name</Label>

                <Input id="edit-department-name" placeholder="Electrical, Plumbing, IT..." value={editName} onChange={(e) => setEditName(e.target.value)} required className="mt-2" />
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
                    <Pencil className="size-4" />
                    Update
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDepartmentOpen} onOpenChange={setDeleteDepartmentOpen}>
        <AlertDialogContent className="sm:max-w-[420px]">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="size-6 text-destructive" />
            </div>

            <AlertDialogTitle className="w-full text-center text-xl">Delete Department?</AlertDialogTitle>

            <AlertDialogDescription className="text-center">
              This action cannot be undone. This will permanently remove
              <span className="font-semibold text-foreground"> {deletingDepartment?.name}</span>.
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
                  Delete Department
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
