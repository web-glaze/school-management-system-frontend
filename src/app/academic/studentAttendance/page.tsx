"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup } from "@/components/ui/field";
import {
  Calendar as CalendarIcon,
  CalendarCheck,
  Check,
  ChevronDown,
  CircleCheck,
  ClipboardList,
  Inbox,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
  MessageSquare,
  X,
} from "lucide-react";
import { useAcademicStore, StudentAttendance } from "@/store/academicStore";
import { usePermission } from "@/hooks/usePermission";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "LEAVE";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "LATE", label: "Late" },
  { value: "LEAVE", label: "Leave" },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function toDateInputValue(value: string) {
  return value ? value.slice(0, 10) : "";
}

function statusBadgeClass(status: AttendanceStatus) {
  switch (status) {
    case "PRESENT":
      return "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400";
    case "ABSENT":
      return "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400";
    case "LATE":
      return "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
    case "LEAVE":
      return "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400";
  }
}

function statusToggleClass(status: AttendanceStatus) {
  switch (status) {
    case "PRESENT":
      return "bg-green-600 border-green-600 text-white hover:bg-green-600";
    case "ABSENT":
      return "bg-red-600 border-red-600 text-white hover:bg-red-600";
    case "LATE":
      return "bg-amber-500 border-amber-500 text-white hover:bg-amber-500";
    case "LEAVE":
      return "bg-blue-600 border-blue-600 text-white hover:bg-blue-600";
  }
}

