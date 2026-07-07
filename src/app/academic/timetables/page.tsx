"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BookOpen, CalendarClock, CalendarRange, Loader2, Pencil, Plus, Sparkles, Trash2, User } from "lucide-react";
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

// ---- Fixed timetable shape. Adjust here if periods/days ever become dynamic. ----
const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: "MONDAY", label: "Monday", short: "Mon" },
  { key: "TUESDAY", label: "Tuesday", short: "Tue" },
  { key: "WEDNESDAY", label: "Wednesday", short: "Wed" },
  { key: "THURSDAY", label: "Thursday", short: "Thu" },
  { key: "FRIDAY", label: "Friday", short: "Fri" },
  { key: "SATURDAY", label: "Saturday", short: "Sat" },
];
const PERIOD_COUNT = 8;
const PERIODS = Array.from({ length: PERIOD_COUNT }, (_, i) => i + 1);

const JS_DAY_TO_KEY: Record<number, DayKey | null> = {
  0: null,
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

// Deterministic subject -> color mapping so the same subject always reads the
// same color across the whole grid, like tabs on a physical timetable.
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

export default function TimetablePage() {
  const { loading, sessions, classes, sections, subjectAllocations, timetables, fetchSessions, fetchClasses, fetchSections, fetchSubjectAllocations, fetchTimetables, createTimetable, updateTimetable, deleteTimetable } =
    useAcademicStore();

  const authorized = usePermission("timetable.read");

  const [sessionId, setSessionId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const [slotOpen, setSlotOpen] = useState(false);
  const [slotForm, setSlotForm] = useState<SlotFormState>(emptySlotForm);
  const [submitting, setSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState<Timetable | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchClasses();
    fetchSections();
    fetchSubjectAllocations();
    fetchTimetables();
  }, [fetchSessions, fetchClasses, fetchSections, fetchSubjectAllocations, fetchTimetables]);

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

  const totalSlots = DAYS.length * PERIOD_COUNT;
  const filledSlots = viewTimetables.length;
  const completionPct = totalSlots === 0 ? 0 : Math.round((filledSlots / totalSlots) * 100);

  const todayKey = JS_DAY_TO_KEY[new Date().getDay()];

  if (authorized === null) {
    return null;
  }

  function isSlotTaken(day: DayKey | "", period: number | "", excludeId?: string) {
    if (!day || !period) return false;
    const existing = cellMap[`${day}-${period}`];
    return Boolean(existing && existing.id !== excludeId);
  }

  function openCreateDialog(day?: DayKey, period?: number) {
    setSlotForm({
      mode: "create",
      day: day ?? "",
      periodNo: period ?? "",
      subjectAllocationId: "",
    });
    setSlotOpen(true);
  }

  function openEditDialog(entry: Timetable) {
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

  const slotConflict = isSlotTaken(slotForm.day, slotForm.periodNo, slotForm.entryId);
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

      toast.error(err.response?.data?.message || Object.values(err.response?.data?.errors || {})[0] || "Failed to save this period");
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

  function renderCell(day: DayKey, period: number) {
    const entry = cellMap[`${day}-${period}`];

    if (!entry) {
      return (
        <button
          type="button"
          onClick={() => openCreateDialog(day, period)}
          className="group flex h-20 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground/50 transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
        >
          <Plus className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="text-[11px] font-medium opacity-0 transition-opacity group-hover:opacity-100">Add</span>
        </button>
      );
    }

    const color = subjectColor(entry.subjectAllocation.subject.id);

    return (
      <div className={cn("group relative flex h-20 w-full flex-col justify-center gap-0.5 overflow-hidden rounded-xl border px-3 py-2 transition-shadow hover:shadow-sm", color.bg, color.border)}>
        <div className="flex items-center gap-1.5">
          <span className={cn("size-1.5 shrink-0 rounded-full", color.dot)} />
          <p className={cn("truncate text-[13px] font-semibold leading-tight", color.text)} title={entry.subjectAllocation.subject.name}>
            {entry.subjectAllocation.subject.name}
          </p>
        </div>

        <div className="flex items-center gap-1 pl-3 text-xs text-muted-foreground">
          <User className="size-3 shrink-0" />
          <span className="truncate" title={entry.subjectAllocation.teacher.name}>
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

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Timetable</h1>
          <p className="text-muted-foreground">Build and manage the weekly period schedule for a class section</p>
        </div>

        <Button className="gap-2 px-5" disabled={!viewSelected} onClick={() => openCreateDialog()}>
          <Plus className="size-4" />
          Add Period
        </Button>
      </div>

      {/* Scope selector */}
      <div className="mb-6 rounded-md border bg-card p-5">
        <div className="mb-4 flex items-center gap-1.5">
          <CalendarRange className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Viewing timetable for</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field>
            <Label>Academic Session</Label>
            <Select value={sessionId} onValueChange={setSessionId}>
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
          </Field>

          <Field>
            <Label>Class</Label>
            <Select value={classId} onValueChange={setClassId}>
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
            <Select value={sectionId} onValueChange={setSectionId}>
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
        </div>

        {viewSelected && (
          <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {filledSlots} / {totalSlots} periods scheduled
              </span>
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full transition-all", completionPct === 100 ? "bg-emerald-500" : "bg-primary")} style={{ width: `${completionPct}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{completionPct}%</span>
            </div>

            {activeSubjects.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <BookOpen className="size-3.5 text-muted-foreground" />
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

      {/* Grid */}
      <div className="rounded-md border bg-card p-5">
        {!viewSelected ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
              <CalendarRange className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Select a session, class and section</h3>
            <p className="mt-2 max-w-sm text-muted-foreground">Choose all three above to view and build that section&apos;s weekly timetable.</p>
          </div>
        ) : loading && timetables.length === 0 ? (
          <div className="space-y-3">
            {PERIODS.map((p) => (
              <div key={p} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[900px] border-separate border-spacing-y-2">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-20 text-xs font-bold uppercase tracking-wider text-foreground/80">Period</TableHead>
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
                      <TableCell key={day.key} className={cn("p-1.5 align-top", day.key === todayKey && "bg-primary/[0.02]")}>
                        {renderCell(day.key, period)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create / Edit slot dialog */}
      <Dialog
        open={slotOpen}
        onOpenChange={(open) => {
          setSlotOpen(open);
          if (!open) {
            setSlotForm(emptySlotForm);
          }
        }}
      >
        <DialogContent className="sm:max-w-105 p-0 overflow-hidden">
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
                  <Select value={slotForm.day} onValueChange={(value) => setSlotForm((p) => ({ ...p, day: value as DayKey }))}>
                    <SelectTrigger className="mt-2 h-11 w-full">
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
                    <SelectTrigger className="mt-2 h-11 w-full">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODS.map((p) => (
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
                  onOpenChange={(open) => {
                    if (open && scopedAllocations.length === 0) {
                      toast.error("No subjects have been allocated to this class section yet.");
                    }
                  }}
                  onValueChange={(value) => {
                    setSlotForm((p) => ({ ...p, subjectAllocationId: value }));
                  }}
                >
                  <SelectTrigger className="mt-2 h-11 w-full">
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

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="sm:max-w-105">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="size-6 text-destructive" />
            </div>
            <AlertDialogTitle className="w-full text-center text-xl">Remove this period?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This will remove <span className="font-semibold text-foreground">{deletingEntry?.subjectAllocation.subject.name}</span>
              {" from "}
              <span className="font-semibold text-foreground">{deletingEntry ? DAYS.find((d) => d.key === deletingEntry.dayOfWeek)?.label : ""}</span>
              {", Period "}
              <span className="font-semibold text-foreground">{deletingEntry?.periodNo}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="h-11 bg-destructive text-white hover:bg-destructive/90">
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
