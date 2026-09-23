"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Calendar as CalendarIcon, Clock, ClipboardList, ListChecks, Loader2, MoreVertical, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAcademicStore, Exam, ExamGroup, ExamSchedule } from "@/store/academicStore";
import { usePermission } from "@/hooks/usePermission";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { eachDayOfInterval, format } from "date-fns";

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};

type ExamStatusT = "DRAFT" | "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
type ExamShiftT = "MORNING" | "AFTERNOON";

interface StoredUser {
  teacherId?: string | null;
}

const EXAM_STATUS_OPTIONS: {
  value: ExamStatusT;
  label: string;
}[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const EXAM_STATUS_FILTER_OPTIONS: {
  value: ExamStatusT | "ALL";
  label: string;
}[] = [{ value: "ALL", label: "All" }, ...EXAM_STATUS_OPTIONS];

const SHIFT_OPTIONS: {
  value: ExamShiftT;
  label: string;
}[] = [
  { value: "MORNING", label: "Morning" },
  { value: "AFTERNOON", label: "Afternoon" },
];

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => i * 5);

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function toDateInputValue(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function toLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toTimeInputValue(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function combineDateAndTime(dateStr: string, timeStr: string): string | undefined {
  if (!dateStr || !timeStr) return undefined;

  const [hours, minutes] = timeStr.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return undefined;

  const date = new Date(`${dateStr}T00:00:00`);

  if (Number.isNaN(date.getTime())) return undefined;

  date.setHours(hours, minutes, 0, 0);

  return date.toISOString();
}

function formatTimeDisplay(value: string) {
  if (!value) return "";

  const [hourStr, minuteStr] = value.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return "";

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;

  return `${String(displayHour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
}

function parseTimeValue(value: string) {
  if (!value) return { hour: 9, minute: 0, period: "AM" as const };

  const [hourStr, minuteStr] = value.split(":");
  const hour24 = Number(hourStr);
  const minute = Number(minuteStr);

  const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return { hour, minute, period };
}

function buildTimeValue(hour: number, minute: number, period: "AM" | "PM") {
  let hour24 = hour % 12;

  if (period === "PM") hour24 += 12;

  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function statusLabel(status: ExamStatusT) {
  return EXAM_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status;
}

function shiftLabel(shift: ExamShiftT) {
  return shift === "MORNING" ? "Morning" : "Afternoon";
}

function statusDotClass(status: ExamStatusT) {
  switch (status) {
    case "DRAFT":
      return "bg-gray-500";
    case "SCHEDULED":
      return "bg-blue-500";
    case "ONGOING":
      return "bg-amber-500";
    case "COMPLETED":
      return "bg-green-500";
    case "CANCELLED":
      return "bg-red-500";
  }
}

function statusBadgeClass(status: ExamStatusT) {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    case "SCHEDULED":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "ONGOING":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "COMPLETED":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "CANCELLED":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  }
}

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function TimePicker({ value, onChange, placeholder = "Select time", disabled }: TimePickerProps) {
  const [open, setOpen] = useState(false);

  const parsed = parseTimeValue(value);

  const update = (patch: Partial<{ hour: number; minute: number; period: "AM" | "PM" }>) => {
    const next = { ...parsed, ...patch };

    onChange(buildTimeValue(next.hour, next.minute, next.period));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled} className="h-11 w-full justify-start gap-2 font-normal">
          <Clock className="size-4 shrink-0 text-muted-foreground" />

          {value ? formatTimeDisplay(value) : <span className="text-muted-foreground">{placeholder}</span>}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex items-center gap-2">
          <Select value={String(parsed.hour)} onValueChange={(v) => update({ hour: Number(v) })}>
            <SelectTrigger className="h-9 w-17">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {HOUR_OPTIONS.map((h) => (
                <SelectItem key={h} value={String(h)}>
                  {String(h).padStart(2, "0")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-sm font-medium text-muted-foreground">:</span>

          <Select value={String(parsed.minute)} onValueChange={(v) => update({ minute: Number(v) })}>
            <SelectTrigger className="h-9 w-17">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {MINUTE_OPTIONS.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {String(m).padStart(2, "0")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={parsed.period} onValueChange={(v) => update({ period: v as "AM" | "PM" })}>
            <SelectTrigger className="h-9 w-19">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function ExamsPage() {
  const {
    loading,
    sessions,
    subjects,
    subjectAllocations,
    examGroups,
    exams,

    fetchSessions,
    fetchSubjects,
    fetchSubjectAllocations,
    fetchExamGroups,
    fetchExams,

    createExam,
    updateExam,
    deleteExam,

    createExamGroup,
    updateExamGroup,
    deleteExamGroup,

    createExamSchedule,
    updateExamSchedule,
    deleteExamSchedule,

    createExamSubjectComponent,
    updateExamSubjectComponent,
    deleteExamSubjectComponent,

    classComponentTemplates,
    fetchClassComponentTemplates,
    createClassComponentTemplate,
    copyClassComponentTemplate,
    deleteClassComponentTemplate,
    replaceClassComponentTemplateDefinitions,
    syncExamComponentsForClassExamGroup,

    classes,
    fetchClasses,
  } = useAcademicStore();

  const authorized = usePermission("exam.read");
  const canCreate = usePermission("exam.create");
  const canUpdate = usePermission("exam.update");
  const canDelete = usePermission("exam.delete");
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

  useEffect(() => {
    if (!userChecked) return;

    fetchSessions();
    fetchSubjects();
    fetchExamGroups();
    fetchExams();
    fetchSubjectAllocations();
    fetchClasses();
  }, [userChecked]);

  const activeSessionId = useMemo(() => {
    const active = sessions.find((session) => session.isActive);

    return active?.id ?? sessions[0]?.id ?? "";
  }, [sessions]);

  const sortedExamGroups = useMemo(() => [...examGroups].sort((a, b) => a.sequence - b.sequence), [examGroups]);

  const activeExamGroupId = useMemo(() => {
    const active = sortedExamGroups.find((group) => group.isActive);

    return active?.id ?? sortedExamGroups[0]?.id ?? "";
  }, [sortedExamGroups]);

  const examGroupLabel = (id: string) => examGroups.find((group) => group.id === id)?.name ?? "—";

  const teacherAllocations = useMemo(() => {
    if (!myTeacherId) return [];

    return subjectAllocations.filter((allocation) => allocation.teacherId === myTeacherId);
  }, [subjectAllocations, myTeacherId]);

  const teacherAllocationIds = useMemo(() => new Set(teacherAllocations.map((allocation) => allocation.id)), [teacherAllocations]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExamStatusT | "ALL">("ALL");
  const [sessionFilter, setSessionFilter] = useState("ALL");

  const visibleExams = useMemo(() => {
    return exams
      .filter((exam) => {
        const matchesSearch = exam.name.toLowerCase().includes(search.toLowerCase()) || examGroupLabel(exam.examGroupId).toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === "ALL" || exam.status === statusFilter;

        const matchesSession = sessionFilter === "ALL" || exam.sessionId === sessionFilter;

        const examSchedules = exam.schedules ?? [];

        const matchesTeacher = !isTeacherView || examSchedules.length === 0 || examSchedules.some((schedule) => teacherAllocationIds.has(schedule.subjectAllocationId));

        return matchesSearch && matchesStatus && matchesSession && matchesTeacher;
      })
      .sort((a, b) => {
        const first = new Date(a.startDate).getTime();
        const second = new Date(b.startDate).getTime();

        return second - first;
      });
  }, [exams, search, statusFilter, sessionFilter, isTeacherView, teacherAllocationIds, examGroups]);

  const [addOpen, setAddOpen] = useState(false);
  const [addSessionId, setAddSessionId] = useState("");
  const [addName, setAddName] = useState("");
  const [addExamGroupId, setAddExamGroupId] = useState("");
  const [addStartDate, setAddStartDate] = useState(todayStr());
  const [addEndDate, setAddEndDate] = useState(todayStr());
  const [addDescription, setAddDescription] = useState("");
  const [addStatus, setAddStatus] = useState<ExamStatusT>("DRAFT");
  const [addStartOpen, setAddStartOpen] = useState(false);
  const [addEndOpen, setAddEndOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editName, setEditName] = useState("");
  const [editExamGroupId, setEditExamGroupId] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<ExamStatusT>("DRAFT");
  const [editStartOpen, setEditStartOpen] = useState(false);
  const [editEndOpen, setEditEndOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [detailExamId, setDetailExamId] = useState<string | null>(null);
  const detailExam = useMemo(() => exams.find((exam) => exam.id === detailExamId) ?? null, [exams, detailExamId]);
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [scheduleClassFilter, setScheduleClassFilter] = useState("ALL");
  const [scheduleSectionFilter, setScheduleSectionFilter] = useState("ALL");
  const [scheduleShiftFilter, setScheduleShiftFilter] = useState<ExamShiftT | "ALL">("ALL");
  const hasActiveScheduleFilters = Boolean(scheduleSearch) || scheduleClassFilter !== "ALL" || scheduleSectionFilter !== "ALL" || scheduleShiftFilter !== "ALL";
  const [dateSheetTab, setDateSheetTab] = useState<"manage" | "datesheet">("manage");
  const detailClasses = useMemo(() => {
    if (!detailExam) return [];

    const map = new Map<string, { id: string; name: string }>();

    (detailExam.schedules ?? []).forEach((schedule) => {
      if (isTeacherView && !teacherAllocationIds.has(schedule.subjectAllocationId)) {
        return;
      }

      map.set(schedule.subjectAllocation.class.id, {
        id: schedule.subjectAllocation.class.id,
        name: schedule.subjectAllocation.class.name,
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [detailExam, isTeacherView, teacherAllocationIds]);

  const detailSections = useMemo(() => {
    if (!detailExam) return [];

    const map = new Map<string, { id: string; name: string }>();

    (detailExam.schedules ?? []).forEach((schedule) => {
      if (isTeacherView && !teacherAllocationIds.has(schedule.subjectAllocationId)) {
        return;
      }

      if (scheduleClassFilter !== "ALL" && schedule.subjectAllocation.class.id !== scheduleClassFilter) {
        return;
      }

      map.set(schedule.subjectAllocation.section.id, {
        id: schedule.subjectAllocation.section.id,
        name: schedule.subjectAllocation.section.name,
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [detailExam, scheduleClassFilter, isTeacherView, teacherAllocationIds]);

  const pivotClasses = useMemo(() => {
    return [...detailClasses].sort((a, b) => {
      const numA = parseInt(a.name, 10);
      const numB = parseInt(b.name, 10);

      if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) {
        return numA - numB;
      }

      return a.name.localeCompare(b.name);
    });
  }, [detailClasses]);

  const pivotDates = useMemo(() => {
    if (!detailExam) return [];

    try {
      return eachDayOfInterval({ start: new Date(detailExam.startDate), end: new Date(detailExam.endDate) });
    } catch {
      return [];
    }
  }, [detailExam]);

  const pivotSubjectsByDateAndClass = useMemo(() => {
    const map = new Map<string, string[]>();

    if (!detailExam) return map;

    (detailExam.schedules ?? []).forEach((schedule) => {
      if (isTeacherView && !teacherAllocationIds.has(schedule.subjectAllocationId)) {
        return;
      }

      const key = `${toDateInputValue(schedule.examDate)}::${schedule.subjectAllocation.class.id}`;
      const existing = map.get(key) ?? [];
      const subjectName = schedule.subjectAllocation.subject.name;

      if (!existing.includes(subjectName)) {
        existing.push(subjectName);
      }

      map.set(key, existing);
    });

    return map;
  }, [detailExam, isTeacherView, teacherAllocationIds]);

  const pivotCell = (dateStr: string, classId: string) => {
    const subjects = pivotSubjectsByDateAndClass.get(`${dateStr}::${classId}`);

    return subjects && subjects.length > 0 ? subjects.join(" / ") : "-";
  };

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null);
  const [scheduleAllocationId, setScheduleAllocationId] = useState("");
  const [scheduleExamDate, setScheduleExamDate] = useState("");
  const [scheduleShift, setScheduleShift] = useState<ExamShiftT>("MORNING");
  const [scheduleStartTime, setScheduleStartTime] = useState("");
  const [scheduleEndTime, setScheduleEndTime] = useState("");
  const [scheduleRoom, setScheduleRoom] = useState("");
  const [scheduleAllocationOpen, setScheduleAllocationOpen] = useState(false);
  const [scheduleDateOpen, setScheduleDateOpen] = useState(false);
  const [detailScheduleDeleteOpen, setDetailScheduleDeleteOpen] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState<ExamSchedule | null>(null);
  const [examGroupManagerOpen, setExamGroupManagerOpen] = useState(false);
  const [editingExamGroup, setEditingExamGroup] = useState<ExamGroup | null>(null);
  const [egName, setEgName] = useState("");
  const [egCode, setEgCode] = useState("");
  const [egSequence, setEgSequence] = useState("1");
  const [egIsActive, setEgIsActive] = useState(true);
  const [egDeleteOpen, setEgDeleteOpen] = useState(false);
  const [deletingExamGroup, setDeletingExamGroup] = useState<ExamGroup | null>(null);
  const [componentOpen, setComponentOpen] = useState(false);
  const [componentContext, setComponentContext] = useState<{
    examId: string;
    subjectId: string;
    subjectName: string;
  } | null>(null);
  const [editingComponent, setEditingComponent] = useState<{ id: string } | null>(null);
  const [componentName, setComponentName] = useState("");
  const [componentCode, setComponentCode] = useState("");
  const [componentMaximumMarks, setComponentMaximumMarks] = useState("");
  const [componentPassingMarks, setComponentPassingMarks] = useState("");
  const [componentWeightage, setComponentWeightage] = useState("");
  const [componentDisplayOrder, setComponentDisplayOrder] = useState("1");
  const [componentIsOptionalSubject, setComponentIsOptionalSubject] = useState(false);
  const [componentDeleteOpen, setComponentDeleteOpen] = useState(false);
  const [deletingComponent, setDeletingComponent] = useState<{ id: string } | null>(null);
  const [componentTemplateOpen, setComponentTemplateOpen] = useState(false);
  const [componentTemplateContext, setComponentTemplateContext] = useState<{
    classId: string;
    className: string;
    examGroupId: string;
    examGroupName: string;
  } | null>(null);
  const [componentTemplateSelectedSubjectId, setComponentTemplateSelectedSubjectId] = useState<string | null>(null);
  const [componentTemplateDefRows, setComponentTemplateDefRows] = useState<
    { name: string; source: "FETCHED" | "MANUAL"; maximumMarks: string; passingMarks: string; displayOrder: number }[]
  >([]);
  const [savingComponentTemplate, setSavingComponentTemplate] = useState(false);
  const [componentTemplateDeleteOpen, setComponentTemplateDeleteOpen] = useState(false);
  const [syncingComponents, setSyncingComponents] = useState(false);
  const [copyTemplateOpen, setCopyTemplateOpen] = useState(false);
  const [copyTargetClassIds, setCopyTargetClassIds] = useState<string[]>([]);
  const [copyingTemplate, setCopyingTemplate] = useState(false);

  const sortedClasses = useMemo(() => [...classes].sort((a, b) => a.sortOrder - b.sortOrder), [classes]);

  const classComponentTemplateRowsForExamGroup = useMemo(() => {
    if (!componentTemplateContext) return [];

    return classComponentTemplates.filter((t) => t.classId === componentTemplateContext.classId && t.examGroupId === componentTemplateContext.examGroupId);
  }, [classComponentTemplates, componentTemplateContext]);

  const componentTemplateOverrideSubjectIds = useMemo(() => {
    return new Set(classComponentTemplateRowsForExamGroup.filter((t) => t.subjectId).map((t) => t.subjectId as string));
  }, [classComponentTemplateRowsForExamGroup]);

  const existingComponentTemplate = useMemo(() => {
    return classComponentTemplateRowsForExamGroup.find((t) => (t.subjectId ?? null) === componentTemplateSelectedSubjectId) ?? null;
  }, [classComponentTemplateRowsForExamGroup, componentTemplateSelectedSubjectId]);

  const availableAllocations = useMemo(() => {
    if (!detailExam) return [];

    return subjectAllocations.filter((allocation) => {
      if (allocation.sessionId !== detailExam.sessionId) return false;

      if (isTeacherView && allocation.teacherId !== myTeacherId) return false;

      return true;
    });
  }, [subjectAllocations, detailExam, isTeacherView, myTeacherId]);

  const resetAddForm = () => {
    setAddSessionId(activeSessionId);
    setAddName("");
    setAddExamGroupId(activeExamGroupId);
    setAddStartDate(todayStr());
    setAddEndDate(todayStr());
    setAddDescription("");
    setAddStatus("DRAFT");
    setFormErrors({});
  };

  const resetDetailFilters = () => {
    setScheduleSearch("");
    setScheduleClassFilter("ALL");
    setScheduleSectionFilter("ALL");
    setScheduleShiftFilter("ALL");
    setDateSheetTab("manage");
  };

  const resetScheduleForm = (exam?: Exam) => {
    setEditingSchedule(null);
    setScheduleAllocationId("");
    setScheduleExamDate(exam ? toDateInputValue(exam.startDate) : "");
    setScheduleShift("MORNING");
    setScheduleStartTime("");
    setScheduleEndTime("");
    setScheduleRoom("");
  };

  const resetExamGroupForm = () => {
    setEditingExamGroup(null);
    setEgName("");
    setEgCode("");
    setEgSequence(String(examGroups.length + 1));
    setEgIsActive(true);
  };

  const resetComponentForm = () => {
    setEditingComponent(null);
    setComponentName("");
    setComponentCode("");
    setComponentMaximumMarks("");
    setComponentPassingMarks("");
    setComponentWeightage("");
    setComponentDisplayOrder("1");
    setComponentIsOptionalSubject(false);
  };

  const openDetail = (exam: Exam) => {
    setDetailExamId(exam.id);
    resetDetailFilters();
  };

  const closeDetail = () => {
    setDetailExamId(null);
    resetDetailFilters();
  };

  const handleCreateExam = async (e: FormEvent) => {
    e.preventDefault();

    if (!addSessionId) {
      setFormErrors((prev) => ({
        ...prev,
        sessionId: "Academic session is required",
      }));
      return;
    }

    if (!addName.trim()) {
      setFormErrors((prev) => ({
        ...prev,
        name: "Exam name is required",
      }));
      return;
    }

    if (!addExamGroupId) {
      setFormErrors((prev) => ({
        ...prev,
        examGroupId: "Exam group is required",
      }));
      return;
    }

    if (addEndDate < addStartDate) {
      setFormErrors((prev) => ({
        ...prev,
        endDate: "End date cannot be before start date",
      }));
      return;
    }

    try {
      await createExam({
        sessionId: addSessionId,
        name: addName.trim(),
        examGroupId: addExamGroupId,
        startDate: addStartDate,
        endDate: addEndDate,
        description: addDescription.trim() || undefined,
        status: addStatus,
      });

      toast.success("Exam created successfully");

      resetAddForm();
      setAddOpen(false);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
        return;
      }

      toast.error(err.response?.data?.message || "Failed to create exam");
    }
  };

  const openEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setEditName(exam.name);
    setEditExamGroupId(exam.examGroupId);
    setEditStartDate(toDateInputValue(exam.startDate));
    setEditEndDate(toDateInputValue(exam.endDate));
    setEditDescription(exam.description ?? "");
    setEditStatus(exam.status);
    setEditOpen(true);
  };

  const handleUpdateExam = async (e: FormEvent) => {
    e.preventDefault();

    if (!editingExam) return;

    if (!editName.trim()) {
      toast.error("Exam name is required");
      return;
    }

    if (!editExamGroupId) {
      toast.error("Exam group is required");
      return;
    }

    if (editEndDate < editStartDate) {
      toast.error("End date cannot be before start date");
      return;
    }

    try {
      await updateExam(editingExam.id, {
        name: editName.trim(),
        examGroupId: editExamGroupId,
        startDate: editStartDate,
        endDate: editEndDate,
        description: editDescription.trim() || undefined,
        status: editStatus,
      });

      toast.success("Exam updated successfully");

      setEditOpen(false);
      setEditingExam(null);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      toast.error(err.response?.data?.message || "Failed to update exam");
    }
  };

  const openDeleteExam = (exam: Exam) => {
    setDeletingExam(exam);
    setDeleteOpen(true);
  };

  const handleDeleteExam = async () => {
    if (!deletingExam) return;

    try {
      await deleteExam(deletingExam.id);

      toast.success("Exam deleted");

      setDeleteOpen(false);
      setDeletingExam(null);

      if (detailExamId === deletingExam.id) {
        setDetailExamId(null);
      }
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      toast.error(err.response?.data?.message || "Failed to delete exam");
    }
  };

  const openAddSchedule = () => {
    if (!detailExam) return;

    resetScheduleForm(detailExam);
    setScheduleOpen(true);
  };

  const openEditSchedule = (schedule: ExamSchedule) => {
    setEditingSchedule(schedule);
    setScheduleAllocationId(schedule.subjectAllocationId);
    setScheduleExamDate(toDateInputValue(schedule.examDate));
    setScheduleShift(schedule.shift);
    setScheduleStartTime(toTimeInputValue(schedule.startTime));
    setScheduleEndTime(toTimeInputValue(schedule.endTime));
    setScheduleRoom(schedule.room ?? "");
    setScheduleOpen(true);
  };

  const handleSaveSchedule = async (e: FormEvent) => {
    e.preventDefault();

    if (!detailExam) return;

    if (!scheduleAllocationId) {
      toast.error("Subject allocation is required");
      return;
    }

    if (!scheduleExamDate) {
      toast.error("Exam date is required");
      return;
    }

    const startTimeIso = combineDateAndTime(scheduleExamDate, scheduleStartTime);
    const endTimeIso = combineDateAndTime(scheduleExamDate, scheduleEndTime);

    if (startTimeIso && endTimeIso && new Date(endTimeIso) <= new Date(startTimeIso)) {
      toast.error("End time must be after start time");
      return;
    }

    try {
      const payload = {
        subjectAllocationId: scheduleAllocationId,
        examDate: scheduleExamDate,
        startTime: startTimeIso,
        endTime: endTimeIso,
        shift: scheduleShift,
        room: scheduleRoom.trim() || undefined,
      };

      if (editingSchedule) {
        await updateExamSchedule(editingSchedule.id, payload);

        toast.success("Exam schedule updated");
      } else {
        await createExamSchedule(detailExam.id, payload);

        toast.success("Exam schedule added");
      }

      setScheduleOpen(false);
      resetScheduleForm(detailExam);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      toast.error(err.response?.data?.message || "Failed to save exam schedule. Make sure this class's marks structure is set up first.");
    }
  };

  const openDeleteSchedule = (schedule: ExamSchedule) => {
    setDeletingSchedule(schedule);
    setDetailScheduleDeleteOpen(true);
  };

  const handleDeleteSchedule = async () => {
    if (!deletingSchedule) return;

    try {
      await deleteExamSchedule(deletingSchedule.id);

      toast.success("Exam schedule deleted");

      setDeletingSchedule(null);
      setDetailScheduleDeleteOpen(false);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      toast.error(err.response?.data?.message || "Failed to delete exam schedule");
    }
  };

  // ---------------------------------------------------------
  // Exam Groups manager
  // ---------------------------------------------------------

  const openEditExamGroup = (group: ExamGroup) => {
    setEditingExamGroup(group);
    setEgName(group.name);
    setEgCode(group.code ?? "");
    setEgSequence(String(group.sequence));
    setEgIsActive(group.isActive);
  };

  const handleSaveExamGroup = async (e: FormEvent) => {
    e.preventDefault();

    if (!egName.trim()) {
      toast.error("Exam group name is required");
      return;
    }

    const sequence = Number(egSequence);

    if (Number.isNaN(sequence) || sequence < 1) {
      toast.error("Sequence must be a positive number");
      return;
    }

    try {
      if (editingExamGroup) {
        await updateExamGroup(editingExamGroup.id, {
          name: egName.trim(),
          code: egCode.trim() || undefined,
          sequence,
          isActive: egIsActive,
        });

        toast.success("Exam group updated");
      } else {
        await createExamGroup({
          name: egName.trim(),
          code: egCode.trim() || undefined,
          sequence,
          isActive: egIsActive,
        });

        toast.success("Exam group created");
      }

      resetExamGroupForm();
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      toast.error(err.response?.data?.message || "Failed to save exam group");
    }
  };

  const openDeleteExamGroup = (group: ExamGroup) => {
    setDeletingExamGroup(group);
    setEgDeleteOpen(true);
  };

  const handleDeleteExamGroup = async () => {
    if (!deletingExamGroup) return;

    try {
      await deleteExamGroup(deletingExamGroup.id);

      toast.success("Exam group deleted");

      setEgDeleteOpen(false);
      setDeletingExamGroup(null);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      toast.error(err.response?.data?.message || "Failed to delete exam group");
    }
  };

  // ---------------------------------------------------------
  // Exam subject component manager (advanced: one-off, per-exam overrides)
  // ---------------------------------------------------------

  const openComponentManager = (schedule: ExamSchedule) => {
    setComponentContext({
      examId: schedule.examId,
      subjectId: schedule.subjectAllocation.subjectId,
      subjectName: schedule.subjectAllocation.subject.name,
    });
    resetComponentForm();
    setComponentOpen(true);
  };

  const componentList = useMemo(() => {
    if (!detailExam || !componentContext) return [];

    return [...(detailExam.subjectComponents ?? [])].filter((c) => c.subjectId === componentContext.subjectId).sort((a, b) => a.displayOrder - b.displayOrder);
  }, [detailExam, componentContext]);

  const componentSubjectScheduleCount = useMemo(() => {
    if (!detailExam || !componentContext) return 0;

    return (detailExam.schedules ?? []).filter((schedule) => schedule.subjectAllocation.subjectId === componentContext.subjectId).length;
  }, [detailExam, componentContext]);

  const componentSubjectIsOptional = useMemo(() => {
    if (!componentContext) return false;

    return subjects.find((subject) => subject.id === componentContext.subjectId)?.isOptional ?? false;
  }, [subjects, componentContext]);

  const openEditComponent = (component: { id: string; name: string; code?: string; maximumMarks: string; passingMarks?: string; weightage?: string; displayOrder: number; isOptionalSubject: boolean }) => {
    setEditingComponent(component);
    setComponentName(component.name);
    setComponentCode(component.code ?? "");
    setComponentMaximumMarks(String(component.maximumMarks ?? ""));
    setComponentPassingMarks(component.passingMarks != null ? String(component.passingMarks) : "");
    setComponentWeightage(component.weightage != null ? String(component.weightage) : "");
    setComponentDisplayOrder(String(component.displayOrder ?? 1));
    setComponentIsOptionalSubject(component.isOptionalSubject);
  };

  const handleSaveComponent = async (e: FormEvent) => {
    e.preventDefault();

    if (!componentContext) return;

    if (!componentName.trim()) {
      toast.error("Component name is required");
      return;
    }

    const maximumMarks = Number(componentMaximumMarks);
    const passingMarks = componentPassingMarks.trim() ? Number(componentPassingMarks) : undefined;
    const weightage = componentWeightage.trim() ? Number(componentWeightage) : undefined;
    const displayOrder = Number(componentDisplayOrder);

    if (Number.isNaN(maximumMarks) || maximumMarks < 0) {
      toast.error("Maximum marks must be valid");
      return;
    }

    if (passingMarks !== undefined && (Number.isNaN(passingMarks) || passingMarks < 0 || passingMarks > maximumMarks)) {
      toast.error("Passing marks must be between 0 and maximum marks");
      return;
    }

    if (weightage !== undefined && (Number.isNaN(weightage) || weightage < 0 || weightage > 100)) {
      toast.error("Weightage must be between 0 and 100");
      return;
    }

    if (Number.isNaN(displayOrder) || displayOrder < 1) {
      toast.error("Display order must be a positive number");
      return;
    }

    try {
      if (editingComponent) {
        await updateExamSubjectComponent(editingComponent.id, {
          name: componentName.trim(),
          code: componentCode.trim() || undefined,
          maximumMarks,
          passingMarks,
          weightage,
          displayOrder,
          isOptionalSubject: componentIsOptionalSubject,
        });

        toast.success("Exam component updated");
      } else {
        await createExamSubjectComponent(componentContext.examId, {
          subjectId: componentContext.subjectId,
          name: componentName.trim(),
          code: componentCode.trim() || undefined,
          maximumMarks,
          passingMarks,
          weightage,
          displayOrder,
          isOptionalSubject: componentIsOptionalSubject,
        });

        toast.success("Exam component added — it now applies to every section taking this subject");
      }

      await fetchExams();
      resetComponentForm();
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to save exam component");
    }
  };

  const openDeleteComponent = (component: { id: string }) => {
    setDeletingComponent(component);
    setComponentDeleteOpen(true);
  };

  const handleDeleteComponent = async () => {
    if (!deletingComponent) return;

    try {
      await deleteExamSubjectComponent(deletingComponent.id);
      toast.success("Exam component deleted");
      setComponentDeleteOpen(false);
      setDeletingComponent(null);

      await fetchExams();
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to delete exam component");
    }
  };

  // ---------------------------------------------------------
  // Grade-level component template manager (default + subject overrides)
  // ---------------------------------------------------------

  const loadDefRowsForSelection = (classId: string, examGroupId: string, subjectId: string | null) => {
    const found = useAcademicStore
      .getState()
      .classComponentTemplates.find((t) => t.classId === classId && t.examGroupId === examGroupId && (t.subjectId ?? null) === subjectId);

    if (found) {
      setComponentTemplateDefRows(
        [...found.definitions]
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((d) => ({
            name: d.name,
            source: d.source,
            maximumMarks: String(d.maximumMarks),
            passingMarks: d.passingMarks != null ? String(d.passingMarks) : "",
            displayOrder: d.displayOrder,
          })),
      );
    } else {
      setComponentTemplateDefRows([{ name: "Theory", source: "FETCHED", maximumMarks: "", passingMarks: "", displayOrder: 1 }]);
    }
  };

  const openComponentTemplateManager = async (schedule: ExamSchedule) => {
    if (!detailExam) return;

    const classId = schedule.subjectAllocation.classId;
    const className = schedule.subjectAllocation.class.name;
    const examGroupId = detailExam.examGroupId;
    const examGroupName = detailExam.examGroup?.name ?? examGroupLabel(examGroupId);

    setComponentTemplateContext({ classId, className, examGroupId, examGroupName });
    setComponentTemplateSelectedSubjectId(null);
    setComponentTemplateOpen(true);

    try {
      await fetchClassComponentTemplates(classId);
    } catch {
      // Nothing configured for this class yet - fine, form starts blank.
    } finally {
      loadDefRowsForSelection(classId, examGroupId, null);
    }
  };

  const handleComponentTemplateSubjectChange = (value: string) => {
    if (!componentTemplateContext) return;

    const subjectId = value === "DEFAULT" ? null : value;

    setComponentTemplateSelectedSubjectId(subjectId);
    loadDefRowsForSelection(componentTemplateContext.classId, componentTemplateContext.examGroupId, subjectId);
  };

  const addComponentTemplateRow = () => {
    setComponentTemplateDefRows((previous) => [...previous, { name: "", source: "MANUAL", maximumMarks: "", passingMarks: "", displayOrder: previous.length + 1 }]);
  };

  const updateComponentTemplateRow = (index: number, field: "name" | "source" | "maximumMarks" | "passingMarks", value: string) => {
    setComponentTemplateDefRows((previous) => previous.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const removeComponentTemplateRow = (index: number) => {
    setComponentTemplateDefRows((previous) => previous.filter((_, i) => i !== index));
  };

  const handleSaveComponentTemplate = async () => {
    if (!componentTemplateContext) return;

    if (componentTemplateDefRows.length === 0) {
      toast.error("Add at least one component");
      return;
    }

    for (const row of componentTemplateDefRows) {
      if (!row.name.trim()) {
        toast.error("Every component needs a name");
        return;
      }

      if (!row.maximumMarks.trim() || Number.isNaN(Number(row.maximumMarks))) {
        toast.error(`Enter valid maximum marks for "${row.name}"`);
        return;
      }
    }

    if (!componentTemplateDefRows.some((row) => row.source === "FETCHED")) {
      toast.error("At least one component must be Fetched (e.g. Theory) so it links to real exam marks");
      return;
    }

    setSavingComponentTemplate(true);

    try {
      let template = existingComponentTemplate;

      if (!template) {
        await createClassComponentTemplate({
          classId: componentTemplateContext.classId,
          examGroupId: componentTemplateContext.examGroupId,
          subjectId: componentTemplateSelectedSubjectId ?? undefined,
        });

        template =
          useAcademicStore
            .getState()
            .classComponentTemplates.find(
              (t) =>
                t.classId === componentTemplateContext.classId &&
                t.examGroupId === componentTemplateContext.examGroupId &&
                (t.subjectId ?? null) === componentTemplateSelectedSubjectId,
            ) ?? null;
      }

      if (!template) {
        throw new Error("Failed to create component template");
      }

      await replaceClassComponentTemplateDefinitions(
        template.id,
        componentTemplateDefRows.map((row, index) => ({
          name: row.name.trim(),
          source: row.source,
          maximumMarks: Number(row.maximumMarks),
          passingMarks: row.passingMarks.trim() ? Number(row.passingMarks) : undefined,
          displayOrder: index + 1,
        })),
      );

      toast.success(
        componentTemplateSelectedSubjectId
          ? "Marks structure saved for this subject"
          : "Marks structure saved — it now applies to every subject in this class for this exam group",
      );

      await fetchExams();
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to save marks structure");
    } finally {
      setSavingComponentTemplate(false);
    }
  };

  const handleDeleteComponentTemplate = async () => {
    if (!existingComponentTemplate) return;

    try {
      await deleteClassComponentTemplate(existingComponentTemplate.id);

      toast.success("Marks structure deleted");

      setComponentTemplateDeleteOpen(false);

      if (componentTemplateContext) {
        loadDefRowsForSelection(componentTemplateContext.classId, componentTemplateContext.examGroupId, componentTemplateSelectedSubjectId);
      }
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to delete marks structure");
    }
  };

  const handleSyncComponents = async () => {
    if (!componentTemplateContext) return;

    setSyncingComponents(true);

    try {
      const result = await syncExamComponentsForClassExamGroup(componentTemplateContext.classId, componentTemplateContext.examGroupId);

      if (result.skipped.length > 0) {
        toast.success(`${result.message} — ${result.skipped.length} skipped (nothing configured for that subject yet)`);
      } else {
        toast.success(result.message);
      }
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to sync exam schedules");
    } finally {
      setSyncingComponents(false);
    }
  };

  // ---------------------------------------------------------
  // Copy marks structure to other classes
  // ---------------------------------------------------------

  const openCopyTemplate = () => {
    setCopyTargetClassIds([]);
    setCopyTemplateOpen(true);
  };

  const toggleCopyTargetClass = (classId: string, checked: boolean) => {
    setCopyTargetClassIds((previous) => (checked ? [...previous, classId] : previous.filter((id) => id !== classId)));
  };

  const handleCopyTemplate = async () => {
    if (!componentTemplateContext) return;

    if (copyTargetClassIds.length === 0) {
      toast.error("Select at least one target class");
      return;
    }

    setCopyingTemplate(true);

    try {
      const result = await copyClassComponentTemplate({
        sourceClassId: componentTemplateContext.classId,
        examGroupId: componentTemplateContext.examGroupId,
        targetClassIds: copyTargetClassIds,
      });

      toast.success(result.message);

      setCopyTemplateOpen(false);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to copy marks structure");
    } finally {
      setCopyingTemplate(false);
    }
  };

  const examSchedules = useMemo(() => {
    if (!detailExam) return [];

    return (detailExam.schedules ?? []).filter((schedule) => !isTeacherView || teacherAllocationIds.has(schedule.subjectAllocationId));
  }, [detailExam, isTeacherView, teacherAllocationIds]);

  const filteredSchedules = useMemo(() => {
    if (!detailExam) return [];

    return (detailExam.schedules ?? [])
      .filter((schedule) => {
        if (isTeacherView && !teacherAllocationIds.has(schedule.subjectAllocationId)) {
          return false;
        }

        const allocation = schedule.subjectAllocation;
        const searchable = [allocation.subject.name, allocation.teacher.name, allocation.class.name, allocation.section.name, schedule.room ?? ""].join(" ").toLowerCase();
        const matchesSearch = searchable.includes(scheduleSearch.toLowerCase());
        const matchesClass = scheduleClassFilter === "ALL" || allocation.class.id === scheduleClassFilter;
        const matchesSection = scheduleSectionFilter === "ALL" || allocation.section.id === scheduleSectionFilter;
        const matchesShift = scheduleShiftFilter === "ALL" || schedule.shift === scheduleShiftFilter;
        return matchesSearch && matchesClass && matchesSection && matchesShift;
      })
      .sort((a, b) => {
        const dateDifference = new Date(a.examDate).getTime() - new Date(b.examDate).getTime();

        if (dateDifference !== 0) {
          return dateDifference;
        }

        if (a.shift !== b.shift) {
          return a.shift === "MORNING" ? -1 : 1;
        }

        return new Date(a.startTime ?? 0).getTime() - new Date(b.startTime ?? 0).getTime();
      });
  }, [detailExam, scheduleSearch, scheduleClassFilter, scheduleSectionFilter, scheduleShiftFilter, isTeacherView, teacherAllocationIds]);

  const groupedSchedules = useMemo(() => {
    const groups = new Map<string, ExamSchedule[]>();

    filteredSchedules.forEach((schedule) => {
      const key = toDateInputValue(schedule.examDate);

      const existing = groups.get(key) ?? [];

      existing.push(schedule);

      groups.set(key, existing);
    });

    return Array.from(groups.entries()).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
  }, [filteredSchedules]);

  if (authorized === null || !userChecked) {
    return null;
  }

  const detailUniqueClasses = new Set(examSchedules.map((schedule) => schedule.subjectAllocation.class.id)).size;
  const detailUniqueSections = new Set(examSchedules.map((schedule) => schedule.subjectAllocation.section.id)).size;
  const detailUniqueSubjects = new Set(examSchedules.map((schedule) => schedule.subjectAllocation.subject.id)).size;
  const hasEditChanges =
    editingExam &&
    (editName !== editingExam.name ||
      editExamGroupId !== editingExam.examGroupId ||
      editStartDate !== toDateInputValue(editingExam.startDate) ||
      editEndDate !== toDateInputValue(editingExam.endDate) ||
      editDescription !== (editingExam.description ?? "") ||
      editStatus !== editingExam.status);

  function renderDetailPage() {
    if (!detailExam) return null;

    return (
      <div className="space-y-6">
        <div className="border-b pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <button
                type="button"
                onClick={closeDetail}
                aria-label="Back to exams"
                className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
              </button>

              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClipboardList className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-bold leading-tight truncate sm:text-xl">{detailExam.name}</h1>

                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", statusBadgeClass(detailExam.status))}>{statusLabel(detailExam.status)}</span>
                </div>

                <p className="mt-1.5 text-xs leading-5 text-muted-foreground sm:text-sm">
                  {examGroupLabel(detailExam.examGroupId)}
                  <span className="mx-1.5 text-muted-foreground/50">•</span>
                  {format(new Date(detailExam.startDate), "dd MMM yyyy")}
                  <span className="mx-1.5 text-muted-foreground/50">-</span>
                  {format(new Date(detailExam.endDate), "dd MMM yyyy")}
                  <span className="mx-1.5 text-muted-foreground/50">•</span>
                  {detailExam.session.name}
                </p>
              </div>
            </div>

            {(canUpdate || canDelete) && (
              <div className="flex w-full gap-2 sm:w-auto">
                {canUpdate && (
                  <Button variant="outline" className="h-9 flex-1 gap-1.5 border-primary/30 px-3.5 text-primary hover:bg-primary/5 hover:text-primary sm:flex-none" onClick={() => openEditExam(detailExam)}>
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                )}

                {canDelete && (
                  <Button
                    variant="outline"
                    className="h-9 flex-1 gap-1.5 border-destructive/30 px-3.5 text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-none"
                    onClick={() => openDeleteExam(detailExam)}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-md border bg-card p-4 sm:p-6">
          <div className="mb-5 flex items-center gap-1.5">
            <ClipboardList className="size-3.5 text-muted-foreground" />

            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Exam Overview</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-lg border bg-muted/20 p-3.5">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Exam Group</p>

              <p className="mt-2 text-sm font-semibold">{examGroupLabel(detailExam.examGroupId)}</p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3.5">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Status</p>

              <div className="mt-2 flex items-center gap-2">
                <span className={cn("size-2 rounded-full", statusDotClass(detailExam.status))} />

                <p className="text-sm font-semibold">{statusLabel(detailExam.status)}</p>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3.5">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Classes</p>

              <p className="mt-2 text-sm font-semibold">{detailUniqueClasses}</p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3.5">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Sections</p>

              <p className="mt-2 text-sm font-semibold">{detailUniqueSections}</p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3.5">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Subjects</p>

              <p className="mt-2 text-sm font-semibold">{detailUniqueSubjects}</p>
            </div>
          </div>

          {detailExam.description && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</p>

              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{detailExam.description}</p>
            </div>
          )}
        </div>

        <div className="rounded-md border bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5 text-muted-foreground" />

                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date Sheet</span>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {filteredSchedules.length} scheduled subject
                {filteredSchedules.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDateSheetTab("manage")}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    dateSheetTab === "manage" ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  Manage
                </button>

                <button
                  type="button"
                  onClick={() => setDateSheetTab("datesheet")}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    dateSheetTab === "datesheet" ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  Overview
                </button>
              </div>

              {dateSheetTab === "manage" && canCreate && (
                <Button className="h-9 gap-2" onClick={openAddSchedule}>
                  <Plus className="size-4" />
                  Add Schedule
                </Button>
              )}
            </div>
          </div>

          {dateSheetTab === "manage" && (
          <>
          <div className="grid grid-cols-1 items-center gap-3 border-b py-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,160px))_auto]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input placeholder="Search subject, class, teacher..." value={scheduleSearch} onChange={(e) => setScheduleSearch(e.target.value)} className="h-10 pl-10" />
            </div>

            <Select
              value={scheduleClassFilter}
              onValueChange={(value) => {
                setScheduleClassFilter(value);
                setScheduleSectionFilter("ALL");
              }}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">All Classes</SelectItem>

                {detailClasses.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={scheduleSectionFilter} onValueChange={setScheduleSectionFilter}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">All Sections</SelectItem>

                {detailSections.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={scheduleShiftFilter} onValueChange={(value) => setScheduleShiftFilter(value as ExamShiftT | "ALL")}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="All Shifts" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">All Shifts</SelectItem>

                {SHIFT_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveScheduleFilters && (
              <Button type="button" variant="ghost" onClick={resetDetailFilters} className="h-10 gap-1.5 text-muted-foreground hover:text-foreground">
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            )}
          </div>

          <div className="mt-5 space-y-6">
            {groupedSchedules.map(([date, schedules]) => (
              <div key={date} className="overflow-hidden rounded-md border">
                <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                  <div>
                    <p className="font-semibold">{format(new Date(date), "dd MMMM yyyy")}</p>

                    <p className="text-xs text-muted-foreground">{format(new Date(date), "EEEE")}</p>
                  </div>

                  <span className="text-xs font-medium text-muted-foreground">
                    {schedules.length} schedule
                    {schedules.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-245 table-fixed text-sm">
                    <colgroup>
                      <col className="w-[13%]" />
                      <col className="w-[11%]" />
                      <col className="w-[20%]" />
                      <col className="w-[10%]" />
                      <col className="w-[16%]" />
                      <col className="w-[10%]" />
                      <col className="w-[12%]" />
                      {(canUpdate || canDelete || canCreate) && <col className="w-[8%]" />}
                    </colgroup>

                    <thead>
                      <tr className="border-b bg-muted/10 text-left">
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Class</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Section</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Subject</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Shift</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Time</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Room</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Components</th>
                        {(canUpdate || canDelete || canCreate) && <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:relative md:-left-7">Actions</th>}
                      </tr>
                    </thead>

                    <tbody>
                      {schedules.map((schedule) => {
                        const allocation = schedule.subjectAllocation;

                        return (
                          <tr key={schedule.id} className="border-b last:border-0 hover:bg-muted/10">
                            <td className="truncate px-4 py-3 font-medium">{allocation.class.name}</td>
                            <td className="truncate px-4 py-3 text-muted-foreground">{allocation.section.name}</td>
                            <td className="px-4 py-3">
                              <div className="truncate font-medium">{allocation.subject.name}</div>
                              <div className="truncate text-xs text-muted-foreground">{allocation.teacher.name}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{shiftLabel(schedule.shift)}</span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                              {schedule.startTime && schedule.endTime ? `${formatTimeDisplay(toTimeInputValue(schedule.startTime))} - ${formatTimeDisplay(toTimeInputValue(schedule.endTime))}` : "—"}
                            </td>
                            <td className="truncate px-4 py-3 text-muted-foreground">{schedule.room || "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {(schedule.components ?? []).length} {(schedule.components ?? []).length === 1 ? "component" : "components"}
                            </td>
                            {(canUpdate || canDelete || canCreate) && (
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1">
                                  {/* Desktop */}
                                  <div className="hidden items-center gap-1 md:flex">
                                    {canCreate && (
                                      <button
                                        type="button"
                                        aria-label="Marks structure"
                                        title="Set the marks structure for this class (applies to every subject and section, every session)"
                                        onClick={() => openComponentTemplateManager(schedule)}
                                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
                                      >
                                        <ListChecks className="size-4" />
                                      </button>
                                    )}

                                    {canCreate && (
                                      <button
                                        type="button"
                                        aria-label="Manage components"
                                        title="Advanced: add a one-off component just for this exam, without changing the reusable structure"
                                        onClick={() => openComponentManager(schedule)}
                                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
                                      >
                                        <Plus className="size-4" />
                                      </button>
                                    )}

                                    {canUpdate && (
                                      <button
                                        type="button"
                                        aria-label="Edit schedule"
                                        title="Edit schedule"
                                        onClick={() => openEditSchedule(schedule)}
                                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
                                      >
                                        <Pencil className="size-4" />
                                      </button>
                                    )}

                                    {canDelete && (
                                      <button
                                        type="button"
                                        aria-label="Delete schedule"
                                        title="Delete schedule"
                                        onClick={() => openDeleteSchedule(schedule)}
                                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                                      >
                                        <Trash2 className="size-4" />
                                      </button>
                                    )}
                                  </div>

                                  {/* Mobile */}
                                  <div className="md:hidden">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button type="button" aria-label="Schedule actions" className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                                          <MoreVertical className="size-4" />
                                        </button>
                                      </DropdownMenuTrigger>

                                      <DropdownMenuContent align="end">
                                        {canCreate && (
                                          <DropdownMenuItem onClick={() => openComponentTemplateManager(schedule)}>
                                            <ListChecks className="mr-2 size-4" />
                                            Marks structure
                                          </DropdownMenuItem>
                                        )}

                                        {canCreate && (
                                          <DropdownMenuItem onClick={() => openComponentManager(schedule)}>
                                            <Plus className="mr-2 size-4" />
                                            Manage components (advanced)
                                          </DropdownMenuItem>
                                        )}

                                        {canUpdate && (
                                          <DropdownMenuItem onClick={() => openEditSchedule(schedule)}>
                                            <Pencil className="mr-2 size-4" />
                                            Edit
                                          </DropdownMenuItem>
                                        )}

                                        {canDelete && (
                                          <DropdownMenuItem onClick={() => openDeleteSchedule(schedule)} className="text-destructive">
                                            <Trash2 className="mr-2 size-4" />
                                            Delete
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {filteredSchedules.length === 0 && (
              <div className="rounded-md border p-10 text-center">
                <CalendarIcon className="mx-auto size-8 text-muted-foreground" />

                <h3 className="mt-3 font-semibold">No schedules found</h3>

                <p className="mt-1 text-sm text-muted-foreground">{(detailExam.schedules ?? []).length === 0 ? "This exam does not have any date-sheet entries yet." : "No schedules match the selected filters."}</p>

                {hasActiveScheduleFilters && (detailExam.schedules ?? []).length > 0 && (
                  <Button type="button" variant="outline" size="sm" onClick={resetDetailFilters} className="mt-4 gap-1.5">
                    <RotateCcw className="size-3.5" />
                    Reset filters
                  </Button>
                )}
              </div>
            )}
          </div>
          </>
          )}

          {dateSheetTab === "datesheet" && (
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">A simple exam schedule — easy to read and share with parents and students.</p>

              <div className="mt-4 overflow-hidden rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-175 text-sm">
                    <thead>
                      <tr className="border-b bg-muted/10 text-left">
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Day</th>

                        {pivotClasses.map((cls) => (
                          <th key={cls.id} className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {cls.name}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {pivotDates.map((date) => {
                        const dateStr = toLocalDateKey(date);
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                        return (
                          <tr key={dateStr} className={cn("border-b last:border-0", isWeekend && "bg-muted/20")}>
                            <td className="whitespace-nowrap px-4 py-3 font-medium">{format(date, "dd/MM/yyyy")}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{format(date, "EEEE")}</td>

                            {pivotClasses.map((cls) => (
                              <td key={cls.id} className="px-4 py-3 text-center text-muted-foreground">
                                {pivotCell(dateStr, cls.id)}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {pivotClasses.length === 0 && (
                  <div className="p-10 text-center">
                    <CalendarIcon className="mx-auto size-8 text-muted-foreground" />

                    <h3 className="mt-3 font-semibold">No schedules found</h3>

                    <p className="mt-1 text-sm text-muted-foreground">Add schedules in the Manage tab to build the date sheet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  // Main page
  // =========================================================

  return (
    <DashboardLayout>
      {detailExam ? (
        renderDetailPage()
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col gap-4 mb-6 sm:mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Exams</h1>

                <p className="text-sm sm:text-base text-muted-foreground">Manage examinations and complete date sheets</p>
              </div>

              <div className="flex gap-2">
                {(canCreate || canUpdate || canDelete) && (
                  <Button
                    variant="outline"
                    className="gap-2 px-5"
                    onClick={() => {
                      resetExamGroupForm();
                      setExamGroupManagerOpen(true);
                    }}
                  >
                    <ListChecks className="size-4" />
                    Exam Groups
                  </Button>
                )}

                {canCreate && (
                  <Button
                    className="gap-2 px-5"
                    onClick={() => {
                      resetAddForm();
                      setAddOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    Add Exam
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-card p-4 sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input placeholder="Search exams..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-10" />
              </div>

              <Select value={sessionFilter} onValueChange={setSessionFilter}>
                <SelectTrigger className="h-10 w-full lg:w-60">
                  <SelectValue placeholder="All Sessions" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="ALL">All Sessions</SelectItem>

                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex flex-wrap items-center gap-1.5">
                {EXAM_STATUS_FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      statusFilter === option.value ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-card">
            <div className="border-b px-4 py-4 sm:px-6">
              <div className="flex items-center gap-1.5">
                <ClipboardList className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Examinations</span>
                <span className="text-xs text-muted-foreground">({visibleExams.length})</span>
              </div>
            </div>

            <div className="divide-y">
              {visibleExams.map((exam) => (
                <div key={exam.id} onClick={() => openDetail(exam)} className="group flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-muted/20 sm:px-6">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ClipboardList className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">{exam.name}</p>

                      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", statusBadgeClass(exam.status))}>{statusLabel(exam.status)}</span>
                    </div>

                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {examGroupLabel(exam.examGroupId)}
                      <span className="mx-1.5">•</span>
                      {format(new Date(exam.startDate), "dd MMM yyyy")}
                      <span className="mx-1.5">-</span>
                      {format(new Date(exam.endDate), "dd MMM yyyy")}
                      <span className="mx-1.5">•</span>
                      {exam.session.name}
                      <span className="mx-1.5">•</span>
                      {(exam.schedules ?? []).length} {(exam.schedules ?? []).length === 1 ? "schedule" : "schedules"}
                    </p>
                  </div>

                  {(canUpdate || canDelete) && (
                    <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {canUpdate && (
                        <button
                          type="button"
                          aria-label="Edit exam"
                          onClick={() => openEditExam(exam)}
                          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
                        >
                          <Pencil className="size-4" />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          aria-label="Delete exam"
                          onClick={() => openDeleteExam(exam)}
                          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {visibleExams.length === 0 && (
                <div className="p-10 text-center">
                  <ClipboardList className="mx-auto size-8 text-muted-foreground" />

                  <h3 className="mt-3 font-semibold">No exams found</h3>

                  <p className="mt-1 text-sm text-muted-foreground">Create an exam or change the current filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          Add Exam
      ===================================================== */}

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);

          if (!open) {
            resetAddForm();
          }
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-125">
          <div className="shrink-0 border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <ClipboardList className="size-5 text-primary" />
              </div>

              <div>
                <DialogTitle className="text-lg">Add Exam</DialogTitle>

                <DialogDescription>Create the examination first, then add its date-sheet entries.</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreateExam} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              <FieldGroup>
                <Field>
                  <Label>Academic Session</Label>

                  <Select
                    value={addSessionId}
                    onValueChange={(value) => {
                      setAddSessionId(value);

                      setFormErrors((prev) => ({
                        ...prev,
                        sessionId: "",
                      }));
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

                  {formErrors.sessionId && <p className="mt-1 text-sm text-red-500">{formErrors.sessionId}</p>}
                </Field>

                <Field>
                  <Label>Exam Name</Label>

                  <Input
                    value={addName}
                    onChange={(e) => {
                      setAddName(e.target.value);

                      setFormErrors((prev) => ({
                        ...prev,
                        name: "",
                      }));
                    }}
                    placeholder="e.g. Mid Term Examination"
                    className={cn("h-11", formErrors.name && "border-red-500")}
                  />

                  {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
                </Field>

                <Field>
                  <div className="flex items-center justify-between">
                    <Label>Exam Group</Label>

                    <button
                      type="button"
                      onClick={() => {
                        resetExamGroupForm();
                        setExamGroupManagerOpen(true);
                      }}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Manage exam groups
                    </button>
                  </div>

                  <Select
                    value={addExamGroupId}
                    onValueChange={(value) => {
                      setAddExamGroupId(value);

                      setFormErrors((prev) => ({
                        ...prev,
                        examGroupId: "",
                      }));
                    }}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder={sortedExamGroups.length === 0 ? "No exam groups yet" : "Select Exam Group"} />
                    </SelectTrigger>

                    <SelectContent>
                      {sortedExamGroups
                        .filter((group) => group.isActive)
                        .map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {formErrors.examGroupId && <p className="mt-1 text-sm text-red-500">{formErrors.examGroupId}</p>}

                  {sortedExamGroups.length === 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">No exam groups yet — click &quot;manage exam groups&quot; to create one (e.g. Unit Test, Mid-Term, End-Term).</p>
                  )}
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <Label>Start Date</Label>

                    <Popover open={addStartOpen} onOpenChange={setAddStartOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="h-11 w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 size-4" />

                          {addStartDate ? format(new Date(addStartDate), "dd MMM yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={addStartDate ? new Date(addStartDate) : undefined}
                          onSelect={(date) => {
                            if (!date) return;

                            const value = format(date, "yyyy-MM-dd");

                            setAddStartDate(value);

                            if (addEndDate < value) {
                              setAddEndDate(value);
                            }

                            setAddStartOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>

                  <Field>
                    <Label>End Date</Label>

                    <Popover open={addEndOpen} onOpenChange={setAddEndOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="h-11 w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 size-4" />

                          {addEndDate ? format(new Date(addEndDate), "dd MMM yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={addEndDate ? new Date(addEndDate) : undefined}
                          disabled={
                            addStartDate
                              ? {
                                  before: new Date(addStartDate),
                                }
                              : undefined
                          }
                          onSelect={(date) => {
                            if (!date) return;

                            setAddEndDate(format(date, "yyyy-MM-dd"));

                            setAddEndOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>
                </div>

                <Field>
                  <Label>Description</Label>

                  <Textarea value={addDescription} onChange={(e) => setAddDescription(e.target.value)} placeholder="Optional exam details" rows={3} />
                </Field>

                <Field>
                  <Label>Status</Label>

                  <Select value={addStatus} onValueChange={(value) => setAddStatus(value as ExamStatusT)}>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {EXAM_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            </div>

            <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t px-7 py-4 pb-7">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>

              <Button type="submit" disabled={loading || !addSessionId || !addName.trim() || !addExamGroupId} className="min-w-32.5">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 size-4" />
                    Add
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =====================================================
          Edit Exam
      ===================================================== */}

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);

          if (!open) {
            setEditingExam(null);
          }
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-125">
          <div className="shrink-0 border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Pencil className="size-5 text-primary" />
              </div>

              <div>
                <DialogTitle className="text-lg">Edit Exam</DialogTitle>

                <DialogDescription>Update examination details.</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateExam} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              <FieldGroup>
                <Field>
                  <Label>Academic Session</Label>

                  <div className="flex h-11 items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">{editingExam?.session.name ?? ""}</div>
                </Field>

                <Field>
                  <Label>Exam Name</Label>

                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-11" />
                </Field>

                <Field>
                  <div className="flex items-center justify-between">
                    <Label>Exam Group</Label>

                    <button
                      type="button"
                      onClick={() => {
                        resetExamGroupForm();
                        setExamGroupManagerOpen(true);
                      }}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Manage exam groups
                    </button>
                  </div>

                  <Select value={editExamGroupId} onValueChange={(value) => setEditExamGroupId(value)}>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {sortedExamGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <Label>Start Date</Label>

                    <Popover open={editStartOpen} onOpenChange={setEditStartOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="h-11 w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 size-4" />

                          {editStartDate ? format(new Date(editStartDate), "dd MMM yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editStartDate ? new Date(editStartDate) : undefined}
                          onSelect={(date) => {
                            if (!date) return;

                            const value = format(date, "yyyy-MM-dd");

                            setEditStartDate(value);

                            if (editEndDate < value) {
                              setEditEndDate(value);
                            }

                            setEditStartOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>

                  <Field>
                    <Label>End Date</Label>

                    <Popover open={editEndOpen} onOpenChange={setEditEndOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="h-11 w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 size-4" />

                          {editEndDate ? format(new Date(editEndDate), "dd MMM yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editEndDate ? new Date(editEndDate) : undefined}
                          disabled={
                            editStartDate
                              ? {
                                  before: new Date(editStartDate),
                                }
                              : undefined
                          }
                          onSelect={(date) => {
                            if (!date) return;

                            setEditEndDate(format(date, "yyyy-MM-dd"));

                            setEditEndOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>
                </div>

                <Field>
                  <Label>Description</Label>

                  <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
                </Field>

                <Field>
                  <Label>Status</Label>

                  <Select value={editStatus} onValueChange={(value) => setEditStatus(value as ExamStatusT)}>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {EXAM_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            </div>

            <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t px-7 py-4 pb-7">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>

              <Button type="submit" disabled={loading || !hasEditChanges || !editName.trim() || !editExamGroupId} className="min-w-32.5">
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

      {/* =====================================================
          Add / Edit Schedule
      ===================================================== */}

      <Dialog
        open={scheduleOpen}
        onOpenChange={(open) => {
          setScheduleOpen(open);

          if (!open && detailExam) {
            resetScheduleForm(detailExam);
          }
        }}
      >
        <DialogContent className="flex max-h-[88vh] flex-col overflow-hidden p-0 sm:max-w-125">
          <div className="shrink-0 border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <CalendarIcon className="size-5 text-primary" />
              </div>

              <div>
                <DialogTitle className="text-lg">{editingSchedule ? "Edit Exam Schedule" : "Add Exam Schedule"}</DialogTitle>

                <DialogDescription>Add one date-sheet entry for this exam.</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveSchedule} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              <FieldGroup>
                <Field>
                  <Label>Subject / Class</Label>

                  <Popover open={scheduleAllocationOpen} onOpenChange={setScheduleAllocationOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" role="combobox" className="h-11 w-full justify-between font-normal">
                        {scheduleAllocationId
                          ? (() => {
                              const allocation = availableAllocations.find((item) => item.id === scheduleAllocationId);

                              return allocation ? `${allocation.subject.name} — ${allocation.class.name} ${allocation.section.name}` : "Select Subject";
                            })()
                          : "Select Subject"}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                      <Command>
                        <CommandInput placeholder="Search subject, class, section..." />

                        <CommandList>
                          <CommandEmpty>No allocation found.</CommandEmpty>

                          <CommandGroup>
                            {availableAllocations.map((allocation) => (
                              <CommandItem
                                key={allocation.id}
                                value={`${allocation.subject.name} ${allocation.class.name} ${allocation.section.name} ${allocation.teacher.name}`}
                                onSelect={() => {
                                  setScheduleAllocationId(allocation.id);
                                  setScheduleAllocationOpen(false);
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{allocation.subject.name}</span>

                                  <span className="text-xs text-muted-foreground">
                                    {allocation.class.name} • {allocation.section.name} • {allocation.teacher.name}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </Field>

                <Field>
                  <Label>Exam Date</Label>

                  <Popover open={scheduleDateOpen} onOpenChange={setScheduleDateOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="h-11 w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 size-4" />

                        {scheduleExamDate ? format(new Date(scheduleExamDate), "dd MMM yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={scheduleExamDate ? new Date(scheduleExamDate) : undefined}
                        disabled={
                          detailExam
                            ? {
                                before: new Date(detailExam.startDate),
                                after: new Date(detailExam.endDate),
                              }
                            : undefined
                        }
                        onSelect={(date) => {
                          if (!date) return;

                          setScheduleExamDate(format(date, "yyyy-MM-dd"));

                          setScheduleDateOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </Field>

                <Field>
                  <Label>Shift</Label>

                  <Select value={scheduleShift} onValueChange={(value) => setScheduleShift(value as ExamShiftT)}>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {SHIFT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <Label>Start Time</Label>

                    <TimePicker value={scheduleStartTime} onChange={setScheduleStartTime} placeholder="Start time" />
                  </Field>

                  <Field>
                    <Label>End Time</Label>

                    <TimePicker value={scheduleEndTime} onChange={setScheduleEndTime} placeholder="End time" />
                  </Field>
                </div>

                <Field>
                  <Label>Room</Label>

                  <Input value={scheduleRoom} onChange={(e) => setScheduleRoom(e.target.value)} placeholder="Optional room / hall" className="h-11" />
                </Field>
              </FieldGroup>
            </div>

            <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t px-7 py-4 pb-7">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>

              <Button type="submit" disabled={loading || !scheduleAllocationId || !scheduleExamDate} className="min-w-32.5">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {editingSchedule ? <Pencil className="mr-2 size-4" /> : <Plus className="mr-2 size-4" />}

                    {editingSchedule ? "Update" : "Add"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =====================================================
          Manage Exam Groups
      ===================================================== */}

      <Dialog
        open={examGroupManagerOpen}
        onOpenChange={(open) => {
          setExamGroupManagerOpen(open);

          if (!open) {
            resetExamGroupForm();
          }
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-125">
          <div className="shrink-0 border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <ListChecks className="size-5 text-primary" />
              </div>

              <div>
                <DialogTitle className="text-lg">Exam Groups</DialogTitle>
                <DialogDescription>The exam terms your school uses — Unit Test, Mid-Term, End-Term, Pre-Board I, etc.</DialogDescription>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="rounded-md border">
              <div className="border-b bg-muted/20 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Configured Exam Groups</p>
              </div>

              <div className="divide-y">
                {sortedExamGroups.map((group) => (
                  <div key={group.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{group.name}</p>
                        {group.code && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{group.code}</span>}
                        {!group.isActive && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Inactive</span>}
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">Sequence {group.sequence}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {canUpdate && (
                        <button
                          type="button"
                          aria-label="Edit exam group"
                          onClick={() => openEditExamGroup(group)}
                          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
                        >
                          <Pencil className="size-4" />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          aria-label="Delete exam group"
                          onClick={() => openDeleteExamGroup(group)}
                          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {sortedExamGroups.length === 0 && (
                  <div className="p-8 text-center">
                    <ListChecks className="mx-auto size-7 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">No exam groups yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">Add your school&apos;s exam terms below — e.g. Unit Test, Mid-Term, End-Term.</p>
                  </div>
                )}
              </div>
            </div>

            {(canCreate || canUpdate) && (
              <form onSubmit={handleSaveExamGroup} className="rounded-md border p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{editingExamGroup ? "Edit Exam Group" : "Add Exam Group"}</p>
                    <p className="text-xs text-muted-foreground">This becomes selectable when creating an exam.</p>
                  </div>

                  {editingExamGroup && (
                    <Button type="button" variant="ghost" size="sm" onClick={resetExamGroupForm}>
                      Cancel edit
                    </Button>
                  )}
                </div>

                <FieldGroup>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field>
                      <Label>Name</Label>
                      <Input value={egName} onChange={(e) => setEgName(e.target.value)} placeholder="e.g. Mid-Term" className="h-11" disabled={editingExamGroup ? !canUpdate : !canCreate} />
                    </Field>

                    <Field>
                      <Label>Code</Label>
                      <Input value={egCode} onChange={(e) => setEgCode(e.target.value)} placeholder="Optional" className="h-11" disabled={editingExamGroup ? !canUpdate : !canCreate} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field>
                      <Label>Sequence</Label>
                      <Input type="number" min="1" value={egSequence} onChange={(e) => setEgSequence(e.target.value)} className="h-11" disabled={editingExamGroup ? !canUpdate : !canCreate} />
                    </Field>

                    <Field>
                      <Label>Active</Label>
                      <div className="mt-3">
                        <Switch checked={egIsActive} onCheckedChange={setEgIsActive} disabled={editingExamGroup ? !canUpdate : !canCreate} />
                      </div>
                    </Field>
                  </div>
                </FieldGroup>

                <div className="mt-4 flex justify-end">
                  <Button type="submit" disabled={loading || !egName.trim() || (editingExamGroup ? !canUpdate : !canCreate)} className="min-w-32.5">
                    {editingExamGroup ? (
                      <>
                        <Pencil className="mr-2 size-4" />
                        Update
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 size-4" />
                        Add Exam Group
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={egDeleteOpen} onOpenChange={setEgDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this exam group?</AlertDialogTitle>
            <AlertDialogDescription>Exam groups already used by an exam can&apos;t be deleted — deactivate them instead. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExamGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* =====================================================
          Manage Exam Subject Components
      ===================================================== */}

      <Dialog
        open={componentOpen}
        onOpenChange={(open) => {
          setComponentOpen(open);

          if (!open) {
            setComponentContext(null);
            resetComponentForm();
          }
        }}
      >
        <DialogContent className="flex max-h-[88vh] flex-col overflow-hidden p-0 sm:max-w-160">
          <div className="shrink-0 border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <ClipboardList className="size-5 text-primary" />
              </div>

              <div>
                <DialogTitle className="text-lg">Exam Components</DialogTitle>
                <DialogDescription>
                  {componentContext ? `${componentContext.subjectName} — this setup is shared by every section, not just one` : "Manage papers and components for this subject."}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {componentContext && componentSubjectScheduleCount > 0 && (
                <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-primary">
                  Applies automatically to {componentSubjectScheduleCount} section{componentSubjectScheduleCount === 1 ? "" : "s"} currently scheduled for {componentContext.subjectName} in this exam — no need to set
                  this up again per section.
                </div>
              )}

              <div className="rounded-md border">
                <div className="border-b bg-muted/20 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Configured Components</p>
                </div>

                <div className="divide-y">
                  {componentList.map((component) => (
                    <div key={component.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{component.name}</p>
                          {component.code && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{component.code}</span>}
                          {component.isOptionalSubject && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">Optional subject only</span>}
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {component.maximumMarks} marks
                          {component.passingMarks != null ? ` • Pass ${component.passingMarks}` : ""}
                          {component.weightage != null ? ` • ${component.weightage}% weightage` : ""}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        {canUpdate && (
                          <button
                            type="button"
                            aria-label="Edit component"
                            onClick={() => openEditComponent(component)}
                            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
                          >
                            <Pencil className="size-4" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            aria-label="Delete component"
                            onClick={() => openDeleteComponent(component)}
                            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {componentList.length === 0 && (
                    <div className="p-8 text-center">
                      <ClipboardList className="mx-auto size-7 text-muted-foreground" />
                      <p className="mt-2 text-sm font-medium">No components added</p>
                      <p className="mt-1 text-xs text-muted-foreground">Add papers or assessment components for this subject — e.g. Theory, Practical, Enrichment.</p>
                    </div>
                  )}
                </div>
              </div>

              {canCreate || canUpdate ? (
                <form onSubmit={handleSaveComponent} className="rounded-md border p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{editingComponent ? "Edit Component" : "Add Component"}</p>
                      <p className="text-xs text-muted-foreground">Define the paper or assessment structure and marks.</p>
                    </div>

                    {editingComponent && (
                      <Button type="button" variant="ghost" size="sm" onClick={resetComponentForm}>
                        Cancel edit
                      </Button>
                    )}
                  </div>

                  <FieldGroup>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field>
                        <Label>Name</Label>
                        <Input value={componentName} onChange={(e) => setComponentName(e.target.value)} placeholder="e.g. Theory" className="h-11" disabled={editingComponent ? !canUpdate : !canCreate} />
                      </Field>

                      <Field>
                        <Label>Code</Label>
                        <Input value={componentCode} onChange={(e) => setComponentCode(e.target.value)} placeholder="Optional" className="h-11" disabled={editingComponent ? !canUpdate : !canCreate} />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field>
                        <Label>Maximum Marks</Label>
                        <Input
                          type="number"
                          min="0"
                          value={componentMaximumMarks}
                          onChange={(e) => setComponentMaximumMarks(e.target.value)}
                          placeholder="e.g. 40"
                          className="h-11"
                          disabled={editingComponent ? !canUpdate : !canCreate}
                        />
                      </Field>

                      <Field>
                        <Label>Passing Marks</Label>
                        <Input
                          type="number"
                          min="0"
                          value={componentPassingMarks}
                          onChange={(e) => setComponentPassingMarks(e.target.value)}
                          placeholder="Optional"
                          className="h-11"
                          disabled={editingComponent ? !canUpdate : !canCreate}
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field>
                        <Label>Weightage (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={componentWeightage}
                          onChange={(e) => setComponentWeightage(e.target.value)}
                          placeholder="Optional"
                          className="h-11"
                          disabled={editingComponent ? !canUpdate : !canCreate}
                        />
                      </Field>

                      <Field>
                        <Label>Display Order</Label>
                        <Input type="number" min="1" value={componentDisplayOrder} onChange={(e) => setComponentDisplayOrder(e.target.value)} className="h-11" disabled={editingComponent ? !canUpdate : !canCreate} />
                      </Field>
                    </div>

                    {componentSubjectIsOptional && (
                      <Field>
                        <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
                          <Checkbox
                            checked={componentIsOptionalSubject}
                            onCheckedChange={(value) => setComponentIsOptionalSubject(Boolean(value))}
                            disabled={editingComponent ? !canUpdate : !canCreate}
                          />
                          Only count this component for students who opted into this subject
                        </label>
                      </Field>
                    )}
                  </FieldGroup>

                  <div className="mt-4 flex justify-end">
                    <Button type="submit" disabled={loading || !componentName.trim() || !componentMaximumMarks || (editingComponent ? !canUpdate : !canCreate)} className="min-w-32.5">
                      {editingComponent ? (
                        <>
                          <Pencil className="mr-2 size-4" />
                          Update
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 size-4" />
                          Add Component
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : null}
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={componentDeleteOpen} onOpenChange={setComponentDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this component?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the component and its recorded marks for every section sharing this subject in this exam.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteComponent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* =====================================================
          Delete Exam
      ===================================================== */}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this exam?</AlertDialogTitle>

            <AlertDialogDescription>This will also delete all schedules attached to this exam. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction onClick={handleDeleteExam} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={detailScheduleDeleteOpen} onOpenChange={setDetailScheduleDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this exam schedule?</AlertDialogTitle>

            <AlertDialogDescription>The selected date-sheet entry will be permanently removed from this exam.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction onClick={handleDeleteSchedule} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* =====================================================
          Grade-level Component Template (marks structure)
      ===================================================== */}

      <Dialog
        open={componentTemplateOpen}
        onOpenChange={(open) => {
          setComponentTemplateOpen(open);

          if (!open) {
            setComponentTemplateContext(null);
            setComponentTemplateSelectedSubjectId(null);
            setComponentTemplateDefRows([]);
          }
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-165">
          <div className="shrink-0 border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <ListChecks className="size-5 text-primary" />
              </div>

              <div>
                <DialogTitle className="text-lg">Marks Structure</DialogTitle>

                <DialogDescription>
                  {componentTemplateContext
                    ? `${componentTemplateContext.className} — ${componentTemplateContext.examGroupName}. Set a default for every subject, plus overrides for the ones that differ.`
                    : "Define the marks structure for this class and exam group."}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <ListChecks className="mt-0.5 size-4 shrink-0 text-primary" />

                <div className="text-xs leading-5 text-muted-foreground">
                  <span className="font-semibold text-foreground">Fetched</span> components pull their marks automatically from real exams entered on this page (e.g. Theory). <span className="font-semibold text-foreground">Manual</span> components
                  are typed in directly by a teacher on the report card (e.g. Practical, Assessment, Enrichment) — they never need a schedule or exam marks entry here.
                </div>
              </div>
            </div>

            <Field>
              <Label>Applies to</Label>

              <Select value={componentTemplateSelectedSubjectId ?? "DEFAULT"} onValueChange={handleComponentTemplateSubjectChange}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="DEFAULT">All subjects (default)</SelectItem>

                  {[...subjects]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                        {componentTemplateOverrideSubjectIds.has(subject.id) ? " (override set)" : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <p className="mt-1.5 text-xs text-muted-foreground">
                Leave on &quot;All subjects&quot; for the structure every subject uses. Pick one subject to give it its own structure instead (e.g. Painting = practical only).
              </p>
            </Field>

            {componentTemplateOverrideSubjectIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Existing overrides:</span>

                {subjects
                  .filter((subject) => componentTemplateOverrideSubjectIds.has(subject.id))
                  .map((subject) => (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => handleComponentTemplateSubjectChange(subject.id)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                        componentTemplateSelectedSubjectId === subject.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {subject.name}
                    </button>
                  ))}
              </div>
            )}

            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-125 text-sm">
                <thead>
                  <tr className="border-b bg-muted/10 text-left">
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Name</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Source</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Max Marks</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Passing Marks</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>

                <tbody>
                  {componentTemplateDefRows.map((row, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="px-3 py-2.5">
                        <Input value={row.name} onChange={(e) => updateComponentTemplateRow(index, "name", e.target.value)} placeholder="e.g. Theory" className="h-9" />
                      </td>

                      <td className="px-3 py-2.5">
                        <Select value={row.source} onValueChange={(value) => updateComponentTemplateRow(index, "source", value)}>
                          <SelectTrigger className="h-9 w-32">
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="FETCHED">Fetched</SelectItem>
                            <SelectItem value="MANUAL">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="px-3 py-2.5">
                        <Input type="number" min="0" value={row.maximumMarks} onChange={(e) => updateComponentTemplateRow(index, "maximumMarks", e.target.value)} placeholder="e.g. 40" className="h-9 w-24" />
                      </td>

                      <td className="px-3 py-2.5">
                        <Input type="number" min="0" value={row.passingMarks} onChange={(e) => updateComponentTemplateRow(index, "passingMarks", e.target.value)} placeholder="Optional" className="h-9 w-24" />
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          aria-label="Remove component"
                          onClick={() => removeComponentTemplateRow(index)}
                          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {componentTemplateDefRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                        No components added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addComponentTemplateRow}>
              <Plus className="size-3.5" />
              Add Component
            </Button>
          </div>

          <DialogFooter className="shrink-0 flex-row flex-wrap items-center justify-between gap-2 border-t px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {existingComponentTemplate && (
                <Button type="button" variant="outline" className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setComponentTemplateDeleteOpen(true)}>
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              )}

              {classComponentTemplateRowsForExamGroup.length > 0 && (
                <Button type="button" variant="outline" className="gap-2" onClick={openCopyTemplate}>
                  <ClipboardList className="size-4" />
                  Copy to Classes
                </Button>
              )}

              <Button type="button" variant="outline" className="gap-2" onClick={handleSyncComponents} disabled={syncingComponents}>
                {syncingComponents ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                Sync Existing Schedules
              </Button>
            </div>

            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>

              <Button type="button" onClick={handleSaveComponentTemplate} disabled={savingComponentTemplate} className="min-w-32.5 gap-2">
                {savingComponentTemplate ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Save Structure
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={componentTemplateDeleteOpen} onOpenChange={setComponentTemplateDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this marks structure?</AlertDialogTitle>
            <AlertDialogDescription>
              {componentTemplateSelectedSubjectId
                ? "This removes the override for this subject — it will fall back to the class-wide default (if one exists)."
                : "This removes the class-wide default structure."}{" "}
              This removes it for {componentTemplateContext?.className ?? "this class"} under {componentTemplateContext?.examGroupName ?? "this exam group"}. Existing exams already using
              it keep their components — this only affects new schedules going forward. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteComponentTemplate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* =====================================================
          Copy Marks Structure to Other Classes
      ===================================================== */}

      <Dialog
        open={copyTemplateOpen}
        onOpenChange={(open) => {
          setCopyTemplateOpen(open);

          if (!open) {
            setCopyTargetClassIds([]);
          }
        }}
      >
        <DialogContent className="flex max-h-[80vh] flex-col overflow-hidden p-0 sm:max-w-125">
          <div className="shrink-0 border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <ClipboardList className="size-5 text-primary" />
              </div>

              <div>
                <DialogTitle className="text-lg">Copy Marks Structure</DialogTitle>

                <DialogDescription>
                  Copies the default and every subject override from {componentTemplateContext?.className ?? "this class"} — {componentTemplateContext?.examGroupName ?? "this exam group"} onto the classes you pick
                  below. Any subjects a target class doesn&apos;t teach are simply unused, not an error.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="rounded-md border">
              <div className="divide-y">
                {sortedClasses
                  .filter((item) => item.id !== componentTemplateContext?.classId)
                  .map((item) => (
                    <label key={item.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer select-none">
                      <Checkbox checked={copyTargetClassIds.includes(item.id)} onCheckedChange={(value) => toggleCopyTargetClass(item.id, Boolean(value))} />
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground">({item.board})</span>
                    </label>
                  ))}

                {sortedClasses.filter((item) => item.id !== componentTemplateContext?.classId).length === 0 && (
                  <p className="p-6 text-center text-sm text-muted-foreground">No other classes to copy to.</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            <Button type="button" onClick={handleCopyTemplate} disabled={copyingTemplate || copyTargetClassIds.length === 0} className="min-w-32.5 gap-2">
              {copyingTemplate ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Copying...
                </>
              ) : (
                <>
                  <ClipboardList className="size-4" />
                  Copy
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
