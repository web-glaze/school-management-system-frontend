"use client";

import type { AxiosError } from "axios";
import type { ReactNode } from "react";
import { Inbox, MoreVertical, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
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
  VISITOR: "Visitor pass",
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
  INSIDE: {
    label: "Visitor inside",
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },
  COMPLETED: {
    label: "Completed",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
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

  // A visitor pass with no student: say who they are meeting.
  if (names.length === 0 && request.type === "VISITOR") {
    return request.hostName ? `Visiting ${request.hostName}` : "Visitor";
  }

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

export interface PillTab {
  value: string;
  label: string;
  icon?: LucideIcon;
}

/** size="main" for the page tabs, size="sub" for tabs inside a tab. */
export function PillTabs({ tabs, value, onChange, size = "main" }: { tabs: PillTab[]; value: string | undefined; onChange: (value: string) => void; size?: "main" | "sub" }) {
  const main = size === "main";

  return (
    <div role="tablist" className="flex w-full gap-1 rounded-xl border bg-card p-1.5 sm:inline-flex sm:w-auto sm:gap-1.5">
      {tabs.map((tab) => {
        const active = tab.value === value;
        const Icon = tab.icon;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex min-w-0 flex-1 items-center justify-center rounded-lg font-medium transition-colors sm:flex-none",
              main ? "flex-col gap-0.5 px-1 py-2 text-[11px] sm:flex-row sm:gap-2 sm:px-4 sm:py-2 sm:text-sm" : "px-2.5 py-1.5 text-xs sm:px-3.5 sm:text-sm",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {Icon && <Icon className="size-4 shrink-0" />}
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Table helpers ---------- */

export const TH = "py-4 text-xs font-bold uppercase tracking-wider text-foreground/80";
export const THEAD_CLASS = "border-b border-border/60 bg-gray-50 dark:bg-muted/15";

export function TableCard({ children }: { children: ReactNode }) {
  return <div className="w-full overflow-x-auto rounded-md border border-border/60 bg-card">{children}</div>;
}

export function TableLoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan}>
        <div className="space-y-3 py-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function TableEmptyRow({ colSpan, title, text }: { colSpan: number; title: string; text?: string }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan}>
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground/75">
            <Inbox className="size-6 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          {text && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}
        </div>
      </TableCell>
    </TableRow>
  );
}

export interface RowAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  danger?: boolean;
  hidden?: boolean;
  disabled?: boolean;
}

/** Icon buttons on desktop, a three-dot menu on phones. */
export function RowActions({ actions }: { actions: RowAction[] }) {
  const items = actions.filter((action) => !action.hidden);

  if (items.length === 0) return null;

  return (
    <>
      <div className="hidden justify-end gap-1 md:flex">
        {items.map(({ label, icon: Icon, onClick, danger, disabled }) => (
          <Button
            key={label}
            variant="ghost"
            size="icon"
            title={label}
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={cn("size-9 rounded-lg text-muted-foreground transition-all", danger ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-muted hover:text-foreground")}
          >
            <Icon className="size-5" />
          </Button>
        ))}
      </div>

      <div className="flex justify-end md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-9" aria-label="Actions">
              <MoreVertical className="size-5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            {items.map(({ label, icon: Icon, onClick, danger, disabled }) => (
              <DropdownMenuItem key={label} disabled={disabled} onClick={onClick} className={danger ? "text-destructive" : undefined}>
                <Icon className="mr-2 size-4" />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

export function formatDay(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** The leave and return time, or the visit day for a visitor pass. */
export function RequestPeriod({ request }: { request: { type: MovementRequest["type"]; requestedFrom?: string; requestedTo: string } }) {
  if (request.type === "VISITOR") {
    return (
      <>
        <p>{formatDay(request.requestedFrom)}</p>
        <p className="text-muted-foreground">Valid all day</p>
      </>
    );
  }

  return (
    <>
      <p>{formatDateTime(request.requestedFrom)}</p>
      <p className="text-muted-foreground">to {formatDateTime(request.requestedTo)}</p>
    </>
  );
}
