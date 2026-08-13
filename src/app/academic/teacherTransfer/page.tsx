"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Eye,
  Inbox,
  Loader2,
  Repeat,
  Search,
  Users,
  User,
  Wand2,
} from "lucide-react";
import { useAcademicStore, TeacherTransferHistory } from "@/store/academicStore";
import { academicService } from "@/services/academic.service";
import { usePermission } from "@/hooks/usePermission";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

type TimetableConflict = {
  timetableId: string;
  sessionId: string;
  classId: string;
  sectionId: string;
  className: string;
  sectionName: string;
  subjectName: string;
  currentDay: string;
  currentPeriod: number;
  conflictTeacherId: string;
  conflictTeacherName: string;
  conflictSubjectName: string;
  availableSlots: {
    dayOfWeek: string;
    periodNo: number;
  }[];
};

type ApiErrorResponse = {
  message?: string;
  type?: string;
  errors?: Record<string, string>;
  conflicts?: TimetableConflict[];
};

type TeacherTransferHistoryExtended = TeacherTransferHistory;

type TeacherTransferPayload = {
  fromTeacherId: string;
  effectiveDate: string;

  classTransfers?: {
    classTeacherAssignmentId: string;
    toTeacherId: string;
  }[];

  subjectTransfers?: {
    subjectAllocationId: string;
    toTeacherId: string;
  }[];

  timetableResolutions?: {
    timetableId: string;
    dayOfWeek: DayOfWeek;
    periodNo: number;
  }[];

  remarks?: string;
};

const STEPS = [
  { label: "Select Teachers", icon: Users },
  { label: "Assignments", icon: ClipboardList },
  { label: "Effective Date", icon: CalendarIcon },
  { label: "Review", icon: Check },
] as const;

const DAY_ORDER: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

function initials(name?: string) {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/);

  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || name.slice(0, 2).toUpperCase();
}

/** Groups a flat list of slots into day-ordered buckets so they can be rendered as a scannable grid of chips instead of a long dropdown list. */
function groupSlotsByDay(slots: TimetableConflict["availableSlots"]) {
  const byDay = new Map<string, number[]>();

  slots.forEach((slot) => {
    const list = byDay.get(slot.dayOfWeek) ?? [];
    list.push(slot.periodNo);
    byDay.set(slot.dayOfWeek, list);
  });

  return DAY_ORDER.filter((day) => byDay.has(day)).map((day) => ({
    day,
    periods: (byDay.get(day) ?? []).sort((a, b) => a - b),
  }));
}

