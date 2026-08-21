"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Calendar as CalendarIcon, Check, ChevronDown, ClipboardList, ExternalLink, Inbox, Loader2, Pencil, Plus, Search, SlidersHorizontal, Trash2, Users, ArrowLeft, BookOpen, X, NotebookTabs } from "lucide-react";
import { useAcademicStore, Assignment, AssignmentStudent, SubjectAllocation } from "@/store/academicStore";
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

type AssignmentTypeT = "HOMEWORK" | "HOLIDAY_HOMEWORK" | "ASSIGNMENT";
type AssignmentStatusT = "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED";
type StudentStatusT = "IN_PROGRESS" | "COMPLETED" | "NOT_SUBMITTED";

const TYPE_OPTIONS: { value: AssignmentTypeT; label: string }[] = [
  { value: "HOMEWORK", label: "Homework" },
  { value: "HOLIDAY_HOMEWORK", label: "Holiday Homework" },
  { value: "ASSIGNMENT", label: "Assignment" },
];

const STATUS_OPTIONS: { value: AssignmentStatusT; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_FILTER_OPTIONS: { value: AssignmentStatusT | "ALL"; label: string }[] = [{ value: "ALL", label: "All" }, ...STATUS_OPTIONS];

const STUDENT_STATUS_OPTIONS: { value: StudentStatusT; label: string }[] = [
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "NOT_SUBMITTED", label: "Not Submitted" },
];

const STUDENT_STATUS_FILTER_OPTIONS: { value: StudentStatusT | "ALL"; label: string }[] = [{ value: "ALL", label: "All" }, ...STUDENT_STATUS_OPTIONS];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function toDateInputValue(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function typeLabel(type: AssignmentTypeT) {
  return TYPE_OPTIONS.find((t) => t.value === type)?.label ?? type;
}

function typeBadgeClass(type: AssignmentTypeT) {
  switch (type) {
    case "HOMEWORK":
      return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400";
    case "HOLIDAY_HOMEWORK":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case "ASSIGNMENT":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400";
  }
}

function assignmentStatusLabel(status: AssignmentStatusT) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

function assignmentStatusBadgeClass(status: AssignmentStatusT) {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300";
    case "PUBLISHED":
      return "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400";
    case "COMPLETED":
      return "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400";
    case "CANCELLED":
      return "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400";
  }
}

