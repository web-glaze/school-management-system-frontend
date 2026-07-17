"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BookOpen, CalendarClock, CalendarRange, CheckCircle2, ClipboardList, Coffee, Loader2, Pencil, Plus, Settings2, Sparkles, Trash2, User } from "lucide-react";
import { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAcademicStore, Timetable } from "@/store/academicStore";
import { usePermission } from "@/hooks/usePermission";

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};

type DayKey = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";

const ALL_DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: "MONDAY", label: "Monday", short: "Mon" },
  { key: "TUESDAY", label: "Tuesday", short: "Tue" },
  { key: "WEDNESDAY", label: "Wednesday", short: "Wed" },
  { key: "THURSDAY", label: "Thursday", short: "Thu" },
  { key: "FRIDAY", label: "Friday", short: "Fri" },
  { key: "SATURDAY", label: "Saturday", short: "Sat" },
];

const DEFAULT_PERIOD_COUNT = 8;
const MIN_PERIODS = 1;
const MAX_PERIODS = 12;
type DayConfig = Record<DayKey, { enabled: boolean; periods: number }>;
const DEFAULT_DAY_CONFIG: DayConfig = ALL_DAYS.reduce((acc, d) => {
  acc[d.key] = { enabled: true, periods: DEFAULT_PERIOD_COUNT };
  return acc;
}, {} as DayConfig);

const DAY_CONFIG_STORAGE_KEY = "timetable:day-config:v1";

function loadDayConfig(): DayConfig {
  if (typeof window === "undefined") return DEFAULT_DAY_CONFIG;
  try {
    const raw = window.localStorage.getItem(DAY_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_DAY_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_DAY_CONFIG, ...parsed };
  } catch {
    return DEFAULT_DAY_CONFIG;
  }
}

