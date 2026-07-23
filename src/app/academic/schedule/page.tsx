"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Field, FieldGroup } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Briefcase,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Layers,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  Music2,
  PartyPopper,
  Pencil,
  Plus,
  School,
  Sparkles,
  Trash2,
  Trees,
  Trophy,
  Users,
} from "lucide-react";
import { AxiosError } from "axios";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { useAcademicStore, CalendarEvent } from "@/store/academicStore";
import { usePermission } from "@/hooks/usePermission";

type ApiErrorResponse = { message?: string; errors?: Record<string, string> };
type TabKey = "calendar" | "upcoming";
type CalendarView = "month" | "week" | "list";
type EventType = CalendarEvent["eventType"];
type EventScope = CalendarEvent["scope"];
type TimetableEffect = CalendarEvent["timetableEffect"];
type UpcomingRangeKey = "TODAY" | "TOMORROW" | "NEXT_7_DAYS" | "NEXT_30_DAYS";

const EVENT_TYPE_META: Record<EventType, { label: string; bg: string; border: string; text: string; dot: string; icon: typeof CalendarDays }> = {
  HOLIDAY: { label: "Holiday", bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", dot: "bg-rose-500", icon: Trees },
  EVENT: { label: "Event", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500", icon: PartyPopper },
  EXAM: { label: "Exam", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500", icon: FileText },
  PTM: { label: "PTM", bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", dot: "bg-violet-500", icon: Users },
  SPORTS: { label: "Sports", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", icon: Trophy },
  CULTURAL: { label: "Cultural", bg: "bg-fuchsia-50", border: "border-fuchsia-200", text: "text-fuchsia-700", dot: "bg-fuchsia-500", icon: Music2 },
  STAFF_MEETING: { label: "Staff Meeting", bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", dot: "bg-cyan-500", icon: Briefcase },
  OTHER: { label: "Other", bg: "bg-lime-50", border: "border-lime-200", text: "text-lime-700", dot: "bg-lime-600", icon: Layers },
};

const EVENT_TYPES = Object.keys(EVENT_TYPE_META) as EventType[];

const SCOPE_META: Record<EventScope, { label: string; icon: typeof School }> = {
  WHOLE_SCHOOL: { label: "Whole School", icon: School },
  SPECIFIC_CLASSES: { label: "Specific Classes", icon: Layers },
  SPECIFIC_SECTIONS: { label: "Specific Sections", icon: Users },
};

const TIMETABLE_EFFECT_OPTIONS: { value: TimetableEffect; label: string }[] = [
  { value: "NONE", label: "None" },
  { value: "HOLIDAY_BLOCK_TIMETABLE", label: "Holiday" },
  { value: "REPLACE_TIMETABLE", label: "Replace Timetable" },
  { value: "NOTICE_ONLY", label: "Notice Only" },
];

const UPCOMING_RANGES: { key: UpcomingRangeKey; label: string }[] = [
  { key: "TODAY", label: "Today" },
  { key: "TOMORROW", label: "Tomorrow" },
  { key: "NEXT_7_DAYS", label: "Next 7 Days" },
  { key: "NEXT_30_DAYS", label: "Next 30 Days" },
];

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CALENDAR_VIEW_OPTIONS: { key: CalendarView; label: string; icon: typeof CalendarDays }[] = [
  { key: "month", label: "Month", icon: LayoutGrid },
  { key: "week", label: "Week", icon: CalendarRange },
  { key: "list", label: "List", icon: ListIcon },
];

interface EventFormState {
  mode: "create" | "edit";
  eventId?: string;
  title: string;
  description: string;
  sessionId: string;
  eventType: EventType;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  startTime: string;
  endTime: string;
  scope: EventScope;
  classIds: string[];
  sectionIds: string[];
  timetableEffect: TimetableEffect;
  isPublished: boolean;
  isActive: boolean;
}

const emptyEventForm: EventFormState = {
  mode: "create",
  title: "",
  description: "",
  sessionId: "",
  eventType: "EVENT",
  startDate: "",
  endDate: "",
  isAllDay: true,
  startTime: "",
  endTime: "",
  scope: "WHOLE_SCHOOL",
  classIds: [],
  sectionIds: [],
  timetableEffect: "NONE",
  isPublished: false,
  isActive: true,
};

function toDateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function formatISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function formatDisplayDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function formatMonthLabel(d: Date) {
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
function getMonthMatrix(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startWeekday = (first.getDay() + 6) % 7; // Monday = 0
  const gridStart = addDays(first, -startWeekday);
  const weeks: Date[][] = [];
  let cur = gridStart;
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(cur);
      cur = addDays(cur, 1);
    }
    weeks.push(week);
  }
  return weeks;
}
function eventsOnDate(events: CalendarEvent[], date: Date) {
  return events.filter((e) => {
    const s = toDateOnly(new Date(e.startDate));
    const en = toDateOnly(new Date(e.endDate));
    return date >= s && date <= en;
  });
}
function daysUntil(dateStr: string, today: Date) {
  const s = toDateOnly(new Date(dateStr));
  return Math.round((s.getTime() - today.getTime()) / 86400000);
}
function scopeLabelFor(entry: CalendarEvent) {
  if (entry.scope === "WHOLE_SCHOOL") return "Whole School";
  if (entry.scope === "SPECIFIC_CLASSES") {
    return (
      entry.classes
        .map((c) => c.class?.name)
        .filter(Boolean)
        .join(", ") || "Specific Classes"
    );
  }
  return (
    entry.sections
      .map((s) => s.section?.name)
      .filter(Boolean)
      .join(", ") || "Specific Sections"
  );
}

function toTimeInputValue(value?: string) {
  if (!value) return "";
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function to12hLabel(value?: string) {
  const time24 = toTimeInputValue(value);
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${mStr} ${period}`;
}

function parseTime24(value?: string) {
  const time24 = toTimeInputValue(value);
  if (!time24) return { hour12: "", minute: "", period: "AM" as const };
  const [hStr, mStr] = time24.split(":");
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

function TimePickerPopover({ value, onChange, icon, placeholder, fullWidth }: { value?: string; onChange: (value: string) => void; icon?: ReactNode; placeholder?: string; fullWidth?: boolean }) {
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
        <Button type="button" variant="outline" className={cn("h-10 justify-start gap-1.5 font-normal", fullWidth && "w-full", !value && "text-muted-foreground")}>
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

export default function SchedulePage() {
  const { loading, sessions, classes, sections, events, fetchSessions, fetchClasses, fetchSections, fetchEvents, createEvent, updateEvent, deleteEvent } = useAcademicStore();

  const authorized = usePermission("schedule.read");

  const [myPermissions, setMyPermissions] = useState<string[]>([]);
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      const parsed: { permissions?: string[] } | null = stored ? JSON.parse(stored) : null;
      setMyPermissions(parsed?.permissions ?? []);
    } catch {
      setMyPermissions([]);
    } finally {
      setUserChecked(true);
    }
  }, []);

  const canCreate = myPermissions.includes("schedule.create");
  const canUpdate = myPermissions.includes("schedule.update");
  const canDelete = myPermissions.includes("schedule.delete");

  useEffect(() => {
    if (!userChecked) return;
    fetchSessions();
    fetchClasses();
    fetchSections();
    fetchEvents();
  }, [userChecked, fetchSessions, fetchClasses, fetchSections, fetchEvents]);

  const today = useMemo(() => toDateOnly(new Date()), []);

  const activeSessionId = useMemo(() => {
    const active = sessions.find((s) => s.isActive);
    return active?.id ?? sessions[0]?.id ?? "";
  }, [sessions]);

  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  // ── Tabs ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>("calendar");

  const TABS: { key: TabKey; label: string; icon: typeof CalendarDays }[] = [
    { key: "calendar", label: "Calendar", icon: CalendarDays },
    { key: "upcoming", label: "Upcoming", icon: CalendarClock },
  ];

  // ── Shared filters (Calendar / Upcoming / Dashboard) ────────────────
  const [filterSessionId, setFilterSessionId] = useState("");
  const [filterEventType, setFilterEventType] = useState<EventType | "ALL">("ALL");

  useEffect(() => {
    if (!filterSessionId && activeSessionId) setFilterSessionId(activeSessionId);
  }, [activeSessionId, filterSessionId]);

  const scopedEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterSessionId && e.sessionId !== filterSessionId) return false;
      if (filterEventType !== "ALL" && e.eventType !== filterEventType) return false;
      return true;
    });
  }, [events, filterSessionId, filterEventType]);

  // ── Create / Edit form ───────────────────────────────────────────────
  const [form, setForm] = useState<EventFormState>(emptyEventForm);
  const [initialForm, setInitialForm] = useState<EventFormState | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (form.mode === "create" && !form.sessionId && activeSessionId) {
      setForm((p) => ({ ...p, sessionId: activeSessionId }));
    }
  }, [activeSessionId, form.mode, form.sessionId]);

  function startCreate(prefillDate?: Date) {
    setFormErrors({});
    setForm({
      ...emptyEventForm,
      sessionId: filterSessionId || activeSessionId,
      startDate: prefillDate ? formatISODate(prefillDate) : "",
      endDate: prefillDate ? formatISODate(prefillDate) : "",
    });
    setCreateDialogOpen(true);
  }

  function startEdit(entry: CalendarEvent) {
    setFormErrors({});
    const editForm: EventFormState = {
      mode: "edit",
      eventId: entry.id,
      title: entry.title,
      description: entry.description ?? "",
      sessionId: entry.sessionId,
      eventType: entry.eventType,
      startDate: formatISODate(new Date(entry.startDate)),
      endDate: formatISODate(new Date(entry.endDate)),
      isAllDay: entry.isAllDay,
      startTime: entry.startTime ?? "",
      endTime: entry.endTime ?? "",
      scope: entry.scope,
      classIds: entry.classes?.map((c) => c.classId) ?? [],
      sectionIds: entry.sections?.map((s) => s.sectionId) ?? [],
      timetableEffect: entry.timetableEffect,
      isPublished: entry.isPublished,
      isActive: entry.isActive,
    };

    setForm(editForm);
    setInitialForm(editForm);
    setEditDialogOpen(true);
  }

  const formValid =
    form.title.trim().length > 0 &&
    form.sessionId.length > 0 &&
    form.startDate.length > 0 &&
    form.endDate.length > 0 &&
    form.endDate >= form.startDate &&
    (form.scope !== "SPECIFIC_CLASSES" || form.classIds.length > 0) &&
    (form.scope !== "SPECIFIC_SECTIONS" || form.sectionIds.length > 0) &&
    (form.isAllDay || (form.startTime.length > 0 && form.endTime.length > 0));

  async function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formValid) return;

    const wasEdit = form.mode === "edit";
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      sessionId: form.sessionId,
      eventType: form.eventType,
      startDate: form.startDate,
      endDate: form.endDate,
      isAllDay: form.isAllDay,
      startTime: form.isAllDay ? undefined : form.startTime,
      endTime: form.isAllDay ? undefined : form.endTime,
      scope: form.scope,
      classIds: form.scope === "SPECIFIC_CLASSES" ? form.classIds : undefined,
      sectionIds: form.scope === "SPECIFIC_SECTIONS" ? form.sectionIds : undefined,
      timetableEffect: form.timetableEffect,
      isPublished: form.isPublished,
      isActive: form.isActive,
    };

    setSubmitting(true);
    try {
      if (form.mode === "edit" && form.eventId) {
        await updateEvent(form.eventId, payload);
        toast.success("Event updated successfully");
      } else {
        await createEvent(payload);
        toast.success("Event created successfully");
      }
      setForm({ ...emptyEventForm, sessionId: filterSessionId || activeSessionId });
      setFormErrors({});
      if (wasEdit) {
        setEditDialogOpen(false);
      } else {
        setCreateDialogOpen(false);
      }
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || "Failed to save this event");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  // ── Delete confirmation (shared across tabs) ────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openDeleteDialog(entry: CalendarEvent) {
    setDeletingEvent(entry);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deletingEvent) return;
    setDeleting(true);
    try {
      await deleteEvent(deletingEvent.id);
      toast.success("Event deleted");
      setDeleteOpen(false);
      setDeletingEvent(null);
    } catch {
      toast.error("Failed to delete this event");
    } finally {
      setDeleting(false);
    }
  }

  // ── Create popup ─────────────────────────────────────────────────────
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  function closeCreateDialog() {
    setCreateDialogOpen(false);
    setForm({ ...emptyEventForm, sessionId: filterSessionId || activeSessionId });
    setFormErrors({});
  }

  // ── Edit popup (does not touch the active tab) ─────────────────────
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  function closeEditDialog() {
    setEditDialogOpen(false);
    setForm({ ...emptyEventForm, sessionId: filterSessionId || activeSessionId });
    setInitialForm(null);
    setFormErrors({});
  }

  // ── View details popup ───────────────────────────────────────────────
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);

  function openViewDialog(entry: CalendarEvent) {
    setViewingEvent(entry);
    setViewOpen(true);
  }

  // ── Calendar tab state ───────────────────────────────────────────────
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [monthCursor, setMonthCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [weekAnchor, setWeekAnchor] = useState(today);
  const monthMatrix = useMemo(() => getMonthMatrix(monthCursor), [monthCursor]);
  const selectedDateEvents = useMemo(() => (selectedDate ? eventsOnDate(scopedEvents, selectedDate) : []), [scopedEvents, selectedDate]);
  const weekDates = useMemo(() => {
    const startWeekday = (weekAnchor.getDay() + 6) % 7;
    const start = addDays(weekAnchor, -startWeekday);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [weekAnchor]);
  const listEvents = useMemo(() => {
    const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const monthEnd = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
    return [...scopedEvents]
      .filter((e) => {
        const s = toDateOnly(new Date(e.startDate));
        const en = toDateOnly(new Date(e.endDate));
        return en >= monthStart && s <= monthEnd;
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [scopedEvents, monthCursor]);

  function goPrev() {
    if (calendarView === "week") {
      setWeekAnchor((d) => addDays(d, -7));
    } else {
      setMonthCursor((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1));
    }
  }
  function goNext() {
    if (calendarView === "week") {
      setWeekAnchor((d) => addDays(d, 7));
    } else {
      setMonthCursor((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1));
    }
  }
  function goToday() {
    setMonthCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
    setWeekAnchor(today);
  }
  function headerLabel() {
    if (calendarView === "week") {
      const start = weekDates[0];
      const end = weekDates[6];
      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()} – ${end.getDate()} ${formatMonthLabel(start)}`;
      }
      return `${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} – ${end.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;
    }
    return formatMonthLabel(monthCursor);
  }

  // ── Upcoming tab state ───────────────────────────────────────────────
  const [upcomingRange, setUpcomingRange] = useState<UpcomingRangeKey>("NEXT_30_DAYS");

  const upcomingEvents = useMemo(() => {
    const maxDays = upcomingRange === "TODAY" ? 0 : upcomingRange === "TOMORROW" ? 1 : upcomingRange === "NEXT_7_DAYS" ? 7 : 30;
    return scopedEvents
      .filter((e) => {
        const diff = daysUntil(e.startDate, today);
        return diff >= 0 && diff <= maxDays;
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [scopedEvents, upcomingRange, today]);

  if (authorized === null || !userChecked) {
    return null;
  }

  function renderEventCard(entry: CalendarEvent) {
    const meta = EVENT_TYPE_META[entry.eventType];
    const Icon = meta.icon;
    const diff = daysUntil(entry.startDate, today);

    return (
      <div
        key={entry.id}
        role="button"
        tabIndex={0}
        onClick={() => openViewDialog(entry)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openViewDialog(entry);
        }}
        className="group flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
      >
        <div
          className={cn(
            "flex size-11 shrink-0 flex-col items-center justify-center rounded-lg border text-center",
            entry.isPublished ? cn(meta.bg, meta.border, meta.text) : "border-dashed border-border bg-muted text-muted-foreground"
          )}
          title={entry.isPublished ? "Published" : "Draft"}
        >
          <span className="text-[10px] font-semibold uppercase">{new Date(entry.startDate).toLocaleDateString("en-IN", { month: "short" })}</span>
          <span className="text-sm font-bold leading-none">{new Date(entry.startDate).getDate()}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className={cn("inline-flex max-w-full items-center gap-1 truncate rounded-full border px-2 py-0.5 text-[11px] font-medium", meta.bg, meta.border, meta.text)}>
              <Icon className="size-3 shrink-0" />
              <span className="truncate">{meta.label}</span>
            </span>
            {!entry.isPublished && (
              <Badge variant="outline" className="shrink-0 text-[11px]">
                Draft
              </Badge>
            )}
          </div>
          <p className="truncate text-sm font-semibold text-foreground" title={entry.title}>
            {entry.title}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">{diff >= 0 && <span className="rounded-full  bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">{diff === 0 ? "Today" : `${diff}d`}</span>}</div>
      </div>
    );
  }

  function renderFiltersBar() {
    return (
      <div className="mb-5 flex flex-col gap-3 rounded-md border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <Label>Academic Session</Label>
            <Select value={filterSessionId} onValueChange={setFilterSessionId}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue className="truncate" placeholder="Select Session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="block max-w-60 truncate">{s.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <Label>Event Type</Label>
            <Select value={filterEventType} onValueChange={(v) => setFilterEventType(v as EventType | "ALL")}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue className="truncate" placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {EVENT_TYPE_META[t].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
    );
  }

  // ── Calendar tab ─────────────────────────────────────────────────────
  function renderCalendarTab() {
    return (
      <>
        {renderFiltersBar()}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-0">
            <Button variant="outline" size="icon" className="size-9" onClick={goPrev}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-32 text-center text-sm font-semibold text-foreground">{headerLabel()}</span>
            <Button variant="outline" size="icon" className="size-9" onClick={goNext}>
              <ChevronRight className="size-4" />
            </Button>
            <div className="bg-card ml-2 rounded-2xl border">
              <Button variant="ghost" size="sm" onClick={goToday}>
                Today
              </Button>
            </div>
          </div>

          <div className="inline-flex rounded-xl sm-w-full border bg-card p-1">
            {CALENDAR_VIEW_OPTIONS.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => setCalendarView(v.key)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs w-full font-semibold transition-colors",
                  calendarView === v.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <v.icon className="size-3.5 shrink-0" />
                <span className="truncate">{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {loading && events.length === 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : calendarView === "month" ? (
          <div className="rounded-md border bg-card p-3 sm:p-4">
            <div className="mb-2 grid grid-cols-7 gap-1.5">
              {WEEKDAY_LABELS.map((d) => (
                <div key={d} className="py-1 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              {monthMatrix.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1.5">
                  {week.map((date, di) => {
                    const inMonth = date.getMonth() === monthCursor.getMonth();
                    const isToday = isSameDate(date, today);
                    const isSelected = selectedDate && isSameDate(date, selectedDate);
                    const dayEvents = eventsOnDate(scopedEvents, date);
                    const shown = dayEvents.slice(0, 2);
                    const extra = dayEvents.length - shown.length;

                    return (
                      <button
                        key={di}
                        type="button"
                        onClick={() => {
                          setSelectedDate(date);
                          setWeekAnchor(date);
                        }}
                        onDoubleClick={() => canCreate && startCreate(date)}
                        className={cn(
                          "group flex h-24 flex-col items-start gap-1 overflow-hidden rounded-lg border p-1.5 text-left transition-colors sm:h-28 sm:p-2",
                          inMonth ? "bg-background" : "bg-muted/30 text-muted-foreground/50",
                          isSelected ? "border-primary ring-1 ring-primary" : "border-border/60 hover:border-primary/40"
                        )}
                      >
                        <div className="flex w-full shrink-0 items-center justify-between">
                          <span className={cn("text-xs font-semibold", isToday && "flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground")}>{date.getDate()}</span>
                          {canCreate && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                startCreate(date);
                              }}
                              className="hidden size-4 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100 sm:flex"
                            >
                              <Plus className="size-3.5" />
                            </span>
                          )}
                        </div>

                        <div className="flex w-full min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                          {shown.map((ev) => {
                            const meta = EVENT_TYPE_META[ev.eventType];
                            return (
                              <span key={ev.id} className={cn("block w-full truncate rounded px-1 py-0.5 text-[10px] font-medium", meta.bg, meta.text)} title={ev.title}>
                                {ev.title}
                              </span>
                            );
                          })}
                          {extra > 0 && <span className="shrink-0 truncate text-[10px] font-medium text-muted-foreground">+{extra} more</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : calendarView === "week" ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
            {weekDates.map((date, i) => {
              const dayEvents = eventsOnDate(scopedEvents, date);
              const isToday = isSameDate(date, today);
              return (
                <div key={i} className={cn("rounded-xl border bg-card p-3", isToday && "border-primary/50 bg-primary/5")}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-muted-foreground">{WEEKDAY_LABELS[i]}</span>
                    <span className={cn("text-sm font-semibold", isToday && "text-primary")}>{date.getDate()}</span>
                  </div>
                  <div className="space-y-1.5">
                    {dayEvents.length === 0 ? (
                      <p className="text-xs text-muted-foreground/50">No events</p>
                    ) : (
                      dayEvents.map((ev) => {
                        const meta = EVENT_TYPE_META[ev.eventType];
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => openViewDialog(ev)}
                            title={ev.title}
                            className={cn("block w-full truncate rounded-lg border px-2 py-1 text-left text-xs font-medium", meta.bg, meta.border, meta.text)}
                          >
                            {ev.title}
                          </button>
                        );
                      })
                    )}
                    {canCreate && (
                      <button
                        type="button"
                        onClick={() => startCreate(date)}
                        className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border py-1.5 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary"
                      >
                        <Plus className="size-3" />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Showing events for {formatMonthLabel(monthCursor)}</p>
            {listEvents.length === 0 ? <EmptyState icon={CalendarDays} title="No events found" description="Try adjusting your filters, or create a new event." /> : listEvents.map((ev) => renderEventCard(ev))}
          </div>
        )}

        {calendarView === "month" && selectedDate && (
          <div className="mt-5 rounded-md border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <CalendarRange className="size-4 shrink-0 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Events on {selectedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</h3>
            </div>
            {selectedDateEvents.length === 0 ? <p className="text-sm text-muted-foreground">No events scheduled for this date.</p> : <div className="space-y-2">{selectedDateEvents.map((ev) => renderEventCard(ev))}</div>}
          </div>
        )}
      </>
    );
  }

  // ── Upcoming tab ─────────────────────────────────────────────────────
  function renderUpcomingTab() {
    return (
      <>
        {renderFiltersBar()}
        <div className="mb-5 flex justify-center sm:justify-end">
          <div className="inline-flex w-full overflow-x-auto rounded-xl border bg-card p-1 sm:w-auto">
            {UPCOMING_RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setUpcomingRange(r.key)}
                className={cn(
                  "flex w-full items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:w-auto",
                  upcomingRange === r.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="truncate">{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {loading && events.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)
          ) : upcomingEvents.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Nothing coming up" description="No events fall within this range." />
          ) : (
            upcomingEvents.map((ev) => renderEventCard(ev))
          )}
        </div>
      </>
    );
  }

  // ── Create / Edit form body (shared markup used inside both popups) ──
  function renderEventFormFields() {
    return (
      <>
        {/* Basics */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Basics</p>
          <FieldGroup>
            <Field>
              <Label>Event Title</Label>
              <Input placeholder="e.g. Annual Sports Day" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="h-10" />
            </Field>
            <Field>
              <Label>Description</Label>
              <Textarea placeholder="Optional notes — venue, attendance rules, etc." value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </Field>
          </FieldGroup>
        </div>

        {/* Event Type */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Event Type</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {EVENT_TYPES.map((t) => {
              const meta = EVENT_TYPE_META[t];
              const Icon = meta.icon;
              const selected = form.eventType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, eventType: t }))}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 text-center transition-colors",
                    selected ? cn(meta.bg, meta.border, meta.text) : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="w-full truncate text-xs font-semibold">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Schedule */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Schedule</p>
          <FieldGroup>
            <Field>
              <Label>Academic Session</Label>
              <Select value={form.sessionId} onValueChange={(v) => setForm((p) => ({ ...p, sessionId: v }))}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue className="truncate" placeholder="Select Session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="block max-w-60 truncate">{s.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <Label>Start Date</Label>

                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className={cn("h-10 w-full justify-start text-left font-normal", !form.startDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 size-4 shrink-0" />
                      <span>{form.startDate ? format(new Date(form.startDate), "dd MMM yyyy") : "Pick a date"}</span>
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <Calendar
                      mode="single"
                      selected={form.startDate ? new Date(form.startDate) : undefined}
                      onSelect={(date) => {
                        if (!date) return;

                        const value = format(date, "yyyy-MM-dd");

                        setForm((p) => ({
                          ...p,
                          startDate: value,
                          endDate: p.endDate && p.endDate >= value ? p.endDate : value,
                        }));

                        setStartDateOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </Field>
              <Field>
                <Label>End Date</Label>

                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className={cn("h-10 w-full justify-start text-left font-normal", !form.endDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 size-4 shrink-0" />
                      <span>{form.endDate ? format(new Date(form.endDate), "dd MMM yyyy") : "Pick a date"}</span>
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <Calendar
                      mode="single"
                      selected={form.endDate ? new Date(form.endDate) : undefined}
                      disabled={(date) => (form.startDate ? date < new Date(form.startDate) : false)}
                      onSelect={(date) => {
                        if (!date) return;

                        setForm((p) => ({
                          ...p,
                          endDate: format(date, "yyyy-MM-dd"),
                        }));

                        setEndDateOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </Field>
            </div>
            {form.endDate && form.startDate && form.endDate < form.startDate && <p className="text-sm text-rose-600">End date must be on or after the start date.</p>}

            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">All Day</p>
                <p className="text-xs text-muted-foreground">Turn off to set specific start/end times</p>
              </div>
              <Switch checked={form.isAllDay} onCheckedChange={(checked) => setForm((p) => ({ ...p, isAllDay: checked }))} />
            </div>

            {!form.isAllDay && (
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <Label>Start Time</Label>
                  <TimePickerPopover
                    value={form.startTime}
                    onChange={(value) =>
                      setForm((p) => ({
                        ...p,
                        startTime: value,
                      }))
                    }
                    icon={<Clock className="size-4" />}
                    placeholder="Select time"
                    fullWidth
                  />
                </Field>
                <Field>
                  <Label>End Time</Label>
                  <TimePickerPopover
                    value={form.endTime}
                    onChange={(value) =>
                      setForm((p) => ({
                        ...p,
                        endTime: value,
                      }))
                    }
                    icon={<Clock className="size-4" />}
                    placeholder="Select time"
                    fullWidth
                  />
                </Field>
              </div>
            )}
          </FieldGroup>
        </div>

        {/* Scope */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Scope</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(SCOPE_META) as EventScope[]).map((s) => {
              const meta = SCOPE_META[s];
              const Icon = meta.icon;
              const selected = form.scope === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, scope: s }))}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 text-center text-xs font-semibold transition-colors",
                    selected ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="w-full truncate">{meta.label}</span>
                </button>
              );
            })}
          </div>

          {form.scope === "SPECIFIC_CLASSES" && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {classes.map((c) => {
                const selected = form.classIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        classIds: selected ? p.classIds.filter((id) => id !== c.id) : [...p.classIds, c.id],
                      }))
                    }
                    className={cn(
                      "max-w-40 truncate rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                    title={c.name}
                  >
                    {c.name}
                  </button>
                );
              })}
              {classes.length === 0 && <p className="text-xs text-muted-foreground">No classes found.</p>}
            </div>
          )}

          {form.scope === "SPECIFIC_SECTIONS" && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sections.map((s) => {
                const selected = form.sectionIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        sectionIds: selected ? p.sectionIds.filter((id) => id !== s.id) : [...p.sectionIds, s.id],
                      }))
                    }
                    className={cn(
                      "max-w-40 truncate rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                    title={s.name}
                  >
                    {s.name}
                  </button>
                );
              })}
              {sections.length === 0 && <p className="text-xs text-muted-foreground">No sections found.</p>}
            </div>
          )}
        </div>

        {/* Timetable */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Timetable Effect</p>
          <Select value={form.timetableEffect} onValueChange={(v) => setForm((p) => ({ ...p, timetableEffect: v as TimetableEffect }))}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue className="truncate" />
            </SelectTrigger>
            <SelectContent>
              {TIMETABLE_EFFECT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Status</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <span className="text-sm font-medium text-foreground">Published</span>
              <Switch checked={form.isPublished} onCheckedChange={(checked) => setForm((p) => ({ ...p, isPublished: checked }))} />
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <span className="text-sm font-medium text-foreground">Active</span>
              <Switch checked={form.isActive} onCheckedChange={(checked) => setForm((p) => ({ ...p, isActive: checked }))} />
            </div>
          </div>
        </div>
      </>
    );
  }

  // ────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">Academic Calendar</h1>
          <p className="truncate text-sm text-muted-foreground sm:text-base">Manage holidays, exams, and school-wide events</p>
        </div>

        {canCreate && (
          <Button onClick={() => startCreate()} className="w-full shrink-0 justify-center px-4 sm:w-auto">
            <Plus className="mr-2 size-4 shrink-0" />
            <span>Create</span>
          </Button>
        )}
      </div>

      <div className="mb-6 flex w-full rounded-xl border bg-card p-1 sm:inline-flex sm:w-fit sm:flex-wrap sm:gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "flex flex-1 items-center justify-center rounded-lg p-2.5 transition-colors sm:flex-none sm:gap-2 sm:px-4 sm:py-2",
              activeTab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="size-5 shrink-0" />
            <span className="hidden truncate text-sm font-semibold sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "calendar" && renderCalendarTab()}
      {activeTab === "upcoming" && renderUpcomingTab()}

      {/* Create Event popup */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => (open ? setCreateDialogOpen(true) : closeCreateDialog())}>
        <DialogContent className="max-h-[78vh] overflow-y-auto p-0 sm:max-w-xl">
          <DialogHeader>
            <div className="border-b px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="size-5 text-primary" />
                </div>

                <div className="min-w-0">
                  <DialogTitle className="truncate text-left text-lg">Create Event</DialogTitle>
                  <DialogDescription className="text-left">Add a new entry to the school calendar and optionally scope it to selected classes.</DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-6 p-6">
            {renderEventFormFields()}

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={closeCreateDialog}>
                Cancel
              </Button>

              <Button type="submit" disabled={submitting || !formValid} className="w-full min-w-36 sm:w-auto">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 size-4" />
                    Create Event
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Event popup — keeps the user on whatever tab they were viewing */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => (open ? setEditDialogOpen(true) : closeEditDialog())}>
        <DialogContent className="max-h-[78vh] overflow-y-auto p-0 sm:max-w-xl">
          <DialogHeader>
            <div className="border-b px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Pencil className="size-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="truncate text-left text-lg">Edit Event</DialogTitle>
                  <DialogDescription className="text-left">Update event details.</DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-6 p-6">
            {renderEventFormFields()}

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={closeEditDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !formValid || !isDirty} className="w-full min-w-36 sm:w-auto">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 size-4" />
                    Update Event
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Event details popup */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-h-[85vh] overflow-x-hidden overflow-y-auto rounded-2xl sm:max-w-lg">
          {viewingEvent && (
            <>
              <DialogHeader className="gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {(() => {
                    const meta = EVENT_TYPE_META[viewingEvent.eventType];
                    const Icon = meta.icon;
                    return (
                      <span className={cn("inline-flex max-w-full items-center gap-1 truncate rounded-full border px-2.5 py-1 text-xs font-semibold", meta.bg, meta.border, meta.text)}>
                        <Icon className="size-3.5 shrink-0" />
                        <span className="truncate">{meta.label}</span>
                      </span>
                    );
                  })()}
                  <Badge variant={viewingEvent.isPublished ? "secondary" : "outline"} className="shrink-0">
                    {viewingEvent.isPublished ? "Published" : "Draft"}
                  </Badge>
                  <Badge variant={viewingEvent.isActive ? "secondary" : "outline"} className="shrink-0">
                    {viewingEvent.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <DialogTitle className="text-left text-xl break-all">{viewingEvent.title}</DialogTitle>
              </DialogHeader>

              <div className="h-px bg-border" />

              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Description</p>
                  {viewingEvent.description ? (
                    <DialogDescription className="rounded-xl border bg-muted/40 p-3 text-left text-sm leading-relaxed whitespace-pre-wrap break-all text-foreground">{viewingEvent.description}</DialogDescription>
                  ) : (
                    <DialogDescription className="text-left text-sm italic">No description added.</DialogDescription>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Details</p>
                  <div className="divide-y overflow-hidden rounded-xl border bg-card">
                    <div className="flex items-center gap-3 p-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <CalendarRange className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Date</p>
                        <p className="truncate text-sm font-medium text-foreground">
                          {formatDisplayDate(viewingEvent.startDate)}
                          {viewingEvent.endDate !== viewingEvent.startDate ? ` – ${formatDisplayDate(viewingEvent.endDate)}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Clock className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Time</p>
                        <p className="truncate text-sm font-medium text-foreground">{viewingEvent.isAllDay ? "All Day" : `${viewingEvent.startTime}${viewingEvent.endTime ? ` – ${viewingEvent.endTime}` : ""}`}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Users className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Scope</p>
                        <p className="truncate text-sm font-medium text-foreground" title={scopeLabelFor(viewingEvent)}>
                          {scopeLabelFor(viewingEvent)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <CalendarClock className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Timetable Effect</p>
                        <p className="truncate text-sm font-medium text-foreground">{TIMETABLE_EFFECT_OPTIONS.find((o) => o.value === viewingEvent.timetableEffect)?.label}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-1 flex-col gap-2 border-t pt-4 sm:flex-row">
                {canUpdate && (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setViewOpen(false);
                      startEdit(viewingEvent);
                    }}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive sm:w-auto"
                    onClick={() => {
                      setViewOpen(false);
                      openDeleteDialog(viewingEvent);
                    }}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-105">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="size-6 text-destructive" />
            </div>
            <AlertDialogTitle className="w-full text-center text-xl">Delete this event?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This will permanently remove{" "}
              <span className="inline-block max-w-70 truncate align-bottom font-semibold text-foreground" title={deletingEvent?.title}>
                {deletingEvent?.title}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4 flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="h-11 w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="h-11 w-full bg-destructive text-white hover:bg-destructive/90 sm:w-auto">
              {deleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 size-4" />
                  Delete event
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof CalendarDays; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border bg-card py-16 text-center sm:py-20">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <h3 className="max-w-full truncate text-lg font-semibold text-foreground">{title}</h3>
      <p className="max-w-sm truncate text-muted-foreground">{description}</p>
    </div>
  );
}
