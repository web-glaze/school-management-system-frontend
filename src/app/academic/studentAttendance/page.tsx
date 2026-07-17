"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import {
  Calendar as CalendarIcon,
  CalendarCheck,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Inbox,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
  MessageSquare,
  CircleCheck,
  PieChart,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { useAcademicStore, StudentAttendance, StudentEnrollment } from "@/store/academicStore";
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

function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, amount: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
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

function statusLabel(status: AttendanceStatus) {
  switch (status) {
    case "PRESENT":
      return "Present";
    case "ABSENT":
      return "Absent";
    case "LATE":
      return "Late";
    case "LEAVE":
      return "Leave";
  }
}

type Markings = Record<string, { status: AttendanceStatus; remarks: string }>;

interface StoredUser {
  teacherId?: string | null;
}

export default function StudentAttendancePage() {
  const {
    loading,
    sessions,
    classes,
    sections,
    studentEnrollments,
    studentAttendances,
    subjectAllocations,
    studentSubjectAllocations,
    teacherAssignments,

    fetchSessions,
    fetchClasses,
    fetchSections,
    fetchStudentEnrollments,
    fetchStudentAttendances,
    fetchSubjectAllocations,
    fetchStudentSubjectAllocations,
    fetchTeacherAssignments,

    createStudentAttendance,
    updateStudentAttendance,
    deleteStudentAttendance,
  } = useAcademicStore();

  const authorized = usePermission("student-attendance.read");

  // ── Current user / teacher context ───────────────────────────────────
  const [myTeacherId, setMyTeacherId] = useState<string | null>(null);
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      const parsed: StoredUser | null = stored ? JSON.parse(stored) : null;
      setMyTeacherId(parsed?.teacherId ?? null);
    } catch {
      setMyTeacherId(null);
    } finally {
      setUserChecked(true);
    }
  }, []);

  const isTeacherView = Boolean(myTeacherId);

  const [viewMode, setViewMode] = useState<"attendance" | "reports">("attendance");

  useEffect(() => {
    if (!userChecked) return;

    fetchSessions();
    fetchStudentAttendances();

    if (isTeacherView) {
      fetchTeacherAssignments();
      fetchSubjectAllocations();
      fetchStudentEnrollments();
      fetchStudentSubjectAllocations();
    } else {
      fetchClasses();
      fetchSections();
      fetchStudentEnrollments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userChecked, isTeacherView]);

  const activeEnrollments = useMemo(() => studentEnrollments.filter((e) => e.enrollmentStatus === "ACTIVE"), [studentEnrollments]);

  const activeSessionId = useMemo(() => {
    const active = sessions.find((s) => s.isActive);
    return active?.id ?? sessions[0]?.id ?? "";
  }, [sessions]);

  // ── Shared: seed / save marking rosters ──────────────────────────────
  function seedMarkingsFor(roster: StudentEnrollment[], date: string): Markings {
    const seeded: Markings = {};
    roster.forEach((e) => {
      const existing = studentAttendances.find((a) => a.enrollmentId === e.id && toDateInputValue(a.date) === date);
      seeded[e.id] = {
        status: existing?.status ?? "PRESENT",
        remarks: existing?.remarks ?? "",
      };
    });
    return seeded;
  }

  async function saveRosterMarkings(roster: StudentEnrollment[], date: string, markings: Markings, setSaving: (v: boolean) => void) {
    setSaving(true);
    try {
      const ops = roster
        .map((e) => {
          const status = markings[e.id]?.status;
          const remarks = markings[e.id]?.remarks ?? "";
          if (!status) return null;

          const existing = studentAttendances.find((a) => a.enrollmentId === e.id && toDateInputValue(a.date) === date);

          if (existing) {
            if (existing.status === status && (existing.remarks ?? "") === remarks) return null;
            return updateStudentAttendance(existing.id, { attendanceDate: date, status, remarks });
          }

          return createStudentAttendance({ enrollmentId: e.id, attendanceDate: date, status, remarks });
        })
        .filter(Boolean) as Promise<void>[];

      if (ops.length === 0) {
        toast.info("No changes to save");
        return;
      }

      await Promise.all(ops);
      toast.success("Attendance saved successfully");
    } catch {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // TEACHER: My Class (homeroom)
  // ══════════════════════════════════════════════════════════════════
  const myClassAssignment = useMemo(() => {
    if (!myTeacherId || !activeSessionId) return null;
    return teacherAssignments.find((a) => a.teacherId === myTeacherId && a.sessionId === activeSessionId) ?? null;
  }, [teacherAssignments, myTeacherId, activeSessionId]);

  const myClassRoster = useMemo(() => {
    if (!myClassAssignment) return [];
    return activeEnrollments
      .filter((e) => e.sessionId === myClassAssignment.sessionId && e.classId === myClassAssignment.classId && e.sectionId === myClassAssignment.sectionId)
      .sort((a, b) => `${a.student.firstName} ${a.student.lastName}`.localeCompare(`${b.student.firstName} ${b.student.lastName}`));
  }, [activeEnrollments, myClassAssignment]);

  const [classDate, setClassDate] = useState(todayStr());
  const [classDateOpen, setClassDateOpen] = useState(false);
  const [classMarkings, setClassMarkings] = useState<Markings>({});
  const [classSaving, setClassSaving] = useState(false);
  const [classSearch, setClassSearch] = useState("");

  useEffect(() => {
    if (myClassRoster.length === 0) return;
    setClassMarkings(seedMarkingsFor(myClassRoster, classDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classDate, myClassAssignment?.id, myClassRoster.length]);

  // ══════════════════════════════════════════════════════════════════
  // TEACHER: My Subjects
  // ══════════════════════════════════════════════════════════════════
  const mySubjectAllocations = useMemo(() => {
    if (!myTeacherId || !activeSessionId) return [];
    return subjectAllocations.filter((a) => a.teacherId === myTeacherId && a.sessionId === activeSessionId);
  }, [subjectAllocations, myTeacherId, activeSessionId]);

  const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(null);
  const selectedAllocation = useMemo(() => mySubjectAllocations.find((a) => a.id === selectedAllocationId) ?? null, [mySubjectAllocations, selectedAllocationId]);

  const subjectRoster = useMemo(() => {
    if (!selectedAllocation) return [];

    if (selectedAllocation.subject.isOptional) {
      // Elective — only students explicitly allocated to this subject
      const studentIds = new Set(studentSubjectAllocations.filter((ssa) => ssa.subjectAllocationId === selectedAllocation.id && ssa.isActive).map((ssa) => ssa.studentId));

      return activeEnrollments
        .filter((e) => e.sessionId === selectedAllocation.sessionId && e.classId === selectedAllocation.classId && e.sectionId === selectedAllocation.sectionId && studentIds.has(e.studentId))
        .sort((a, b) => `${a.student.firstName} ${a.student.lastName}`.localeCompare(`${b.student.firstName} ${b.student.lastName}`));
    }

    // Compulsory — the whole enrolled class-section
    return activeEnrollments
      .filter((e) => e.sessionId === selectedAllocation.sessionId && e.classId === selectedAllocation.classId && e.sectionId === selectedAllocation.sectionId)
      .sort((a, b) => `${a.student.firstName} ${a.student.lastName}`.localeCompare(`${b.student.firstName} ${b.student.lastName}`));
  }, [selectedAllocation, activeEnrollments, studentSubjectAllocations]);

  const [subjectDate, setSubjectDate] = useState(todayStr());
  const [subjectDateOpen, setSubjectDateOpen] = useState(false);
  const [subjectMarkings, setSubjectMarkings] = useState<Markings>({});
  const [subjectSaving, setSubjectSaving] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState("");

  useEffect(() => {
    if (!selectedAllocation || subjectRoster.length === 0) return;
    setSubjectMarkings(seedMarkingsFor(subjectRoster, subjectDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectDate, selectedAllocationId, subjectRoster.length]);

  const [teacherTab, setTeacherTab] = useState<"class" | "subjects">("class");

  // ══════════════════════════════════════════════════════════════════
  // ADMIN: Attendance grid (session/class/section scoped, weekly view)
  // ══════════════════════════════════════════════════════════════════
  const [recSessionId, setRecSessionId] = useState("");
  const [recClassId, setRecClassId] = useState("");
  const [recSectionId, setRecSectionId] = useState("");
  const [recRegisterLoaded, setRecRegisterLoaded] = useState(false);
  const [recSearch, setRecSearch] = useState("");
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()));
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);

  const recFilteredSections = useMemo(() => {
    if (recClassId === "all" || !recClassId) return sections;
    return sections.filter((section) => studentEnrollments.some((e) => e.class.id === recClassId && e.section.id === section.id));
  }, [recClassId, sections, studentEnrollments]);

  const recRegisterStudents = useMemo(() => {
    if (!recSessionId || !recClassId || !recSectionId) return [];
    return activeEnrollments
      .filter((e) => e.session.id === recSessionId && e.class.id === recClassId && e.section.id === recSectionId)
      .sort((a, b) => `${a.student.firstName} ${a.student.lastName}`.localeCompare(`${b.student.firstName} ${b.student.lastName}`));
  }, [activeEnrollments, recSessionId, recClassId, recSectionId]);

  const recSearchedStudents = recRegisterStudents.filter((e) => {
    const name = `${e.student.firstName} ${e.student.lastName}`.toLowerCase();
    return name.includes(recSearch.toLowerCase()) || e.student.admissionNo.toLowerCase().includes(recSearch.toLowerCase());
  });

  const attendanceByKey = useMemo(() => {
    const map = new Map<string, StudentAttendance>();
    studentAttendances.forEach((a) => {
      map.set(`${a.enrollmentId}|${toDateInputValue(a.date)}`, a);
    });
    return map;
  }, [studentAttendances]);

  function getAttendanceFor(enrollId: string, dateStr: string) {
    return attendanceByKey.get(`${enrollId}|${dateStr}`);
  }

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i)), [weekAnchor]);

  function handleLoadRecordsRegister() {
    if (!recSessionId || !recClassId || !recSectionId) {
      toast.error("Please select session, class and section");
      return;
    }
    setRecRegisterLoaded(true);
  }

  function goToPrevWeek() {
    setWeekAnchor((d) => addDays(d, -7));
  }
  function goToNextWeek() {
    setWeekAnchor((d) => addDays(d, 7));
  }
  function goToToday() {
    setWeekAnchor(startOfWeek(new Date()));
  }

  function openAddForCell(forEnrollmentId: string, dateStr: string) {
    resetAddForm();
    setEnrollmentId(forEnrollmentId);
    setAddDate(dateStr);
    setAddOpen(true);
  }

  function handleCellClick(forEnrollmentId: string, dateStr: string) {
    const record = getAttendanceFor(forEnrollmentId, dateStr);
    if (record) {
      openEditDialog(record);
    } else {
      openAddForCell(forEnrollmentId, dateStr);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // REPORTS
  // ══════════════════════════════════════════════════════════════════
  const [repSessionId, setRepSessionId] = useState("");
  const [repClassId, setRepClassId] = useState("");
  const [repSectionId, setRepSectionId] = useState("");
  const [repLoaded, setRepLoaded] = useState(false);
  const [repSearch, setRepSearch] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportEnrollment, setReportEnrollment] = useState<StudentEnrollment | null>(null);

  const repFilteredSections = useMemo(() => {
    if (repClassId === "all" || !repClassId) return sections;
    return sections.filter((section) => studentEnrollments.some((e) => e.class.id === repClassId && e.section.id === section.id));
  }, [repClassId, sections, studentEnrollments]);

  const reportRoster: StudentEnrollment[] = useMemo(() => {
    if (isTeacherView) return myClassRoster;
    if (!repSessionId || !repClassId || !repSectionId) return [];
    return activeEnrollments
      .filter((e) => e.session.id === repSessionId && e.class.id === repClassId && e.section.id === repSectionId)
      .sort((a, b) => `${a.student.firstName} ${a.student.lastName}`.localeCompare(`${b.student.firstName} ${b.student.lastName}`));
  }, [isTeacherView, myClassRoster, activeEnrollments, repSessionId, repClassId, repSectionId]);

  const reportSearchedRoster = reportRoster.filter((e) => {
    const name = `${e.student.firstName} ${e.student.lastName}`.toLowerCase();
    return name.includes(repSearch.toLowerCase()) || e.student.admissionNo.toLowerCase().includes(repSearch.toLowerCase());
  });

  function recordsForEnrollment(enrollmentId: string) {
    return studentAttendances.filter((a) => a.enrollmentId === enrollmentId).sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  function statsForEnrollment(enrollmentId: string) {
    const records = recordsForEnrollment(enrollmentId);
    const total = records.length;
    const present = records.filter((r) => r.status === "PRESENT").length;
    const absent = records.filter((r) => r.status === "ABSENT").length;
    const late = records.filter((r) => r.status === "LATE").length;
    const leave = records.filter((r) => r.status === "LEAVE").length;
    const pct = total ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, leave, pct, records };
  }

  function openReportDialog(enrollment: StudentEnrollment) {
    setReportEnrollment(enrollment);
    setReportOpen(true);
  }

  function handleLoadReportsRegister() {
    if (!repSessionId || !repClassId || !repSectionId) {
      toast.error("Please select session, class and section");
      return;
    }
    setRepLoaded(true);
  }

  // ══════════════════════════════════════════════════════════════════
  // Add / Edit / Delete dialogs
  // ══════════════════════════════════════════════════════════════════
  const [addOpen, setAddOpen] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [addDate, setAddDate] = useState(todayStr());
  const [addStatus, setAddStatus] = useState<AttendanceStatus>("PRESENT");
  const [addRemarks, setAddRemarks] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);
  const [addDateOpen, setAddDateOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<StudentAttendance | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editStatus, setEditStatus] = useState<AttendanceStatus>("PRESENT");
  const [editRemarks, setEditRemarks] = useState("");
  const [editDateOpen, setEditDateOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAttendance, setDeletingAttendance] = useState<StudentAttendance | null>(null);

  if (authorized === null || !userChecked) {
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

  // ── Reusable roster-marking panel (My Class / My Subjects) ──────────
  function renderMarkingPanel(opts: {
    roster: StudentEnrollment[];
    date: string;
    setDate: (v: string) => void;
    dateOpen: boolean;
    setDateOpen: (v: boolean) => void;
    markings: Markings;
    setMarkings: (m: Markings) => void;
    search: string;
    setSearch: (v: string) => void;
    saving: boolean;
    onSave: () => void;
  }) {
    const { roster, date, setDate, dateOpen, setDateOpen, markings, setMarkings, search, setSearch, saving, onSave } = opts;

    const searched = roster.filter((e) => {
      const name = `${e.student.firstName} ${e.student.lastName}`.toLowerCase();
      return name.includes(search.toLowerCase()) || e.student.admissionNo.toLowerCase().includes(search.toLowerCase());
    });

    const stats = { total: roster.length, PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 };
    roster.forEach((e) => {
      const status = markings[e.id]?.status;
      if (status) stats[status] += 1;
    });

    function setStatus(id: string, status: AttendanceStatus) {
      setMarkings({
        ...markings,
        [id]: { ...(markings[id] ?? { remarks: "" }), status },
      });
    }

    function markAllPresent() {
      const updated: Markings = { ...markings };
      roster.forEach((e) => {
        updated[e.id] = { ...(updated[e.id] ?? { remarks: "" }), status: "PRESENT" };
      });
      setMarkings(updated);
    }

    function resetPanel() {
      setMarkings(seedMarkingsFor(roster, date));
      toast.info("Reverted to saved attendance");
    }

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="h-11 justify-start gap-2 font-normal">
                <CalendarIcon className="size-4" />
                {format(new Date(date), "dd MMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
              <Calendar
                mode="single"
                selected={new Date(date)}
                onSelect={(d) => {
                  if (!d) return;
                  setDate(format(d, "yyyy-MM-dd"));
                  setDateOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search student..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-10" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-900/10">
            <p className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wide">Present</p>
            <p className="text-2xl font-bold mt-1 text-green-700 dark:text-green-400">{stats.PRESENT}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/10">
            <p className="text-xs font-medium text-red-700 dark:text-red-400 uppercase tracking-wide">Absent</p>
            <p className="text-2xl font-bold mt-1 text-red-700 dark:text-red-400">{stats.ABSENT}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/10">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">Late</p>
            <p className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-400">{stats.LATE}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-900/10">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide">Leave</p>
            <p className="text-2xl font-bold mt-1 text-blue-700 dark:text-blue-400">{stats.LEAVE}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={markAllPresent} className="gap-1.5">
            <CircleCheck className="size-4" />
            Mark all Present
          </Button>
          <Button variant="outline" size="sm" onClick={resetPanel} className="gap-1.5">
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>

        <div className="divide-y divide-border/40 rounded-md border">
          {searched.map((e) => (
            <div key={e.id} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4">
              <div className="flex flex-col gap-3 md:w-64 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                    {e.student.firstName.charAt(0)}
                    {e.student.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium leading-tight">
                      {e.student.firstName} {e.student.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{e.student.admissionNo}</p>
                  </div>
                </div>

                <div className="relative w-full md:w-56">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Remarks (optional)"
                    value={markings[e.id]?.remarks ?? ""}
                    onChange={(ev) =>
                      setMarkings({
                        ...markings,
                        [e.id]: { ...(markings[e.id] ?? { status: "PRESENT", remarks: "" }), remarks: ev.target.value },
                      })
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
                      onClick={() => setStatus(e.id, opt.value)}
                      className={cn(
                        "px-2 py-1.5 md:px-3.5 rounded-md text-[11px] md:text-xs font-semibold border transition-colors text-center",
                        markings[e.id]?.status === opt.value ? statusToggleClass(opt.value) : "border-input text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {searched.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No students match your search.</div>}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border bg-muted/30 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Marking attendance for <span className="font-semibold text-foreground">{stats.total}</span> student{stats.total !== 1 ? "s" : ""} on{" "}
            <span className="font-semibold text-foreground">{format(new Date(date), "dd MMM yyyy")}</span>
          </p>

          <Button onClick={onSave} disabled={saving} className="w-full sm:w-auto sm:min-w-40 h-10">
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
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 mb-6 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">{isTeacherView ? "My Attendance" : "Student Attendance"}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">{isTeacherView ? "Mark attendance for your class and subjects" : "Mark and manage daily student attendance"}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-lg border p-1 bg-muted/40">
                <button
                  onClick={() => setViewMode("attendance")}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    viewMode === "attendance" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ClipboardList className="size-4" />
                  Attendance
                </button>

                <button
                  onClick={() => setViewMode("reports")}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    viewMode === "reports" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <PieChart className="size-4" />
                  Reports
                </button>
              </div>

              {!isTeacherView && (
                <Button className="gap-2 px-5 hidden sm:flex" onClick={() => setAddOpen(true)}>
                  <Plus className="size-4" />
                  Add Entry
                </Button>
              )}
            </div>
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
                        <Button type="button" variant="outline" role="combobox" aria-expanded={enrollmentOpen} className="h-11 w-full justify-between font-normal">
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
                        <Button type="button" variant="outline" className={cn("h-11 w-full justify-start text-left font-normal", !addDate && "text-muted-foreground", formErrors.date && "border-red-500")}>
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

        {viewMode === "attendance" ? (
          isTeacherView ? (
            <div className="space-y-6">
              <div className="inline-flex rounded-xl border bg-card p-1">
                <button
                  type="button"
                  onClick={() => setTeacherTab("class")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                    teacherTab === "class" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <GraduationCap className="size-4" />
                  My Class
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherTab("subjects")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                    teacherTab === "subjects" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <BookOpen className="size-4" />
                  Subject Attendance
                </button>
              </div>

              <div className="bg-card rounded-md border p-4 sm:p-6">
                {teacherTab === "class" ? (
                  !myClassAssignment ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                        <GraduationCap className="size-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold">You are not a class teacher</h3>
                      <p className="max-w-sm text-muted-foreground">You are not currently assigned as the class teacher of any section this session.</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-5 flex flex-wrap items-center gap-2 border-b pb-4">
                        <CircleCheck className="size-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          Class teacher of {myClassAssignment.class.name} — {myClassAssignment.section.name}
                        </span>
                      </div>
                      {renderMarkingPanel({
                        roster: myClassRoster,
                        date: classDate,
                        setDate: setClassDate,
                        dateOpen: classDateOpen,
                        setDateOpen: setClassDateOpen,
                        markings: classMarkings,
                        setMarkings: setClassMarkings,
                        search: classSearch,
                        setSearch: setClassSearch,
                        saving: classSaving,
                        onSave: () => saveRosterMarkings(myClassRoster, classDate, classMarkings, setClassSaving),
                      })}
                    </>
                  )
                ) : selectedAllocation ? (
                  <>
                    <button type="button" onClick={() => setSelectedAllocationId(null)} className="mb-5 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                      <ArrowLeft className="size-4" />
                      Back to subjects
                    </button>

                    <div className="mb-5 flex flex-wrap items-center gap-2 border-b pb-4">
                      <BookOpen className="size-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {selectedAllocation.subject.name} — {selectedAllocation.class.name} {selectedAllocation.section.name}
                        {selectedAllocation.subject.isOptional && <span className="ml-2 text-xs text-muted-foreground">(Elective — allocated students only)</span>}
                      </span>
                    </div>

                    {renderMarkingPanel({
                      roster: subjectRoster,
                      date: subjectDate,
                      setDate: setSubjectDate,
                      dateOpen: subjectDateOpen,
                      setDateOpen: setSubjectDateOpen,
                      markings: subjectMarkings,
                      setMarkings: setSubjectMarkings,
                      search: subjectSearch,
                      setSearch: setSubjectSearch,
                      saving: subjectSaving,
                      onSave: () => saveRosterMarkings(subjectRoster, subjectDate, subjectMarkings, setSubjectSaving),
                    })}
                  </>
                ) : mySubjectAllocations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                      <BookOpen className="size-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No subjects assigned</h3>
                    <p className="max-w-sm text-muted-foreground">You are not currently allocated as a subject teacher for any class this session.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {mySubjectAllocations.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelectedAllocationId(a.id)}
                        className="flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                      >
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <BookOpen className="size-4" />
                        </div>
                        <p className="font-semibold text-foreground">{a.subject.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {a.class.name} — {a.section.name}
                        </p>
                        {a.subject.isOptional && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Elective</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-card rounded-md border p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Select Register</span>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field>
                    <Label>Academic Session</Label>
                    <Select
                      value={recSessionId}
                      onValueChange={(value) => {
                        setRecSessionId(value);
                        setRecRegisterLoaded(false);
                      }}
                    >
                      <SelectTrigger className="h-11 w-full">
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
                      value={recClassId}
                      onValueChange={(value) => {
                        setRecClassId(value);
                        setRecSectionId("");
                        setRecRegisterLoaded(false);
                      }}
                    >
                      <SelectTrigger className="h-11 w-full">
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
                      value={recSectionId}
                      onValueChange={(value) => {
                        setRecSectionId(value);
                        setRecRegisterLoaded(false);
                      }}
                      disabled={!recClassId}
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select Section" />
                      </SelectTrigger>
                      <SelectContent>
                        {recFilteredSections.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Button onClick={handleLoadRecordsRegister} className="h-11 px-6">
                  <Users className="size-4 mr-2" />
                  View Register
                </Button>
              </div>

              {!recRegisterLoaded ? (
                <div className="bg-card rounded-md border p-8 sm:p-16 flex flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <CalendarCheck className="size-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Select a session, class and section</h3>
                  <p className="text-muted-foreground">Then click &ldquo;View Register&rdquo; to see the weekly attendance grid.</p>
                </div>
              ) : recRegisterStudents.length === 0 ? (
                <div className="bg-card rounded-md border p-8 sm:p-16 flex flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <Inbox className="size-6" />
                  </div>
                  <h3 className="text-lg font-semibold">No active students found</h3>
                  <p className="text-muted-foreground">There are no active enrollments for this class and section.</p>
                </div>
              ) : (
                <div className="bg-card rounded-md border p-4 sm:p-6 space-y-5">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input placeholder="Search student..." value={recSearch} onChange={(e) => setRecSearch(e.target.value)} className="h-10 pl-10" />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="icon" className="size-10 shrink-0" onClick={goToPrevWeek} aria-label="Previous week">
                      <ChevronLeft className="size-4" />
                    </Button>

                    <Popover open={weekPickerOpen} onOpenChange={setWeekPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="h-10 justify-start gap-2 font-medium">
                          <CalendarIcon className="size-4" />
                          {format(weekDates[0], "dd MMM")} - {format(weekDates[6], "dd MMM yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <Calendar
                          mode="single"
                          selected={weekAnchor}
                          onSelect={(date) => {
                            if (!date) return;
                            setWeekAnchor(startOfWeek(date));
                            setWeekPickerOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>

                    <Button variant="outline" size="icon" className="size-10 shrink-0" onClick={goToNextWeek} aria-label="Next week">
                      <ChevronRight className="size-4" />
                    </Button>

                    <Button variant="ghost" size="sm" onClick={goToToday} className="text-muted-foreground">
                      Today
                    </Button>
                  </div>

                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader className="bg-gray-50 dark:bg-muted/15 border-b border-border/60">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="sticky left-0 z-10 bg-gray-50 dark:bg-muted/15 font-bold text-xs uppercase tracking-wider py-4 pl-6 text-foreground/80 min-w-52">Student Profile</TableHead>
                          {weekDates.map((date) => (
                            <TableHead key={date.toISOString()} className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 text-center min-w-28">
                              <div>{format(date, "dd")}</div>
                              <div className="font-medium normal-case text-[11px] text-muted-foreground">{format(date, "EEEE")}</div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>

                      <TableBody className="divide-y divide-border/30">
                        {recSearchedStudents.map((enrollment) => (
                          <TableRow key={enrollment.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell className="sticky left-0 z-10 bg-card py-4 pl-6">
                              <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                                  {enrollment.student.firstName.charAt(0)}
                                  {enrollment.student.lastName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-semibold leading-tight">
                                    {enrollment.student.firstName} {enrollment.student.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{enrollment.student.admissionNo}</p>
                                </div>
                              </div>
                            </TableCell>

                            {weekDates.map((date) => {
                              const dateStr = toISODate(date);
                              const record = getAttendanceFor(enrollment.id, dateStr);

                              return (
                                <TableCell key={dateStr} className="py-3 px-2 align-middle">
                                  {record ? (
                                    <button
                                      type="button"
                                      onClick={() => handleCellClick(enrollment.id, dateStr)}
                                      title={record.remarks || undefined}
                                      className={cn("w-full max-w-32 rounded-md px-2 py-2 text-center text-xs font-semibold transition-colors hover:opacity-80", statusBadgeClass(record.status))}
                                    >
                                      <p>{statusLabel(record.status)}</p>
                                      {record.remarks && <p className="mt-0.5 truncate font-normal opacity-80 text-[10px]">{record.remarks}</p>}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleCellClick(enrollment.id, dateStr)}
                                      className="w-full rounded-md px-2 py-2 text-center text-xs font-medium text-muted-foreground/50 border border-dashed border-border hover:bg-muted/40 transition-colors"
                                    >
                                      Not marked
                                    </button>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}

                        {recSearchedStudents.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="p-8 text-center text-muted-foreground text-sm">
                              No students match your search.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <p className="text-xs text-muted-foreground">Tap any cell to add or edit that day&apos;s attendance. Hover a marked cell to read its full remark.</p>
                </div>
              )}
            </div>
          )
        ) : (
          // ── REPORTS ──────────────────────────────────────────────────
          <div className="space-y-6">
            {!isTeacherView && (
              <div className="bg-card rounded-md border p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Select Register</span>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field>
                    <Label>Academic Session</Label>
                    <Select
                      value={repSessionId}
                      onValueChange={(value) => {
                        setRepSessionId(value);
                        setRepLoaded(false);
                      }}
                    >
                      <SelectTrigger className="h-11 w-full">
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
                      value={repClassId}
                      onValueChange={(value) => {
                        setRepClassId(value);
                        setRepSectionId("");
                        setRepLoaded(false);
                      }}
                    >
                      <SelectTrigger className="h-11 w-full">
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
                      value={repSectionId}
                      onValueChange={(value) => {
                        setRepSectionId(value);
                        setRepLoaded(false);
                      }}
                      disabled={!repClassId}
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select Section" />
                      </SelectTrigger>
                      <SelectContent>
                        {repFilteredSections.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Button onClick={handleLoadReportsRegister} className="h-11 px-6">
                  <Users className="size-4 mr-2" />
                  Load Students
                </Button>
              </div>
            )}

            {isTeacherView && !myClassAssignment ? (
              <div className="bg-card rounded-md border p-8 sm:p-16 flex flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <GraduationCap className="size-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">You are not a class teacher</h3>
                <p className="text-muted-foreground">Reports are available for the class you are assigned to as class teacher.</p>
              </div>
            ) : !isTeacherView && !repLoaded ? (
              <div className="bg-card rounded-md border p-8 sm:p-16 flex flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <PieChart className="size-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Select a session, class and section</h3>
                <p className="text-muted-foreground">Then click &ldquo;Load Students&rdquo; to view attendance reports.</p>
              </div>
            ) : reportRoster.length === 0 ? (
              <div className="bg-card rounded-md border p-8 sm:p-16 flex flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Inbox className="size-6" />
                </div>
                <h3 className="text-lg font-semibold">No active students found</h3>
              </div>
            ) : (
              <div className="bg-card rounded-md border p-4 sm:p-6 space-y-4">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input placeholder="Search student..." value={repSearch} onChange={(e) => setRepSearch(e.target.value)} className="h-10 pl-10" />
                </div>

                <div className="divide-y divide-border/40 rounded-md border">
                  {reportSearchedRoster.map((e) => {
                    const stats = statsForEnrollment(e.id);
                    return (
                      <button key={e.id} type="button" onClick={() => openReportDialog(e)} className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/20">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                          {e.student.firstName.charAt(0)}
                          {e.student.lastName.charAt(0)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-tight truncate">
                            {e.student.firstName} {e.student.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{e.student.admissionNo}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <p className={cn("text-sm font-bold", stats.pct >= 75 ? "text-green-600" : stats.pct >= 50 ? "text-amber-600" : "text-red-600")}>{stats.pct}%</p>
                            <p className="text-[11px] text-muted-foreground">{stats.total} days marked</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {reportSearchedRoster.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No students match your search.</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Student report dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden max-h-[85vh] flex flex-col">
          <div className="border-b px-6 py-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <PieChart className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  {reportEnrollment ? `${reportEnrollment.student.firstName} ${reportEnrollment.student.lastName}` : "Student Report"}
                </DialogTitle>
                <DialogDescription>
                  {reportEnrollment ? `${reportEnrollment.student.admissionNo} • ${reportEnrollment.class.name} ${reportEnrollment.section.name}` : ""}
                </DialogDescription>
              </div>
            </div>
          </div>

          {reportEnrollment && (
            <div className="overflow-y-auto p-6 space-y-5">
              {(() => {
                const stats = statsForEnrollment(reportEnrollment.id);
                return (
                  <>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                      <div className="rounded-lg border p-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Attendance</p>
                        <p className={cn("text-2xl font-bold mt-1", stats.pct >= 75 ? "text-green-600" : stats.pct >= 50 ? "text-amber-600" : "text-red-600")}>{stats.pct}%</p>
                      </div>
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-900/10">
                        <p className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wide">Present</p>
                        <p className="text-2xl font-bold mt-1 text-green-700 dark:text-green-400">{stats.present}</p>
                      </div>
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/10">
                        <p className="text-xs font-medium text-red-700 dark:text-red-400 uppercase tracking-wide">Absent</p>
                        <p className="text-2xl font-bold mt-1 text-red-700 dark:text-red-400">{stats.absent}</p>
                      </div>
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/10">
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">Late</p>
                        <p className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-400">{stats.late}</p>
                      </div>
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-900/10">
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide">Leave</p>
                        <p className="text-2xl font-bold mt-1 text-blue-700 dark:text-blue-400">{stats.leave}</p>
                      </div>
                    </div>

                    <div className="divide-y divide-border/40 rounded-md border">
                      {stats.records.map((r) => (
                        <div key={r.id} className="flex items-center gap-3 p-3">
                          <div className="w-24 shrink-0 text-sm font-medium">{format(new Date(r.date), "dd MMM yyyy")}</div>
                          <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold shrink-0", statusBadgeClass(r.status))}>{statusLabel(r.status)}</span>
                          <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground" title={r.remarks || undefined}>
                            {r.remarks}
                          </p>
                          <button type="button" onClick={() => openEditDialog(r)} className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary">
                            <Pencil className="size-3.5" />
                          </button>
                          <button type="button" onClick={() => openDeleteDialog(r)} className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}

                      {stats.records.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No attendance records yet.</div>}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
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
                <div className="h-11 flex items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                  {editingAttendance ? `${editingAttendance.enrollment.student.admissionNo} - ${editingAttendance.enrollment.student.firstName} ${editingAttendance.enrollment.student.lastName}` : ""}
                </div>
              </Field>

              <Field>
                <Label>Date</Label>
                <Popover open={editDateOpen} onOpenChange={setEditDateOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className={cn("h-11 w-full justify-start text-left font-normal", !editDate && "text-muted-foreground")}>
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

      {/* Delete confirmation */}
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