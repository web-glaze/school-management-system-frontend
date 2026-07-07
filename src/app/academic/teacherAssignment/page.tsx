"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, GraduationCap, Inbox, Loader2, MoreVertical, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAcademicStore } from "@/store/academicStore";
import { usePermission } from "@/hooks/usePermission";

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};

interface TeacherAssignment {
  id: string;

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

  teacher: {
    id: string;
    name: string;
    email: string;
  };

  createdAt: string;
}

export default function TeacherAssignmentPage() {
  const {
    loading,

    sessions,
    classes,
    sections,
    teachers,
    teacherAssignments,

    fetchSessions,
    fetchClasses,
    fetchSections,
    fetchTeachers,
    fetchTeacherAssignments,

    createTeacherAssignment,
    updateTeacherAssignment,
    deleteTeacherAssignment,
  } = useAcademicStore();

  const authorized = usePermission("teacher-assignment.read");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({ class: "all", section: "all", session: "all" });
  const [sessionId, setSessionId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [editSessionId, setEditSessionId] = useState("");
  const [editClassId, setEditClassId] = useState("");
  const [editSectionId, setEditSectionId] = useState("");
  const [editTeacherId, setEditTeacherId] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editingAssignment, setEditingAssignment] = useState<TeacherAssignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<TeacherAssignment | null>(null);
  const resetForm = () => {
    setSessionId("");
    setClassId("");
    setSectionId("");
    setTeacherId("");
    setFormErrors({});
  };
  const filteredSections = useMemo(() => {
    if (classFilter === "all") return sections;
    return sections.filter((section) => teacherAssignments.some((allocation) => allocation.class.id === classFilter && allocation.section.id === section.id));
  }, [classFilter, sections, teacherAssignments]);

  const filteredAssignments = teacherAssignments.filter((item) => {
    const matchesSearch = item.teacher.name.toLowerCase().includes(search.toLowerCase());
    const matchesClass = appliedFilters.class === "all" || item.class.id === appliedFilters.class;
    const matchesSection = appliedFilters.section === "all" || item.section.id === appliedFilters.section;
    const matchesSession = appliedFilters.session === "all" || item.session.id === appliedFilters.session;
    return matchesSearch && matchesClass && matchesSection && matchesSession;
  });

  useEffect(() => {
    fetchSessions();
    fetchClasses();
    fetchSections();
    fetchTeachers();
    fetchTeacherAssignments();
  }, [fetchSessions, fetchClasses, fetchSections, fetchTeachers, fetchTeacherAssignments]);

  if (authorized === null) {
    return null;
  }

  const hasActiveFilters = appliedFilters.class !== "all" || appliedFilters.section !== "all" || appliedFilters.session !== "all";
  const filtersChanged = classFilter !== appliedFilters.class || sectionFilter !== appliedFilters.section || sessionFilter !== appliedFilters.session;
  const pendingFilterCount = [classFilter !== "all", sectionFilter !== "all", sessionFilter !== "all"].filter(Boolean).length;
  function applyFilters() {
    setAppliedFilters({
      class: classFilter,
      section: sectionFilter,
      session: sessionFilter,
    });
  }

  function clearFilters() {
    setClassFilter("all");
    setSectionFilter("all");
    setSessionFilter("all");

    setAppliedFilters({
      class: "all",
      section: "all",
      session: "all",
    });
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createTeacherAssignment({
        sessionId,
        classId,
        sectionId,
        teacherId,
      });

      toast.success("Class teacher assignment created successfully");

      resetForm();
      setAddOpen(false);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);

        toast.error(Object.values(err.response.data.errors)[0]);

        return;
      }

      toast.error(err.response?.data?.message || "Failed to create class teacher assignment");
    }
  };

  const openEditDialog = (assignment: TeacherAssignment) => {
    setEditSessionId(assignment.session.id);
    setEditClassId(assignment.class.id);
    setEditSectionId(assignment.section.id);
    setEditTeacherId(assignment.teacher.id);

    setEditingAssignment(assignment);
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingAssignment) return;

    try {
      await updateTeacherAssignment(editingAssignment.id, {
        sessionId: editSessionId,
        classId: editClassId,
        sectionId: editSectionId,
        teacherId: editTeacherId,
      });

      toast.success("Class teacher assignment updated successfully");

      setEditOpen(false);
      setEditingAssignment(null);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);

        toast.error(Object.values(err.response.data.errors)[0]);
        return;
      }

      toast.error(err.response?.data?.message ?? "Failed to update class teacher assignment");
    }
  };

  const openDeleteDialog = (assignment: TeacherAssignment) => {
    setDeletingAssignment(assignment);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingAssignment) return;

    try {
      await deleteTeacherAssignment(deletingAssignment.id);

      toast.success("Class teacher assignment deleted successfully");

      setDeleteOpen(false);
      setDeletingAssignment(null);
    } catch {
      toast.error("Failed to delete class teacher assignment");
    }
  };

  const hasEditChanges =
    editingAssignment && (editSessionId !== editingAssignment.session.id || editClassId !== editingAssignment.class.id || editSectionId !== editingAssignment.section.id || editTeacherId !== editingAssignment.teacher.id);

  return (
    <DashboardLayout>
      <div className="flex md:flex-row flex-col md:items-center items-start justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Class teacher assignments</h1>

          <p className="text-muted-foreground">Manage class teacher assignments</p>
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
              New Assignment
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-125 p-0 overflow-hidden">
            <div className="border-b px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="size-5 text-primary" />
                </div>

                <div>
                  <DialogTitle>Create Class Teacher Assignment</DialogTitle>

                  <DialogDescription>Assign a class teacher.</DialogDescription>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-6 p-6">
              <FieldGroup>
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
                      {sessions.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {formErrors.sessionId && <p className="mt-1 text-sm text-red-500">{formErrors.sessionId}</p>}
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

                  {formErrors.classId && <p className="mt-1 text-sm text-red-500">{formErrors.classId}</p>}
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

                  {formErrors.sectionId && <p className="mt-1 text-sm text-red-500">{formErrors.sectionId}</p>}
                </Field>

                <Field>
                  <Label>Teacher</Label>

                  <Select
                    value={teacherId}
                    onValueChange={(value) => {
                      setTeacherId(value);

                      setFormErrors((p) => ({
                        ...p,
                        teacherId: "",
                      }));
                    }}
                  >
                    <SelectTrigger className="mt-2 h-11 w-full">
                      <SelectValue placeholder="Select Teacher" />
                    </SelectTrigger>

                    <SelectContent>
                      {teachers.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {formErrors.teacherId && <p className="mt-1 text-sm text-red-500">{formErrors.teacherId}</p>}
                </Field>
              </FieldGroup>

              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </DialogClose>

                <Button type="submit" disabled={loading} className="min-w-32">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 size-4" />
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
        <div className="hidden md:flex md:flex-wrap md:items-center md:gap-2">
          <div className="flex shrink-0 items-center gap-1.5 mr-1">
            <SlidersHorizontal className="size-3.5 text-muted-foreground" />

            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filters</span>

            {pendingFilterCount > 0 && <span className="flex size-4 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">{pendingFilterCount}</span>}
          </div>

          <div className="relative w-64">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input placeholder="Search teacher..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-10" />
          </div>

          <div className="flex items-center gap-2 flex-1">
            <Select
              value={classFilter}
              onValueChange={(value) => {
                setClassFilter(value);
                setSectionFilter("all");
              }}
            >
              <SelectTrigger className="h-10 w-40">
                <SelectValue placeholder="Class" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Class</SelectItem>

                {classes.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sectionFilter} onValueChange={setSectionFilter} disabled={classFilter === "all"}>
              <SelectTrigger className="h-10 w-40">
                <SelectValue placeholder="Section" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Section</SelectItem>

                {filteredSections.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sessionFilter} onValueChange={setSessionFilter}>
              <SelectTrigger className="h-10 w-40">
                <SelectValue placeholder="Session" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Session</SelectItem>

                {sessions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={applyFilters} disabled={!filtersChanged} className="ml-auto h-10 min-w-28 px-6 font-medium shadow-sm">
            Apply Filters
          </Button>
        </div>

        {/* Mobile */}
        <div className="space-y-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex shrink-0 items-center gap-1.5">
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />

              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filters</span>

              {pendingFilterCount > 0 && <span className="flex size-4 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">{pendingFilterCount}</span>}
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />

              <Input placeholder="Search teacher..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-9" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              value={classFilter}
              onValueChange={(value) => {
                setClassFilter(value);
                setSectionFilter("all");
              }}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Class" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Class</SelectItem>

                {classes.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sectionFilter} onValueChange={setSectionFilter} disabled={classFilter === "all"}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Section" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Section</SelectItem>

                {filteredSections.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sessionFilter} onValueChange={setSessionFilter}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Session" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Session</SelectItem>

                {sessions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={applyFilters} disabled={!filtersChanged} className="h-10 w-full">
            Apply Filters
          </Button>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 text-xs text-muted-foreground md:w-auto">Active filters:</span>

            {appliedFilters.class !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                Class: {classes.find((c) => c.id === appliedFilters.class)?.name}
                <button
                  onClick={() => {
                    setClassFilter("all");
                    setSectionFilter("all");
                    setAppliedFilters((p) => ({
                      ...p,
                      class: "all",
                      section: "all",
                    }));
                  }}
                >
                  <X className="size-3" />
                </button>
              </span>
            )}

            {appliedFilters.section !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                Section: {sections.find((s) => s.id === appliedFilters.section)?.name}
                <button
                  onClick={() => {
                    setSectionFilter("all");

                    setAppliedFilters((p) => ({
                      ...p,
                      section: "all",
                    }));
                  }}
                >
                  <X className="size-3" />
                </button>
              </span>
            )}

            {appliedFilters.session !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                Session: {sessions.find((s) => s.id === appliedFilters.session)?.name}
                <button
                  onClick={() => {
                    setSessionFilter("all");

                    setAppliedFilters((p) => ({
                      ...p,
                      session: "all",
                    }));
                  }}
                >
                  <X className="size-3" />
                </button>
              </span>
            )}

            <button onClick={clearFilters} className="ml-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline">
              Clear all
            </button>
          </div>
        )}
        {loading && teacherAssignments.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Inbox className="size-6" />
            </div>

            <h3 className="text-lg font-semibold">{teacherAssignments.length === 0 ? "No class teacher assignments created yet." : "No class teacher assignments found."}</h3>

            <p className="mt-2 text-muted-foreground">{teacherAssignments.length === 0 ? "Assign your first class teacher." : "Try adjusting your search or filters."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-muted/15 border-b border-border/60">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pl-6 text-foreground/80 w-52">Teacher</TableHead>
                  <TableHead className="hidden md:table-cell w-36 font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Session</TableHead>
                  <TableHead className="hidden md:table-cell w-36 font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Class</TableHead>
                  <TableHead className="hidden md:table-cell w-36 font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Section</TableHead>
                  <TableHead className="hidden md:table-cell w-60 font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Created At</TableHead>
                  <TableHead className="w-16 font-bold text-xs uppercase tracking-wider py-4 pr-4 text-right text-foreground/80">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-border/30">
                {filteredAssignments.map((allocation) => (
                  <TableRow key={allocation.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="py-4 pl-6">
                      <div className="space-y-1 max-w-45">
                        <p className="font-semibold text-foreground text-base leading-tight hover:text-primary transition-colors" title={allocation.teacher.name}>
                          {allocation.teacher.name.length > 18 ? `${allocation.teacher.name.slice(0, 18)}...` : allocation.teacher.name}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell">{allocation.session.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{allocation.class.name}</TableCell>

                    <TableCell className="hidden md:table-cell">{allocation.section.name}</TableCell>

                    <TableCell className="hidden md:table-cell py-4 text-xs font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-5 text-muted-foreground/80" />
                        <span className="text-sm">
                          {new Date(allocation.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="w-16 py-4 pr-4 text-right align-top">
                      <div className="hidden md:flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-10 rounded-lg text-muted-foreground hover:bg-blue-300/10 hover:text-blue-700 transition-all" onClick={() => openEditDialog(allocation)}>
                          <Pencil className="size-5" />
                        </Button>

                        <Button variant="ghost" size="icon" className="size-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all" onClick={() => openDeleteDialog(allocation)}>
                          <Trash2 className="size-5" />
                        </Button>
                      </div>

                      <div className="md:hidden flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-9">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(allocation)}>
                              <Pencil className="mr-2 size-4" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => openDeleteDialog(allocation)} className="text-destructive">
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
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);

          if (!open) {
            setEditingAssignment(null);
            setFormErrors({});
          }
        }}
      >
        <DialogContent className="sm:max-w-125 p-0 overflow-hidden">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pencil className="size-5 text-primary" />
              </div>

              <div>
                <DialogTitle>Edit Class Teacher Assignment</DialogTitle>

                <DialogDescription>Update class teacher assignment details.</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6 p-6">
            <FieldGroup>
              <Field>
                <Label>Academic Session</Label>

                <Select
                  value={editSessionId}
                  onValueChange={(value) => {
                    setEditSessionId(value);
                    setFormErrors((prev) => ({
                      ...prev,
                      sessionId: "",
                    }));
                  }}
                >
                  <SelectTrigger className="mt-2 h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {sessions.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.sessionId && <p className="mt-1 text-sm text-red-500">{formErrors.sessionId}</p>}
              </Field>

              <Field>
                <Label>Class</Label>

                <Select
                  value={editClassId}
                  onValueChange={(value) => {
                    setEditClassId(value);
                    setFormErrors((prev) => ({
                      ...prev,
                      classId: "",
                    }));
                  }}
                >
                  <SelectTrigger className="mt-2 h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {classes.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.classId && <p className="mt-1 text-sm text-red-500">{formErrors.classId}</p>}
              </Field>

              <Field>
                <Label>Section</Label>

                <Select
                  value={editSectionId}
                  onValueChange={(value) => {
                    setEditSectionId(value);
                    setFormErrors((prev) => ({
                      ...prev,
                      sectionId: "",
                    }));
                  }}
                >
                  <SelectTrigger className="mt-2 h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {sections.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.sectionId && <p className="mt-1 text-sm text-red-500">{formErrors.sectionId}</p>}
              </Field>

              <Field>
                <Label>Teacher</Label>

                <Select
                  value={editTeacherId}
                  onValueChange={(value) => {
                    setEditTeacherId(value);
                    setFormErrors((prev) => ({
                      ...prev,
                      teacherId: "",
                    }));
                  }}
                >
                  <SelectTrigger className="mt-2 h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {teachers.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.teacherId && <p className="mt-1 text-sm text-red-500">{formErrors.teacherId}</p>}
              </Field>
            </FieldGroup>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>

              <Button type="submit" disabled={loading || !hasEditChanges} className="min-w-32">
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

            <AlertDialogTitle className="w-full text-center text-xl">Delete Class Teacher Assignment?</AlertDialogTitle>

            <AlertDialogDescription className="text-center">
              This action cannot be undone. This will permanently remove the class teacher assignment for{" "}
              <span className="font-semibold text-foreground">
                {deletingAssignment && (`${deletingAssignment.teacher.name}`.length > 10 ? `${deletingAssignment.teacher.name.slice(0, 10)}...` : deletingAssignment.teacher.name)}
              </span>{" "}
              from <span className="font-semibold text-foreground">{deletingAssignment?.class.name}</span>
              {" - "}
              <span className="font-semibold text-foreground">{deletingAssignment?.section.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>

            <AlertDialogAction onClick={handleDelete} className="h-11 bg-destructive text-white hover:bg-destructive/90">
              <>
                <Trash2 className="mr-2 size-4" />
                Delete assignment
              </>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
