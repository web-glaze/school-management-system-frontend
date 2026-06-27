"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CalendarDays, Calendar, Inbox, Loader2, Pencil, Plus, Search, Trash2, MoreVertical } from "lucide-react";
import { useAcademicStore } from "@/store/academicStore";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { usePermission } from "@/hooks/usePermission";
import { useEffect, useState } from "react";
import { Field, FieldGroup } from "@/components/ui/field";
import { toast } from "sonner";
import { AxiosError } from "axios";

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};

interface Teacher {
  id: string;
  teacherCode: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  joiningDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TeachersPage() {
  const { teachers, loading, fetchTeachers, createTeacher, updateTeacher, deleteTeacher } = useAcademicStore();
  const [name, setName] = useState("");
  const [editName, setEditName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editJoiningDate, setEditJoiningDate] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [editIsActive, setEditIsActive] = useState(false);
  const [addTeacherOpen, setAddTeacherOpen] = useState(false);
  const [editTeacherOpen, setEditTeacherOpen] = useState(false);
  const [deleteTeacherOpen, setDeleteTeacherOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createTeacher({
        name,
        email,
        phone,
        designation,
        joiningDate,
        isActive,
      });

      setName("");
      setEmail("");
      setPhone("");
      setDesignation("");
      setJoiningDate("");
      setIsActive(false);

      setFormErrors({});
      setAddTeacherOpen(false);

      toast.success("Teacher created successfully");
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;

      const errors = apiError.response?.data?.errors;

      if (errors) {
        setFormErrors(errors);
        return;
      }

      toast.error(apiError.response?.data?.message ?? "Failed to create teacher");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTeacher) return;

    try {
      await updateTeacher(editingTeacher.id, {
        name: editName,
        email: editEmail,
        phone: editPhone,
        designation: editDesignation,
        joiningDate: editJoiningDate,
        isActive: editIsActive,
      });

      setEditTeacherOpen(false);
      setEditingTeacher(null);

      toast.success("Teacher data updated successfully");
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;

      const errors = apiError.response?.data?.errors;

      if (errors) {
        setEditErrors(errors);
        return;
      }

      toast.error(apiError.response?.data?.message ?? "Failed to update teacher data");
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!deletingTeacher) return;

    try {
      setDeletingId(deletingTeacher.id);

      await deleteTeacher(deletingTeacher.id);

      setDeleteTeacherOpen(false);
      setDeletingTeacher(null);

      toast.success("Teacher data deleted successfully");
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;

      const errors = apiError.response?.data?.errors;

      if (errors) {
        toast.error(Object.values(errors)[0]);
        return;
      }

      toast.error(apiError.response?.data?.message ?? "Failed to delete teacher data");
    } finally {
      setDeletingId(null);
    }
  };