function studentStatusLabel(status: StudentStatusT) {
  return STUDENT_STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

function studentStatusBadgeClass(status: StudentStatusT) {
  switch (status) {
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
    case "COMPLETED":
      return "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400";
    case "NOT_SUBMITTED":
      return "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400";
  }
}

function studentStatusTileClass(status: StudentStatusT) {
  switch (status) {
    case "IN_PROGRESS":
      return "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10";
    case "COMPLETED":
      return "border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10";
    case "NOT_SUBMITTED":
      return "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/10";
  }
}

function studentStatusTextClass(status: StudentStatusT) {
  switch (status) {
    case "IN_PROGRESS":
      return "text-amber-700 dark:text-amber-400";
    case "COMPLETED":
      return "text-green-700 dark:text-green-400";
    case "NOT_SUBMITTED":
      return "text-red-700 dark:text-red-400";
  }
}

interface StoredUser {
  teacherId?: string | null;
}

export default function AssignmentsPage() {
  const {
    loading,
    sessions,
    classes,
    sections,
    subjectAllocations,
    studentEnrollments,
    assignments,

    fetchSessions,
    fetchClasses,
    fetchSections,
    fetchSubjectAllocations,
    fetchStudentEnrollments,
    fetchAssignments,

    createAssignment,
    updateAssignment,
    updateAssignmentStudentStatus,
    deleteAssignment,
  } = useAcademicStore();

  const authorized = usePermission("assignment.read");
  const canCreate = usePermission("assignment.create");
  const canUpdate = usePermission("assignment.update");
  const canDelete = usePermission("assignment.delete");

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

  useEffect(() => {
    if (!userChecked) return;

    fetchSessions();
    fetchAssignments();

    if (isTeacherView) {
      fetchSubjectAllocations();
    } else {
      fetchClasses();
      fetchSections();
      fetchStudentEnrollments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userChecked, isTeacherView]);

  const activeSessionId = useMemo(() => {
    const active = sessions.find((s) => s.isActive);
    return active?.id ?? sessions[0]?.id ?? "";
  }, [sessions]);

  // ══════════════════════════════════════════════════════════════════
  // TEACHER: My Subjects → assignments per subject
  // ══════════════════════════════════════════════════════════════════
  const mySubjectAllocations = useMemo(() => {
    if (!myTeacherId || !activeSessionId) return [];
    return subjectAllocations.filter((a) => a.teacherId === myTeacherId && a.sessionId === activeSessionId);
  }, [subjectAllocations, myTeacherId, activeSessionId]);

  const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(null);
  const selectedAllocation = useMemo(() => mySubjectAllocations.find((a) => a.id === selectedAllocationId) ?? null, [mySubjectAllocations, selectedAllocationId]);

  const subjectAssignmentCount = (allocationId: string) => assignments.filter((a) => a.subjectAllocationId === allocationId).length;

  const [teacherSearch, setTeacherSearch] = useState("");
  const [teacherStatusFilter, setTeacherStatusFilter] = useState<AssignmentStatusT | "ALL">("ALL");

  // ══════════════════════════════════════════════════════════════════
  // ADMIN: session / class / section scoped list
  // ══════════════════════════════════════════════════════════════════
  const [admSessionId, setAdmSessionId] = useState("");
  const [admClassId, setAdmClassId] = useState("");
  const [admSectionId, setAdmSectionId] = useState("");
  const [admLoaded, setAdmLoaded] = useState(false);
  const [admSearch, setAdmSearch] = useState("");
  const [admStatusFilter, setAdmStatusFilter] = useState<AssignmentStatusT | "ALL">("ALL");

  const admFilteredSections = useMemo(() => {
    if (admClassId === "all" || !admClassId) return sections;
    return sections.filter((section) => studentEnrollments.some((e) => e.classId === admClassId && e.sectionId === section.id));
  }, [admClassId, sections, studentEnrollments]);

  const admAssignments = useMemo(() => {
    if (!admSessionId || !admClassId || !admSectionId) return [];
    return assignments.filter((a) => a.sessionId === admSessionId && a.classId === admClassId && a.sectionId === admSectionId).sort((a, b) => (a.givenDate < b.givenDate ? 1 : -1));
  }, [assignments, admSessionId, admClassId, admSectionId]);

  function handleLoadAdminAssignments() {
    if (!admSessionId || !admClassId || !admSectionId) {
      toast.error("Please select session, class and section");
      return;
    }
    setAdmLoaded(true);
  }

  // ══════════════════════════════════════════════════════════════════
  // Add / Edit / Delete assignment dialogs
  // ══════════════════════════════════════════════════════════════════
  const [addOpen, setAddOpen] = useState(false);
  const [addSubjectAllocationId, setAddSubjectAllocationId] = useState("");
  const [addType, setAddType] = useState<AssignmentTypeT>("HOMEWORK");
  const [addTitle, setAddTitle] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addGivenDate, setAddGivenDate] = useState(todayStr());
  const [addDueDate, setAddDueDate] = useState("");
  const [addAttachmentUrl, setAddAttachmentUrl] = useState("");
  const [addStatus, setAddStatus] = useState<AssignmentStatusT>("PUBLISHED");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [allocationOpen, setAllocationOpen] = useState(false);
  const [addGivenDateOpen, setAddGivenDateOpen] = useState(false);
  const [addDueDateOpen, setAddDueDateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [editType, setEditType] = useState<AssignmentTypeT>("HOMEWORK");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editGivenDate, setEditGivenDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editAttachmentUrl, setEditAttachmentUrl] = useState("");
  const [editStatus, setEditStatus] = useState<AssignmentStatusT>("PUBLISHED");
  const [editGivenDateOpen, setEditGivenDateOpen] = useState(false);
  const [editDueDateOpen, setEditDueDateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);

  // ══════════════════════════════════════════════════════════════════
  // Detail page (assignment + student statuses) — full page, not a dialog,
  // since a class can have a lot of students and a small popup doesn't work.
  // ══════════════════════════════════════════════════════════════════
  const [detailAssignmentId, setDetailAssignmentId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState<StudentStatusT | "ALL">("ALL");
  const detailAssignment = useMemo(() => assignments.find((a) => a.id === detailAssignmentId) ?? null, [assignments, detailAssignmentId]);
  const [statusEditOpen, setStatusEditOpen] = useState(false);
  const [statusEditing, setStatusEditing] = useState<{ assignment: Assignment; student: AssignmentStudent } | null>(null);
  const [statusValue, setStatusValue] = useState<StudentStatusT>("IN_PROGRESS");
  const [statusRemarks, setStatusRemarks] = useState("");

  if (authorized === null || !userChecked) {
    return null;
  }

  const resetAddForm = () => {
    setAddSubjectAllocationId(selectedAllocationId ?? "");
    setAddType("HOMEWORK");
    setAddTitle("");
    setAddDescription("");
    setAddGivenDate(todayStr());
    setAddDueDate("");
    setAddAttachmentUrl("");
    setAddStatus("PUBLISHED");
    setFormErrors({});
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addSubjectAllocationId) {
      setFormErrors((p) => ({ ...p, subjectAllocationId: "Subject is required" }));
      return;
    }
    if (!addTitle.trim()) {
      setFormErrors((p) => ({ ...p, title: "Title is required" }));
      return;
    }

    try {
      await createAssignment({
        subjectAllocationId: addSubjectAllocationId,
        type: addType,
        title: addTitle,
        description: addDescription || undefined,
        givenDate: addGivenDate,
        dueDate: addDueDate || undefined,
        attachmentUrl: addAttachmentUrl || undefined,
        status: addStatus,
      });

      toast.success("Assignment created successfully");
      resetAddForm();
      setAddOpen(false);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
        return;
      }

      toast.error(err.response?.data?.message || "Failed to create assignment");
    }
  };

  const openEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setEditType(assignment.type);
    setEditTitle(assignment.title);
    setEditDescription(assignment.description ?? "");
    setEditGivenDate(toDateInputValue(assignment.givenDate));
    setEditDueDate(toDateInputValue(assignment.dueDate));
    setEditAttachmentUrl(assignment.attachmentUrl ?? "");
    setEditStatus(assignment.status);
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;

    try {
      await updateAssignment(editingAssignment.id, {
        type: editType,
        title: editTitle,
        description: editDescription || undefined,
        givenDate: editGivenDate,
        dueDate: editDueDate || undefined,
        attachmentUrl: editAttachmentUrl || undefined,
        status: editStatus,
      });

      toast.success("Assignment updated successfully");
      setEditOpen(false);
      setEditingAssignment(null);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to update assignment");
    }
  };

  const openDeleteAssignment = (assignment: Assignment) => {
    setDeletingAssignment(assignment);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingAssignment) return;

    try {
      await deleteAssignment(deletingAssignment.id);
      toast.success("Assignment deleted");
      setDeleteOpen(false);
      setDeletingAssignment(null);
      if (detailAssignmentId === deletingAssignment.id) {
        setDetailAssignmentId(null);
      }
    } catch {
      toast.error("Failed to delete assignment");
    }
  };

  const openDetail = (assignment: Assignment) => {
    setDetailAssignmentId(assignment.id);
    setStudentSearch("");
    setStudentStatusFilter("ALL");
  };

  const closeDetail = () => {
    setDetailAssignmentId(null);
  };

  const openStatusEdit = (assignment: Assignment, student: AssignmentStudent) => {
    setStatusEditing({ assignment, student });
    setStatusValue(student.status);
    setStatusRemarks(student.remarks ?? "");
    setStatusEditOpen(true);
  };

  const handleUpdateStudentStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusEditing) return;

    try {
      await updateAssignmentStudentStatus(statusEditing.assignment.id, statusEditing.student.studentId, {
        status: statusValue,
        remarks: statusRemarks.trim() ? statusRemarks.trim() : null,
      });

      toast.success("Student status updated");
      setStatusEditOpen(false);
      setStatusEditing(null);
    } catch {
      toast.error("Failed to update student status");
    }
  };

  const hasEditChanges =
    editingAssignment &&
    (editType !== editingAssignment.type ||
      editTitle !== editingAssignment.title ||
      editDescription !== (editingAssignment.description ?? "") ||
      editGivenDate !== toDateInputValue(editingAssignment.givenDate) ||
      editDueDate !== toDateInputValue(editingAssignment.dueDate) ||
      editAttachmentUrl !== (editingAssignment.attachmentUrl ?? "") ||
      editStatus !== editingAssignment.status);

  const hasStatusChanges = statusEditing && (statusValue !== statusEditing.student.status || statusRemarks !== (statusEditing.student.remarks ?? ""));

  // ── Shared list renderer, used by teacher-subject view AND admin view ──
  function renderAssignmentList(list: Assignment[], search: string, setSearch: (v: string) => void, statusFilter: AssignmentStatusT | "ALL", setStatusFilter: (v: AssignmentStatusT | "ALL") => void) {
    const filtered = list.filter((a) => {
      const matchesSearch =
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.teacher.name.toLowerCase().includes(search.toLowerCase()) ||
        a.class.name.toLowerCase().includes(search.toLowerCase()) ||
        a.section.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search by title, teacher or class" value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-10" />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors border",
                  statusFilter === opt.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((a) => {
            const completed = a.students.filter((s) => s.status === "COMPLETED").length;

            return (
              <div key={a.id} onClick={() => openDetail(a)} className="group flex items-center gap-4 rounded-md border p-4 cursor-pointer hover:bg-muted/20 transition-colors">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ClipboardList className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold leading-tight truncate">{a.title}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0", typeBadgeClass(a.type))}>{typeLabel(a.type)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground truncate">
                    {a.teacher.name} • {a.subjectAllocation.subject.name} • {a.class.name} {a.section.name}
                  </p>
                </div>

                {(canUpdate || canDelete) && (
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {canUpdate && (
                      <button
                        type="button"
                        aria-label="Edit assignment"
                        onClick={() => openEditAssignment(a)}
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
                      >
                        <Pencil className="size-4.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        aria-label="Delete assignment"
                        onClick={() => openDeleteAssignment(a)}
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="size-4.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">No assignments match your filters.</div>}
        </div>
      </div>
    );
  }

  // ── Full-page assignment detail: Overview card + Students card ─────────
  function renderDetailPage() {
    if (!detailAssignment) return null;

    const statusCounts: Record<StudentStatusT, number> = {
      COMPLETED: 0,
      IN_PROGRESS: 0,
      NOT_SUBMITTED: 0,
    };
    detailAssignment.students.forEach((s) => {
      statusCounts[s.status] += 1;
    });
    const totalStudents = detailAssignment.students.length;
    const completionPct = totalStudents ? Math.round((statusCounts.COMPLETED / totalStudents) * 100) : 0;

    const filteredStudents = detailAssignment.students.filter((s) => {
      const name = `${s.student.firstName} ${s.student.lastName}`.toLowerCase();
      const matchesSearch = name.includes(studentSearch.toLowerCase()) || s.student.admissionNo.toLowerCase().includes(studentSearch.toLowerCase());
      const matchesStatus = studentStatusFilter === "ALL" || s.status === studentStatusFilter;
      return matchesSearch && matchesStatus;
    });

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <button
              type="button"
              onClick={closeDetail}
              aria-label="Back to assignments"
              className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardList className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">{detailAssignment.title}</h1>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0", typeBadgeClass(detailAssignment.type))}>{typeLabel(detailAssignment.type)}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0", assignmentStatusBadgeClass(detailAssignment.status))}>{assignmentStatusLabel(detailAssignment.status)}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground truncate">
                {detailAssignment.teacher.name} • {detailAssignment.subjectAllocation.subject.name} • {detailAssignment.class.name} {detailAssignment.section.name}
              </p>
            </div>
          </div>

          {(canUpdate || canDelete) && (
            <div className="flex items-center gap-2 shrink-0">
              {canUpdate && (
                <Button variant="outline" className="h-9 gap-1.5 border-primary/30 px-3.5 text-primary hover:bg-primary/5 hover:text-primary" onClick={() => openEditAssignment(detailAssignment)}>
                  <Pencil className="size-4" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button variant="outline" className="h-9 gap-1.5 border-destructive/30 px-3.5 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => openDeleteAssignment(detailAssignment)}>
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Overview card */}
        <div className="bg-card rounded-md border p-4 sm:p-6 space-y-5">
          <div className="flex items-center gap-1.5">
            <ClipboardList className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overview</span>
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Given Date</p>
              <p className="mt-1 text-sm font-medium">{format(new Date(detailAssignment.givenDate), "dd MMM yyyy")}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Due Date</p>
              <p className="mt-1 text-sm font-medium">{detailAssignment.dueDate ? format(new Date(detailAssignment.dueDate), "dd MMM yyyy") : "—"}</p>
            </div>
          </div>

          {detailAssignment.description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</p>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{detailAssignment.description}</p>
            </div>
          )}

          {detailAssignment.attachmentUrl && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Attachment</p>
              <a href={detailAssignment.attachmentUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <ExternalLink className="size-3.5" />
                View attachment
              </a>
            </div>
          )}

          {/* Completion summary — colored stat tiles, same language as the attendance reports */}
          <div className="border-t pt-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completion</p>
                <p className={cn("text-2xl font-bold mt-1", completionPct >= 75 ? "text-green-600" : completionPct >= 50 ? "text-amber-600" : "text-red-600")}>{completionPct}%</p>
              </div>
              {STUDENT_STATUS_OPTIONS.map((opt) => (
                <div key={opt.value} className={cn("rounded-lg border p-4", studentStatusTileClass(opt.value))}>
                  <p className={cn("text-xs font-medium uppercase tracking-wide", studentStatusTextClass(opt.value))}>{opt.label}</p>
                  <p className={cn("text-2xl font-bold mt-1", studentStatusTextClass(opt.value))}>{statusCounts[opt.value]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Students card */}
        <div className="bg-card rounded-md border p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-1.5">
            <Users className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Students ({totalStudents})</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search student..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="h-10 pl-10" />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {STUDENT_STATUS_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStudentStatusFilter(opt.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors border",
                    studentStatusFilter === opt.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-border/40 rounded-md border">
            {filteredStudents.map((s) => (
              <button key={s.id} type="button" onClick={() => openStatusEdit(detailAssignment, s)} className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-muted/20">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                  {s.student.firstName.charAt(0)}
                  {s.student.lastName.charAt(0)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-tight truncate">
                    {s.student.firstName} {s.student.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{s.student.admissionNo}</p>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold shrink-0", studentStatusBadgeClass(s.status))}>{studentStatusLabel(s.status)}</span>
              </button>
            ))}

            {filteredStudents.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">{totalStudents === 0 ? "No students linked to this assignment." : "No students match your search or filter."}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {detailAssignment ? (
        renderDetailPage()
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col gap-4 mb-6 sm:mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">{isTeacherView ? "My Assignments" : "Assignments"}</h1>
                <p className="text-sm sm:text-base text-muted-foreground">{isTeacherView ? "Log homework and assignments, and track student progress" : "Review assignments and student progress across classes"}</p>
              </div>

              {isTeacherView && canCreate && (
                <Button
                  className="gap-2 px-5"
                  onClick={() => {
                    resetAddForm();
                    setAddOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  Add Assignment
                </Button>
              )}
            </div>
          </div>

          {isTeacherView ? (
            <div className="space-y-6">
              {mySubjectAllocations.length === 0 ? (
                <div className="bg-card rounded-md border p-8 sm:p-16 flex flex-col items-center justify-center text-center">
                  <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                    <BookOpen className="size-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">No subjects assigned</h3>
                  <p className="max-w-sm text-muted-foreground">You are not currently allocated as a subject teacher for any class this session.</p>
                </div>
              ) : selectedAllocation ? (
                <div className="bg-card rounded-md border p-4 sm:p-6">
                  <button type="button" onClick={() => setSelectedAllocationId(null)} className="mb-5 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="size-4" />
                    Back to subjects
                  </button>

                  <div className="mb-5 flex flex-wrap items-center gap-2 border-b pb-4">
                    <BookOpen className="size-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {selectedAllocation.subject.name} — {selectedAllocation.class.name} {selectedAllocation.section.name}
                    </span>
                  </div>

                  {renderAssignmentList(
                    assignments.filter((a) => a.subjectAllocationId === selectedAllocation.id),
                    teacherSearch,
                    setTeacherSearch,
                    teacherStatusFilter,
                    setTeacherStatusFilter
                  )}
                </div>
              ) : (
                <div className="bg-card rounded-md border p-4 sm:p-6">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {mySubjectAllocations
                      .filter((a) => a.teacher.isActive)
                      .map((a: SubjectAllocation) => (
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
                          <span className="text-[11px] font-medium text-muted-foreground">{subjectAssignmentCount(a.id)} assignment</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-card rounded-md border p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Select Class</span>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field>
                    <Label>Academic Session</Label>
                    <Select
                      value={admSessionId}
                      onValueChange={(value) => {
                        setAdmSessionId(value);
                        setAdmLoaded(false);
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
                      value={admClassId}
                      onValueChange={(value) => {
                        setAdmClassId(value);
                        setAdmSectionId("");
                        setAdmLoaded(false);
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
                      value={admSectionId}
                      onValueChange={(value) => {
                        setAdmSectionId(value);
                        setAdmLoaded(false);
                      }}
                      disabled={!admClassId}
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select Section" />
                      </SelectTrigger>
                      <SelectContent>
                        {admFilteredSections.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Button onClick={handleLoadAdminAssignments} className="h-11 px-6">
                  <NotebookTabs className="size-4 mr-2" />
                  View Assignments
                </Button>
              </div>

              {!admLoaded ? (
                <div className="bg-card rounded-md border p-8 sm:p-16 flex flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <ClipboardList className="size-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Select a session, class and section</h3>
                  <p className="text-muted-foreground">Then click &ldquo;View Assignments&rdquo; to see the assignment list.</p>
                </div>
              ) : admAssignments.length === 0 ? (
                <div className="bg-card rounded-md border p-8 sm:p-16 flex flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <Inbox className="size-6" />
                  </div>
                  <h3 className="text-lg font-semibold">No assignments found</h3>
                  <p className="text-muted-foreground">There are no assignments recorded for this class and section yet.</p>
                </div>
              ) : (
                <div className="bg-card rounded-md border p-4 sm:p-6">{renderAssignmentList(admAssignments, admSearch, setAdmSearch, admStatusFilter, setAdmStatusFilter)}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Assignment dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetAddForm();
        }}
      >
        <DialogContent className="sm:max-w-125 p-0 overflow-hidden max-h-[85vh] flex flex-col">
          <div className="border-b px-6 py-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardList className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">Add Assignment</DialogTitle>
                <DialogDescription>Log a new homework or assignment for your class.</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreate} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              <FieldGroup>
                <Field>
                  <Label>Subject</Label>
                  <Popover open={allocationOpen} onOpenChange={setAllocationOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" role="combobox" aria-expanded={allocationOpen} className="h-11 w-full justify-between font-normal">
                        {addSubjectAllocationId
                          ? (() => {
                              const alloc = mySubjectAllocations.find((a) => a.id === addSubjectAllocationId);
                              return alloc ? `${alloc.subject.name} — ${alloc.class.name} ${alloc.section.name}` : "Select Subject";
                            })()
                          : "Select Subject"}
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
                        <CommandInput placeholder="Search subject, class or section..." />
                        <CommandList>
                          <CommandEmpty>No subject found.</CommandEmpty>
                          <CommandGroup>
                            {mySubjectAllocations.map((alloc) => (
                              <CommandItem
                                key={alloc.id}
                                value={`${alloc.subject.name} ${alloc.class.name} ${alloc.section.name}`}
                                onSelect={() => {
                                  setAddSubjectAllocationId(alloc.id);
                                  setFormErrors((p) => ({ ...p, subjectAllocationId: "" }));
                                  setAllocationOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 size-4", addSubjectAllocationId === alloc.id ? "opacity-100" : "opacity-0")} />
                                <div className="flex flex-col">
                                  <span className="font-medium">{alloc.subject.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {alloc.class.name} • {alloc.section.name}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {formErrors.subjectAllocationId && <p className="text-sm text-red-500 mt-1">{formErrors.subjectAllocationId}</p>}
                </Field>

                <Field>
                  <Label>Type</Label>
                  <Select value={addType} onValueChange={(value) => setAddType(value as AssignmentTypeT)}>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <Label>Title</Label>
                  <Input
                    value={addTitle}
                    onChange={(e) => {
                      setAddTitle(e.target.value);
                      setFormErrors((p) => ({ ...p, title: "" }));
                    }}
                    placeholder="e.g. Chapter 4 exercises"
                    className={cn("h-11", formErrors.title && "border-red-500")}
                  />
                  {formErrors.title && <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>}
                </Field>

                <Field>
                  <Label>Description</Label>
                  <Textarea value={addDescription} onChange={(e) => setAddDescription(e.target.value)} placeholder="Optional instructions or details" rows={3} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <Label>Given Date</Label>
                    <Popover open={addGivenDateOpen} onOpenChange={setAddGivenDateOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className={cn("h-11 w-full justify-start text-left font-normal", !addGivenDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {addGivenDate ? format(new Date(addGivenDate), "dd MMM yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <Calendar
                          mode="single"
                          selected={addGivenDate ? new Date(addGivenDate) : undefined}
                          onSelect={(date) => {
                            if (!date) return;
                            setAddGivenDate(format(date, "yyyy-MM-dd"));
                            setAddGivenDateOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>

                  <Field>
                    <Label>Due Date</Label>
                    <Popover open={addDueDateOpen} onOpenChange={setAddDueDateOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className={cn("h-11 w-full justify-start text-left font-normal", !addDueDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {addDueDate ? format(new Date(addDueDate), "dd MMM yyyy") : "Optional"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <Calendar
                          mode="single"
                          selected={addDueDate ? new Date(addDueDate) : undefined}
                          onSelect={(date) => {
                            if (!date) return;
                            setAddDueDate(format(date, "yyyy-MM-dd"));
                            setAddDueDateOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>
                </div>

                <Field>
                  <Label>Attachment URL</Label>
                  <Input value={addAttachmentUrl} onChange={(e) => setAddAttachmentUrl(e.target.value)} placeholder="Optional link to a file or resource" className="h-11" />
                </Field>

                <Field>
                  <Label>Status</Label>
                  <Select value={addStatus} onValueChange={(value) => setAddStatus(value as AssignmentStatusT)}>
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
              </FieldGroup>
            </div>

            <DialogFooter className="gap-2 border-t px-7 py-4 pb-7 shrink-0 flex-row justify-end">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading || !addSubjectAllocationId || !addTitle.trim()} className="min-w-32.5">
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

      {/* Edit Assignment dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingAssignment(null);
        }}
      >
        <DialogContent className="sm:max-w-125 p-0 overflow-hidden max-h-[85vh] flex flex-col">
          <div className="border-b px-6 py-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pencil className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">Edit Assignment</DialogTitle>
                <DialogDescription>Update assignment details.</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              <FieldGroup>
                <Field>
                  <Label>Subject</Label>
                  <div className="h-11 flex items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                    {editingAssignment ? `${editingAssignment.subjectAllocation.subject.name} — ${editingAssignment.class.name} ${editingAssignment.section.name}` : ""}
                  </div>
                </Field>

                <Field>
                  <Label>Type</Label>
                  <Select value={editType} onValueChange={(value) => setEditType(value as AssignmentTypeT)}>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <Label>Title</Label>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-11" />
                </Field>

                <Field>
                  <Label>Description</Label>
                  <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <Label>Given Date</Label>
                    <Popover open={editGivenDateOpen} onOpenChange={setEditGivenDateOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className={cn("h-11 w-full justify-start text-left font-normal", !editGivenDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editGivenDate ? format(new Date(editGivenDate), "dd MMM yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <Calendar
                          mode="single"
                          selected={editGivenDate ? new Date(editGivenDate) : undefined}
                          defaultMonth={editGivenDate ? new Date(editGivenDate) : new Date()}
                          onSelect={(date) => {
                            if (!date) return;
                            setEditGivenDate(format(date, "yyyy-MM-dd"));
                            setEditGivenDateOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>

                  <Field>
                    <Label>Due Date</Label>
                    <div className="flex gap-1.5">
                      <Popover open={editDueDateOpen} onOpenChange={setEditDueDateOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" className={cn("h-11 flex-1 justify-start text-left font-normal", !editDueDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editDueDate ? format(new Date(editDueDate), "dd MMM yyyy") : "Optional"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                          <Calendar
                            mode="single"
                            selected={editDueDate ? new Date(editDueDate) : undefined}
                            defaultMonth={editDueDate ? new Date(editDueDate) : new Date()}
                            onSelect={(date) => {
                              if (!date) return;
                              setEditDueDate(format(date, "yyyy-MM-dd"));
                              setEditDueDateOpen(false);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      {editDueDate && (
                        <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={() => setEditDueDate("")}>
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  </Field>
                </div>

                <Field>
                  <Label>Attachment URL</Label>
                  <Input value={editAttachmentUrl} onChange={(e) => setEditAttachmentUrl(e.target.value)} placeholder="Optional link to a file or resource" className="h-11" />
                </Field>

                <Field>
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={(value) => setEditStatus(value as AssignmentStatusT)}>
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
              </FieldGroup>
            </div>

            <DialogFooter className="gap-2 border-t px-7 py-4 pb-7 shrink-0 flex-row justify-end">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading || !hasEditChanges || !editTitle.trim()} className="min-w-32.5">
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

      {/* Update student status dialog */}
      <Dialog
        open={statusEditOpen}
        onOpenChange={(open) => {
          setStatusEditOpen(open);
          if (!open) setStatusEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-105 p-0 overflow-hidden">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pencil className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Update Student Status</DialogTitle>
                <DialogDescription>{statusEditing ? `${statusEditing.student.student.firstName} ${statusEditing.student.student.lastName}` : ""}</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateStudentStatus} className="space-y-6 p-6">
            <FieldGroup>
              <Field>
                <Label>Status</Label>
                <Select value={statusValue} onValueChange={(value) => setStatusValue(value as StudentStatusT)}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDENT_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <Label>Remarks</Label>
                <Input value={statusRemarks} onChange={(e) => setStatusRemarks(e.target.value)} placeholder="Optional remarks" className="h-11" />
              </Field>
            </FieldGroup>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading || !hasStatusChanges} className="min-w-32">
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
            <AlertDialogTitle className="w-full text-center text-xl">Delete assignment?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This action cannot be undone. This will permanently delete <span className="font-semibold text-foreground">{deletingAssignment?.title}</span> and all associated student status records.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-11 bg-destructive text-white hover:bg-destructive/90">
              <>
                <Trash2 className="mr-2 size-4" />
                Delete assignment
              </>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