export default function TeacherTransferPage() {
  const { teachers, subjectAllocations, teacherAssignments, teacherTransfers, loading, fetchTeachers, fetchSubjectAllocations, fetchTeacherAssignments, fetchTeacherTransfers } = useAcademicStore();
  const authorized = usePermission("teacher-transfer.read");
  const canTransfer = usePermission("teacher-transfer.create");
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [fromTeacherId, setFromTeacherId] = useState("");
  const [classTeacherToTeacherId, setClassTeacherToTeacherId] = useState("");
  const [transferClassTeacher, setTransferClassTeacher] = useState(false);
  const [transferSubjects, setTransferSubjects] = useState(false);
  const [defaultSubjectTeacherId, setDefaultSubjectTeacherId] = useState("");
  const [subjectTeacherMap, setSubjectTeacherMap] = useState<Record<string, string>>({});
  const [subjectIncluded, setSubjectIncluded] = useState<Record<string, boolean>>({});
  const [effectiveDate, setEffectiveDate] = useState("");
  const [effectiveDateOpen, setEffectiveDateOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<TeacherTransferHistoryExtended | null>(null);
  const [timetableConflicts, setTimetableConflicts] = useState<TimetableConflict[]>([]);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [timetableResolutions, setTimetableResolutions] = useState<
    Record<
      string,
      {
        dayOfWeek: DayOfWeek;
        periodNo: number;
      }
    >
  >({});

  useEffect(() => {
    fetchTeachers();
    fetchSubjectAllocations();
    fetchTeacherAssignments();
    fetchTeacherTransfers();
  }, []);

  const activeTeachers = useMemo(() => teachers.filter((t) => t.isActive), [teachers]);
  const fromTeacher = useMemo(() => teachers.find((t) => t.id === fromTeacherId) ?? null, [teachers, fromTeacherId]);
  const replacementCandidates = useMemo(() => activeTeachers.filter((t) => t.id !== fromTeacherId), [activeTeachers, fromTeacherId]);
  const teacherName = (id?: string) => (id ? (teachers.find((t) => t.id === id)?.name ?? "-") : "-");
  const affectedSubjectAllocations = useMemo(() => subjectAllocations.filter((a) => a.teacherId === fromTeacherId), [subjectAllocations, fromTeacherId]);
  const includedSubjectAllocations = useMemo(() => affectedSubjectAllocations.filter((a) => subjectIncluded[a.id]), [affectedSubjectAllocations, subjectIncluded]);
  const allSubjectsIncluded = affectedSubjectAllocations.length > 0 && affectedSubjectAllocations.every((a) => subjectIncluded[a.id]);
  const affectedClassAssignments = useMemo(() => teacherAssignments.filter((a) => a.teacherId === fromTeacherId), [teacherAssignments, fromTeacherId]);
  const resolvedConflictCount = useMemo(() => timetableConflicts.filter((c) => timetableResolutions[c.timetableId]).length, [timetableConflicts, timetableResolutions]);
  const allConflictsResolved = timetableConflicts.length > 0 && resolvedConflictCount === timetableConflicts.length;
  const clearError = (field: string) => setErrors((prev) => ({ ...prev, [field]: "" }));
  const resetWizard = () => {
    setStep(0);
    setFromTeacherId("");
    setClassTeacherToTeacherId("");
    setTransferClassTeacher(false);
    setTransferSubjects(false);
    setDefaultSubjectTeacherId("");
    setSubjectTeacherMap({});
    setSubjectIncluded({});
    setEffectiveDate("");
    setRemarks("");
    setErrors({});
    setTimetableConflicts([]);
    setTimetableResolutions({});
    setConflictDialogOpen(false);
  };

  const validateStep = (current: number) => {
    const nextErrors: Record<string, string> = {};

    if (current === 0) {
      if (!fromTeacherId) nextErrors.fromTeacherId = "Select the teacher being transferred";
    }

    if (current === 1) {
      if (!transferClassTeacher && !transferSubjects) {
        nextErrors.assignmentTypes = "Select at least one assignment type to transfer";
      }

      if (transferSubjects) {
        if (includedSubjectAllocations.length === 0) {
          nextErrors.subjectTransfers = "Select at least one subject allocation to transfer";
        } else if (includedSubjectAllocations.some((a) => !subjectTeacherMap[a.id])) {
          nextErrors.subjectTransfers = "Assign a replacement teacher to every selected subject allocation";
        }
      }
    }

    if (current === 2) {
      if (!effectiveDate) nextErrors.effectiveDate = "Effective date is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((prev) => Math.max(prev - 1, 0));

  const toggleSelectAllSubjects = (checked: boolean) => {
    const next: Record<string, boolean> = { ...subjectIncluded };
    affectedSubjectAllocations.forEach((a) => {
      next[a.id] = checked;
    });
    setSubjectIncluded(next);
    clearError("subjectTransfers");
  };

  const applyDefaultToAllSubjects = () => {
    if (!defaultSubjectTeacherId) return;
    const nextIncluded: Record<string, boolean> = {};
    const nextMap: Record<string, string> = { ...subjectTeacherMap };
    affectedSubjectAllocations.forEach((a) => {
      nextIncluded[a.id] = true;
      nextMap[a.id] = defaultSubjectTeacherId;
    });
    setSubjectIncluded(nextIncluded);
    setSubjectTeacherMap(nextMap);
    clearError("subjectTransfers");
  };

  const handleSubmit = async () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) return;

    const payload: TeacherTransferPayload = {
      fromTeacherId,

      classTransfers: transferClassTeacher
        ? affectedClassAssignments.map((a) => ({
            classTeacherAssignmentId: a.id,
            toTeacherId: classTeacherToTeacherId,
          }))
        : undefined,

      subjectTransfers: transferSubjects
        ? includedSubjectAllocations.map((a) => ({
            subjectAllocationId: a.id,
            toTeacherId: subjectTeacherMap[a.id],
          }))
        : undefined,

      effectiveDate,

      timetableResolutions:
        Object.keys(timetableResolutions).length > 0
          ? Object.entries(timetableResolutions).map(([timetableId, resolution]) => ({
              timetableId,
              dayOfWeek: resolution.dayOfWeek,
              periodNo: resolution.periodNo,
            }))
          : undefined,

      remarks: remarks.trim() || undefined,
    };

    try {
      setSubmitting(true);

      const response = await academicService.teacherTransfers.create(payload);
      const transferred = response.data?.data?.transferred ?? response.data?.transferred;

      await Promise.all([fetchTeacherTransfers(), fetchSubjectAllocations(), fetchTeacherAssignments()]);

      if (transferred) {
        toast.success(`Transferred ${transferred.subjectAllocations} subject allocation and ${transferred.classTeacherAssignments} class teacher assignment`);
      } else {
        toast.success("Teacher transferred successfully");
      }

      resetWizard();
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;
      const responseData = apiError.response?.data;

      if (responseData?.type === "TIMETABLE_CONFLICT" && responseData.conflicts?.length) {
        setTimetableConflicts(responseData.conflicts);

        const existingResolutions: Record<
          string,
          {
            dayOfWeek: DayOfWeek;
            periodNo: number;
          }
        > = {};

        responseData.conflicts.forEach((conflict) => {
          const existing = timetableResolutions[conflict.timetableId];

          if (existing) {
            existingResolutions[conflict.timetableId] = existing;
          }
        });

        setTimetableResolutions(existingResolutions);
        setConflictDialogOpen(true);
        return;
      }

      const apiErrors = responseData?.errors;

      if (apiErrors) {
        setErrors(apiErrors);
        toast.error(Object.values(apiErrors)[0]);
        return;
      }

      toast.error(responseData?.message ?? "Failed to transfer teacher");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredHistory = (Array.isArray(teacherTransfers) ? teacherTransfers : []).filter(
    (item) =>
      item.fromTeacher?.name.toLowerCase().includes(search.toLowerCase()) ||
      item.subjectTransfers?.some((x) => x.toTeacher?.name.toLowerCase().includes(search.toLowerCase())) ||
      item.classTransfers?.some((x) => x.toTeacher?.name.toLowerCase().includes(search.toLowerCase()))
  ) as TeacherTransferHistoryExtended[];

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));

  const paginatedHistory = useMemo(() => filteredHistory.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE), [filteredHistory, page]);

  const openHistoryDialog = (item: TeacherTransferHistoryExtended) => {
    setSelectedTransfer(item);
    setHistoryOpen(true);
  };

  if (authorized === null) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teacher Transfer</h1>
          <p className="text-muted-foreground">Move a teacher&apos;s subject allocations and class teacher duties to another teacher</p>
        </div>

        {canTransfer === false ? (
          <div className="bg-card rounded-md p-8 border border-border/60 text-center text-muted-foreground">You don&apos;t have permission to transfer teachers.</div>
        ) : (
          <div className="bg-card rounded-md border border-border/60 overflow-hidden">
            {/* Stepper header */}
            <div className="border-b border-border/60">
              {/* Compact mobile stepper: avoids the awkward side-scrolling icon row on narrow screens */}
              <div className="sm:hidden px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{step + 1}</div>
                    <span className="truncate text-sm font-semibold text-foreground">{STEPS[step].label}</span>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">
                    Step {step + 1} of {STEPS.length}
                  </span>
                </div>

                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
                </div>
              </div>

              {/* Full icon stepper for tablet/desktop */}
              <div className="hidden items-center gap-4 overflow-x-auto px-6 py-5 sm:flex">
                {STEPS.map((s, index) => {
                  const Icon = s.icon;
                  const isActive = index === step;
                  const isDone = index < step;

                  return (
                    <div key={s.label} className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "size-8 rounded-full flex items-center justify-center border text-xs font-semibold transition-colors shrink-0",
                            isDone && "bg-primary border-primary text-primary-foreground",
                            isActive && !isDone && "border-primary text-primary bg-primary/10",
                            !isActive && !isDone && "border-border text-muted-foreground"
                          )}
                        >
                          {isDone ? <Check className="size-4" /> : <Icon className="size-4" />}
                        </div>

                        <span className={cn("text-sm font-medium whitespace-nowrap", isActive ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
                      </div>

                      {index < STEPS.length - 1 && <div className="h-px w-10 bg-border" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* Step 1: Teacher to transfer + class teacher replacement */}
              {step === 0 && (
                <FieldGroup>
                  <Field>
                    <Label>Teacher to transfer</Label>
                    <Select
                      value={fromTeacherId}
                      onValueChange={(value) => {
                        setFromTeacherId(value);
                        clearError("fromTeacherId");
                        setClassTeacherToTeacherId("");
                        setTransferClassTeacher(false);
                        setTransferSubjects(false);
                        setDefaultSubjectTeacherId("");
                        setSubjectTeacherMap({});
                        setSubjectIncluded({});
                      }}
                    >
                      <SelectTrigger className={cn("w-full", errors.fromTeacherId && "border-red-500")}>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>

                      <SelectContent>
                        {activeTeachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name} · {teacher.teacherCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.fromTeacherId && <p className="text-sm text-red-500 mt-1">{errors.fromTeacherId}</p>}
                  </Field>

                  <Field>
                    <Label>Replacement for Class Teacher Duty</Label>
                    <Select
                      value={classTeacherToTeacherId}
                      onValueChange={(value) => {
                        setClassTeacherToTeacherId(value);
                        clearError("classTeacherToTeacherId");
                        clearError("assignmentTypes");
                        setTransferClassTeacher(!!value && affectedClassAssignments.length > 0);
                      }}
                      disabled={!fromTeacherId || affectedClassAssignments.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={!fromTeacherId ? "Select a teacher first" : affectedClassAssignments.length === 0 ? "No class teacher duties to transfer" : "Select replacement teacher"} />
                      </SelectTrigger>

                      <SelectContent>
                        {replacementCandidates.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name} · {teacher.teacherCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {affectedClassAssignments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {affectedClassAssignments.map((a) => (
                          <Badge key={a.id} className="bg-muted text-muted-foreground font-normal">
                            {a.class?.name} {a.section?.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Field>
                </FieldGroup>
              )}

              {/* Step 2: Assignments */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Choose what should move off <span className="font-semibold text-foreground">{fromTeacher?.name}</span>&apos;s plate.
                  </p>

                  {/* Class teacher duty */}
                  <div
                    className={cn(
                      "flex items-start gap-3 rounded-md border p-4 cursor-pointer transition-colors",
                      transferClassTeacher ? "border-primary bg-primary/5" : "border-border",
                      (affectedClassAssignments.length === 0 || !classTeacherToTeacherId) && "opacity-60 cursor-not-allowed"
                    )}
                    onClick={() => {
                      if (affectedClassAssignments.length === 0 || !classTeacherToTeacherId) return;
                      setTransferClassTeacher(!transferClassTeacher);
                      clearError("assignmentTypes");
                    }}
                  >
                    <Checkbox
                      checked={transferClassTeacher}
                      disabled={affectedClassAssignments.length === 0 || !classTeacherToTeacherId}
                      onCheckedChange={(checked) => {
                        setTransferClassTeacher(checked === true);
                        clearError("assignmentTypes");
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-primary" />
                        <span className="font-semibold text-foreground">Class Teacher Duty</span>
                        {affectedClassAssignments.length > 0 && <Badge variant="secondary">{affectedClassAssignments.length}</Badge>}
                      </div>

                      <p className="text-sm text-muted-foreground mt-1">
                        {affectedClassAssignments.length === 0
                          ? "This teacher is not a class teacher for any section."
                          : !classTeacherToTeacherId
                            ? "Go back and pick a replacement teacher to enable this."
                            : `All sections below move to ${teacherName(classTeacherToTeacherId)}. Uncheck to leave class teacher duty with ${fromTeacher?.name}.`}
                      </p>
                    </div>
                  </div>

                  {/* Subject allocations */}
                  <div className={cn("rounded-md border p-4 transition-colors", transferSubjects ? "border-primary bg-primary/5" : "border-border", affectedSubjectAllocations.length === 0 && "opacity-60")}>
                    <div
                      className={cn("flex items-start gap-3", affectedSubjectAllocations.length === 0 ? "cursor-not-allowed" : "cursor-pointer")}
                      onClick={() => {
                        if (affectedSubjectAllocations.length === 0) return;
                        setTransferSubjects(!transferSubjects);
                        clearError("assignmentTypes");
                      }}
                    >
                      <Checkbox
                        checked={transferSubjects}
                        disabled={affectedSubjectAllocations.length === 0}
                        onCheckedChange={(checked) => {
                          setTransferSubjects(checked === true);
                          clearError("assignmentTypes");
                        }}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <BookOpen className="size-4 text-primary" />
                          <span className="font-semibold text-foreground">Subject Allocations</span>
                          {includedSubjectAllocations.length > 0 && <Badge variant="secondary">{includedSubjectAllocations.length}</Badge>}
                        </div>

                        <p className="text-sm text-muted-foreground mt-1">
                          {affectedSubjectAllocations.length === 0
                            ? "No active subject allocations for this teacher."
                            : `Tick a subject below to move it. Leave it unticked and it stays with ${fromTeacher?.name ?? "the current teacher"}.`}
                        </p>
                      </div>
                    </div>

                    {transferSubjects && affectedSubjectAllocations.length > 0 && (
                      <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="rounded-md bg-muted/40 p-3 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                            <Field className="flex-1 min-w-0">
                              <Label className="text-xs">Replacement teacher</Label>
                              <Select value={defaultSubjectTeacherId} onValueChange={setDefaultSubjectTeacherId}>
                                <SelectTrigger className="h-9 w-full bg-background">
                                  <SelectValue placeholder="Select teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                  {replacementCandidates.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                      {t.name} · {t.teacherCode}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </Field>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 w-full sm:w-auto shrink-0 gap-1.5 bg-background"
                              disabled={!defaultSubjectTeacherId}
                              title={!defaultSubjectTeacherId ? "Pick a replacement teacher first" : undefined}
                              onClick={applyDefaultToAllSubjects}
                            >
                              <Wand2 className="size-3.5" />
                              Move All Subjects Here
                            </Button>
                          </div>

                          <p className="text-xs text-muted-foreground">Ticks every subject below and assigns this teacher to all of them. You can still untick or change individual rows after.</p>
                        </div>
                        <div className="rounded-md border overflow-hidden overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                          <Table className="min-w-160">
                            <TableHeader className="bg-muted/30">
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="text-xs font-bold uppercase tracking-wider w-10">
                                  <Checkbox
                                    checked={allSubjectsIncluded}
                                    onCheckedChange={(checked) => toggleSelectAllSubjects(checked === true)}
                                    aria-label="Select all subject allocations"
                                    title="Select / deselect all"
                                  />
                                </TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-wider">Class</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-wider">Section</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-wider">Subject</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-wider">Current Teacher</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-wider">New Teacher</TableHead>
                              </TableRow>
                            </TableHeader>

                            <TableBody>
                              {affectedSubjectAllocations.map((a) => {
                                const included = !!subjectIncluded[a.id];

                                return (
                                  <TableRow key={a.id} className={cn(!included && "opacity-60")}>
                                    <TableCell>
                                      <Checkbox
                                        checked={included}
                                        onCheckedChange={(checked) => {
                                          setSubjectIncluded((prev) => ({ ...prev, [a.id]: checked === true }));
                                          clearError("subjectTransfers");
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell className="font-medium text-foreground">{a.class?.name}</TableCell>
                                    <TableCell>{a.section?.name}</TableCell>
                                    <TableCell>{a.subject?.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{fromTeacher?.name}</TableCell>
                                    <TableCell>
                                      {included ? (
                                        <Select
                                          value={subjectTeacherMap[a.id] ?? ""}
                                          onValueChange={(value) => {
                                            setSubjectTeacherMap((prev) => ({ ...prev, [a.id]: value }));
                                            clearError("subjectTransfers");
                                          }}
                                        >
                                          <SelectTrigger className={cn("h-9 w-44", !subjectTeacherMap[a.id] && errors.subjectTransfers && "border-red-500")}>
                                            <SelectValue placeholder="Select teacher" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {replacementCandidates.map((t) => (
                                              <SelectItem key={t.id} value={t.id}>
                                                {t.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <span className="text-sm text-muted-foreground">Stays with {fromTeacher?.name}</span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>

                        {errors.subjectTransfers && <p className="text-sm text-red-500">{errors.subjectTransfers}</p>}
                      </div>
                    )}
                  </div>

                  {errors.assignmentTypes && <p className="text-sm text-red-500">{errors.assignmentTypes}</p>}
                </div>
              )}

              {/* Step 3: Effective date + remarks */}
              {step === 2 && (
                <FieldGroup>
                  <Field>
                    <Label>Effective Date</Label>
                    <Popover open={effectiveDateOpen} onOpenChange={setEffectiveDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn("h-10 w-full sm:w-56 justify-start text-left font-normal", !effectiveDate && "text-muted-foreground", errors.effectiveDate && "border-red-500")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {effectiveDate ? format(new Date(effectiveDate), "dd MMM yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <Calendar
                          mode="single"
                          selected={effectiveDate ? new Date(effectiveDate) : undefined}
                          onSelect={(date) => {
                            if (!date) return;
                            setEffectiveDate(format(date, "yyyy-MM-dd"));
                            clearError("effectiveDate");
                            setEffectiveDateOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.effectiveDate && <p className="text-sm text-red-500 mt-1">{errors.effectiveDate}</p>}
                    <p className="text-xs text-muted-foreground mt-1">Existing allocations for {fromTeacher?.name} will be ended on this date; replacements start the same day.</p>
                  </Field>

                  <Field>
                    <Label>Remarks (optional)</Label>
                    <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Reason for transfer, e.g. long leave, resignation, reassignment" rows={4} />
                  </Field>
                </FieldGroup>
              )}

              {/* Step 4: Review */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="rounded-md border border-border/60 px-4 py-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                      <span className="text-sm text-muted-foreground">Transferring from</span>
                      <span className="font-semibold text-foreground">{fromTeacher?.name}</span>
                    </div>
                  </div>

                  {transferClassTeacher && (
                    <div className="rounded-md border border-border/60 overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/20">
                        <Users className="size-4 text-primary shrink-0" />
                        <span className="font-semibold text-foreground text-sm">Class Teacher Duty</span>
                        <Badge variant="secondary" className="ml-1">
                          {affectedClassAssignments.length}
                        </Badge>
                      </div>

                      <div className="divide-y divide-border/30">
                        {affectedClassAssignments.map((a) => (
                          <div key={a.id} className="px-4 py-2.5 text-sm text-foreground truncate">
                            {a.class?.name} {a.section?.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {transferSubjects && includedSubjectAllocations.length > 0 && (
                    <div className="rounded-md border border-border/60 overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b border-border/40 bg-muted/20">
                        <div className="flex items-center gap-2 min-w-0">
                          <BookOpen className="size-4 text-primary shrink-0" />
                          <span className="font-semibold text-foreground text-sm">Subject Allocations</span>
                          <Badge variant="secondary">{includedSubjectAllocations.length}</Badge>
                        </div>
                      </div>

                      <div className="divide-y divide-border/30">
                        {includedSubjectAllocations.map((a) => (
                          <div key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 px-4 py-2.5 text-sm">
                            <span className="text-foreground min-w-0 truncate">
                              {a.class?.name} {a.section?.name} · {a.subject?.name}
                            </span>

                            <span className="font-medium text-foreground">{teacherName(subjectTeacherMap[a.id])}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {transferSubjects && affectedSubjectAllocations.length > includedSubjectAllocations.length && (
                    <p className="text-xs text-muted-foreground">
                      {affectedSubjectAllocations.length - includedSubjectAllocations.length} subject allocation will stay with {fromTeacher?.name}.
                    </p>
                  )}

                  <div className="rounded-md border border-border/60 divide-y divide-border/40">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-4 py-3">
                      <span className="text-sm text-muted-foreground">Effective date</span>
                      <span className="font-medium text-foreground">{effectiveDate ? format(new Date(effectiveDate), "dd MMM yyyy") : "-"}</span>
                    </div>

                    {remarks.trim() && (
                      <div className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">Remarks</span>
                        <p className="text-foreground mt-1 wrap-break-word text-sm">{remarks}</p>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">Selected assignments will be transferred on the effective date.</p>
                </div>
              )}
            </div>

            {/* Footer controls */}
            <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 sm:px-6 py-4">
              <Button type="button" variant="outline" onClick={goBack} disabled={step === 0} className="gap-2">
                <ArrowLeft className="size-4" />
                Back
              </Button>

              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={goNext} className="gap-2">
                  Next
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={submitting} className="min-w-32 sm:min-w-40 gap-2">
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span className="hidden sm:inline">Transferring...</span>
                      <span className="sm:hidden">Wait...</span>
                    </>
                  ) : (
                    <>
                      <Repeat className="size-4" />
                      <span className="hidden sm:inline">Confirm Transfer</span>
                      <span className="sm:hidden">Confirm</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Transfer history */}
        <div className="bg-card rounded-md p-4 sm:p-5 md:p-6 border border-border/60 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Transfer History</h2>
              <p className="text-sm text-muted-foreground">Past teacher transfers</p>
            </div>

            <div className="relative w-full lg:w-87.5 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Search by teacher name"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="pl-11"
              />
            </div>
          </div>

          {loading && teacherTransfers.length === 0 ? (
            <div className="space-y-4">
              <div className="flex gap-4 border-b border-border/50 pb-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-6 bg-muted rounded flex-1 animate-pulse" />
                ))}
              </div>

              {[1, 2, 3].map((row) => (
                <div key={row} className="flex gap-4 py-2 border-b border-border/20">
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                </div>
              ))}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 md:p-16 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground/75">
                <Inbox className="size-6 stroke-[1.5]" />
              </div>

              <h3 className="text-lg font-bold text-foreground">{teacherTransfers.length === 0 ? "No transfers yet." : "No transfers found."}</h3>
              <p className="text-muted-foreground mt-1.5 max-w-sm">{teacherTransfers.length === 0 ? "Completed transfers will show up here." : "Try adjusting your search."}</p>
            </div>
          ) : (
            <>
              <div className="relative w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <Table className="table-fixed">
                  <TableHeader className="bg-gray-50 dark:bg-muted/15 border-b border-border/60">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pl-4 sm:pl-6 text-foreground/80 w-56 sm:w-64">Transfer</TableHead>
                      <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-wider py-4 px-4 text-foreground/80 w-28">Remarks</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 w-32 hidden lg:table-cell">Effective Date</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 w-32 hidden lg:table-cell">Created At</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pr-4 sm:pr-6 text-foreground/80 text-right w-16 sm:w-20 sticky right-0 bg-gray-50 dark:bg-muted/15 shadow-lg md:shadow-none border-l border-border/40 md:border-l-0">
                        <span className="md:block">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y divide-border/30">
                    {paginatedHistory.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="py-4 pl-4 sm:pl-6 align-middle">
                          <div className="flex items-center gap-2 min-w-0 max-w-56 sm:max-w-72">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground/70">{initials(item.fromTeacher?.name)}</div>
                              <span className="font-semibold text-foreground text-sm truncate max-w-20 sm:max-w-24 md:max-w-32" title={item.fromTeacher?.name}>
                                {item.fromTeacher?.name}
                              </span>
                            </div>

                            <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />

                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                                {initials(item.classTransfers?.[0]?.toTeacher?.name ?? item.subjectTransfers?.[0]?.toTeacher?.name)}
                              </div>
                              <span
                                className="font-semibold text-foreground text-sm truncate max-w-20 sm:max-w-24 md:max-w-32"
                                title={item.classTransfers?.[0]?.toTeacher?.name ?? item.subjectTransfers?.[0]?.toTeacher?.name}
                              >
                                {item.classTransfers?.[0]?.toTeacher?.name ?? item.subjectTransfers?.[0]?.toTeacher?.name ?? "-"}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="hidden md:table-cell py-4 px-4 align-middle">
                          <span className="text-sm text-muted-foreground truncate block" title={item.remarks}>
                            {item.remarks || "-"}
                          </span>
                        </TableCell>

                        <TableCell className="py-4 text-xs font-medium text-muted-foreground hidden lg:table-cell align-middle">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="size-4 text-muted-foreground/80" />
                            <span className="text-sm">
                              {new Date(item.effectiveDate).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-4 text-xs font-medium text-muted-foreground hidden lg:table-cell align-middle">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="size-4 text-muted-foreground/80" />
                            <span className="text-sm">
                              {new Date(item.createdAt).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-4 pr-4 sm:pr-6 text-right align-middle w-14 md:w-24 bg-card sticky right-0 shadow-lg md:shadow-none border-l border-border/40 md:border-l-0">
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-9 md:size-10 rounded-lg text-muted-foreground hover:bg-blue-300/10 hover:text-blue-700 transition-all"
                              title="View transfer details"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={() => openHistoryDialog(item)}
                            >
                              <Eye className="size-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-3">
                <Button variant="outline" size="icon" onClick={() => setPage(Math.max(page - 1, 0))} disabled={page === 0} className="size-8 shrink-0">
                  <ChevronLeft className="size-4" />
                </Button>

                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredHistory.length)} of {filteredHistory.length}
                </span>

                <Button variant="outline" size="icon" onClick={() => setPage(Math.min(page + 1, totalPages - 1))} disabled={page === totalPages - 1} className="size-8 shrink-0">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Timetable conflict popup */}
      <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden p-0 flex flex-col gap-0">
          {/* Header */}
          <div className="shrink-0 border-b border-border/60 px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-start gap-3">
              <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500">
                <AlertTriangle className="size-4.5 sm:size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <DialogTitle className="text-base sm:text-lg">Resolve Timetable Conflicts</DialogTitle>
                <DialogDescription className="mt-0.5 text-xs sm:text-sm">The replacement teacher already has a class at the same time. Pick a new period for each clash below.</DialogDescription>
              </div>
            </div>

            {/* Progress summary */}
            <div className="mt-4 flex items-center gap-3">
              <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", allConflictsResolved ? "bg-emerald-500" : "bg-primary")}
                  style={{ width: timetableConflicts.length ? `${(resolvedConflictCount / timetableConflicts.length) * 100}%` : "0%" }}
                />
              </div>
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                {resolvedConflictCount}/{timetableConflicts.length} resolved
              </span>
            </div>
          </div>

          {/* Conflict list */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
            {timetableConflicts.map((conflict) => {
              const selected = timetableResolutions[conflict.timetableId];
              const isResolved = !!selected;
              const dayGroups = groupSlotsByDay(conflict.availableSlots);

              return (
                <div key={conflict.timetableId} className={cn("rounded-lg border p-3 sm:p-4 space-y-3.5 transition-colors", isResolved ? "border-emerald-500/40 bg-emerald-500/3" : "border-border/60")}>
                  {/* Card header: what's clashing */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{conflict.subjectName}</p>
                        <span className="text-sm text-muted-foreground">
                          {conflict.className} {conflict.sectionName}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 flex-wrap text-sm">
                        <Badge variant="outline" className="gap-1.5 border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400 font-normal">
                          {conflict.currentDay} · Period {conflict.currentPeriod}
                        </Badge>

                        <span className="text-xs text-muted-foreground">clashes with</span>

                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="text-foreground font-medium wrap-break-word">{conflict.conflictTeacherName}</span>
                          <span className="text-muted-foreground wrap-break-word">· {conflict.conflictSubjectName}</span>
                        </div>
                      </div>
                    </div>

                    {isResolved ? (
                      <Badge className="self-start shrink-0 gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent font-medium">
                        <CheckCircle2 className="size-3.5" />
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="self-start shrink-0 border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-500 font-medium">
                        Needs a slot
                      </Badge>
                    )}
                  </div>

                  {/* Slot picker */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {isResolved ? (
                        <>
                          New slot:{" "}
                          <span className="text-foreground font-semibold">
                            {DAY_LABELS[selected.dayOfWeek]} · Period {selected.periodNo}
                          </span>
                        </>
                      ) : (
                        "Choose a new slot"
                      )}
                    </p>

                    {dayGroups.length === 0 ? (
                      <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-500">
                        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                        <span>No free slots for this teacher. Go back and choose a different replacement teacher, or leave this allocation with {fromTeacher?.name}.</span>
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-1.5">
                        {dayGroups.map(({ day, periods }) => (
                          <div key={day} className="rounded-md bg-muted/30 p-2 sm:bg-transparent sm:p-0 sm:rounded-none">
                            <div className="flex items-start gap-2.5">
                              <span className="w-10 shrink-0 pt-1 sm:pt-1.5 text-xs font-semibold text-muted-foreground">{DAY_LABELS[day]}</span>

                              <div className="flex flex-1 flex-wrap gap-1.5">
                                {periods.map((periodNo) => {
                                  const isSelected = selected?.dayOfWeek === day && selected?.periodNo === periodNo;

                                  const isAlreadyUsed = Object.entries(timetableResolutions).some(([timetableId, resolution]) => {
                                    if (timetableId === conflict.timetableId) return false;

                                    const otherConflict = timetableConflicts.find((item) => item.timetableId === timetableId);

                                    if (!otherConflict) return false;

                                    return (
                                      resolution.dayOfWeek === day &&
                                      resolution.periodNo === periodNo &&
                                      otherConflict.sessionId === conflict.sessionId &&
                                      otherConflict.classId === conflict.classId &&
                                      otherConflict.sectionId === conflict.sectionId
                                    );
                                  });

                                  return (
                                    <button
                                      key={`${day}-${periodNo}`}
                                      type="button"
                                      disabled={isAlreadyUsed}
                                      onClick={() =>
                                        setTimetableResolutions((prev) => ({
                                          ...prev,
                                          [conflict.timetableId]: {
                                            dayOfWeek: day as DayOfWeek,
                                            periodNo,
                                          },
                                        }))
                                      }
                                      className={cn(
                                        "h-9 sm:h-8 min-w-10 sm:min-w-9 rounded-md border px-2 text-xs font-medium transition-colors",
                                        isSelected && "border-primary bg-primary text-primary-foreground",
                                        isAlreadyUsed && "cursor-not-allowed border-border bg-muted text-muted-foreground/40 line-through",
                                        !isSelected && !isAlreadyUsed && "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5"
                                      )}
                                    >
                                      P{periodNo}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <DialogFooter className="shrink-0 border-t border-border/60 px-4 sm:px-6 py-4 flex flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground text-left pl-4 flex-1 min-w-0">
              {allConflictsResolved ? "All clashes have a new slot." : `${timetableConflicts.length - resolvedConflictCount} clash still need a slot.`}
            </p>

            <div className="flex items-center pb-3 pr-3 sm:pb-3 sm:pr-2 gap-2 shrink-0">
              <Button type="button" variant="outline" className="min-w-16" onClick={() => setConflictDialogOpen(false)}>
                Cancel
              </Button>

              <Button
                type="button"
                className="min-w-24"
                disabled={submitting || !allConflictsResolved}
                onClick={() => {
                  setConflictDialogOpen(false);
                  handleSubmit();
                }}
              >
                {submitting ? "Transferring..." : `Apply ${resolvedConflictCount}/${timetableConflicts.length} Slots`}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden max-h-[85vh] flex flex-col">
          <div className="border-b px-4 sm:px-6 py-4 sm:py-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-9 sm:size-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                <Repeat className="size-4.5 sm:size-5 text-primary" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg">Transfer Details</DialogTitle>
                <DialogDescription className="truncate text-xs sm:text-sm">{selectedTransfer ? `${selectedTransfer.fromTeacher?.name} Transfer Details` : ""}</DialogDescription>
              </div>
            </div>
          </div>

          {selectedTransfer && (
            <div className="overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Teacher summary */}
              <div className="flex items-center justify-center gap-4 rounded-md bg-muted/40 p-4">
                <div className="flex flex-col items-center gap-1.5 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="size-4.5" />
                  </div>
                  <span className="font-semibold text-foreground text-sm text-center max-w-24 sm:max-w-32 truncate">{selectedTransfer.fromTeacher?.name}</span>
                </div>

                <ArrowRight className="size-4 text-muted-foreground shrink-0" />

                <div className="flex flex-col items-center gap-1.5 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="size-4.5" />
                  </div>
                  <span className="font-semibold text-foreground text-sm text-center max-w-24 sm:max-w-32 truncate">Multiple Teachers</span>
                </div>
              </div>

              {/* Basic info */}
              <div className="rounded-md border border-border/60 divide-y divide-border/40">
                <div className="flex items-center justify-between gap-2 p-4">
                  <span className="text-sm text-muted-foreground shrink-0">Effective Date</span>
                  <span className="font-medium text-foreground text-right">{new Date(selectedTransfer.effectiveDate).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                </div>

                <div className="flex items-center justify-between gap-2 p-4">
                  <span className="text-sm text-muted-foreground shrink-0">Transferred By</span>
                  <span className="font-medium text-foreground text-right truncate min-w-0">{selectedTransfer.transferredBy?.name ?? "-"}</span>
                </div>

                {selectedTransfer.remarks && (
                  <div className="p-4">
                    <span className="text-sm text-muted-foreground">Remarks</span>
                    <p className="text-foreground mt-1 wrap-break-word">{selectedTransfer.remarks}</p>
                  </div>
                )}
              </div>

              {/* Subject allocations moved */}
              {selectedTransfer.subjectTransfers && selectedTransfer.subjectTransfers.length > 0 && (
                <div className="rounded-md border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="size-4 text-primary" />
                    <span className="font-semibold text-foreground">Subject Allocations Moved</span>
                    <Badge variant="secondary">{selectedTransfer.subjectTransfers.length}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedTransfer.subjectTransfers.map((a) => (
                      <Badge key={a.id} className="bg-muted text-muted-foreground font-normal">
                        {a.subjectAllocation.class?.name} {a.subjectAllocation.section?.name} · {a.subjectAllocation.subject?.name} → {a.toTeacher?.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Class teacher duties moved */}
              {selectedTransfer.classTransfers && selectedTransfer.classTransfers.length > 0 && (
                <div className="rounded-md border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="size-4 text-primary" />
                    <span className="font-semibold text-foreground">Class Teacher Duties Moved</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedTransfer.classTransfers.map((a) => (
                      <Badge key={a.id} className="bg-muted text-muted-foreground font-normal">
                        {a.classTeacherAssignment.class?.name} {a.classTeacherAssignment.section?.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(!selectedTransfer.subjectTransfers || selectedTransfer.subjectTransfers.length === 0) && (!selectedTransfer.classTransfers || selectedTransfer.classTransfers.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-2">No detailed assignment breakdown available for this transfer.</p>
              )}
            </div>
          )}

          <DialogFooter className="p-4 sm:p-6 pt-2.5 flex flex-row justify-end">
            <DialogClose asChild>
              <div className="pb-3 px-3">
                <Button className="min-w-16" variant="outline">
                  Close
                </Button>
              </div>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