export default function StudentAttendancePage() {
  const {
    loading,

    sessions,
    classes,
    sections,
    studentEnrollments,
    studentAttendances,

    fetchSessions,
    fetchClasses,
    fetchSections,
    fetchStudentEnrollments,
    fetchStudentAttendances,

    createStudentAttendance,
    updateStudentAttendance,
    deleteStudentAttendance,
  } = useAcademicStore();

  const authorized = usePermission("student-attendance.read");

  const [viewMode, setViewMode] = useState<"mark" | "records">("mark");

  const [regSessionId, setRegSessionId] = useState("");
  const [regClassId, setRegClassId] = useState("");
  const [regSectionId, setRegSectionId] = useState("");
  const [regDate, setRegDate] = useState(todayStr());
  const [registerLoaded, setRegisterLoaded] = useState(false);
  const [registerSearch, setRegisterSearch] = useState("");
  const [markings, setMarkings] = useState<
    Record<
      string,
      {
        status: AttendanceStatus;
        remarks: string;
      }
    >
  >({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    class: "all",
    section: "all",
    session: "all",
    status: "all",
    date: "",
  });
  const [addOpen, setAddOpen] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [addDate, setAddDate] = useState(todayStr());
  const [addStatus, setAddStatus] = useState<AttendanceStatus>("PRESENT");
  const [addRemarks, setAddRemarks] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<StudentAttendance | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editStatus, setEditStatus] = useState<AttendanceStatus>("PRESENT");
  const [editRemarks, setEditRemarks] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAttendance, setDeletingAttendance] = useState<StudentAttendance | null>(null);
  const [regDateOpen, setRegDateOpen] = useState(false);
  const [addDateOpen, setAddDateOpen] = useState(false);
  const [editDateOpen, setEditDateOpen] = useState(false);
  const [desktopFilterDateOpen, setDesktopFilterDateOpen] = useState(false);
  const [mobileFilterDateOpen, setMobileFilterDateOpen] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchClasses();
    fetchSections();
    fetchStudentEnrollments();
    fetchStudentAttendances();
  }, []);

  const activeEnrollments = useMemo(() => studentEnrollments.filter((e) => e.enrollmentStatus === "ACTIVE"), [studentEnrollments]);

  const regFilteredSections = useMemo(() => {
    if (regClassId === "all" || !regClassId) return sections;
    return sections.filter((section) => studentEnrollments.some((e) => e.class.id === regClassId && e.section.id === section.id));
  }, [regClassId, sections, studentEnrollments]);

  const filteredSections = useMemo(() => {
    if (classFilter === "all") return sections;
    return sections.filter((section) => studentEnrollments.some((e) => e.class.id === classFilter && e.section.id === section.id));
  }, [classFilter, sections, studentEnrollments]);

  const registerStudents = useMemo(() => {
    if (!regSessionId || !regClassId || !regSectionId) return [];

    return activeEnrollments
      .filter((e) => e.session.id === regSessionId && e.class.id === regClassId && e.section.id === regSectionId)
      .sort((a, b) => `${a.student.firstName} ${a.student.lastName}`.localeCompare(`${b.student.firstName} ${b.student.lastName}`));
  }, [activeEnrollments, regSessionId, regClassId, regSectionId]);

  const existingForDate = useMemo(() => {
    const map: Record<
      string,
      {
        id: string;
        status: AttendanceStatus;
        remarks: string;
      }
    > = {};

    studentAttendances.forEach((a) => {
      if (toDateInputValue(a.date) === regDate) {
        map[a.enrollmentId] = {
          id: a.id,
          status: a.status,
          remarks: a.remarks ?? "",
        };
      }
    });

    return map;
  }, [studentAttendances, regDate]);

  const registerSearchedStudents = registerStudents.filter((e) => {
    const name = `${e.student.firstName} ${e.student.lastName}`.toLowerCase();
    return name.includes(registerSearch.toLowerCase()) || e.student.admissionNo.toLowerCase().includes(registerSearch.toLowerCase());
  });

  const registerStats = useMemo(() => {
    const stats = { total: registerStudents.length, PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 };

    registerStudents.forEach((e) => {
      const status = markings[e.id]?.status;
      if (status) stats[status] += 1;
    });

    return stats;
  }, [registerStudents, markings]);

  // const hasUnsavedChanges = registerStudents.some((e) => {
  //   const current = markings[e.id];
  //   const saved = existingForDate[e.id]?.status ?? "PRESENT";                   if, to disable the save button for future

  //   return current !== saved;
  // });

  function seedMarkings() {
    const seeded: Record<
      string,
      {
        status: AttendanceStatus;
        remarks: string;
      }
    > = {};

    registerStudents.forEach((e) => {
      seeded[e.id] = {
        status: existingForDate[e.id]?.status ?? "PRESENT",
        remarks: existingForDate[e.id]?.remarks ?? "",
      };
    });

    setMarkings(seeded);
  }

  function handleLoadRegister() {
    if (!regSessionId || !regClassId || !regSectionId) {
      toast.error("Please select session, class and section");
      return;
    }

    seedMarkings();
    setRegisterLoaded(true);
  }

  function handleDateChange(value: string) {
    setRegDate(value);

    if (registerLoaded) {
      const seeded: Record<
        string,
        {
          status: AttendanceStatus;
          remarks: string;
        }
      > = {};

      registerStudents.forEach((e) => {
        const existing = studentAttendances.find((a) => a.enrollmentId === e.id && toDateInputValue(a.date) === value);
        seeded[e.id] = {
          status: existing?.status ?? "PRESENT",
          remarks: existing?.remarks ?? "",
        };
      });

      setMarkings(seeded);
    }
  }

  function setStudentStatus(id: string, status: AttendanceStatus) {
    setMarkings((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? { remarks: "" }),
        status,
      },
    }));
  }

  function markAllAs(status: AttendanceStatus) {
    const updated: Record<
      string,
      {
        status: AttendanceStatus;
        remarks: string;
      }
    > = { ...markings };
    registerStudents.forEach((e) => {
      updated[e.id] = {
        ...(updated[e.id] ?? { remarks: "" }),
        status,
      };
    });
    setMarkings(updated);
  }

  function resetToSaved() {
    seedMarkings();
    toast.info("Reverted to saved attendance");
  }

  async function handleSaveRegister() {
    setSaving(true);

    try {
      const ops = registerStudents
        .map((e) => {
          const status = markings[e.id]?.status;
          const remarks = markings[e.id]?.remarks ?? "";
          if (!status) return null;

          const existing = existingForDate[e.id];

          if (existing) {
            if (existing.status === status) return null;
            return updateStudentAttendance(existing.id, {
              attendanceDate: regDate,
              status,
              remarks,
            });
          }

          return createStudentAttendance({
            enrollmentId: e.id,
            attendanceDate: regDate,
            status,
            remarks,
          });
        })
        .filter(Boolean) as Promise<void>[];

      if (ops.length === 0) {
        toast.info("No changes to save");
        setSaving(false);
        return;
      }

      await Promise.all(ops);

      toast.success("Attendance saved successfully");
    } catch (error) {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  }

  const filteredAttendances = studentAttendances
    .filter((item) => {
      const studentName = `${item.enrollment.student.firstName} ${item.enrollment.student.lastName}`.toLowerCase();

      const matchesSearch = studentName.includes(search.toLowerCase()) || item.enrollment.student.admissionNo.toLowerCase().includes(search.toLowerCase());

      const matchesClass = appliedFilters.class === "all" || item.enrollment.class.id === appliedFilters.class;
      const matchesSection = appliedFilters.section === "all" || item.enrollment.section.id === appliedFilters.section;
      const matchesSession = appliedFilters.session === "all" || item.enrollment.session.id === appliedFilters.session;
      const matchesStatus = appliedFilters.status === "all" || item.status === appliedFilters.status;
      const matchesDate = !appliedFilters.date || toDateInputValue(item.date) === appliedFilters.date;

      return matchesSearch && matchesClass && matchesSection && matchesSession && matchesStatus && matchesDate;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const hasActiveFilters = appliedFilters.class !== "all" || appliedFilters.section !== "all" || appliedFilters.session !== "all" || appliedFilters.status !== "all" || appliedFilters.date !== "";

  const filtersChanged =
    classFilter !== appliedFilters.class || sectionFilter !== appliedFilters.section || sessionFilter !== appliedFilters.session || statusFilter !== appliedFilters.status || dateFilter !== appliedFilters.date;

  const pendingFilterCount = [classFilter !== "all", sectionFilter !== "all", sessionFilter !== "all", statusFilter !== "all", dateFilter !== ""].filter(Boolean).length;

  function applyFilters() {
    setAppliedFilters({
      class: classFilter,
      section: sectionFilter,
      session: sessionFilter,
      status: statusFilter,
      date: dateFilter,
    });
  }

  function clearFilters() {
    setClassFilter("all");
    setSectionFilter("all");
    setSessionFilter("all");
    setStatusFilter("all");
    setDateFilter("");

    setAppliedFilters({
      class: "all",
      section: "all",
      session: "all",
      status: "all",
      date: "",
    });
  }

  if (authorized === null) {
    return null;
  }

  const resetAddForm = () => {
    setEnrollmentId("");
    setAddDate(todayStr());
    setAddStatus("PRESENT");
    setAddRemarks("");
    setFormErrors({});
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createStudentAttendance({
        enrollmentId,
        attendanceDate: addDate,
        status: addStatus,
        remarks: addRemarks,
      });

      toast.success("Attendance marked successfully");

      resetAddForm();
      setAddOpen(false);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
        toast.error(Object.values(err.response.data.errors)[0]);
        return;
      }

      toast.error(err.response?.data?.message || "Failed to mark attendance");
    }
  };

  const openEditDialog = (attendance: StudentAttendance) => {
    setEditDate(toDateInputValue(attendance.date));
    setEditStatus(attendance.status);
    setEditRemarks(attendance.remarks ?? "");
    setEditingAttendance(attendance);
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingAttendance) return;

    try {
      await updateStudentAttendance(editingAttendance.id, {
        attendanceDate: editDate,
        status: editStatus,
        remarks: editRemarks,
      });

      toast.success("Attendance updated successfully");

      setEditOpen(false);
      setEditingAttendance(null);
    } catch {
      toast.error("Failed to update attendance");
    }
  };

  const openDeleteDialog = (attendance: StudentAttendance) => {
    setDeletingAttendance(attendance);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingAttendance) return;

    try {
      await deleteStudentAttendance(deletingAttendance.id);

      toast.success("Attendance record deleted");

      setDeleteOpen(false);
      setDeletingAttendance(null);
    } catch {
      toast.error("Failed to delete attendance record");
    }
  };

  const hasEditChanges = editingAttendance && (editDate !== toDateInputValue(editingAttendance.date) || editStatus !== editingAttendance.status || editRemarks !== (editingAttendance.remarks ?? ""));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 mb-6 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Student Attendance</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Mark and manage daily student attendance</p>
            </div>

            {/* Desktop controls */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="inline-flex rounded-lg border p-1 bg-muted/40">
                <button
                  onClick={() => setViewMode("mark")}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    viewMode === "mark" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ClipboardList className="size-4" />
                  Mark Attendance
                </button>

                <button
                  onClick={() => setViewMode("records")}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    viewMode === "records" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <CalendarCheck className="size-4" />
                  Records
                </button>
              </div>

              <Button className="gap-2 px-5" onClick={() => setAddOpen(true)}>
                <Plus className="size-4" />
                Add Entry
              </Button>
            </div>
          </div>

          {/* Mobile controls */}
          <div className="flex sm:hidden items-center gap-2">
            <div className="flex flex-1 rounded-lg border p-1 bg-muted/40">
              <button
                onClick={() => setViewMode("mark")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 rounded-md text-xs font-medium transition-colors truncate",
                  viewMode === "mark" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                <ClipboardList className="size-4 shrink-0" />
                Mark
              </button>

              <button
                onClick={() => setViewMode("records")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 rounded-md text-xs font-medium transition-colors truncate",
                  viewMode === "records" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                <CalendarCheck className="size-4 shrink-0" />
                Records
              </button>
            </div>

            <Button size="icon" className="size-10 shrink-0" onClick={() => setAddOpen(true)} aria-label="Add Entry">
              <Plus className="size-5" />
            </Button>
          </div>

          <Dialog
            open={addOpen}
            onOpenChange={(open) => {
              setAddOpen(open);
              if (!open) resetAddForm();
            }}
          >
              <DialogContent className="sm:max-w-125 p-0 overflow-hidden">
                <div className="border-b px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ClipboardList className="size-5 text-primary" />
                    </div>

                    <div>
                      <DialogTitle className="text-lg">Add Attendance Entry</DialogTitle>
                      <DialogDescription>Mark attendance for a single student.</DialogDescription>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCreate} className="space-y-6 p-6">
                  <FieldGroup>
                    <Field>
                      <Label>Student</Label>

                      <Popover open={enrollmentOpen} onOpenChange={setEnrollmentOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" role="combobox" aria-expanded={enrollmentOpen} className=" h-11 w-full justify-between font-normal">
                            {enrollmentId
                              ? (() => {
                                  const enrollment = activeEnrollments.find((e) => e.id === enrollmentId);
                                  return enrollment ? `${enrollment.student.admissionNo} - ${enrollment.student.firstName} ${enrollment.student.lastName}` : "Select Student";
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
                                {activeEnrollments.map((enrollment) => (
                                  <CommandItem
                                    key={enrollment.id}
                                    value={`${enrollment.student.firstName} ${enrollment.student.lastName} ${enrollment.student.admissionNo}`}
                                    onSelect={(currentValue) => {
                                      const selected = activeEnrollments.find((e) => `${e.student.firstName} ${e.student.lastName} ${e.student.admissionNo}`.toLowerCase() === currentValue.toLowerCase());

                                      if (!selected) return;

                                      setEnrollmentId(selected.id);
                                      setFormErrors((p) => ({ ...p, enrollmentId: "" }));
                                      setEnrollmentOpen(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 size-4", enrollmentId === enrollment.id ? "opacity-100" : "opacity-0")} />

                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {enrollment.student.firstName} {enrollment.student.lastName}
                                      </span>

                                      <span className="text-xs text-muted-foreground">
                                        {enrollment.student.admissionNo} • {enrollment.class.name} {enrollment.section.name}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {formErrors.enrollmentId && <p className="text-sm text-red-500 mt-1">{formErrors.enrollmentId}</p>}
                    </Field>

                    <Field>
                      <Label>Date</Label>

                      <Popover open={addDateOpen} onOpenChange={setAddDateOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" className={cn(" h-11 w-full justify-start text-left font-normal", !addDate && "text-muted-foreground", formErrors.date && "border-red-500")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {addDate ? format(new Date(addDate), "dd MMM yyyy") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                          <Calendar
                            mode="single"
                            selected={addDate ? new Date(addDate) : undefined}
                            onSelect={(date) => {
                              if (!date) return;
                              setAddDate(format(date, "yyyy-MM-dd"));
                              setFormErrors((p) => ({ ...p, date: "" }));
                              setAddDateOpen(false);
                            }}
                          />
                        </PopoverContent>
                      </Popover>

                      {formErrors.date && <p className="text-sm text-red-500 mt-1">{formErrors.date}</p>}
                    </Field>

                    <Field>
                      <Label>Status</Label>

                      <Select value={addStatus} onValueChange={(value) => setAddStatus(value as AttendanceStatus)}>
                        <SelectTrigger className="h-11 w-full">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>

                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {formErrors.status && <p className="text-sm text-red-500 mt-1">{formErrors.status}</p>}
                    </Field>

                    <Field className="md:col-span-3">
                      <Label>Remarks</Label>

                      <Input value={addRemarks} onChange={(e) => setAddRemarks(e.target.value)} placeholder="Optional remarks" className="h-11" />
                    </Field>
                  </FieldGroup>

                  <DialogFooter className="gap-2">
                    <DialogClose asChild>
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>
                    </DialogClose>

                    <Button type="submit" disabled={loading || !enrollmentId} className="min-w-32.5">
                      {loading ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Plus className="size-4 mr-2" />
                          Add
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
          </Dialog>
        </div>

        {viewMode === "mark" ? (
          <div className="space-y-6">
            <div className="bg-card rounded-md border p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Select Register</span>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <Field>
                  <Label>Academic Session</Label>

                  <Select
                    value={regSessionId}
                    onValueChange={(value) => {
                      setRegSessionId(value);
                      setRegisterLoaded(false);
                    }}
                  >
                    <SelectTrigger className=" h-11 w-full">
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

                  <Select
                    value={regClassId}
                    onValueChange={(value) => {
                      setRegClassId(value);
                      setRegSectionId("");
                      setRegisterLoaded(false);
                    }}
                  >
                    <SelectTrigger className=" h-11 w-full">
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

                  <Select
                    value={regSectionId}
                    onValueChange={(value) => {
                      setRegSectionId(value);
                      setRegisterLoaded(false);
                    }}
                    disabled={!regClassId}
                  >
                    <SelectTrigger className=" h-11 w-full">
                      <SelectValue placeholder="Select Section" />
                    </SelectTrigger>

                    <SelectContent>
                      {regFilteredSections.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <Label>Date</Label>

                  <Popover open={regDateOpen} onOpenChange={setRegDateOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className={cn(" h-11 w-full justify-start text-left font-normal", !regDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {regDate ? format(new Date(regDate), "dd MMM yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                      <Calendar
                        mode="single"
                        selected={regDate ? new Date(regDate) : undefined}
                        onSelect={(date) => {
                          if (!date) return;
                          handleDateChange(format(date, "yyyy-MM-dd"));
                          setRegDateOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </Field>
              </div>

              <Button onClick={handleLoadRegister} className="h-11 px-6">
                <Users className="size-4 mr-2" />
                Load Students
              </Button>
            </div>

            {!registerLoaded ? (
              <div className="bg-card rounded-md border p-8 sm:p-16 flex flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <ClipboardList className="size-6 text-muted-foreground" />
                </div>

                <h3 className="text-lg font-semibold">Select a session, class and section</h3>
                <p className=" text-muted-foreground">Then click &ldquo;Load Students&rdquo; to start marking attendance.</p>
              </div>
            ) : registerStudents.length === 0 ? (
              <div className="bg-card rounded-md border p-8 sm:p-16 flex flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Inbox className="size-6" />
                </div>

                <h3 className="text-lg font-semibold">No active students found</h3>
                <p className=" text-muted-foreground">There are no active enrollments for this class and section.</p>
              </div>
            ) : (
              <div className="bg-card rounded-md border p-4 sm:p-6 space-y-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
                    <p className="text-2xl font-bold mt-1">{registerStats.total}</p>
                  </div>

                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-900/10">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wide">Present</p>
                    <p className="text-2xl font-bold mt-1 text-green-700 dark:text-green-400">{registerStats.PRESENT}</p>
                  </div>

                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/10">
                    <p className="text-xs font-medium text-red-700 dark:text-red-400 uppercase tracking-wide">Absent</p>
                    <p className="text-2xl font-bold mt-1 text-red-700 dark:text-red-400">{registerStats.ABSENT}</p>
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/10">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">Late</p>
                    <p className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-400">{registerStats.LATE}</p>
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-900/10">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide">Leave</p>
                    <p className="text-2xl font-bold mt-1 text-blue-700 dark:text-blue-400">{registerStats.LEAVE}</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input placeholder="Search student..." value={registerSearch} onChange={(e) => setRegisterSearch(e.target.value)} className="h-10 pl-10" />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => markAllAs("PRESENT")} className="gap-1.5 flex-1 sm:flex-none">
                      <CircleCheck className="size-4" />
                      <span className="whitespace-nowrap">Mark all Present</span>
                    </Button>

                    <Button variant="outline" size="sm" onClick={resetToSaved} className="gap-1.5 flex-1 sm:flex-none">
                      <RotateCcw className="size-4" />
                      Reset
                    </Button>
                  </div>
                </div>

                <div className="divide-y divide-border/40 rounded-md border">
                  {registerSearchedStudents.map((enrollment) => (
                    <div key={enrollment.id} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4">
                      <div className="flex flex-col gap-3 md:w-64 shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                            {enrollment.student.firstName.charAt(0)}
                            {enrollment.student.lastName.charAt(0)}
                          </div>

                          <div>
                            <p className="font-medium leading-tight">
                              {enrollment.student.firstName} {enrollment.student.lastName}
                            </p>

                            <p className="text-xs text-muted-foreground">{enrollment.student.admissionNo}</p>
                          </div>
                        </div>

                        <div className="relative w-full md:w-56">
                          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />

                          <Input
                            placeholder="Remarks (optional)"
                            value={markings[enrollment.id]?.remarks ?? ""}
                            onChange={(e) =>
                              setMarkings((prev) => ({
                                ...prev,
                                [enrollment.id]: {
                                  ...(prev[enrollment.id] ?? {
                                    status: "PRESENT",
                                    remarks: "",
                                  }),
                                  remarks: e.target.value,
                                },
                              }))
                            }
                            className="h-9 pl-8 text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col md:ml-auto">
                        <div className="grid grid-cols-4 gap-1.5 md:flex md:flex-wrap md:justify-end md:gap-2">
                          {STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setStudentStatus(enrollment.id, opt.value)}
                              className={cn(
                                "px-2 py-1.5 md:px-3.5 rounded-md text-[11px] md:text-xs font-semibold border transition-colors text-center",
                                markings[enrollment.id]?.status === opt.value ? statusToggleClass(opt.value) : "border-input text-muted-foreground hover:bg-muted"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {registerSearchedStudents.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No students match your search.</div>}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border bg-muted/30 px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Marking attendance for <span className="font-semibold text-foreground">{registerStats.total}</span> student{registerStats.total !== 1 ? "s" : ""} on{" "}
                    <span className="font-semibold text-foreground">{new Date(regDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </p>

                  <Button onClick={handleSaveRegister} disabled={saving} className="w-full sm:w-auto sm:min-w-40 h-10">
                    {saving ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="size-4 mr-2" />
                        Save Attendance
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card rounded-md border p-4 sm:p-6 space-y-4">
            <div className="space-y-3">
              <div className="hidden md:flex md:flex-wrap md:items-center md:gap-2">
                <div className="flex shrink-0 items-center gap-1.5 mr-1">
                  <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filters</span>

                  {pendingFilterCount > 0 && <span className="flex size-4 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold leading-none text-white">{pendingFilterCount}</span>}
                </div>

                <div className="relative w-full md:w-56">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input placeholder="Search student..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-10" />
                </div>

                <Select
                  value={classFilter}
                  onValueChange={(value) => {
                    setClassFilter(value);
                    setSectionFilter("all");
                  }}
                >
                  <SelectTrigger className="h-10 w-36">
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
                  <SelectTrigger className="h-10 w-36">
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

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">Status</SelectItem>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover open={desktopFilterDateOpen} onOpenChange={setDesktopFilterDateOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className={cn("h-10 w-40 justify-start text-left font-normal", !dateFilter && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFilter ? format(new Date(dateFilter), "dd MMM yyyy") : "Pick a Date"}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <Calendar
                      mode="single"
                      selected={dateFilter ? new Date(dateFilter) : undefined}
                      onSelect={(date) => {
                        if (!date) return;

                        setDateFilter(format(date, "yyyy-MM-dd"));
                        setDesktopFilterDateOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>

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
                    <Input placeholder="Search student..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-9" />
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

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="all">Status</SelectItem>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Popover open={mobileFilterDateOpen} onOpenChange={setMobileFilterDateOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className={cn("h-10 col-span-2 justify-start text-left font-normal", !dateFilter && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFilter ? format(new Date(dateFilter), "dd MMM yyyy") : "Pick a Date"}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                      <Calendar
                        mode="single"
                        selected={dateFilter ? new Date(dateFilter) : undefined}
                        onSelect={(date) => {
                          if (!date) return;

                          setDateFilter(format(date, "yyyy-MM-dd"));
                          setDesktopFilterDateOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button onClick={applyFilters} disabled={!filtersChanged} className="h-10 w-full">
                  Apply Filters
                </Button>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">Active filters:</span>

                {appliedFilters.class !== "all" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                    Class:
                    {classes.find((c) => c.id === appliedFilters.class)?.name}
                    <button
                      onClick={() => {
                        setClassFilter("all");
                        setSectionFilter("all");
                        setAppliedFilters((p) => ({ ...p, class: "all", section: "all" }));
                      }}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}

                {appliedFilters.section !== "all" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                    Section:
                    {sections.find((s) => s.id === appliedFilters.section)?.name}
                    <button
                      onClick={() => {
                        setSectionFilter("all");
                        setAppliedFilters((p) => ({ ...p, section: "all" }));
                      }}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}

                {appliedFilters.session !== "all" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                    Session:
                    {sessions.find((s) => s.id === appliedFilters.session)?.name}
                    <button
                      onClick={() => {
                        setSessionFilter("all");
                        setAppliedFilters((p) => ({ ...p, session: "all" }));
                      }}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}

                {appliedFilters.status !== "all" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                    Status:
                    {appliedFilters.status}
                    <button
                      onClick={() => {
                        setStatusFilter("all");
                        setAppliedFilters((p) => ({ ...p, status: "all" }));
                      }}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}

                {appliedFilters.date !== "" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                    Date:
                    {new Date(appliedFilters.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    <button
                      onClick={() => {
                        setDateFilter("");
                        setAppliedFilters((p) => ({ ...p, date: "" }));
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

            {loading && studentAttendances.length === 0 ? (
              <div className="space-y-4">
                <div className="flex gap-4 border-b pb-3">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="h-6 flex-1 rounded bg-muted animate-pulse" />
                  ))}
                </div>

                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-4 border-b py-3">
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <div key={j} className="h-8 flex-1 rounded bg-muted animate-pulse" />
                    ))}
                  </div>
                ))}
              </div>
            ) : filteredAttendances.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Inbox className="size-6" />
                </div>

                <h3 className="text-lg font-semibold">{studentAttendances.length === 0 ? "No attendance records yet." : "No records found."}</h3>

                <p className=" text-muted-foreground">{studentAttendances.length === 0 ? "Mark attendance to see records here." : "Try adjusting your search or filters."}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-muted/15 border-b border-border/60">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-wider py-4 pl-6 text-foreground/80 min-w-25">Admission No.</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-45">Student</TableHead>
                      <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Class</TableHead>
                      <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Section</TableHead>
                      <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Date</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 ">Status</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pr-6 text-right text-foreground/80 min-w-12.5">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y divide-border/30">
                    {filteredAttendances.map((attendance) => (
                      <TableRow key={attendance.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="hidden md:table-cell py-4 pl-6 font-medium">{attendance.enrollment.student.admissionNo}</TableCell>

                        <TableCell className="py-4">
                          <div className="space-y-1 max-w-45">
                            <p className="font-semibold text-foreground text-base leading-tight" title={`${attendance.enrollment.student.firstName} ${attendance.enrollment.student.lastName}`}>
                              {`${attendance.enrollment.student.firstName} ${attendance.enrollment.student.lastName}`.length > 15
                                ? `${`${attendance.enrollment.student.firstName} ${attendance.enrollment.student.lastName}`.slice(0, 15)}...`
                                : `${attendance.enrollment.student.firstName} ${attendance.enrollment.student.lastName}`}
                            </p>

                            <p className="text-sm text-foreground/50 md:hidden">{attendance.enrollment.student.admissionNo}</p>
                            <p className="text-xs text-foreground/50 md:hidden">
                              {attendance.enrollment.class.name} - {attendance.enrollment.section.name}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="hidden md:table-cell">{attendance.enrollment.class.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{attendance.enrollment.section.name}</TableCell>

                        <TableCell className="hidden md:table-cell py-4 text-xs font-medium text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="size-5 text-muted-foreground/80" />

                            <span className="text-sm">
                              {new Date(attendance.date).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge className={statusBadgeClass(attendance.status)}>{attendance.status}</Badge>
                        </TableCell>

                        <TableCell className="py-4 pr-6 text-right align-top max-w-12.5">
                          <div className="hidden md:flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="size-10 rounded-lg text-muted-foreground hover:bg-blue-300/10 hover:text-blue-700 transition-all" onClick={() => openEditDialog(attendance)}>
                              <Pencil className="size-5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                              onClick={() => openDeleteDialog(attendance)}
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
                                <DropdownMenuItem onClick={() => openEditDialog(attendance)}>
                                  <Pencil className="mr-2 size-4" />
                                  Edit
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => openDeleteDialog(attendance)} className="text-destructive">
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
        )}
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingAttendance(null);
        }}
      >
        <DialogContent className="sm:max-w-125 p-0 overflow-hidden">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pencil className="size-5 text-primary" />
              </div>

              <div>
                <DialogTitle>Edit Attendance</DialogTitle>
                <DialogDescription>Update the attendance record.</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6 p-6">
            <FieldGroup>
              <Field>
                <Label>Student</Label>

                <div className=" h-11 flex items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                  {editingAttendance ? `${editingAttendance.enrollment.student.admissionNo} - ${editingAttendance.enrollment.student.firstName} ${editingAttendance.enrollment.student.lastName}` : ""}
                </div>
              </Field>

              <Field>
                <Label>Date</Label>
                <Popover open={editDateOpen} onOpenChange={setEditDateOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className={cn(" h-11 w-full justify-start text-left font-normal", !editDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editDate ? format(new Date(editDate), "dd MMM yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <Calendar
                      mode="single"
                      selected={editDate ? new Date(editDate) : undefined}
                      defaultMonth={editDate ? new Date(editDate) : new Date()}
                      onSelect={(date) => {
                        if (!date) return;
                        setEditDate(format(date, "yyyy-MM-dd"));
                        setEditDateOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </Field>

              <Field>
                <Label>Status</Label>

                <Select value={editStatus} onValueChange={(value) => setEditStatus(value as AttendanceStatus)}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>

                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field className="md:col-span-3">
                <Label>Remarks</Label>

                <Input value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} placeholder="Optional remarks" className="h-11" />
              </Field>
            </FieldGroup>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>

              <Button type="submit" disabled={loading || !hasEditChanges}>
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

            <AlertDialogTitle className="w-full text-center text-xl">Delete attendance record?</AlertDialogTitle>

            <AlertDialogDescription className="text-center">
              This action cannot be undone. This will permanently remove the attendance entry for{" "}
              <span className="font-semibold text-foreground">
                {deletingAttendance &&
                  (`${deletingAttendance.enrollment.student.firstName} ${deletingAttendance.enrollment.student.lastName}`.length > 10
                    ? `${`${deletingAttendance.enrollment.student.firstName} ${deletingAttendance.enrollment.student.lastName}`.slice(0, 10)}...`
                    : `${deletingAttendance.enrollment.student.firstName} ${deletingAttendance.enrollment.student.lastName}`)}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>

            <AlertDialogAction onClick={handleDelete} className="h-11 bg-destructive text-white hover:bg-destructive/90">
              <>
                <Trash2 className="mr-2 size-4" />
                Delete record
              </>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
