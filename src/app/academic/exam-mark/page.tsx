"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ClipboardCheck, Search, Save, RotateCcw, ShieldAlert } from "lucide-react";
import { useAcademicStore, Exam, ExamSchedule, ExamSubjectComponent } from "@/store/academicStore";
import { usePermission } from "@/hooks/usePermission";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};

interface MarkEntry {
  marksObtained: string;
  remarks: string;
  isAbsent: boolean;
}

export default function ExamMarksPage() {
  const {
    loading,
    exams,
    studentEnrollments,
    examMarks,

    fetchExams,
    fetchStudents,
    fetchStudentEnrollments,
    fetchExamMarks,

    createExamMark,
    updateExamMark,
  } = useAcademicStore();

  const authorized = usePermission("marks.read");
  const canEnter = usePermission("marks.enter");
  const canUpdate = usePermission("marks.update");

  const [examId, setExamId] = useState("");
  const [scheduleId, setScheduleId] = useState("");
  const [componentId, setComponentId] = useState("");
  const [search, setSearch] = useState("");
  const [marks, setMarks] = useState<Record<string, MarkEntry>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchStudents();
    fetchStudentEnrollments();
    fetchExamMarks();
  }, []);

  const selectedExam = useMemo<Exam | null>(() => {
    return exams.find((exam) => exam.id === examId) ?? null;
  }, [exams, examId]);

  const schedules = useMemo(() => {
    if (!selectedExam) return [];

    return [...selectedExam.schedules].sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
  }, [selectedExam]);

  const selectedSchedule = useMemo<ExamSchedule | null>(() => {
    return schedules.find((schedule) => schedule.id === scheduleId) ?? null;
  }, [schedules, scheduleId]);
  const components = useMemo<ExamSubjectComponent[]>(() => {
    if (!selectedSchedule) return [];

    return [...(selectedSchedule.components ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [selectedSchedule]);

  const selectedComponent = useMemo<ExamSubjectComponent | null>(() => {
    return components.find((component) => component.id === componentId) ?? null;
  }, [components, componentId]);

  const eligibleStudents = useMemo(() => {
    if (!selectedSchedule) return [];

    const allocation = selectedSchedule.subjectAllocation;

    return studentEnrollments
      .filter((enrollment) => {
        return enrollment.sessionId === selectedExam?.sessionId && enrollment.classId === allocation.class.id && enrollment.sectionId === allocation.section.id && enrollment.enrollmentStatus === "ACTIVE";
      })
      .map((enrollment) => enrollment.student)
      .filter((student, index, array) => {
        return array.findIndex((item) => item.id === student.id) === index;
      })
      .sort((a, b) => {
        const first = `${a.firstName} ${a.lastName}`;
        const second = `${b.firstName} ${b.lastName}`;

        return first.localeCompare(second);
      });
  }, [studentEnrollments, selectedSchedule, selectedExam]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return eligibleStudents;

    return eligibleStudents.filter((student) => {
      const name = `${student.firstName} ${student.lastName}`.toLowerCase();

      return name.includes(query) || student.admissionNo.toLowerCase().includes(query) || student.studentCode.toLowerCase().includes(query);
    });
  }, [eligibleStudents, search]);

  const scheduleMarks = useMemo(() => {
    if (!selectedSchedule || !selectedComponent) return [];

    return examMarks.filter((mark) => mark.examScheduleId === selectedSchedule.id && mark.examSubjectComponentId === selectedComponent.id);
  }, [examMarks, selectedSchedule, selectedComponent]);

  useEffect(() => {
    if (!selectedSchedule || !selectedComponent) {
      setMarks({});
      return;
    }

    const nextMarks: Record<string, MarkEntry> = {};

    eligibleStudents.forEach((student) => {
      const existing = scheduleMarks.find((mark) => mark.studentId === student.id);

      nextMarks[student.id] = {
        marksObtained: existing?.marksObtained !== undefined && existing?.marksObtained !== null ? String(existing.marksObtained) : "",
        remarks: existing?.remarks ?? "",
        isAbsent: existing?.isAbsent ?? false,
      };
    });

    setMarks(nextMarks);
  }, [selectedSchedule, selectedComponent, eligibleStudents, scheduleMarks]);

  const handleExamChange = (value: string) => {
    setExamId(value);
    setScheduleId("");
    setComponentId("");
    setSearch("");
    setMarks({});
  };

  const handleScheduleChange = (value: string) => {
    setScheduleId(value);

    const nextSchedule = schedules.find((schedule) => schedule.id === value);
    const nextComponents = nextSchedule?.components ?? [];

    setComponentId(nextComponents[0]?.id ?? "");
    setSearch("");
  };

  const handleComponentChange = (value: string) => {
    setComponentId(value);
    setSearch("");
  };

  const updateStudentMark = (studentId: string, field: keyof MarkEntry, value: string | boolean) => {
    setMarks((previous) => {
      const current = previous[studentId] ?? {
        marksObtained: "",
        remarks: "",
        isAbsent: false,
      };

      const next: MarkEntry = { ...current, [field]: value };
      if (field === "isAbsent" && value === true) {
        next.marksObtained = "";
      }

      return {
        ...previous,
        [studentId]: next,
      };
    });
  };

  const validateMarks = () => {
    if (!selectedSchedule || !selectedComponent) return false;

    for (const student of eligibleStudents) {
      const entry = marks[student.id];

      if (!entry || entry.isAbsent) continue;

      const value = entry.marksObtained ?? "";

      if (!value.trim()) continue;

      const numericValue = Number(value);

      if (Number.isNaN(numericValue) || numericValue < 0) {
        toast.error(`Invalid marks for ${student.firstName} ${student.lastName}`);
        return false;
      }

      if (numericValue > Number(selectedComponent.maximumMarks)) {
        toast.error(`Marks for ${student.firstName} ${student.lastName} cannot exceed ${selectedComponent.maximumMarks}`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!selectedSchedule) {
      toast.error("Select an exam schedule first");
      return;
    }

    if (!selectedComponent) {
      toast.error("Select an exam component first");
      return;
    }

    if (!validateMarks()) return;

    setSaving(true);

    const existingMarks = new Map(scheduleMarks.map((mark) => [mark.studentId, mark]));

    const tasks: Promise<unknown>[] = [];
    let skippedForPermission = 0;

    for (const student of eligibleStudents) {
      const entry = marks[student.id] ?? {
        marksObtained: "",
        remarks: "",
        isAbsent: false,
      };

      const value = entry.marksObtained ?? "";
      const remarks = entry.remarks?.trim() || undefined;
      const isAbsent = entry.isAbsent;

      if (!value.trim() && !isAbsent) continue;

      const existing = existingMarks.get(student.id);

      const payload = {
        examScheduleId: selectedSchedule.id,
        examSubjectComponentId: selectedComponent.id,
        marksObtained: isAbsent ? undefined : Number(value),
        isAbsent,
        remarks,
      };

      if (existing) {
        if (canUpdate) {
          tasks.push(updateExamMark(existing.id, payload));
        } else {
          skippedForPermission += 1;
        }
      } else if (canEnter) {
        tasks.push(
          createExamMark({
            ...payload,
            studentId: student.id,
          })
        );
      } else {
        skippedForPermission += 1;
      }
    }

    if (tasks.length === 0) {
      setSaving(false);
      if (skippedForPermission > 0) {
        toast.error("You don't have permission to save these marks");
      } else {
        toast.error("No marks to save");
      }
      return;
    }

    const results = await Promise.allSettled(tasks);
    const failed = results.filter((result) => result.status === "rejected");

    try {
      await fetchExamMarks();
    } finally {
      setSaving(false);
    }

    if (failed.length === 0) {
      if (skippedForPermission > 0) {
        toast.success(`Saved ${tasks.length} mark(s). ${skippedForPermission} skipped due to permissions.`);
      } else {
        toast.success("Marks saved successfully");
      }
    } else {
      const firstError = failed[0] as PromiseRejectedResult;
      const err = firstError.reason as AxiosError<ApiErrorResponse>;
      const message = err?.response?.data?.message || "Failed to save some marks";

      toast.error(`${message} (${failed.length} of ${tasks.length} failed)`);
    }
  };

  if (authorized === null) {
    return null;
  }

  if (authorized === false) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border bg-card p-12 text-center">
          <ShieldAlert className="size-8 text-muted-foreground" />
          <h3 className="font-semibold">Access Denied</h3>
          <p className="max-w-sm text-sm text-muted-foreground">You don&apos;t have permission to view exam marks. Contact your administrator if you believe this is a mistake.</p>
        </div>
      </DashboardLayout>
    );
  }

  const passedCount = selectedComponent
    ? eligibleStudents.filter((student) => {
        const entry = marks[student.id];
        if (!entry || entry.isAbsent) return false;

        const raw = entry.marksObtained ?? "";
        if (!raw.trim()) return false;

        const value = Number(raw);

        return !Number.isNaN(value) && selectedComponent.passingMarks !== undefined && Number(selectedComponent.passingMarks) <= value;
      }).length
    : 0;

  const absentCount = selectedSchedule ? eligibleStudents.filter((student) => marks[student.id]?.isAbsent).length : 0;

  const enteredCount = selectedSchedule
    ? eligibleStudents.filter((student) => {
        const entry = marks[student.id];
        return entry?.isAbsent || entry?.marksObtained?.trim() !== "";
      }).length
    : 0;

  const canEdit = canEnter || canUpdate;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Marks Entry</h1>

            <p className="text-sm text-muted-foreground sm:text-base">Enter and manage student examination marks</p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-md border bg-card p-4 sm:p-6">
          <div className="mb-5 flex items-center gap-1.5">
            <ClipboardCheck className="size-3.5 text-muted-foreground" />

            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Examination Selection</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="exam-select" className="mb-2 block text-sm font-medium">
                Examination
              </label>

              <Select value={examId} onValueChange={handleExamChange}>
                <SelectTrigger id="exam-select" className="h-11 w-full">
                  <SelectValue placeholder="Select Examination" />
                </SelectTrigger>

                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="schedule-select" className="mb-2 block text-sm font-medium">
                Exam Schedule
              </label>

              <Select value={scheduleId} onValueChange={handleScheduleChange} disabled={!examId}>
                <SelectTrigger id="schedule-select" className="h-11 w-full">
                  <SelectValue placeholder="Select Subject / Paper" />
                </SelectTrigger>

                <SelectContent>
                  {schedules.map((schedule) => (
                    <SelectItem key={schedule.id} value={schedule.id}>
                      {schedule.subjectAllocation.subject.name}
                      {" — "}
                      {schedule.subjectAllocation.class.name} {schedule.subjectAllocation.section.name}
                      {" — "}
                      {format(new Date(schedule.examDate), "dd MMM yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSchedule && (
              <div>
                <label htmlFor="component-select" className="mb-2 block text-sm font-medium">
                  Exam Component / Paper
                </label>

                <Select value={componentId} onValueChange={handleComponentChange} disabled={components.length === 0}>
                  <SelectTrigger id="component-select" className="h-11 w-full">
                    <SelectValue placeholder={components.length === 0 ? "No components configured" : "Select Component / Paper"} />
                  </SelectTrigger>

                  <SelectContent>
                    {components.map((component) => (
                      <SelectItem key={component.id} value={component.id}>
                        {component.name}
                        {component.code ? ` (${component.code})` : ""}
                        {" — "}
                        {component.maximumMarks} marks
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {components.length === 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No exam components have been configured for this subject yet — set them up once from the Exams page (they&apos;ll apply to every section automatically).
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selected Schedule Overview */}
        {selectedSchedule && (
          <div className="rounded-md border bg-card p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-lg border bg-muted/20 p-3.5">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Subject</p>

                <p className="mt-2 text-sm font-semibold">{selectedSchedule.subjectAllocation.subject.name}</p>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3.5">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Class</p>

                <p className="mt-2 text-sm font-semibold">
                  {selectedSchedule.subjectAllocation.class.name}
                  {" - "}
                  {selectedSchedule.subjectAllocation.section.name}
                </p>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3.5">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Exam Date</p>

                <p className="mt-2 text-sm font-semibold">{format(new Date(selectedSchedule.examDate), "dd MMM yyyy")}</p>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3.5">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Component</p>

                <p className="mt-2 truncate text-sm font-semibold">{selectedComponent?.name ?? "—"}</p>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3.5">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Maximum Marks</p>

                <p className="mt-2 text-sm font-semibold">{selectedComponent?.maximumMarks ?? "—"}</p>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3.5">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Passing Marks</p>

                <p className="mt-2 text-sm font-semibold">{selectedComponent?.passingMarks ?? "—"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Marks Table */}
        <div className="rounded-md border bg-card">
          <div className="flex flex-col gap-4 border-b px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <ClipboardCheck className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Student Marks</span>
                </div>

                {selectedSchedule && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {enteredCount} entered
                    {absentCount > 0 && ` • ${absentCount} absent`}
                    {selectedComponent?.passingMarks !== undefined && ` • ${passedCount} passed`}
                  </p>
                )}
              </div>

              {selectedSchedule && search && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSearch("");
                  }}
                  className="h-9 gap-1.5 self-start text-muted-foreground"
                >
                  <RotateCcw className="size-3.5" />
                  Reset Search
                </Button>
              )}
            </div>

            {selectedSchedule && (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input placeholder="Search student name, admission number..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-10" />
              </div>
            )}
          </div>

          {!selectedSchedule ? (
            <div className="p-12 text-center">
              <ClipboardCheck className="mx-auto size-8 text-muted-foreground" />

              <h3 className="mt-3 font-semibold">Select an exam schedule</h3>

              <p className="mt-1 text-sm text-muted-foreground">Select an examination and subject schedule to enter student marks.</p>
            </div>
          ) : !selectedComponent ? (
            <div className="p-12 text-center">
              <ClipboardCheck className="mx-auto size-8 text-muted-foreground" />

              <h3 className="mt-3 font-semibold">Select an exam component</h3>

              <p className="mt-1 text-sm text-muted-foreground">Select a paper or component for this schedule before entering marks.</p>
            </div>
          ) : filteredStudents.length === 0 && eligibleStudents.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardCheck className="mx-auto size-8 text-muted-foreground" />

              <h3 className="mt-3 font-semibold">No students found</h3>

              <p className="mt-1 text-sm text-muted-foreground">No active students are enrolled in this class and section.</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <Search className="mx-auto size-8 text-muted-foreground" />

              <h3 className="mt-3 font-semibold">No matches</h3>

              <p className="mt-1 text-sm text-muted-foreground">No students match &quot;{search}&quot;. Try a different search.</p>
            </div>
          ) : (
            <>
              {!canEdit && (
                <div className="mx-4 mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-400 sm:mx-6">
                  You have read-only access to marks and cannot make changes.
                </div>
              )}

              <div className="max-h-[60vh] overflow-auto">
                <table className="w-full min-w-215 text-sm">
                  <thead className="sticky top-0 z-10 bg-card">
                    <tr className="border-b bg-muted/10 text-left">
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">S no.</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Student</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Admission No.</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Marks</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Absent</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Result</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Remarks</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map((student, index) => {
                      const current = marks[student.id] ?? {
                        marksObtained: "",
                        remarks: "",
                        isAbsent: false,
                      };

                      const numericMarks = current.marksObtained.trim() ? Number(current.marksObtained) : null;
                      const hasMarks = !current.isAbsent && numericMarks !== null && !Number.isNaN(numericMarks);
                      const isPassed = hasMarks && selectedComponent?.passingMarks !== undefined && numericMarks >= Number(selectedComponent.passingMarks);

                      return (
                        <tr key={student.id} className="border-b last:border-0 hover:bg-muted/10">
                          <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>

                          <td className="px-4 py-3">
                            <div className="font-medium">
                              {student.firstName} {student.lastName}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-muted-foreground">{student.admissionNo}</td>

                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min={0}
                              max={Number(selectedComponent.maximumMarks)}
                              step="1"
                              value={current.marksObtained}
                              disabled={!canEdit || current.isAbsent}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value !== "" && Number(value) < 0) {
                                  return;
                                }
                                if (value !== "" && Number(value) > Number(selectedComponent.maximumMarks)) {
                                  return;
                                }
                                updateStudentMark(student.id, "marksObtained", value);
                              }}
                              placeholder={current.isAbsent ? "Absent" : `0 - ${selectedComponent.maximumMarks}`}
                              className="h-10 w-32"
                            />
                          </td>

                          <td className="px-4 py-3">
                            <Checkbox
                              checked={current.isAbsent}
                              disabled={!canEdit}
                              onCheckedChange={(value) => updateStudentMark(student.id, "isAbsent", Boolean(value))}
                              aria-label={`Mark ${student.firstName} ${student.lastName} absent`}
                            />
                          </td>

                          <td className="px-4 py-3">
                            {current.isAbsent ? (
                              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">Absent</span>
                            ) : hasMarks && selectedComponent.passingMarks !== undefined ? (
                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                                  isPassed ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                )}
                              >
                                {isPassed ? "Passed" : "Failed"}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <Textarea
                              value={current.remarks}
                              disabled={!canEdit}
                              onChange={(e) => updateStudentMark(student.id, "remarks", e.target.value)}
                              placeholder="Optional"
                              rows={1}
                              className="min-h-10 w-56 resize-none"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {canEdit && (
                <div className="flex items-center justify-end gap-3 border-t px-4 py-4 sm:px-6">
                  <p className="mr-auto hidden text-xs text-muted-foreground sm:block">Rows left blank and not marked absent will not create a mark record.</p>

                  <Button type="button" onClick={handleSave} disabled={saving || loading} className="min-w-32">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 size-4" />
                        Save Marks
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}