  const openEditDialog = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditName(teacher.name);
    setEditIsActive(teacher.isActive);
    setEditErrors({});
    setEditTeacherOpen(true);
    setEditEmail(teacher.email);
    setEditPhone(teacher.phone);
    setEditDesignation(teacher.designation);
    setEditJoiningDate(teacher.joiningDate.split("T")[0]);
  };

  const openDeleteDialog = (teacher: Teacher) => {
    setDeletingTeacher(teacher);
    setDeleteTeacherOpen(true);
  };

  const authorized = usePermission("teacher.read");

  if (authorized === null) {
    return null;
  }

  const clearFormError = (field: string) => {
    setFormErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const clearEditError = (field: string) => {
    setEditErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const isTeacherChanged =
    editingTeacher &&
    (editName.trim() !== editingTeacher.name ||
      editIsActive !== editingTeacher.isActive ||
      editEmail !== editingTeacher.email ||
      editPhone !== editingTeacher.phone ||
      editDesignation !== editingTeacher.designation ||
      editJoiningDate !== editingTeacher.joiningDate.split("T")[0]);

  const filteredTeachers = teachers.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()) || item.teacherCode.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex md:flex-row flex-col md:items-center items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Teachers</h1>
            <p className="text-muted-foreground">Manage teachers data</p>
          </div>

          <Dialog open={addTeacherOpen} onOpenChange={setAddTeacherOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 px-5">
                <Plus className="size-4" />
                Add Teacher
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-115 p-0 overflow-hidden">
              <div className="border-b px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="size-5 text-primary" />
                  </div>

                  <div>
                    <DialogTitle className="text-lg">Create Teacher</DialogTitle>

                    <DialogDescription>Add a new Teacher</DialogDescription>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreate} className="space-y-6 p-6">
                <FieldGroup>
                  <Field>
                    <Label>Teacher Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        clearFormError("name");
                      }}
                      className="mt-2"
                    />
                    {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
                  </Field>

                  <Field>
                    <Label>Email</Label>
                    <Input
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearFormError("email");
                      }}
                      className="mt-2"
                    />
                    {formErrors.email && <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>}
                  </Field>

                  <Field>
                    <Label>Phone</Label>
                    <Input
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        clearFormError("phone");
                      }}
                      className="mt-2"
                    />
                    {formErrors.phone && <p className="text-sm text-red-500 mt-1">{formErrors.phone}</p>}
                  </Field>

                  <Field>
                    <Label>Designation</Label>
                    <Input
                      value={designation}
                      onChange={(e) => {
                        setDesignation(e.target.value);
                        clearFormError("designation");
                      }}
                      className="mt-2"
                    />
                    {formErrors.designation && <p className="text-sm text-red-500 mt-1">{formErrors.designation}</p>}
                  </Field>

                  <Field>
                    <Label>Joining Date</Label>
                    <Input
                      type="date"
                      value={joiningDate}
                      onChange={(e) => {
                        setJoiningDate(e.target.value);
                        clearFormError("joiningDate");
                      }}
                      className="mt-2"
                    />
                    {formErrors.joiningDate && <p className="text-sm text-red-500 mt-1">{formErrors.joiningDate}</p>}
                  </Field>

                  <Field>
                    <Label>Status</Label>
                    <div className="mt-3">
                      <Switch checked={isActive} onCheckedChange={setIsActive} />
                    </div>
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

        <div className="bg-card rounded-md p-5 md:p-6 border border-border/60 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:w-87.5 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />

              <Input type="text" placeholder="Search by teacher name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11" />
            </div>
          </div>

          {loading && teachers.length === 0 ? (
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
          ) : filteredTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 md:p-16 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground/75">
                <Inbox className="size-6 stroke-[1.5]" />
              </div>

              <h3 className="text-lg font-bold text-foreground">No teachers created yet.</h3>

              <p className="text-muted-foreground mt-1.5 max-w-sm">No matching records were found in the database. Check search queries or reset parameters.</p>
            </div>
          ) : (
            <div className="relative w-full overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-muted/15 border-b border-border/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pl-6 text-foreground/80 min-w-45">Teacher</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Code</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Email</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Phone</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Designation</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Joining Date</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-30 hidden lg:table-cell">Created At</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pr-6 text-foreground/80 text-right min-w-12.5">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-border/30">
                  {filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="py-4 pl-6 align-top">
                        <div className="space-y-1 max-w-45">
                          <p className="font-semibold text-foreground text-base leading-tight hover:text-primary transition-colors">{teacher.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">{teacher.teacherCode}</TableCell>
                      <TableCell className="py-4">{teacher.email}</TableCell>
                      <TableCell className="py-4">{teacher.phone}</TableCell>
                      <TableCell className="py-4">{teacher.designation}</TableCell>
                      <TableCell className="py-4">{new Date(teacher.joiningDate).toLocaleDateString("en-IN")}</TableCell>

                      <TableCell className="py-4">
                        <Badge className={teacher.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-muted text-muted-foreground"}>{teacher.isActive ? "Active" : "Inactive"}</Badge>
                      </TableCell>

                      <TableCell className="py-4 text-xs font-medium text-muted-foreground align-top hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-5 text-muted-foreground/80" />

                          <span className="text-sm">
                            {new Date(teacher.createdAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 pr-6 text-right align-top max-w-12.5">
                        <div className="hidden md:flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-10 rounded-lg text-muted-foreground hover:bg-blue-300/10 hover:text-blue-700 transition-all" onClick={() => openEditDialog(teacher)}>
                            <Pencil className="size-5" />
                          </Button>

                          <Button variant="ghost" size="icon" className="size-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all" onClick={() => openDeleteDialog(teacher)}>
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
                              <DropdownMenuItem onClick={() => openEditDialog(teacher)}>
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => openDeleteDialog(teacher)} className="text-destructive">
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </DropdownMenuItem>
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

      <Dialog open={editTeacherOpen} onOpenChange={setEditTeacherOpen}>
        <DialogContent className="sm:max-w-115 p-0 overflow-hidden">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pencil className="size-5 text-primary" />
              </div>

              <div>
                <DialogTitle className="text-lg">Edit Teacher</DialogTitle>

                <DialogDescription>Update Teacher details</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6 p-6">
            <FieldGroup>
              <Field>
                <Label>Teacher Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    clearEditError("name");
                  }}
                  className="mt-2"
                />
                {editErrors.name && <p className="text-sm text-red-500 mt-1">{editErrors.name}</p>}
              </Field>

              <Field>
                <Label>Email</Label>
                <Input
                  value={editEmail}
                  onChange={(e) => {
                    setEditEmail(e.target.value);
                    clearEditError("email");
                  }}
                  className="mt-2"
                />
                {editErrors.email && <p className="text-sm text-red-500 mt-1">{editErrors.email}</p>}
              </Field>

              <Field>
                <Label>Phone</Label>
                <Input
                  value={editPhone}
                  onChange={(e) => {
                    setEditPhone(e.target.value);
                    clearEditError("phone");
                  }}
                  className="mt-2"
                />
                {editErrors.phone && <p className="text-sm text-red-500 mt-1">{editErrors.phone}</p>}
              </Field>

              <Field>
                <Label>Designation</Label>
                <Input
                  value={editDesignation}
                  onChange={(e) => {
                    setEditDesignation(e.target.value);
                    clearEditError("designation");
                  }}
                  className="mt-2"
                />
                {editErrors.designation && <p className="text-sm text-red-500 mt-1">{editErrors.designation}</p>}
              </Field>

              <Field>
                <Label>Joining Date</Label>
                <Input
                  type="date"
                  value={editJoiningDate}
                  onChange={(e) => {
                    setEditJoiningDate(e.target.value);
                    clearEditError("joiningDate");
                  }}
                  className="mt-2"
                />
                {editErrors.joiningDate && <p className="text-sm text-red-500 mt-1">{editErrors.joiningDate}</p>}
              </Field>

              <Field>
                <Label>Active Teacher</Label>
                <div className="mt-3">
                  <Switch checked={editIsActive} onCheckedChange={setEditIsActive} />
                </div>
              </Field>
            </FieldGroup>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>

              <Button type="submit" disabled={loading || !isTeacherChanged} className="min-w-32.5 gap-2 px-5">
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

      <AlertDialog open={deleteTeacherOpen} onOpenChange={setDeleteTeacherOpen}>
        <AlertDialogContent className="sm:max-w-105">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="size-6 text-destructive" />
            </div>

            <AlertDialogTitle className="w-full text-center text-xl">Delete teacher?</AlertDialogTitle>

            <AlertDialogDescription className="text-center">
              This action cannot be undone. This will permanently remove
              <span className="font-semibold text-foreground"> {deletingTeacher?.name}</span>.
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
                  Delete teacher
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}  