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
import {
  Briefcase,
  Calendar as CalendarIcon,
  CalendarCheck,
  Check,
  ChevronDown,
  CircleCheck,
  Clock,
  ClipboardList,
  Inbox,
  Loader2,
  LogIn,
  LogOut,
  MessageSquare,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useAcademicStore, FacultyAttendance } from "@/store/academicStore";
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

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "LEAVE" | "HOLIDAY";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "LATE", label: "Late" },
  { value: "HALF_DAY", label: "Half Day" },
  { value: "LEAVE", label: "Leave" },
  { value: "HOLIDAY", label: "Holiday" },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function toDateInputValue(value: string) {
  return value ? value.slice(0, 10) : "";
}

function toTimeInputValue(value?: string) {
  if (!value) return "";

  if (value.includes("T")) {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  return value.slice(0, 5);
}

function to12hLabel(time24: string) {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${mStr} ${period}`;
}

function parseTime24(value: string) {
  if (!value) return { hour12: "", minute: "", period: "AM" as const };
  const [hStr, mStr] = value.split(":");
  let h = parseInt(hStr, 10);
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return { hour12: String(h).padStart(2, "0"), minute: mStr ?? "00", period };
}

function buildTime24(hour12: string, minute: string, period: "AM" | "PM") {
  if (!hour12 || !minute) return "";
  let h = parseInt(hour12, 10) % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

function TimePickerPopover({
  value,
  onChange,
  icon,
  placeholder,
  fullWidth = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  placeholder: string;
  fullWidth?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hourText, setHourText] = useState("");
  const [minuteText, setMinuteText] = useState("");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  function handleOpenChange(next: boolean) {
    if (next) {
      const parsed = parseTime24(value);
      setHourText(parsed.hour12);
      setMinuteText(parsed.minute);
      setPeriod(parsed.period);
    }

    setOpen(next);
  }

  function commit(h: string, m: string, p: "AM" | "PM") {
    if (!h || !m) return;
    onChange(buildTime24(h, m, p));
  }

  function clampHour(raw: string) {
    if (!raw) return "";
    const n = Math.min(12, Math.max(1, parseInt(raw, 10) || 1));
    return String(n).padStart(2, "0");
  }

  function clampMinute(raw: string) {
    if (!raw) return "";
    const n = Math.min(59, Math.max(0, parseInt(raw, 10) || 0));
    return String(n).padStart(2, "0");
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className={cn("justify-start gap-1.5 font-normal", fullWidth ? "h-11 w-full" : "h-9 px-3 text-xs", !value && "text-muted-foreground", className)}>
          {icon}
          {value ? to12hLabel(value) : placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex items-center gap-1.5">
          <Input
            inputMode="numeric"
            maxLength={2}
            value={hourText}
            onChange={(e) => setHourText(e.target.value.replace(/\D/g, "").slice(0, 2))}
            onBlur={() => {
              const hh = clampHour(hourText);
              setHourText(hh);
              commit(hh, minuteText, period);
            }}
            placeholder="HH"
            className="h-9 w-14 text-center text-xs"
          />

          <span className="text-xs text-muted-foreground">:</span>

          <Input
            inputMode="numeric"
            maxLength={2}
            value={minuteText}
            onChange={(e) => setMinuteText(e.target.value.replace(/\D/g, "").slice(0, 2))}
            onBlur={() => {
              const mm = clampMinute(minuteText);
              setMinuteText(mm);
              commit(hourText, mm, period);
            }}
            placeholder="MM"
            className="h-9 w-14 text-center text-xs"
          />

          <Select
            value={period}
            onValueChange={(p) => {
              setPeriod(p as "AM" | "PM");
              commit(hourText, minuteText, p as "AM" | "PM");
            }}
          >
            <SelectTrigger className="h-9 w-17 px-2 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setHourText("");
              setMinuteText("");
              onChange("");
              setOpen(false);
            }}
            className="text-xs font-medium text-muted-foreground hover:text-destructive"
          >
            Clear
          </button>

          <Button
            type="button"
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => {
              commit(clampHour(hourText), clampMinute(minuteText), period);
              setOpen(false);
            }}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function combineDateTime(date: string, time: string): string | undefined {
  if (!time || !date) return undefined;

  const d = new Date(`${date}T${time}:00`);
  if (isNaN(d.getTime())) return undefined;

  return d.toISOString();
}

function formatTime(value?: string) {
  const time24 = toTimeInputValue(value);
  return time24 ? to12hLabel(time24) : "—";
}

function statusBadgeClass(status: AttendanceStatus) {
  switch (status) {
    case "PRESENT":
      return "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400";
    case "ABSENT":
      return "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400";
    case "LATE":
      return "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
    case "HALF_DAY":
      return "bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400";
    case "LEAVE":
      return "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400";
    case "HOLIDAY":
      return "bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-400";
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
    case "HALF_DAY":
      return "bg-purple-600 border-purple-600 text-white hover:bg-purple-600";
    case "LEAVE":
      return "bg-blue-600 border-blue-600 text-white hover:bg-blue-600";
    case "HOLIDAY":
      return "bg-slate-600 border-slate-600 text-white hover:bg-slate-600";
  }
}

type MarkingEntry = {
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
  remarks: string;
};

export default function FacultyAttendancePage() {
  const {
    loading,

    sessions,
    teachers,
    facultyAttendances,

    fetchSessions,
    fetchTeachers,
    fetchFacultyAttendances,

    createFacultyAttendance,
    updateFacultyAttendance,
    deleteFacultyAttendance,
  } = useAcademicStore();

  const authorized = usePermission("faculty-attendance.read");
  const [viewMode, setViewMode] = useState<"mark" | "records">("mark");
  const [regSessionId, setRegSessionId] = useState("");
  const [regDesignation, setRegDesignation] = useState("all");
  const [regDate, setRegDate] = useState(todayStr());
  const [registerLoaded, setRegisterLoaded] = useState(false);
  const [registerSearch, setRegisterSearch] = useState("");
  const [markings, setMarkings] = useState<Record<string, MarkingEntry>>({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [designationFilter, setDesignationFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    designation: "all",
    session: "all",
    status: "all",
    date: "",
  });
  const [addOpen, setAddOpen] = useState(false);
  const [teacherId, setTeacherId] = useState("");
  const [addSessionId, setAddSessionId] = useState("");
  const [addDate, setAddDate] = useState(todayStr());
  const [addStatus, setAddStatus] = useState<AttendanceStatus>("PRESENT");
  const [addCheckIn, setAddCheckIn] = useState("");
  const [addCheckOut, setAddCheckOut] = useState("");
  const [addRemarks, setAddRemarks] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<FacultyAttendance | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editStatus, setEditStatus] = useState<AttendanceStatus>("PRESENT");
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAttendance, setDeletingAttendance] = useState<FacultyAttendance | null>(null);
  const [regDateOpen, setRegDateOpen] = useState(false);
  const [addDateOpen, setAddDateOpen] = useState(false);
  const [editDateOpen, setEditDateOpen] = useState(false);
  const [filterDateOpen, setFilterDateOpen] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchTeachers();
    fetchFacultyAttendances();
  }, []);

  const activeTeachers = useMemo(() => teachers.filter((t) => t.isActive), [teachers]);

  const designationOptions = useMemo(() => Array.from(new Set(teachers.map((t) => t.designation).filter(Boolean))).sort(), [teachers]);

  const regFilteredTeachers = useMemo(() => {
    if (regDesignation === "all") return activeTeachers;
    return activeTeachers.filter((t) => t.designation === regDesignation);
  }, [activeTeachers, regDesignation]);

  const registerStaff = useMemo(() => {
    return [...regFilteredTeachers].sort((a, b) => a.name.localeCompare(b.name));
  }, [regFilteredTeachers]);

  const existingForDate = useMemo(() => {
    const map: Record<string, { id: string; status: AttendanceStatus; checkIn?: string; checkOut?: string; remarks?: string }> = {};

    facultyAttendances.forEach((a) => {
      if (a.sessionId === regSessionId && toDateInputValue(a.date) === regDate) {
        map[a.teacherId] = { id: a.id, status: a.status, checkIn: a.checkIn, checkOut: a.checkOut, remarks: a.remarks };
      }
    });

    return map;
  }, [facultyAttendances, regSessionId, regDate]);

  const registerSearchedStaff = registerStaff.filter((t) => {
    const name = t.name.toLowerCase();
    return name.includes(registerSearch.toLowerCase()) || t.teacherCode.toLowerCase().includes(registerSearch.toLowerCase());
  });

  const registerStats = useMemo(() => {
    const stats = { total: registerStaff.length, PRESENT: 0, ABSENT: 0, LATE: 0, HALF_DAY: 0, LEAVE: 0, HOLIDAY: 0 };

    registerStaff.forEach((t) => {
      const entry = markings[t.id];
      if (entry) stats[entry.status] += 1;
    });

    return stats;
  }, [registerStaff, markings]);

  function seedMarkings() {
    const seeded: Record<string, MarkingEntry> = {};

    registerStaff.forEach((t) => {
      const existing = existingForDate[t.id];
      seeded[t.id] = {
        status: existing?.status ?? "PRESENT",
        checkIn: toTimeInputValue(existing?.checkIn),
        checkOut: toTimeInputValue(existing?.checkOut),
        remarks: existing?.remarks ?? "",
      };
    });

    setMarkings(seeded);
  }

  function handleLoadRegister() {
    if (!regSessionId) {
      toast.error("Please select an academic session");
      return;
    }

    seedMarkings();
    setRegisterLoaded(true);
  }

  function handleDateChange(value: string) {
    setRegDate(value);

    if (registerLoaded) {
      const seeded: Record<string, MarkingEntry> = {};

      registerStaff.forEach((t) => {
        const existing = facultyAttendances.find((a) => a.teacherId === t.id && a.sessionId === regSessionId && toDateInputValue(a.date) === value);
        seeded[t.id] = {
          status: existing?.status ?? "PRESENT",
          checkIn: toTimeInputValue(existing?.checkIn),
          checkOut: toTimeInputValue(existing?.checkOut),
          remarks: existing?.remarks ?? "",
        };
      });

      setMarkings(seeded);
    }
  }

  function updateMarking(id: string, patch: Partial<MarkingEntry>) {
    setMarkings((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function markAllAs(status: AttendanceStatus) {
    const updated: Record<string, MarkingEntry> = { ...markings };
    registerStaff.forEach((t) => {
      updated[t.id] = { ...updated[t.id], status };
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
      const ops = registerStaff
        .map((t) => {
          const entry = markings[t.id];
          if (!entry) return null;

          const existing = existingForDate[t.id];

          const payload = {
            attendanceDate: regDate,
            status: entry.status,
            checkIn: combineDateTime(regDate, entry.checkIn),
            checkOut: combineDateTime(regDate, entry.checkOut),
            remarks: entry.remarks,
          };

          if (existing) {
            const unchanged =
              existing.status === entry.status && toTimeInputValue(existing.checkIn) === entry.checkIn && toTimeInputValue(existing.checkOut) === entry.checkOut && (existing.remarks ?? "") === (entry.remarks || "");

            if (unchanged) return null;

            return updateFacultyAttendance(existing.id, payload);
          }

          return createFacultyAttendance({ sessionId: regSessionId, teacherId: t.id, ...payload });
        })
        .filter(Boolean) as Promise<void>[];

      if (ops.length === 0) {
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

  const hasUnsavedChanges = registerStaff.some((teacher) => {
    const current = markings[teacher.id];
    const saved = existingForDate[teacher.id];

    if (!current) return false;

    return (
      current.status !== (saved?.status ?? "PRESENT") ||
      current.checkIn !== toTimeInputValue(saved?.checkIn) ||
      current.checkOut !== toTimeInputValue(saved?.checkOut) ||
      (current.remarks ?? "") !== (saved?.remarks ?? "")
    );
  });

  const filteredAttendances = facultyAttendances
    .filter((item) => {
      const name = item.teacher.name.toLowerCase();

      const matchesSearch = name.includes(search.toLowerCase()) || item.teacher.teacherCode.toLowerCase().includes(search.toLowerCase());

      const matchesDesignation = appliedFilters.designation === "all" || item.teacher.designation === appliedFilters.designation;
      const matchesSession = appliedFilters.session === "all" || item.session.id === appliedFilters.session;
      const matchesStatus = appliedFilters.status === "all" || item.status === appliedFilters.status;
      const matchesDate = !appliedFilters.date || toDateInputValue(item.date) === appliedFilters.date;

      return matchesSearch && matchesDesignation && matchesSession && matchesStatus && matchesDate;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const hasActiveFilters = appliedFilters.designation !== "all" || appliedFilters.session !== "all" || appliedFilters.status !== "all" || appliedFilters.date !== "";

  const filtersChanged = designationFilter !== appliedFilters.designation || sessionFilter !== appliedFilters.session || statusFilter !== appliedFilters.status || dateFilter !== appliedFilters.date;

  const pendingFilterCount = [designationFilter !== "all", sessionFilter !== "all", statusFilter !== "all", dateFilter !== ""].filter(Boolean).length;

  function applyFilters() {
    setAppliedFilters({
      designation: designationFilter,
      session: sessionFilter,
      status: statusFilter,
      date: dateFilter,
    });
  }

  function clearFilters() {
    setDesignationFilter("all");
    setSessionFilter("all");
    setStatusFilter("all");
    setDateFilter("");

    setAppliedFilters({
      designation: "all",
      session: "all",
      status: "all",
      date: "",
    });
  }

  if (authorized === null) {
    return null;
  }

  const resetAddForm = () => {
    setTeacherId("");
    setAddSessionId("");
    setAddDate(todayStr());
    setAddStatus("PRESENT");
    setAddCheckIn("");
    setAddCheckOut("");
    setAddRemarks("");
    setFormErrors({});
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createFacultyAttendance({
        teacherId,
        sessionId: addSessionId,
        attendanceDate: addDate,
        status: addStatus,
        checkIn: combineDateTime(addDate, addCheckIn),
        checkOut: combineDateTime(addDate, addCheckOut),
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

  const openEditDialog = (attendance: FacultyAttendance) => {
    setEditDate(toDateInputValue(attendance.date));
    setEditStatus(attendance.status);
    setEditCheckIn(toTimeInputValue(attendance.checkIn));
    setEditCheckOut(toTimeInputValue(attendance.checkOut));
    setEditRemarks(attendance.remarks ?? "");
    setEditingAttendance(attendance);
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingAttendance) return;

    try {
      await updateFacultyAttendance(editingAttendance.id, {
        attendanceDate: editDate,
        status: editStatus,
        checkIn: combineDateTime(editDate, editCheckIn),
        checkOut: combineDateTime(editDate, editCheckOut),
        remarks: editRemarks,
      });

      toast.success("Attendance updated successfully");

      setEditOpen(false);
      setEditingAttendance(null);
    } catch {
      toast.error("Failed to update attendance");
    }
  };

  const openDeleteDialog = (attendance: FacultyAttendance) => {
    setDeletingAttendance(attendance);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingAttendance) return;

    try {
      await deleteFacultyAttendance(deletingAttendance.id);

      toast.success("Attendance record deleted");

      setDeleteOpen(false);
      setDeletingAttendance(null);
    } catch {
      toast.error("Failed to delete attendance record");
    }
  };

  const hasEditChanges =
    editingAttendance &&
    (editDate !== toDateInputValue(editingAttendance.date) ||
      editStatus !== editingAttendance.status ||
      editCheckIn !== toTimeInputValue(editingAttendance.checkIn) ||
      editCheckOut !== toTimeInputValue(editingAttendance.checkOut) ||
      editRemarks !== (editingAttendance.remarks ?? ""));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex md:flex-row flex-col md:items-center items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Faculty Attendance</h1>
            <p className="text-muted-foreground">Mark and manage daily staff attendance</p>
          </div>

          <div className="flex items-center gap-3">
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

            <Dialog
              open={addOpen}
              onOpenChange={(open) => {
                setAddOpen(open);
                if (!open) resetAddForm();
              }}
            >
              <DialogTrigger asChild>
                <Button className="gap-2 px-5">
                  <Plus className="size-4" />
                  Add Entry
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-125 p-0 overflow-hidden">
                <div className="border-b px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ClipboardList className="size-5 text-primary" />
                    </div>

                    <div>
                      <DialogTitle className="text-lg">Add Attendance Entry</DialogTitle>
                      <DialogDescription>Mark attendance for a single staff member.</DialogDescription>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCreate} className="space-y-6 p-6 max-h-[70vh] overflow-y-auto">
                  <FieldGroup>
                    <Field>
                      <Label>Staff Member</Label>

                      <Popover open={teacherOpen} onOpenChange={setTeacherOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" role="combobox" aria-expanded={teacherOpen} className="mt-2 h-11 w-full justify-between font-normal">
                            {teacherId
                              ? (() => {
                                  const teacher = activeTeachers.find((t) => t.id === teacherId);
                                  return teacher ? `${teacher.teacherCode} - ${teacher.name}` : "Select Staff Member";
                                })()
                              : "Select Staff Member"}

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
                            <CommandInput placeholder="Search name or employee code..." />

                            <CommandList>
                              <CommandEmpty>No staff member found.</CommandEmpty>

                              <CommandGroup>
                                {activeTeachers.map((teacher) => (
                                  <CommandItem
                                    key={teacher.id}
                                    value={`${teacher.name} ${teacher.teacherCode}`}
                                    onSelect={(currentValue) => {
                                      const selected = activeTeachers.find((t) => `${t.name} ${t.teacherCode}`.toLowerCase() === currentValue.toLowerCase());

                                      if (!selected) return;

                                      setTeacherId(selected.id);
                                      setFormErrors((p) => ({ ...p, teacherId: "" }));
                                      setTeacherOpen(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 size-4", teacherId === teacher.id ? "opacity-100" : "opacity-0")} />

                                    <div className="flex flex-col">
                                      <span className="font-medium">{teacher.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {teacher.teacherCode} • {teacher.designation}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {formErrors.teacherId && <p className="text-sm text-red-500 mt-1">{formErrors.teacherId}</p>}
                    </Field>

                    <Field>
                      <Label>Academic Session</Label>

                      <Select value={addSessionId} onValueChange={setAddSessionId}>
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
                      <Label>Date</Label>

                      <Popover open={addDateOpen} onOpenChange={setAddDateOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" className={cn("mt-2 h-11 w-full justify-start text-left font-normal", !addDate && "text-muted-foreground", formErrors.date && "border-red-500")}>
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
                        <SelectTrigger className="mt-2 h-11 w-full">
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

                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <Label>Check In</Label>
                        <TimePickerPopover value={addCheckIn} onChange={setAddCheckIn} icon={<LogIn className="size-4" />} placeholder="Select time" fullWidth className="mt-2" />
                      </Field>

                      <Field>
                        <Label>Check Out</Label>
                        <TimePickerPopover value={addCheckOut} onChange={setAddCheckOut} icon={<LogOut className="size-4" />} placeholder="Select time" fullWidth className="mt-2" />
                      </Field>
                    </div>

                    <Field>
                      <Label>Remarks</Label>
                      <Input placeholder="Optional remarks" value={addRemarks} onChange={(e) => setAddRemarks(e.target.value)} className="mt-2 h-11" />
                    </Field>
                  </FieldGroup>

                  <DialogFooter className="gap-2">
                    <DialogClose asChild>
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>
                    </DialogClose>

                    <Button type="submit" disabled={loading || !teacherId || !addSessionId} className="min-w-32.5">
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
        </div>

        {viewMode === "mark" ? (
          <div className="space-y-6">
            <div className="bg-card rounded-md border p-6 space-y-4">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Select Register</span>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field>
                  <Label>Academic Session</Label>

                  <Select
                    value={regSessionId}
                    onValueChange={(value) => {
                      setRegSessionId(value);
                      setRegisterLoaded(false);
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
                </Field>

                <Field>
                  <Label>Designation</Label>

                  <Select
                    value={regDesignation}
                    onValueChange={(value) => {
                      setRegDesignation(value);
                      setRegisterLoaded(false);
                    }}
                  >
                    <SelectTrigger className="mt-2 h-11 w-full">
                      <SelectValue placeholder="All Designations" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="all">All Designations</SelectItem>
                      {designationOptions.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <Label>Date</Label>

                  <Popover open={regDateOpen} onOpenChange={setRegDateOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className={cn("mt-2 h-11 w-full justify-start text-left font-normal", !regDate && "text-muted-foreground")}>
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
                Load Staff
              </Button>
            </div>

            {!registerLoaded ? (
              <div className="bg-card rounded-md border p-16 flex flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <ClipboardList className="size-6 text-muted-foreground" />
                </div>

                <h3 className="text-lg font-semibold">Select a session and designation</h3>
                <p className="mt-2 text-muted-foreground">Then click &ldquo;Load Staff&rdquo; to start marking attendance.</p>
              </div>
            ) : registerStaff.length === 0 ? (
              <div className="bg-card rounded-md border p-16 flex flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Inbox className="size-6" />
                </div>

                <h3 className="text-lg font-semibold">No active staff found</h3>
                <p className="mt-2 text-muted-foreground">There are no active staff members for this designation.</p>
              </div>
            ) : (
              <div className="bg-card rounded-md border p-6 space-y-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
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

                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900/40 dark:bg-purple-900/10">
                    <p className="text-xs font-medium text-purple-700 dark:text-purple-400 uppercase tracking-wide">Half Day</p>
                    <p className="text-2xl font-bold mt-1 text-purple-700 dark:text-purple-400">{registerStats.HALF_DAY}</p>
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-900/10">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide">Leave</p>
                    <p className="text-2xl font-bold mt-1 text-blue-700 dark:text-blue-400">{registerStats.LEAVE}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-400 uppercase tracking-wide">Holiday</p>
                    <p className="text-2xl font-bold mt-1 text-slate-700 dark:text-slate-400">{registerStats.HOLIDAY}</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input placeholder="Search staff..." value={registerSearch} onChange={(e) => setRegisterSearch(e.target.value)} className="h-10 pl-10" />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => markAllAs("PRESENT")} className="gap-1.5">
                      <CircleCheck className="size-4" />
                      Mark all Present
                    </Button>

                    <Button variant="outline" size="sm" onClick={resetToSaved} className="gap-1.5">
                      <RotateCcw className="size-4" />
                      Reset
                    </Button>
                  </div>
                </div>

                <div className="divide-y divide-border/40 rounded-md border">
                  {registerSearchedStaff.map((teacher) => {
                    const entry = markings[teacher.id];

                    return (
                      <div key={teacher.id} className="flex flex-col gap-3 p-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                          <div className="flex items-center gap-3 md:w-64 shrink-0">
                            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                              {teacher.name
                                .split(" ")
                                .slice(0, 2)
                                .map((n) => n.charAt(0))
                                .join("")}
                            </div>

                            <div>
                              <p className="font-medium leading-tight">{teacher.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {teacher.teacherCode} • {teacher.designation}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 md:ml-auto">
                            {STATUS_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => updateMarking(teacher.id, { status: opt.value })}
                                className={cn(
                                  "px-3.5 py-1.5 rounded-md text-xs font-semibold border transition-colors",
                                  entry?.status === opt.value ? statusToggleClass(opt.value) : "border-input text-muted-foreground hover:bg-muted"
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-3">
                          <TimePickerPopover value={entry?.checkIn ?? ""} onChange={(v) => updateMarking(teacher.id, { checkIn: v })} icon={<LogIn className="size-3.5" />} placeholder="Check In" />

                          <TimePickerPopover value={entry?.checkOut ?? ""} onChange={(v) => updateMarking(teacher.id, { checkOut: v })} icon={<LogOut className="size-3.5" />} placeholder="Check Out" />

                          <div className="relative w-full md:w-56">
                            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                            <Input value={entry?.remarks ?? ""} onChange={(e) => updateMarking(teacher.id, { remarks: e.target.value })} className="h-9 pl-8 text-xs" placeholder="Remarks (optional)" />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {registerSearchedStaff.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No staff match your search.</div>}
                </div>

                <div className="flex items-center justify-between rounded-md border bg-muted/30 px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Marking attendance for <span className="font-semibold text-foreground">{registerStats.total}</span> staff member{registerStats.total !== 1 ? "s" : ""} on{" "}
                    <span className="font-semibold text-foreground">{new Date(regDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </p>

                  <Button onClick={handleSaveRegister} disabled={saving || !hasUnsavedChanges} className="min-w-40 h-10">
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
          <div className="bg-card rounded-md border p-6 space-y-4">
            <div className="space-y-3">
              <div className="hidden md:flex md:flex-wrap md:items-center md:gap-2">
                <div className="flex shrink-0 items-center gap-1.5 mr-1">
                  <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filters</span>

                  {pendingFilterCount > 0 && <span className="flex size-4 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold leading-none text-white">{pendingFilterCount}</span>}
                </div>

                <div className="relative w-56">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-10" />
                </div>

                <Select value={designationFilter} onValueChange={setDesignationFilter}>
                  <SelectTrigger className="h-10 w-40">
                    <SelectValue placeholder="Designation" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">Designation</SelectItem>
                    {designationOptions.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
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

                <Popover open={filterDateOpen} onOpenChange={setFilterDateOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="h-10 w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFilter ? format(new Date(dateFilter), "dd MMM yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <Calendar
                      mode="single"
                      selected={dateFilter ? new Date(dateFilter) : undefined}
                      onSelect={(date) => {
                        if (!date) return;
                        setDateFilter(format(date, "yyyy-MM-dd"));
                        setFilterDateOpen(false);
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
                    <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-9" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Select value={designationFilter} onValueChange={setDesignationFilter}>
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Designation" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="all">Designation</SelectItem>
                      {designationOptions.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
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

                  <Popover open={filterDateOpen} onOpenChange={setFilterDateOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="h-10 w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFilter ? format(new Date(dateFilter), "dd MMM yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                      <Calendar
                        mode="single"
                        selected={dateFilter ? new Date(dateFilter) : undefined}
                        onSelect={(date) => {
                          if (!date) return;
                          setDateFilter(format(date, "yyyy-MM-dd"));
                          setFilterDateOpen(false);
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

                {appliedFilters.designation !== "all" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                    Designation:
                    {appliedFilters.designation}
                    <button
                      onClick={() => {
                        setDesignationFilter("all");
                        setAppliedFilters((p) => ({ ...p, designation: "all" }));
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

            {loading && facultyAttendances.length === 0 ? (
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

                <h3 className="text-lg font-semibold">{facultyAttendances.length === 0 ? "No attendance records yet." : "No records found."}</h3>

                <p className="mt-2 text-muted-foreground">{facultyAttendances.length === 0 ? "Mark attendance to see records here." : "Try adjusting your search or filters."}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-muted/15 border-b border-border/60">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-wider py-4 pl-6 text-foreground/80 min-w-40">Employee Code</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-45">Staff Member</TableHead>
                      <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Designation</TableHead>
                      <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Date</TableHead>
                      <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Timing</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Status</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pr-6 text-right text-foreground/80 min-w-12.5">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y divide-border/30">
                    {filteredAttendances.map((attendance) => (
                      <TableRow key={attendance.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="hidden md:table-cell py-4 pl-6 font-medium">{attendance.teacher.teacherCode}</TableCell>

                        <TableCell className="py-4">
                          <div className="space-y-1 max-w-45">
                            <p className="font-semibold text-foreground text-base leading-tight" title={attendance.teacher.name}>
                              {attendance.teacher.name.length > 18 ? `${attendance.teacher.name.slice(0, 18)}...` : attendance.teacher.name}
                            </p>

                            <p className="text-sm text-foreground/50 md:hidden">{attendance.teacher.teacherCode}</p>
                            <p className="text-xs text-foreground/50 md:hidden">{attendance.teacher.designation}</p>
                          </div>
                        </TableCell>

                        <TableCell className="hidden md:table-cell">
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <Briefcase className="size-3.5 text-muted-foreground/80" />
                            {attendance.teacher.designation}
                          </span>
                        </TableCell>

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

                        <TableCell className="hidden md:table-cell">
                          {attendance.checkIn || attendance.checkOut ? (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="size-3.5" />
                              {formatTime(attendance.checkIn)} – {formatTime(attendance.checkOut)}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge className={statusBadgeClass(attendance.status)}>{STATUS_OPTIONS.find((o) => o.value === attendance.status)?.label ?? attendance.status}</Badge>
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

          <form onSubmit={handleUpdate} className="space-y-6 p-6 max-h-[70vh] overflow-y-auto">
            <FieldGroup>
              <Field>
                <Label>Staff Member</Label>

                <div className="mt-2 h-11 flex items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                  {editingAttendance ? `${editingAttendance.teacher.teacherCode} - ${editingAttendance.teacher.name}` : ""}
                </div>
              </Field>

              <Field>
                <Label>Date</Label>
                <Popover open={editDateOpen} onOpenChange={setEditDateOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className={cn("mt-2 h-11 w-full justify-start text-left font-normal", !editDate && "text-muted-foreground")}>
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
                  <SelectTrigger className="mt-2 h-11 w-full">
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

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label>Check In</Label>
                  <TimePickerPopover value={editCheckIn} onChange={setEditCheckIn} icon={<LogIn className="size-4" />} placeholder="Select time" fullWidth className="mt-2" />
                </Field>

                <Field>
                  <Label>Check Out</Label>
                  <TimePickerPopover value={editCheckOut} onChange={setEditCheckOut} icon={<LogOut className="size-4" />} placeholder="Select time" fullWidth className="mt-2" />
                </Field>
              </div>

              <Field>
                <Label>Remarks</Label>
                <Input placeholder="Optional remarks" value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} className="mt-2 h-11" />
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
                {deletingAttendance && (deletingAttendance.teacher.name.length > 12 ? `${deletingAttendance.teacher.name.slice(0, 12)}...` : deletingAttendance.teacher.name)}
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