const JS_DAY_TO_KEY: Record<number, DayKey | null> = {
  0: null,
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

const SUBJECT_PALETTE = [
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", dot: "bg-violet-500" },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
  { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", dot: "bg-cyan-500" },
  { bg: "bg-fuchsia-50", border: "border-fuchsia-200", text: "text-fuchsia-700", dot: "bg-fuchsia-500" },
  { bg: "bg-lime-50", border: "border-lime-200", text: "text-lime-700", dot: "bg-lime-600" },
] as const;

function subjectColor(subjectId: string) {
  let hash = 0;
  for (let i = 0; i < subjectId.length; i++) {
    hash = (hash * 31 + subjectId.charCodeAt(i)) >>> 0;
  }
  return SUBJECT_PALETTE[hash % SUBJECT_PALETTE.length];
}

interface SlotFormState {
  mode: "create" | "edit";
  entryId?: string;
  day: DayKey | "";
  periodNo: number | "";
  subjectAllocationId: string;
}

const emptySlotForm: SlotFormState = {
  mode: "create",
  day: "",
  periodNo: "",
  subjectAllocationId: "",
};

interface StoredUser {
  teacherId?: string | null;
}

export default function TimetablePage() {
  const {
    loading,
    sessions,
    classes,
    sections,
    subjectAllocations,
    timetables,
    teacherAssignments,
    fetchSessions,
    fetchClasses,
    fetchSections,
    fetchSubjectAllocations,
    fetchTimetables,
    fetchTeacherAssignments,
    createTimetable,
    updateTimetable,
    deleteTimetable,
  } = useAcademicStore();

  const authorized = usePermission("timetable.read");

  // ── Current user / teacher context ────────────────────────────────────
  const [myTeacherId, setMyTeacherId] = useState<string | null>(null);
  const [myPermissions, setMyPermissions] = useState<string[]>([]);
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      const parsed: (StoredUser & { permissions?: string[] }) | null = stored ? JSON.parse(stored) : null;
      setMyTeacherId(parsed?.teacherId ?? null);
      setMyPermissions(parsed?.permissions ?? []);
    } catch {
      setMyTeacherId(null);
      setMyPermissions([]);
    } finally {
      setUserChecked(true);
    }
  }, []);

  const canManageTimetable = myPermissions.includes("timetable.create") || myPermissions.includes("timetable.update") || myPermissions.includes("timetable.delete");

  // Restricted read-only view only applies to teachers who lack management rights
  const isTeacherView = Boolean(myTeacherId) && !canManageTimetable;
  const [teacherTab, setTeacherTab] = useState<"class" | "schedule">("class");
  const [sessionId, setSessionId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [dayConfig, setDayConfig] = useState<DayConfig>(DEFAULT_DAY_CONFIG);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftDayConfig, setDraftDayConfig] = useState<DayConfig>(DEFAULT_DAY_CONFIG);
  useEffect(() => {
    setDayConfig(loadDayConfig());
  }, []);
  const DAYS = useMemo(() => ALL_DAYS.filter((d) => dayConfig[d.key]?.enabled), [dayConfig]);
  const maxPeriods = useMemo(() => (DAYS.length === 0 ? 0 : Math.max(...DAYS.map((d) => dayConfig[d.key].periods))), [DAYS, dayConfig]);
  const PERIODS = useMemo(() => Array.from({ length: maxPeriods }, (_, i) => i + 1), [maxPeriods]);
  const todayKey = JS_DAY_TO_KEY[new Date().getDay()];
  const firstActiveDay = DAYS[0]?.key ?? "MONDAY";
  const [mobileDay, setMobileDay] = useState<DayKey>(todayKey && dayConfig[todayKey]?.enabled ? todayKey : firstActiveDay);
  useEffect(() => {
    if (DAYS.length > 0 && !DAYS.some((d) => d.key === mobileDay)) {
      setMobileDay(DAYS[0].key);
    }
  }, [DAYS]);

  const [slotOpen, setSlotOpen] = useState(false);
  const [slotForm, setSlotForm] = useState<SlotFormState>(emptySlotForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState<Timetable | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!userChecked) return;

    fetchSessions();
    fetchTimetables();
    fetchTeacherAssignments();

    if (!isTeacherView) {
      fetchClasses();
      fetchSections();
      fetchSubjectAllocations();
    }
  }, [userChecked, isTeacherView, fetchSessions, fetchClasses, fetchSections, fetchSubjectAllocations, fetchTimetables, fetchTeacherAssignments]);
  ``;

  // ── Active session (used for both teacher tabs) ─────────────────────────
  const activeSessionId = useMemo(() => {
    const active = sessions.find((s) => s.isActive);
    return active?.id ?? sessions[0]?.id ?? "";
  }, [sessions]);

  // ── Tab 1: My Class (as class teacher) ───────────────────────────────────
  const myClassAssignment = useMemo(() => {
    if (!myTeacherId || !activeSessionId) return null;
    return teacherAssignments.find((a) => a.teacherId === myTeacherId && a.sessionId === activeSessionId) ?? null;
  }, [teacherAssignments, myTeacherId, activeSessionId]);

  const myClassTimetables = useMemo(() => {
    if (!myClassAssignment) return [];
    return timetables.filter((t) => t.sessionId === myClassAssignment.sessionId && t.classId === myClassAssignment.classId && t.sectionId === myClassAssignment.sectionId);
  }, [timetables, myClassAssignment]);

  const myClassCellMap = useMemo(() => {
    const map: Record<string, Timetable> = {};
    myClassTimetables.forEach((t) => {
      map[`${t.dayOfWeek}-${t.periodNo}`] = t;
    });
    return map;
  }, [myClassTimetables]);

  // ── Tab 2: My Schedule (as subject teacher, across all classes) ─────────
  const myScheduleTimetables = useMemo(() => {
    if (!myTeacherId || !activeSessionId) return [];
    return timetables.filter((t) => t.subjectAllocation.teacherId === myTeacherId && t.sessionId === activeSessionId);
  }, [timetables, myTeacherId, activeSessionId]);

  const myScheduleCellMap = useMemo(() => {
    const map: Record<string, Timetable> = {};
    myScheduleTimetables.forEach((t) => {
      map[`${t.dayOfWeek}-${t.periodNo}`] = t;
    });
    return map;
  }, [myScheduleTimetables]);

  const freePeriodCount = useMemo(() => {
    const totalSlots = DAYS.reduce((sum, d) => sum + dayConfig[d.key].periods, 0);
    return totalSlots - myScheduleTimetables.length;
  }, [DAYS, dayConfig, myScheduleTimetables]);

  // ── Admin scope selection (existing behaviour) ───────────────────────────
  const viewSelected = Boolean(sessionId && classId && sectionId);
  const viewTimetables = useMemo(() => {
    if (!viewSelected) return [];
    return timetables.filter((t) => t.sessionId === sessionId && t.classId === classId && t.sectionId === sectionId);
  }, [timetables, sessionId, classId, sectionId, viewSelected]);

  const cellMap = useMemo(() => {
    const map: Record<string, Timetable> = {};
    viewTimetables.forEach((t) => {
      map[`${t.dayOfWeek}-${t.periodNo}`] = t;
    });
    return map;
  }, [viewTimetables]);

  const scopedAllocations = useMemo(() => {
    if (!viewSelected) return [];
    return subjectAllocations.filter((a) => a.sessionId === sessionId && a.classId === classId && a.sectionId === sectionId);
  }, [subjectAllocations, sessionId, classId, sectionId, viewSelected]);

  const activeSubjects = useMemo(() => {
    const map = new Map<string, string>();
    viewTimetables.forEach((t) => {
      map.set(t.subjectAllocation.subject.id, t.subjectAllocation.subject.name);
    });
    return Array.from(map.entries());
  }, [viewTimetables]);

  const totalSlots = useMemo(() => DAYS.reduce((sum, d) => sum + dayConfig[d.key].periods, 0), [DAYS, dayConfig]);
  const filledSlots = viewTimetables.length;
  const completionPct = totalSlots === 0 ? 0 : Math.round((filledSlots / totalSlots) * 100);
  const mobileDayFilled = DAYS.reduce<Record<DayKey, number>>(
    (acc, day) => {
      acc[day.key] = viewTimetables.filter((t) => t.dayOfWeek === day.key).length;
      return acc;
    },
    {} as Record<DayKey, number>
  );

  if (authorized === null || !userChecked) {
    return null;
  }

  function isSlotTaken(day: DayKey | "", period: number | "", excludeId?: string) {
    if (!day || !period) return false;
    const existing = cellMap[`${day}-${period}`];
    return Boolean(existing && existing.id !== excludeId);
  }

  function periodsForDay(day: DayKey | "") {
    if (!day) return PERIODS;
    const count = dayConfig[day]?.periods ?? DEFAULT_PERIOD_COUNT;
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  function openCreateDialog(day?: DayKey, period?: number) {
    if (scopedAllocations.length === 0) {
      toast.error("No subjects have been allocated to this class section yet.");
      return;
    }

    setFormErrors({});
    setSlotForm({
      mode: "create",
      day: day ?? "",
      periodNo: period ?? "",
      subjectAllocationId: "",
    });
    setSlotOpen(true);
  }

  function openEditDialog(entry: Timetable) {
    setFormErrors({});
    setSlotForm({
      mode: "edit",
      entryId: entry.id,
      day: entry.dayOfWeek as DayKey,
      periodNo: entry.periodNo,
      subjectAllocationId: entry.subjectAllocation.id,
    });
    setSlotOpen(true);
  }

  function openDeleteDialog(entry: Timetable) {
    setDeletingEntry(entry);
    setDeleteOpen(true);
  }

  function openSettingsDialog() {
    setDraftDayConfig(dayConfig);
    setSettingsOpen(true);
  }

  function saveSettings() {
    const anyEnabled = ALL_DAYS.some((d) => draftDayConfig[d.key]?.enabled);
    if (!anyEnabled) {
      toast.error("At least one day must stay enabled.");
      return;
    }

    setDayConfig(draftDayConfig);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DAY_CONFIG_STORAGE_KEY, JSON.stringify(draftDayConfig));
    }
    setSettingsOpen(false);
    toast.success("Timetable structure updated");
  }

  const slotConflict = !submitting && isSlotTaken(slotForm.day, slotForm.periodNo, slotForm.entryId);
  const slotComplete = Boolean(slotForm.day && slotForm.periodNo && slotForm.subjectAllocationId);

  async function handleSlotSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slotForm.day || !slotForm.periodNo || slotConflict) return;

    const payload = {
      sessionId,
      classId,
      sectionId,
      subjectAllocationId: slotForm.subjectAllocationId,
      dayOfWeek: slotForm.day,
      periodNo: slotForm.periodNo as number,
    };

    setSubmitting(true);

    try {
      if (slotForm.mode === "edit" && slotForm.entryId) {
        await updateTimetable(slotForm.entryId, payload);
        toast.success("Period updated successfully");
      } else {
        await createTimetable(payload);
        toast.success("Period scheduled successfully");
      }

      setSlotOpen(false);
      setSlotForm(emptySlotForm);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || "Failed to save this period");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deletingEntry) return;

    setDeleting(true);

    try {
      await deleteTimetable(deletingEntry.id);
      toast.success("Period removed from timetable");
      setDeleteOpen(false);
      setDeletingEntry(null);
    } catch {
      toast.error("Failed to remove this period");
    } finally {
      setDeleting(false);
    }
  }

  function renderGridCell(day: DayKey, period: number) {
    const dayPeriodCount = dayConfig[day]?.periods ?? DEFAULT_PERIOD_COUNT;

    if (period > dayPeriodCount) {
      return <div className="flex h-20 w-full items-center justify-center rounded-xl border border-dashed border-border/40 text-xs text-muted-foreground/30">—</div>;
    }

    const entry = cellMap[`${day}-${period}`];

    if (!entry) {
      return (
        <button
          type="button"
          onClick={() => openCreateDialog(day, period)}
          className="group flex h-20 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground/50 transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
        >
          <Plus className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="text-[11px] font-medium opacity-0 transition-opacity group-hover:opacity-100">Add</span>
        </button>
      );
    }

    const color = subjectColor(entry.subjectAllocation.subject.id);

    return (
      <div className={cn("group relative flex h-20 w-full min-w-0 flex-col justify-center gap-0.5 overflow-hidden rounded-xl border px-3 py-2 transition-shadow hover:shadow-sm", color.bg, color.border)}>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={cn("size-1.5 shrink-0 rounded-full", color.dot)} />
          <p className={cn("min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight", color.text)} title={entry.subjectAllocation.subject.name}>
            {entry.subjectAllocation.subject.name}
          </p>
        </div>

        <div className="flex min-w-0 items-center gap-1 pl-3 text-xs text-muted-foreground">
          <User className="size-3 shrink-0" />
          <span className="min-w-0 flex-1 truncate" title={entry.subjectAllocation.teacher.name}>
            {entry.subjectAllocation.teacher.name}
          </span>
        </div>

        <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => openEditDialog(entry)}
            className="flex size-6 items-center justify-center rounded-md bg-background/80 text-muted-foreground shadow-sm hover:bg-background hover:text-primary"
          >
            <Pencil className="size-3" />
          </button>
          <button
            type="button"
            onClick={() => openDeleteDialog(entry)}
            className="flex size-6 items-center justify-center rounded-md bg-background/80 text-muted-foreground shadow-sm hover:bg-background hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
    );
  }

  function renderMobileRow(period: number) {
    const dayPeriodCount = dayConfig[mobileDay]?.periods ?? DEFAULT_PERIOD_COUNT;

    if (period > dayPeriodCount) {
      return null;
    }

    const entry = cellMap[`${mobileDay}-${period}`];

    if (!entry) {
      return (
        <button
          type="button"
          onClick={() => openCreateDialog(mobileDay, period)}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3.5 text-muted-foreground/60 transition-colors active:bg-primary/5"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">P{period}</span>
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Plus className="size-4" />
            Add period
          </span>
        </button>
      );
    }

    const color = subjectColor(entry.subjectAllocation.subject.id);

    return (
      <div className={cn("flex w-full items-center gap-3 rounded-xl border px-4 py-3.5", color.bg, color.border)}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/70 text-xs font-semibold text-muted-foreground">P{period}</span>

        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm font-semibold leading-tight", color.text)}>{entry.subjectAllocation.subject.name}</p>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <User className="size-3 shrink-0" />
            <span className="truncate">{entry.subjectAllocation.teacher.name}</span>
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <button type="button" onClick={() => openEditDialog(entry)} className="flex size-8 items-center justify-center rounded-lg bg-background/70 text-muted-foreground active:bg-background">
            <Pencil className="size-3.5" />
          </button>
          <button type="button" onClick={() => openDeleteDialog(entry)} className="flex size-8 items-center justify-center rounded-lg bg-background/70 text-muted-foreground active:bg-background">
            <Trash2 className="size-3.5 text-destructive" />
          </button>
        </div>
      </div>
    );
  }

  function renderReadonlyCell(entry: Timetable | undefined, subtitle: (t: Timetable) => string, freeLabel: string, dayPeriodCount: number, period: number) {
    if (period > dayPeriodCount) {
      return <div className="flex h-20 w-full items-center justify-center rounded-xl border border-dashed border-border/40 text-xs text-muted-foreground/30">—</div>;
    }

    if (!entry) {
      return (
        <div className="flex h-20 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border/60 text-muted-foreground/50">
          <Coffee className="size-3.5" />
          <span className="text-[11px] font-medium">{freeLabel}</span>
        </div>
      );
    }

    const color = subjectColor(entry.subjectAllocation.subject.id);

    return (
      <div className={cn("flex h-20 w-full min-w-0 flex-col justify-center gap-0.5 overflow-hidden rounded-xl border px-3 py-2", color.bg, color.border)}>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={cn("size-1.5 shrink-0 rounded-full", color.dot)} />
          <p className={cn("min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight", color.text)} title={entry.subjectAllocation.subject.name}>
            {entry.subjectAllocation.subject.name}
          </p>
        </div>
        <p className="truncate pl-3 text-xs text-muted-foreground" title={subtitle(entry)}>
          {subtitle(entry)}
        </p>
      </div>
    );
  }

  function renderReadonlyMobileRow(entry: Timetable | undefined, subtitle: (t: Timetable) => string, freeLabel: string, dayPeriodCount: number, period: number) {
    if (period > dayPeriodCount) return null;

    if (!entry) {
      return (
        <div className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border/60 px-4 py-3.5 text-muted-foreground/60">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">P{period}</span>
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Coffee className="size-4" />
            {freeLabel}
          </span>
        </div>
      );
    }

    const color = subjectColor(entry.subjectAllocation.subject.id);

    return (
      <div className={cn("flex w-full items-center gap-3 rounded-xl border px-4 py-3.5", color.bg, color.border)}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/70 text-xs font-semibold text-muted-foreground">P{period}</span>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm font-semibold leading-tight", color.text)}>{entry.subjectAllocation.subject.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle(entry)}</p>
        </div>
      </div>
    );
  }

  function renderReadonlySchedule(cellMapForView: Record<string, Timetable>, subtitle: (t: Timetable) => string, freeLabel: string) {
    return (
      <>
        <div className="md:hidden">
          <div className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {DAYS.map((day) => {
              const isActive = mobileDay === day.key;
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setMobileDay(day.key)}
                  className={cn(
                    "flex shrink-0 flex-col items-center rounded-xl border px-3.5 py-2 transition-colors",
                    isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground",
                    !isActive && day.key === todayKey && "border-primary/40 text-primary"
                  )}
                >
                  <span className="text-xs font-semibold">{day.short}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            {PERIODS.map((period) => {
              const dayPeriodCount = dayConfig[mobileDay]?.periods ?? DEFAULT_PERIOD_COUNT;
              const entry = cellMapForView[`${mobileDay}-${period}`];
              return <div key={period}>{renderReadonlyMobileRow(entry, subtitle, freeLabel, dayPeriodCount, period)}</div>;
            })}
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <Table className="min-w-240 table-fixed border-separate border-spacing-y-2">
            <colgroup>
              <col className="w-20" />
              {DAYS.map((day) => (
                <col key={day.key} className="w-37.5" />
              ))}
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold uppercase tracking-wider text-foreground/80">Period</TableHead>
                {DAYS.map((day) => (
                  <TableHead key={day.key} className={cn("rounded-t-lg text-center text-xs font-bold uppercase tracking-wider text-foreground/80", day.key === todayKey && "bg-primary/5 text-primary")}>
                    <div className="flex items-center justify-center gap-1.5">
                      {day.label}
                      {day.key === todayKey && <span className="size-1.5 rounded-full bg-primary" />}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {PERIODS.map((period) => (
                <TableRow key={period} className="hover:bg-transparent">
                  <TableCell className="align-middle text-sm font-semibold text-muted-foreground">Period {period}</TableCell>
                  {DAYS.map((day) => {
                    const dayPeriodCount = dayConfig[day.key]?.periods ?? DEFAULT_PERIOD_COUNT;
                    const entry = cellMapForView[`${day.key}-${period}`];
                    return (
                      <TableCell key={day.key} className={cn("p-1.5 align-top", day.key === todayKey && "bg-primary/2")}>
                        {renderReadonlyCell(entry, subtitle, freeLabel, dayPeriodCount, period)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // TEACHER VIEW
  // ══════════════════════════════════════════════════════════════════════
  if (isTeacherView) {
    return (
      <DashboardLayout>
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">My Timetable</h1>
            <p className="text-sm text-muted-foreground sm:text-base">View your class and teaching schedule</p>
          </div>
        </div>

        <div className="mb-6 inline-flex rounded-xl border bg-card p-1">
          <button
            type="button"
            onClick={() => setTeacherTab("class")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              teacherTab === "class" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ClipboardList className="size-4" />
            My Class
          </button>
          <button
            type="button"
            onClick={() => setTeacherTab("schedule")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              teacherTab === "schedule" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarClock className="size-4" />
            My Schedule
          </button>
        </div>

        <div className="rounded-md border bg-card p-4 sm:p-5">
          {loading && timetables.length === 0 ? (
            <div className="space-y-3">
              {PERIODS.map((p) => (
                <div key={p} className="h-16 rounded-xl bg-muted animate-pulse sm:h-20" />
              ))}
            </div>
          ) : teacherTab === "class" ? (
            !myClassAssignment ? (
              <div className="flex flex-col items-center justify-center py-16 text-center sm:py-20">
                <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                  <ClipboardList className="size-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">You are not a class teacher</h3>
                <p className="max-w-sm text-muted-foreground">You are not currently assigned as the class teacher of any section this session.</p>
              </div>
            ) : (
              <>
                <div className="mb-5 flex flex-wrap items-center gap-2 border-b pb-4">
                  <CheckCircle2 className="size-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Class teacher of {myClassAssignment.class.name} — {myClassAssignment.section.name}
                  </span>
                </div>
                {renderReadonlySchedule(myClassCellMap, (t) => `Taught by ${t.subjectAllocation.teacher.name}`, "Free")}
              </>
            )
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center gap-4 border-b pb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{myScheduleTimetables.length} periods this week</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coffee className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{freePeriodCount} free periods</span>
                </div>
              </div>
              {renderReadonlySchedule(myScheduleCellMap, (t) => `${t.class.name} — ${t.section.name}`, "Free")}
            </>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // ADMIN VIEW
  // ══════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Timetable</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Build and manage the weekly period schedule for a class section</p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Button variant="outline" className="h-11 shrink-0 px-3 sm:px-4 gap-2" onClick={openSettingsDialog}>
            <Settings2 className="size-4" />
            <span className="hidden sm:inline">Days &amp; Periods</span>
          </Button>

          <div className="flex-1 sm:flex-none">
            <Button className="w-full gap-2 px-3 sm:w-auto sm:px-5" disabled={!viewSelected} onClick={() => openCreateDialog()}>
              <Plus className="size-4" />
              Add Period
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-md border bg-card p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-1.5">
          <CalendarRange className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Viewing timetable for</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field>
            <Label>Academic Session</Label>
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger className=" h-11 w-full">
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
          </Field>

          <Field>
            <Label>Class</Label>
            <Select value={classId} onValueChange={setClassId}>
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
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger className=" h-11 w-full">
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
        </div>

        {viewSelected && (
          <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {filledSlots} / {totalSlots} periods scheduled
              </span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:w-32">
                <div className={cn("h-full rounded-full transition-all", completionPct === 100 ? "bg-emerald-500" : "bg-primary")} style={{ width: `${completionPct}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{completionPct}%</span>
            </div>

            {activeSubjects.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <BookOpen className="size-3.5 shrink-0 text-muted-foreground" />
                {activeSubjects.map(([id, name]) => {
                  const color = subjectColor(id);
                  return (
                    <span key={id} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium", color.bg, color.border, color.text)}>
                      <span className={cn("size-1.5 rounded-full", color.dot)} />
                      {name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-md border bg-card p-4 sm:p-5">
        {DAYS.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center sm:py-20">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
              <Settings2 className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No school days enabled</h3>
            <p className="max-w-sm text-muted-foreground">Use &quot;Days &amp; Periods&quot; above to enable at least one day.</p>
          </div>
        ) : !viewSelected ? (
          <div className="flex flex-col items-center justify-center py-16 text-center sm:py-20">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
              <CalendarRange className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Select a session, class and section</h3>
            <p className=" max-w-sm text-muted-foreground">Choose all three above to view and build that section&apos;s weekly timetable.</p>
          </div>
        ) : loading && timetables.length === 0 ? (
          <div className="space-y-3">
            {PERIODS.map((p) => (
              <div key={p} className="h-16 rounded-xl bg-muted animate-pulse sm:h-20" />
            ))}
          </div>
        ) : (
          <>
            <div className="md:hidden">
              <div className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
                {DAYS.map((day) => {
                  const isActive = mobileDay === day.key;
                  const filled = mobileDayFilled[day.key] ?? 0;
                  const dayPeriodCount = dayConfig[day.key]?.periods ?? DEFAULT_PERIOD_COUNT;
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => setMobileDay(day.key)}
                      className={cn(
                        "flex shrink-0 flex-col items-center rounded-xl border px-3.5 py-2 transition-colors",
                        isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground",
                        !isActive && day.key === todayKey && "border-primary/40 text-primary"
                      )}
                    >
                      <span className="text-xs font-semibold">{day.short}</span>
                      <span className={cn("text-[10px]", isActive ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        {filled}/{dayPeriodCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                {PERIODS.map((period) => (
                  <div key={period}>{renderMobileRow(period)}</div>
                ))}
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <Table className="min-w-240 table-fixed border-separate border-spacing-y-2">
                <colgroup>
                  <col className="w-20" />
                  {DAYS.map((day) => (
                    <col key={day.key} className="w-37.5" />
                  ))}
                </colgroup>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-foreground/80">Period</TableHead>
                    {DAYS.map((day) => (
                      <TableHead key={day.key} className={cn("rounded-t-lg text-center text-xs font-bold uppercase tracking-wider text-foreground/80", day.key === todayKey && "bg-primary/5 text-primary")}>
                        <div className="flex items-center justify-center gap-1.5">
                          {day.label}
                          {day.key === todayKey && <span className="size-1.5 rounded-full bg-primary" />}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {PERIODS.map((period) => (
                    <TableRow key={period} className="hover:bg-transparent">
                      <TableCell className="align-middle text-sm font-semibold text-muted-foreground">Period {period}</TableCell>
                      {DAYS.map((day) => (
                        <TableCell key={day.key} className={cn("p-1.5 align-top", day.key === todayKey && "bg-primary/2")}>
                          {renderGridCell(day.key, period)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-2xl p-0 overflow-hidden sm:max-w-105">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Settings2 className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Days &amp; Periods</DialogTitle>
                <DialogDescription>Update days and number of periods.</DialogDescription>
              </div>
            </div>
          </div>

          <div className="max-h-[55vh] space-y-2 overflow-y-auto p-5">
            {ALL_DAYS.map((day) => {
              const config = draftDayConfig[day.key];
              return (
                <div key={day.key} className={cn("flex items-center gap-2 rounded-xl border p-3 transition-colors", config.enabled ? "border-border" : "border-border/50 bg-muted/30")}>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) =>
                      setDraftDayConfig((p) => ({
                        ...p,
                        [day.key]: { ...p[day.key], enabled: checked },
                      }))
                    }
                  />

                  <span className={cn("flex-1 text-sm font-medium", !config.enabled && "text-muted-foreground")}>{day.label}</span>

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={MIN_PERIODS}
                      max={MAX_PERIODS}
                      value={config.periods}
                      disabled={!config.enabled}
                      onChange={(e) => {
                        const raw = Number(e.target.value);
                        const clamped = Number.isFinite(raw) ? Math.min(MAX_PERIODS, Math.max(MIN_PERIODS, raw)) : MIN_PERIODS;
                        setDraftDayConfig((p) => ({
                          ...p,
                          [day.key]: { ...p[day.key], periods: clamped },
                        }));
                      }}
                      className="h-9 w-14 text-center"
                    />
                    <span className="text-xs text-muted-foreground">periods</span>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 px-7 pb-7">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>

            <Button type="button" onClick={saveSettings} className="min-w-32">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={slotOpen}
        onOpenChange={(open) => {
          setSlotOpen(open);
          if (!open) {
            setSlotForm(emptySlotForm);
            setFormErrors({});
          }
        }}
      >
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-[22rem] rounded-2xl overflow-hidden p-0 sm:max-w-105">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                {slotForm.mode === "edit" ? <Pencil className="size-5 text-primary" /> : <Sparkles className="size-5 text-primary" />}
              </div>
              <div>
                <DialogTitle>{slotForm.mode === "edit" ? "Edit Period" : "Schedule a Period"}</DialogTitle>
                <DialogDescription>{slotForm.mode === "edit" ? "Update the day, period or subject for this slot." : "Assign a subject allocation to a day and period."}</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSlotSubmit} className="space-y-6 p-6">
            <FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <Label>Day</Label>
                  <Select
                    value={slotForm.day}
                    onValueChange={(value) =>
                      setSlotForm((p) => {
                        const day = value as DayKey;
                        const maxForDay = dayConfig[day]?.periods ?? DEFAULT_PERIOD_COUNT;
                        const periodNo = typeof p.periodNo === "number" && p.periodNo <= maxForDay ? p.periodNo : "";
                        return { ...p, day, periodNo };
                      })
                    }
                  >
                    <SelectTrigger className=" h-11 w-full">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem key={day.key} value={day.key}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <Label>Period</Label>
                  <Select value={slotForm.periodNo ? String(slotForm.periodNo) : ""} onValueChange={(value) => setSlotForm((p) => ({ ...p, periodNo: Number(value) }))}>
                    <SelectTrigger className=" h-11 w-full">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodsForDay(slotForm.day).map((p) => (
                        <SelectItem key={p} value={String(p)}>
                          Period {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {slotConflict && <p className="text-sm text-rose-600">This day and period already has a period scheduled. Pick another slot, or edit the existing one.</p>}

              <Field>
                <Label>Subject</Label>
                <Select
                  value={slotForm.subjectAllocationId}
                  onValueChange={(value) => {
                    setSlotForm((p) => ({ ...p, subjectAllocationId: value }));
                    setFormErrors((p) => ({ ...p, subjectAllocationId: "" }));
                  }}
                >
                  <SelectTrigger className=" h-11 w-full">
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {scopedAllocations.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.subject.name} — {item.teacher.name}
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

              <Button type="submit" disabled={submitting || !slotComplete || slotConflict} className="min-w-32">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : slotForm.mode === "edit" ? (
                  <>
                    <Pencil className="mr-2 size-4" />
                    Update
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 size-4" />
                    Schedule
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-105">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="size-6 text-destructive" />
            </div>
            <AlertDialogTitle className="w-full text-center text-xl">Remove this period?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This will remove <span className="font-semibold text-foreground">{deletingEntry?.subjectAllocation.subject.name}</span>
              {" from "}
              <span className="font-semibold text-foreground">{deletingEntry ? ALL_DAYS.find((d) => d.key === deletingEntry.dayOfWeek)?.label : ""}</span>
              {", Period "}
              <span className="font-semibold text-foreground">{deletingEntry?.periodNo}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4 flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="h-11 w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="h-11 w-full bg-destructive text-white hover:bg-destructive/90 sm:w-auto">
              {deleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 size-4" />
                  Remove period
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
