"use client";

import { useState } from "react";
import { format } from "date-fns";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Check, ChevronDown, Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { AttendanceMode, AttendanceStatus, DayOfWeek, EmployeeType, LeaveFrequency, PayDayBasis } from "@/services/hr.service";

// ───────────────────────── Errors ─────────────────────────

type ApiErrorResponse = { message?: string | string[]; errors?: Record<string, string> };

export function apiError(error: unknown, fallback: string) {
  const data = (error as AxiosError<ApiErrorResponse>)?.response?.data;
  if (data?.errors && Object.keys(data.errors).length) return Object.values(data.errors)[0];
  const msg = data?.message;
  if (Array.isArray(msg)) return msg[0] ?? fallback;
  return msg || fallback;
}

export const toastError = (error: unknown, fallback: string) => toast.error(apiError(error, fallback));

// Field-level messages from the API, e.g. { biometricCode: "..." }
export const fieldErrors = (error: unknown): Record<string, string> => (error as AxiosError<ApiErrorResponse>)?.response?.data?.errors ?? {};

export function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-red-500 mt-1">{message}</p> : null;
}

// ───────────────────────── Dates, times, numbers ─────────────────────────

export const todayStr = () => format(new Date(), "yyyy-MM-dd");
export const currentPeriodKey = () => format(new Date(), "yyyy-MM");

// API dates arrive as ISO strings at UTC midnight. Only the YYYY-MM-DD part matters.
export const dateKey = (value?: string | null) => (value ? value.slice(0, 10) : "");
export const toLocalDate = (key: string) => new Date(`${key}T00:00:00`);

export function formatDate(value?: string | null, pattern = "dd MMM yyyy") {
  const key = dateKey(value);
  if (!key) return "—";
  const d = toLocalDate(key);
  return Number.isNaN(d.getTime()) ? "—" : format(d, pattern);
}

// For real moments in time (punches, check-in / check-out).
export function formatTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : format(d, "hh:mm a");
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : format(d, "dd MMM yyyy, hh:mm a");
}

// "HH:mm" (local) of an ISO moment
export function timeFromIso(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : format(d, "HH:mm");
}

// A date key + "HH:mm" picked on screen -> an ISO moment for the API
export const isoFromDateTime = (dateStr: string, time24: string) => new Date(`${dateStr}T${time24}:00`).toISOString();

export function minutesText(mins?: number | null) {
  if (mins == null) return "—";
  const m = Math.round(mins);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

// Prisma sends decimals as strings
export const num = (v?: string | number | null) => Number(v ?? 0);

export function daysText(v?: string | number | null) {
  const n = num(v);
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function money(v?: string | number | null) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(num(v));
}

// "2026-11" -> "November 2026"
export function periodLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return format(new Date(y, m - 1, 1), "MMMM yyyy");
}

// "2026-11" -> first and last day of that month
export function monthBounds(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return { from: format(new Date(y, m - 1, 1), "yyyy-MM-dd"), to: format(new Date(y, m, 0), "yyyy-MM-dd") };
}

// ───────────────────────── Options ─────────────────────────

export const ATTENDANCE_STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "LATE", label: "Late" },
  { value: "HALF_DAY", label: "Half Day" },
  { value: "LEAVE", label: "Leave" },
  { value: "HOLIDAY", label: "Holiday" },
  { value: "WEEKLY_OFF", label: "Weekly Off" },
];

export const EMPLOYEE_TYPE_OPTIONS: { value: EmployeeType; label: string }[] = [
  { value: "TEACHING", label: "Teaching" },
  { value: "NON_TEACHING", label: "Non-teaching" },
  { value: "OTHER", label: "Other" },
];

export const ATTENDANCE_MODE_OPTIONS: { value: AttendanceMode; label: string }[] = [
  { value: "BIOMETRIC", label: "Biometric" },
  { value: "MANUAL", label: "Manual (HR marks)" },
  { value: "NOT_TRACKED", label: "Not tracked" },
];

export const DAY_OPTIONS: { value: DayOfWeek; label: string; short: string }[] = [
  { value: "MONDAY", label: "Monday", short: "Mon" },
  { value: "TUESDAY", label: "Tuesday", short: "Tue" },
  { value: "WEDNESDAY", label: "Wednesday", short: "Wed" },
  { value: "THURSDAY", label: "Thursday", short: "Thu" },
  { value: "FRIDAY", label: "Friday", short: "Fri" },
  { value: "SATURDAY", label: "Saturday", short: "Sat" },
  { value: "SUNDAY", label: "Sunday", short: "Sun" },
];

