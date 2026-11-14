"use client";

import type { AxiosError } from "axios";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { mediaUrl, type MovementRequest, type MovementStatus, type MovementType, type StudentCard } from "@/services/gatepass.service";

type ApiErrorBody = {
  message?: string | string[];
  errors?: Record<string, string>;
};

/** Pulls a readable message out of an API error. */
export function apiError(error: unknown, fallback = "Something went wrong") {
  const data = (error as AxiosError<ApiErrorBody>)?.response?.data;
  const first = data?.errors ? Object.values(data.errors)[0] : undefined;

  if (first) return first;
  if (Array.isArray(data?.message)) return data.message[0] ?? fallback;

  return data?.message || fallback;
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export const TYPE_LABEL: Record<MovementType, string> = {
  OUTPASS: "Outpass",
  EVENT_TRIP: "Event trip",
};

const STATUS_META: Record<MovementStatus, { label: string; className: string }> = {
  PENDING_HOUSEMOTHER: {
    label: "Awaiting housemother",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  PENDING_PCH: {
    label: "Awaiting final approval",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  APPROVED: {
    label: "Approved",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  REJECTED: {
    label: "Rejected",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-gray-200 bg-gray-50 text-gray-600",
  },
  OUT: {
    label: "Student out",
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },
  RETURNED: {
    label: "Returned",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  OVERDUE: {
    label: "Overdue",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  EXPIRED: {
    label: "Expired",
    className: "border-gray-200 bg-gray-50 text-gray-600",
  },
};

export function StatusBadge({ status }: { status: MovementStatus }) {
  const meta = STATUS_META[status] ?? { label: status, className: "" };

  return (
    <Badge variant="outline" className={cn("font-medium", meta.className)}>
      {meta.label}
    </Badge>
  );
}

export function fullName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`.trim();
}

/** "Asha Rao, Meera Das +3 more" */
export function studentsLabel(request: MovementRequest) {
  const names = request.students.map((s) => fullName(s.student));

  if (names.length <= 2) return names.join(", ");

  return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
}

export function StudentAvatar({ name, photoUrl, size = 40 }: { name: string; photoUrl?: string | null; size?: number }) {
  const src = mediaUrl(photoUrl);

  if (src) {
    return <img src={src} alt={name} style={{ width: size, height: size }} className="shrink-0 rounded-full border object-cover" />;
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-medium text-muted-foreground">
      {initials || "?"}
    </div>
  );
}

/** A student with photo, admission number, class, hostel and housemother. */
export function StudentSummary({ student, compact = false }: { student: StudentCard; compact?: boolean }) {
  const classLabel = [student.className, student.sectionName].filter(Boolean).join(" - ");

  return (
    <div className="flex items-center gap-3">
      <StudentAvatar name={student.name} photoUrl={student.photoUrl} size={compact ? 36 : 56} />

      <div className="min-w-0 text-sm">
        <p className="truncate font-medium">{student.name}</p>

        <p className="text-muted-foreground">
          Adm. no. {student.admissionNo}
          {classLabel ? ` · ${classLabel}` : ""}
        </p>

        {compact ? (
          !student.hostelName && <p className="text-amber-600">No hostel</p>
        ) : (
          <p className="text-muted-foreground">
            {student.hostelName ? `${student.hostelName}${student.roomNo ? ` · Room ${student.roomNo}` : ""}` : "No hostel assigned"}
            {student.housemotherName ? ` · Housemother: ${student.housemotherName}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
