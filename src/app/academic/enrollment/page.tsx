"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup } from "@/components/ui/field";
import { Calendar, Check, ChevronDown, GraduationCap, Inbox, Loader2, MoreVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useAcademicStore } from "@/store/academicStore";
import { usePermission } from "@/hooks/usePermission";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};

interface StudentEnrollment {
  id: string;

  enrollmentStatus: "ACTIVE" | "PROMOTED" | "TRANSFERRED" | "GRADUATED" | "DROPPED";

  student: {
    id: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
  };

  session: {
    id: string;
    name: string;
  };

  class: {
    id: string;
    name: string;
  };

  section: {
    id: string;
    name: string;
  };

  createdAt: string;
}

export default function StudentEnrollmentsPage() {
  const {
    loading,

    students,
    sessions,
    classes,
    sections,
    studentEnrollments,

    fetchStudents,
    fetchSessions,
    fetchClasses,
    fetchSections,
    fetchStudentEnrollments,

    createStudentEnrollment,
    updateStudentEnrollment,
    deleteStudentEnrollment,
  } = useAcademicStore();

  const authorized = usePermission("student-enrollment.read");
  const [search, setSearch] = useState("");
  const [studentId, setStudentId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [editSessionId, setEditSessionId] = useState("");
  const [editClassId, setEditClassId] = useState("");
  const [editSectionId, setEditSectionId] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "PROMOTED" | "TRANSFERRED" | "GRADUATED" | "DROPPED">("ACTIVE");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editingEnrollment, setEditingEnrollment] = useState<StudentEnrollment | null>(null);
  const [deletingEnrollment, setDeletingEnrollment] = useState<StudentEnrollment | null>(null);
  const [studentOpen, setStudentOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchSessions();
    fetchClasses();
    fetchSections();
    fetchStudentEnrollments();
  }, []);
  if (authorized === null) {
    return null;
  }

  const filteredEnrollments = studentEnrollments.filter((item) => {
    const studentName = `${item.student.firstName} ${item.student.lastName}`.toLowerCase();

    return studentName.includes(search.toLowerCase()) || item.student.admissionNo.toLowerCase().includes(search.toLowerCase());
  });

  const resetForm = () => {
    setStudentId("");
    setSessionId("");
    setClassId("");
    setSectionId("");
    setStatus("ACTIVE");
    setFormErrors({});
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createStudentEnrollment({
        studentId,
        sessionId,
        classId,
        sectionId,
      });

      toast.success("Enrollment created successfully");

      resetForm();
      setAddOpen(false);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);

        toast.error(Object.values(err.response.data.errors)[0]);

        return;
      }

      toast.error(err.response?.data?.message || "Failed to create enrollment");
    }
  };

  const openEditDialog = (enrollment: StudentEnrollment) => {
    setEditSessionId(enrollment.session.id);
    setEditClassId(enrollment.class.id);
    setEditSectionId(enrollment.section.id);
    setStatus(enrollment.enrollmentStatus);

    setEditingEnrollment(enrollment);
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingEnrollment) return;

    try {
      await updateStudentEnrollment(editingEnrollment.id, {
        sessionId: editSessionId,
        classId: editClassId,
        sectionId: editSectionId,
        enrollmentStatus: status,
      });

      toast.success("Enrollment updated successfully");

      setEditOpen(false);
      setEditingEnrollment(null);
    } catch {
      toast.error("Failed to update enrollment");
    }
  };

  const openDeleteDialog = (enrollment: StudentEnrollment) => {
    setDeletingEnrollment(enrollment);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingEnrollment) return;

    try {
      await deleteStudentEnrollment(deletingEnrollment.id);

      toast.success("Enrollment deleted successfully");

      setDeleteOpen(false);
      setDeletingEnrollment(null);
    } catch {
      toast.error("Failed to delete enrollment");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex md:flex-row flex-col md:items-center items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Student Enrollments</h1>

            <p className="text-muted-foreground">Manage student enrollments</p>
          </div>

          <Dialog
            open={addOpen}
            onOpenChange={(open) => {
              setAddOpen(open);

              if (!open) {
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 px-5">
                <Plus className="size-4" />
                New Enrollment
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-125 p-0 overflow-hidden">
              <div className="border-b px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="size-5 text-primary" />
                  </div>

                  <div>
                    <DialogTitle className="text-lg">Create Student Enrollment</DialogTitle>

                    <DialogDescription>Enroll a student into an academic session.</DialogDescription>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreate} className="space-y-6 p-6">
                <FieldGroup>
                  <Field>
                    <Label>Student</Label>

                    <Popover open={studentOpen} onOpenChange={setStudentOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" role="combobox" aria-expanded={studentOpen} className="mt-2 h-11 w-full justify-between font-normal">
                          {studentId
                            ? (() => {
                                const student = students.find((s) => s.id === studentId);

                                return student ? `${student.admissionNo} - ${student.firstName} ${student.lastName}` : "Select Student";
                              })()
                            : "Select Student"}

                          <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                        <Command
                          filter={(value, search) => {
                            if (!search) return 1;

                            return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                          }}
                        >
                          <CommandInput placeholder="Search name or admission no..." />

                          <CommandList>
                            <CommandEmpty>No student found.</CommandEmpty>

                            <CommandGroup>
                              {students.map((student) => (
                                <CommandItem
                                  key={student.id}
                                  value={`${student.firstName} ${student.lastName} ${student.admissionNo}`}
                                  onSelect={(currentValue) => {
                                    const selectedStudent = students.find((s) => `${s.firstName} ${s.lastName} ${s.admissionNo}`.toLowerCase() === currentValue.toLowerCase());

                                    if (!selectedStudent) return;

                                    setStudentId(selectedStudent.id);

                                    setFormErrors((p) => ({
                                      ...p,
                                      studentId: "",
                                    }));

                                    setStudentOpen(false);
                                  }}
                                >
                                  <Check className={cn("mr-2 size-4", studentId === student.id ? "opacity-100" : "opacity-0")} />

                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {student.firstName} {student.lastName}
                                    </span>

                                    <span className="text-xs text-muted-foreground">{student.admissionNo}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {formErrors.studentId && <p className="text-sm text-red-500 mt-1">{formErrors.studentId}</p>}
                  </Field>

                  <Field>
                    <Label>Academic Session</Label>

                    <Select
                      value={sessionId}
                      onValueChange={(value) => {
                        setSessionId(value);
                        setFormErrors((p) => ({
                          ...p,
                          sessionId: "",
                        }));
                      }}
                    >
                      <SelectTrigger className="mt-2 h-11 w-full">
                        <SelectValue placeholder="Select Session" />
                      </SelectTrigger>

                      <SelectContent>
                        {sessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            {session.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {formErrors.sessionId && <p className="text-sm text-red-500 mt-1">{formErrors.sessionId}</p>}
                  </Field>

                  <Field>
                    <Label>Class</Label>

                    <Select
                      value={classId}
                      onValueChange={(value) => {
                        setClassId(value);
                        setFormErrors((p) => ({
                          ...p,
                          classId: "",
                        }));
                      }}
                    >
                      <SelectTrigger className="mt-2 h-11 w-full">
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>

                      <SelectContent>
                        {classes.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {formErrors.classId && <p className="text-sm text-red-500 mt-1">{formErrors.classId}</p>}
                  </Field>

                  <Field>
                    <Label>Section</Label>

                    <Select
                      value={sectionId}
                      onValueChange={(value) => {
                        setSectionId(value);
                        setFormErrors((p) => ({
                          ...p,
                          sectionId: "",
                        }));
                      }}
                    >
                      <SelectTrigger className="mt-2 h-11 w-full">
                        <SelectValue placeholder="Select Section" />
                      </SelectTrigger>

                      <SelectContent>
                        {sections.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {formErrors.sectionId && <p className="text-sm text-red-500 mt-1">{formErrors.sectionId}</p>}
                  </Field>
                </FieldGroup>

                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </DialogClose>

                  <Button type="submit" disabled={loading} className="min-w-32.5">
                    {loading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="size-4 mr-2" />
                        Create
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card rounded-md border p-6 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />

            <Input placeholder="Search student..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          {loading && studentEnrollments.length === 0 ? (
            <div className="space-y-4">
              <div className="flex gap-4 border-b pb-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-6 flex-1 rounded bg-muted animate-pulse" />
                ))}
              </div>

              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 border-b py-3">
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <div key={j} className="h-8 flex-1 rounded bg-muted animate-pulse" />
                  ))}
                </div>
              ))}
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Inbox className="size-6" />
              </div>

              <h3 className="text-lg font-semibold">{studentEnrollments.length === 0 ? "No enrollments created yet." : "No enrollments found."}</h3>

              <p className="mt-2 text-muted-foreground">{studentEnrollments.length === 0 ? "Create your first student enrollment." : "Try a different search."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-muted/15 border-b border-border/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-wider py-4 pl-6 text-foreground/80 min-w-40">Admission No.</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-45">Student</TableHead>
                    <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Session</TableHead>
                    <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Class</TableHead>
                    <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Section</TableHead>
                    <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Status</TableHead>
                    <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-30">Created At</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pr-6 text-right text-foreground/80 min-w-12.5">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-border/30">
                  {filteredEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="hidden md:table-cell py-4 pl-6 font-medium">{enrollment.student.admissionNo}</TableCell>

                      <TableCell className="py-4 ">
                        <div className="space-y-1 max-w-45">
                          <p className="font-semibold text-foreground text-base leading-tight hover:text-primary transition-colors" title={`${enrollment.student.firstName} ${enrollment.student.lastName}`}>
                            {`${enrollment.student.firstName} ${enrollment.student.lastName}`.length > 15
                              ? `${`${enrollment.student.firstName} ${enrollment.student.lastName}`.slice(0, 15)}...`
                              : `${enrollment.student.firstName} ${enrollment.student.lastName}`}
                          </p>

                          <p className="text-sm text-foreground/50 md:hidden">{enrollment.student.admissionNo}</p>
                        </div>
                      </TableCell>

                      <TableCell className="hidden md:table-cell">{enrollment.session.name}</TableCell>

                      <TableCell className="hidden md:table-cell">{enrollment.class.name}</TableCell>

                      <TableCell className="hidden md:table-cell">{enrollment.section.name}</TableCell>

                      <TableCell className="hidden md:table-cell">
                        <Badge
                          className={
                            enrollment.enrollmentStatus === "ACTIVE"
                              ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                              : enrollment.enrollmentStatus === "PROMOTED"
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                                : enrollment.enrollmentStatus === "TRANSFERRED"
                                  ? "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
                                  : enrollment.enrollmentStatus === "GRADUATED"
                                    ? "bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400"
                                    : "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                          }
                        >
                          {enrollment.enrollmentStatus}
                        </Badge>
                      </TableCell>

                      <TableCell className="hidden md:table-cell py-4 text-xs font-medium text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-5 text-muted-foreground/80" />

                          <span className="text-sm">
                            {new Date(enrollment.createdAt).toLocaleString("en-IN", {
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
                          <Button variant="ghost" size="icon" className="size-10 rounded-lg text-muted-foreground hover:bg-blue-300/10 hover:text-blue-700 transition-all" onClick={() => openEditDialog(enrollment)}>
                            <Pencil className="size-5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                            onClick={() => openDeleteDialog(enrollment)}
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
                              <DropdownMenuItem onClick={() => openEditDialog(enrollment)}>
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => openDeleteDialog(enrollment)} className="text-destructive">
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

      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { setEditingEnrollment(null);}}}>
        <DialogContent className="sm:max-w-125 p-0 overflow-hidden">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pencil className="size-5 text-primary" />
              </div>

              <div>
                <DialogTitle>Edit Enrollment</DialogTitle>
                <DialogDescription>Update enrollment details.</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6 p-6">
            <FieldGroup>
              <Field>
                <Label>Student</Label>

                <div className="mt-2 h-11 flex items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                  {editingEnrollment ? `${editingEnrollment.student.admissionNo} - ${editingEnrollment.student.firstName} ${editingEnrollment.student.lastName}` : ""}
                </div>
              </Field>

              <Field>
                <Label>Academic Session</Label>

                <Select value={editSessionId} onValueChange={(value) => setEditSessionId(value)}>
                  <SelectTrigger className="mt-2 h-11 w-full">
                    <SelectValue placeholder="Select Session" />
                  </SelectTrigger>

                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <Label>Class</Label>

                <Select value={editClassId} onValueChange={(value) => setEditClassId(value)}>
                  <SelectTrigger className="mt-2 h-11 w-full">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>

                  <SelectContent>
                    {classes.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <Label>Section</Label>

                <Select value={editSectionId} onValueChange={(value) => setEditSectionId(value)}>
                  <SelectTrigger className="mt-2 h-11 w-full">
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>

                  <SelectContent>
                    {sections.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <Label>Enrollment Status</Label>

                <Select value={status} onValueChange={(value) => setStatus(value as "ACTIVE" | "PROMOTED" | "TRANSFERRED" | "GRADUATED" | "DROPPED")}>
                  <SelectTrigger className="mt-2 h-11 w-full">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PROMOTED">Promoted</SelectItem>
                    <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                    <SelectItem value="GRADUATED">Graduated</SelectItem>
                    <SelectItem value="DROPPED">Dropped</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>

              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 size-4" />
                    Update
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="sm:max-w-105">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="size-6 text-destructive" />
            </div>

            <AlertDialogTitle className="w-full text-center text-xl">Delete enrollment?</AlertDialogTitle>

            <AlertDialogDescription className="text-center">
              This action cannot be undone. This will permanently remove{" "}
              <span className="font-semibold text-foreground">
                {deletingEnrollment &&
                  (`${deletingEnrollment.student.firstName} ${deletingEnrollment.student.lastName}`.length > 10
                    ? `${`${deletingEnrollment.student.firstName} ${deletingEnrollment.student.lastName}`.slice(0, 10)}...`
                    : `${deletingEnrollment.student.firstName} ${deletingEnrollment.student.lastName}`)}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>

            <AlertDialogAction onClick={handleDelete} className="h-11 bg-destructive text-white hover:bg-destructive/90">
              <>
                <Trash2 className="mr-2 size-4" />
                Delete enrollment
              </>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
