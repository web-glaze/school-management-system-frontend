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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar, GraduationCap, Inbox, Loader2, MoreVertical, Pencil, Plus, Search, SlidersHorizontal, Trash2, X, ChevronDown, Check } from "lucide-react";
import { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAcademicStore, StudentSubjectAllocation } from "@/store/academicStore";
import { usePermission } from "@/hooks/usePermission";

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};

export default function StudentSubjectAllocationPage() {
  const {
    loading,

    sessions,
    classes,
    sections,
    subjects,
    students,
    subjectAllocations,
    studentSubjectAllocations,

    fetchSessions,
    fetchClasses,
    fetchSections,
    fetchSubjects,
    fetchStudents,
    fetchSubjectAllocations,
    fetchStudentSubjectAllocations,

    createStudentSubjectAllocation,
    updateStudentSubjectAllocation,
    deleteStudentSubjectAllocation,
  } = useAcademicStore();

  const authorized = usePermission("student-subject-allocation.read");

  const [search, setSearch] = useState("");

  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({
    class: "all",
    section: "all",
    session: "all",
    subject: "all",
  });

  const [studentId, setStudentId] = useState("");
  const [subjectAllocationId, setSubjectAllocationId] = useState("");

  const [editStudentId, setEditStudentId] = useState("");
  const [editSubjectAllocationId, setEditSubjectAllocationId] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [studentOpen, setStudentOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [editingAllocation, setEditingAllocation] = useState<StudentSubjectAllocation | null>(null);

  const [deletingAllocation, setDeletingAllocation] = useState<StudentSubjectAllocation | null>(null);

  const resetForm = () => {
    setStudentId("");
    setSubjectAllocationId("");
    setFormErrors({});
  };

  const studentName = (s: { firstName: string; lastName: string }) => `${s.firstName} ${s.lastName}`;

  const allocationLabel = (a: (typeof subjectAllocations)[number]) => `${a.subject.name} • ${a.class.name} ${a.section.name} • ${a.teacher.name} (${a.session.name})`;

  const filteredSections = useMemo(() => {
    if (classFilter === "all") return sections;

    return sections.filter((section) => studentSubjectAllocations.some((allocation) => allocation.subjectAllocation.class.id === classFilter && allocation.subjectAllocation.section.id === section.id));
  }, [classFilter, sections, studentSubjectAllocations]);

  const filteredAllocations = studentSubjectAllocations.filter((item) => {
    const matchesSearch = studentName(item.student).toLowerCase().includes(search.toLowerCase()) || item.subjectAllocation.subject.name.toLowerCase().includes(search.toLowerCase());

    const matchesClass = appliedFilters.class === "all" || item.subjectAllocation.class.id === appliedFilters.class;
    const matchesSection = appliedFilters.section === "all" || item.subjectAllocation.section.id === appliedFilters.section;
    const matchesSession = appliedFilters.session === "all" || item.subjectAllocation.session.id === appliedFilters.session;
    const matchesSubject = appliedFilters.subject === "all" || item.subjectAllocation.subject.id === appliedFilters.subject;

    return matchesSearch && matchesClass && matchesSection && matchesSession && matchesSubject;
  });

  useEffect(() => {
    fetchSessions();
    fetchClasses();
    fetchSections();
    fetchSubjects();
    fetchStudents();
    fetchSubjectAllocations();
    fetchStudentSubjectAllocations();
  }, [fetchSessions, fetchClasses, fetchSections, fetchSubjects, fetchStudents, fetchSubjectAllocations, fetchStudentSubjectAllocations]);

  if (authorized === null) {
    return null;
  }

  const hasActiveFilters = appliedFilters.class !== "all" || appliedFilters.section !== "all" || appliedFilters.session !== "all" || appliedFilters.subject !== "all";

  const filtersChanged = classFilter !== appliedFilters.class || sectionFilter !== appliedFilters.section || sessionFilter !== appliedFilters.session || subjectFilter !== appliedFilters.subject;

  const pendingFilterCount = [classFilter !== "all", sectionFilter !== "all", sessionFilter !== "all", subjectFilter !== "all"].filter(Boolean).length;

  function applyFilters() {
    setAppliedFilters({
      class: classFilter,
      section: sectionFilter,
      session: sessionFilter,
      subject: subjectFilter,
    });
  }

  function clearFilters() {
    setClassFilter("all");
    setSectionFilter("all");
    setSessionFilter("all");
    setSubjectFilter("all");

    setAppliedFilters({
      class: "all",
      section: "all",
      session: "all",
      subject: "all",
    });
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createStudentSubjectAllocation({
        studentId,
        subjectAllocationId,
      });

      toast.success("Student subject allocation created successfully");

      resetForm();
      setAddOpen(false);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
        return;
      }
      toast.error(err.response?.data?.message || "Failed to create student subject allocation");
    }
  };

  const openEditDialog = (allocation: StudentSubjectAllocation) => {
    setEditStudentId(allocation.student.id);
    setEditSubjectAllocationId(allocation.subjectAllocation.id);

    setEditingAllocation(allocation);
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingAllocation) return;

    try {
      await updateStudentSubjectAllocation(editingAllocation.id, {
        studentId: editStudentId,
        subjectAllocationId: editSubjectAllocationId,
      });

      toast.success("Student subject allocation updated successfully");

      setEditOpen(false);
      setEditingAllocation(null);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
        return;
      }
      toast.error(err.response?.data?.message || "Failed to update student subject allocation");
    }
  };

  const openDeleteDialog = (allocation: StudentSubjectAllocation) => {
    setDeletingAllocation(allocation);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingAllocation) return;

    try {
      await deleteStudentSubjectAllocation(deletingAllocation.id);

      toast.success("Student subject allocation deleted successfully");

      setDeleteOpen(false);
      setDeletingAllocation(null);
    } catch {
      toast.error("Failed to delete student subject allocation");
    }
  };

  const hasEditChanges = editingAllocation && (editStudentId !== editingAllocation.student.id || editSubjectAllocationId !== editingAllocation.subjectAllocation.id);

  return (
    <DashboardLayout>
      <div className="flex md:flex-row flex-col md:items-center items-start justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Subject Allocations</h1>

          <p className="text-muted-foreground">Manage student subject allocations</p>
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
              New Allocation
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-125 p-0 overflow-hidden">
            <div className="border-b px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="size-5 text-primary" />
                </div>

                <div>
                  <DialogTitle>Create Student Subject Allocation</DialogTitle>

                  <DialogDescription>Assign a student to a subject allocation.</DialogDescription>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-6 p-6">
              <FieldGroup>
                <Field>
                  <Label>Student</Label>

                  <Popover open={studentOpen} onOpenChange={setStudentOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" role="combobox" aria-expanded={studentOpen} className="h-11 w-full justify-between font-normal">
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
                                  const selected = students.find((s) => `${s.firstName} ${s.lastName} ${s.admissionNo}`.toLowerCase() === currentValue.toLowerCase());

                                  if (!selected) return;

                                  setStudentId(selected.id);

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

                  {formErrors.studentId && <p className="mt-1 text-sm text-red-500">{formErrors.studentId}</p>}
                </Field>

                <Field>
                  <Label>Subject Allocation</Label>

                  <Select
                    value={subjectAllocationId}
                    onValueChange={(value) => {
                      setSubjectAllocationId(value);

                      setFormErrors((p) => ({
                        ...p,
                        subjectAllocationId: "",
                      }));
                    }}
                  >
                    <SelectTrigger className=" h-11 w-full">
                      <SelectValue placeholder="Select Subject Allocation" />
                    </SelectTrigger>

                    <SelectContent>
                      {subjectAllocations.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {allocationLabel(item)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {formErrors.subjectAllocationId && <p className="mt-1 text-sm text-red-500">{formErrors.subjectAllocationId}</p>}
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

            <Input placeholder="Search student or subject..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-10" />
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

            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="h-10 w-40">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Subject</SelectItem>

                {subjects.map((item) => (
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

              <Input placeholder="Search student or subject..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-9" />
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

            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Subject</SelectItem>

                {subjects.map((item) => (
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

            {appliedFilters.subject !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                Subject: {subjects.find((s) => s.id === appliedFilters.subject)?.name}
                <button
                  onClick={() => {
                    setSubjectFilter("all");

                    setAppliedFilters((p) => ({
                      ...p,
                      subject: "all",
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
        {loading && studentSubjectAllocations.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredAllocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Inbox className="size-6" />
            </div>

            <h3 className="text-lg font-semibold">{studentSubjectAllocations.length === 0 ? "No student subject allocations created yet." : "No student subject allocations found."}</h3>

            <p className=" text-muted-foreground">{studentSubjectAllocations.length === 0 ? "Create your first student subject allocation." : "Try adjusting your search or filters."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-muted/15 border-b border-border/60">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pl-6 text-foreground/80 min-w-45">Student</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 w-20 sm:w-50">Subject</TableHead>
                  <TableHead className="hidden md:table-cell w-36 font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Teacher</TableHead>
                  <TableHead className="hidden md:table-cell w-36 font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Session</TableHead>
                  <TableHead className="hidden md:table-cell w-36 font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Class</TableHead>
                  <TableHead className="hidden md:table-cell w-36 font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Section</TableHead>
                  <TableHead className="hidden md:table-cell w-60 font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Created At</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pr-4 sm:pr-6 text-foreground/80 text-right w-14 md:w-24 sticky right-0 bg-gray-50 dark:bg-muted/15 shadow-lg md:shadow-none border-l border-border/40 md:border-l-0">
                    <span className="md:block">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-border/30">
                {filteredAllocations.map((allocation) => (
                  <TableRow key={allocation.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="py-4 align-middle">
                        <div className="space-y-1 min-w-0 max-w-35 sm:max-w-55 md:max-w-45">
                          <p className="font-semibold text-foreground text-base leading-tight truncate hover:text-primary transition-colors" title={`${studentName(allocation.student)}`}>
                            {`${studentName(allocation.student)}`}
                          </p>

                          <p className="text-sm text-foreground/50 truncate">{allocation.student.admissionNo}</p>
                        </div>
                      </TableCell>
                    <TableCell className=" md:table-cell">{allocation.subjectAllocation.subject.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{allocation.subjectAllocation.teacher.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{allocation.subjectAllocation.session.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{allocation.subjectAllocation.class.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{allocation.subjectAllocation.section.name}</TableCell>
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

                    <TableCell className="py-4 pr-4 sm:pr-6 text-right align-middle w-14 md:w-24 bg-card sticky right-0 shadow-lg md:shadow-none border-l border-border/40 md:border-l-0">
                      <div className="hidden md:flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-10 rounded-lg text-muted-foreground hover:bg-blue-300/10 hover:text-blue-700 transition-all"
                          title="Edit section"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => openEditDialog(allocation)}
                        >
                          <Pencil className="size-5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                          title="Delete section"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => openDeleteDialog(allocation)}
                        >
                          <Trash2 className="size-5" />
                        </Button>
                      </div>

                      <div className="md:hidden flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-9" onPointerDown={(e) => e.stopPropagation()}>
                              <MoreVertical className="size-5" />
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
            setEditingAllocation(null);
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
                <DialogTitle>Edit Student Subject Allocation</DialogTitle>

                <DialogDescription>Update student subject allocation details.</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6 p-6">
            <FieldGroup>
              <Field>
                <Label>Student</Label>

                <Select
                  value={editStudentId}
                  onValueChange={(value) => {
                    setEditStudentId(value);
                    setFormErrors((prev) => ({
                      ...prev,
                      studentId: "",
                    }));
                  }}
                >
                  <SelectTrigger className=" h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {students.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {studentName(item)} ({item.admissionNo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.studentId && <p className="mt-1 text-sm text-red-500">{formErrors.studentId}</p>}
              </Field>

              <Field>
                <Label>Subject Allocation</Label>

                <Select
                  value={editSubjectAllocationId}
                  onValueChange={(value) => {
                    setEditSubjectAllocationId(value);
                    setFormErrors((prev) => ({
                      ...prev,
                      subjectAllocationId: "",
                    }));
                  }}
                >
                  <SelectTrigger className=" h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {subjectAllocations.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {allocationLabel(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.subjectAllocationId && <p className="mt-1 text-sm text-red-500">{formErrors.subjectAllocationId}</p>}
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

            <AlertDialogTitle className="w-full text-center text-xl">Delete Student Subject Allocation?</AlertDialogTitle>

            <AlertDialogDescription className="text-center">
              This action cannot be undone. This will permanently remove{" "}
              <span className="inline-block max-w-60 truncate align-bottom font-semibold text-foreground">{deletingAllocation && `${studentName(deletingAllocation.student)}`}</span> in{" "}
              <span className="inline-block max-w-60 truncate align-bottom font-semibold text-foreground">{deletingAllocation && `${deletingAllocation.subjectAllocation.subject.name}`}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>

            <AlertDialogAction onClick={handleDelete} className="h-11 bg-destructive text-white hover:bg-destructive/90">
              <>
                <Trash2 className="mr-2 size-4" />
                Delete allocation
              </>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}