export const LEAVE_FREQUENCY_OPTIONS: { value: LeaveFrequency; label: string }[] = [
  { value: "YEARLY", label: "Yearly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "ONE_TIME", label: "One time" },
];

export const DAY_BASIS_OPTIONS: { value: PayDayBasis; label: string }[] = [
  { value: "WORKING_DAYS", label: "Working days" },
  { value: "CALENDAR_DAYS", label: "Calendar days" },
  { value: "FIXED_30", label: "Fixed 30 days" },
];

export const labelOf = (options: { value: string; label: string }[], value?: string | null) => options.find((o) => o.value === value)?.label ?? value ?? "—";

// ───────────────────────── Status badge ─────────────────────────

const STATUS_META: Record<string, { label: string; className: string }> = {
  PRESENT: { label: "Present", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  LATE: { label: "Late", className: "border-amber-200 bg-amber-50 text-amber-700" },
  HALF_DAY: { label: "Half Day", className: "border-orange-200 bg-orange-50 text-orange-700" },
  ABSENT: { label: "Absent", className: "border-red-200 bg-red-50 text-red-700" },
  LEAVE: { label: "Leave", className: "border-sky-200 bg-sky-50 text-sky-700" },
  HALF_DAY_LEAVE: { label: "Half-day Leave", className: "border-sky-200 bg-sky-50 text-sky-700" },
  HOLIDAY: { label: "Holiday", className: "border-violet-200 bg-violet-50 text-violet-700" },
  WEEKLY_OFF: { label: "Weekly Off", className: "border-slate-200 bg-slate-50 text-slate-600" },
  UNMARKED: { label: "Unmarked", className: "border-yellow-300 border-dashed bg-yellow-50 text-yellow-700" },
  PENDING: { label: "Pending", className: "border-slate-200 bg-slate-50 text-slate-500" },
  NOT_TRACKED: { label: "Not tracked", className: "border-slate-200 bg-slate-50 text-slate-500" },
  NOT_JOINED: { label: "Not joined", className: "border-slate-200 bg-slate-50 text-slate-400" },
};

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, className: "border-slate-200 bg-slate-50 text-slate-600" };
  return (
    <Badge variant="outline" className={cn("font-medium", meta.className)}>
      {meta.label}
    </Badge>
  );
}

export const statusLabel = (status: string) => STATUS_META[status]?.label ?? status;

// ───────────────────────── Small building blocks ─────────────────────────

export function EmptyState({ icon: Icon = Inbox, title, hint }: { icon?: LucideIcon; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <p className="font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

// Same look as the toggle on the old attendance page. Scrolls sideways on phones.
export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; icon?: LucideIcon }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="max-w-full overflow-x-auto">
      <div className="inline-flex min-w-max rounded-lg border p-1 bg-muted/40">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors",
              value === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.icon && <t.icon className="size-4" />}
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// The icon + title block at the top of every dialog
export function DialogHeading({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <div className="border-b px-6 py-5">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="size-5 text-primary" />
        </div>
        <div>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            className={cn(destructive && "bg-red-600 hover:bg-red-700")}
            onClick={(e) => {
              // keep the dialog open until the caller finishes and closes it
              e.preventDefault();
              onConfirm();
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ───────────────────────── Date field ─────────────────────────

export function DateField({
  value,
  onChange,
  placeholder = "Pick a date",
  hasError,
  disabled,
  clearable,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("h-11 w-full justify-start text-left font-normal", !value && "text-muted-foreground", hasError && "border-red-500", className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatDate(value) : placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Calendar
          mode="single"
          selected={value ? toLocalDate(value) : undefined}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
        />
        {clearable && value && (
          <div className="border-t p-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-xs font-medium text-muted-foreground hover:text-destructive"
            >
              Clear date
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ───────────────────────── Time picker (from the old attendance page) ─────────────────────────

export function to12hLabel(time24: string) {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${mStr} ${period}`;
}

function parseTime24(value: string) {
  if (!value) return { hour12: "", minute: "", period: "AM" as const };
  const [hStr, mStr] = value.split(":");
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

export function TimePickerPopover({
  value,
  onChange,
  icon,
  placeholder,
  fullWidth = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  placeholder: string;
  fullWidth?: boolean;
  className?: string;
}) {
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
        <Button type="button" variant="outline" className={cn("justify-start gap-1.5 font-normal", fullWidth ? "h-11 w-full" : "h-9 px-3 text-xs", !value && "text-muted-foreground", className)}>
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

// ───────────────────────── Employee picker ─────────────────────────

export interface PickerEmployee {
  id: string;
  name: string;
  employeeCode: string;
  designation?: string | null;
  department?: string | null;
}

// value "" means nothing picked (or "all", when allLabel is given)
export function EmployeePicker({
  employees,
  value,
  onChange,
  placeholder = "Select employee",
  allLabel,
  hasError,
  disabled,
  className,
}: {
  employees: PickerEmployee[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  allLabel?: string;
  hasError?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = employees.find((e) => e.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("h-11 w-full justify-between font-normal", !selected && !allLabel && "text-muted-foreground", hasError && "border-red-500", className)}
        >
          <span className="truncate">{selected ? `${selected.employeeCode} - ${selected.name}` : allLabel || placeholder}</span>
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command
          filter={(v, search) => {
            if (!search) return 1;
            return v.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search name or employee code..." />

          <CommandList>
            <CommandEmpty>No employee found.</CommandEmpty>

            <CommandGroup>
              {allLabel && (
                <CommandItem
                  value="all employees"
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 size-4", !value ? "opacity-100" : "opacity-0")} />
                  {allLabel}
                </CommandItem>
              )}

              {employees.map((e) => (
                <CommandItem
                  key={e.id}
                  value={`${e.name} ${e.employeeCode}`}
                  onSelect={() => {
                    onChange(e.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 size-4", value === e.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    <span className="font-medium">{e.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {e.employeeCode}
                      {e.designation ? ` • ${e.designation}` : ""}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}