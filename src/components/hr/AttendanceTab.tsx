"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, ClipboardList, Fingerprint, Loader2, LogIn, LogOut, MoreVertical, Pencil, Plus, Trash2, Upload, UserX, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHasPermission } from "@/hooks/usePermission";
import { hrService, type AttendanceStatus, type ImportPunchItem } from "@/services/hr.service";
import { useHrStore, type AttendanceRecord, type EmployeeLookup } from "@/store/hrStore";
import {
  ATTENDANCE_STATUS_OPTIONS,
  ConfirmDialog,
  DateField,
  DialogHeading,
  EmployeePicker,
  EmptyState,
  FieldError,
  SegmentedTabs,
  StatusBadge,
  TimePickerPopover,
  currentPeriodKey,
  dateKey,
  fieldErrors,
  formatDate,
  formatDateTime,
  formatTime,
  isoFromDateTime,
  minutesText,
  monthBounds,
  timeFromIso,
  todayStr,
  toastError,
} from "@/components/hr/shared";
import { ResultDialog, TEXTAREA_CLASS, parseCsv, readFileText, type ResultInfo } from "@/components/hr/parts";

type View = "daily" | "records" | "punches" | "unmatched";
type EntryState = { record: AttendanceRecord | null; employeeId?: string; date?: string };

const ALL = "ALL";

// ───────────────────────── Add / correct attendance ─────────────────────────

function AttendanceDialog({ entry, employees, onClose }: { entry: EntryState | null; employees: EmployeeLookup[]; onClose: () => void }) {
  const { createAttendance, updateAttendance } = useHrStore();
  const record = entry?.record ?? null;

  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [status, setStatus] = useState<AttendanceStatus>("PRESENT");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!entry) return;
    if (entry.record) {
      const r = entry.record;
      setEmployeeId(r.employeeId);
      setDate(dateKey(r.date));
      setStatus(r.status);
      setCheckIn(timeFromIso(r.checkIn));
      setCheckOut(timeFromIso(r.checkOut));
      setRemarks(r.remarks ?? "");
    } else {
      setEmployeeId(entry.employeeId ?? "");
      setDate(entry.date ?? todayStr());
      setStatus("PRESENT");
      setCheckIn("");
      setCheckOut("");
      setRemarks("");
    }
    setErrors({});
  }, [entry]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs: Record<string, string> = {};
    if (!employeeId) errs.employeeId = "Select an employee";
    if (!date) errs.attendanceDate = "Pick a date";
    if (checkIn && checkOut && checkOut <= checkIn) errs.checkOut = "Check-out must be after check-in";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const base = {
      attendanceDate: date,
      status,
      checkIn: checkIn ? isoFromDateTime(date, checkIn) : undefined,
      checkOut: checkOut ? isoFromDateTime(date, checkOut) : undefined,
      remarks: remarks.trim() || (record ? "" : undefined),
    };

    setSaving(true);
    try {
      if (record) {
        await updateAttendance(record.id, base);
        toast.success("Attendance updated successfully");
      } else {
        await createAttendance({ employeeId, ...base });
        toast.success("Attendance saved successfully");
      }
      onClose();
    } catch (error) {
      const fe = fieldErrors(error);
      if (Object.keys(fe).length) setErrors(fe);
      toastError(error, "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={!!entry}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-125 p-0 overflow-hidden">
        <DialogHeading
          icon={ClipboardList}
          title={record ? "Correct Attendance" : "Add Attendance Entry"}
          description={record ? "Saving marks this day as edited by HR, so the automatic marking will not change it." : "Mark attendance for one employee on one day."}
        />

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
          <FieldGroup>
            <Field>
              <Label>Employee</Label>
              <EmployeePicker employees={employees} value={employeeId} onChange={setEmployeeId} disabled={!!record} hasError={!!errors.employeeId} />
              <FieldError message={errors.employeeId} />
            </Field>

            <Field>
              <Label>Date</Label>
              <DateField value={date} onChange={setDate} hasError={!!errors.attendanceDate} />
              <FieldError message={errors.attendanceDate} />
            </Field>

            <Field>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as AttendanceStatus)}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTENDANCE_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <Label>Check In</Label>
                <TimePickerPopover value={checkIn} onChange={setCheckIn} icon={<LogIn className="size-4" />} placeholder="Select time" fullWidth />
              </Field>
              <Field>
                <Label>Check Out</Label>
                <TimePickerPopover value={checkOut} onChange={setCheckOut} icon={<LogOut className="size-4" />} placeholder="Select time" fullWidth />
                <FieldError message={errors.checkOut} />
              </Field>
            </div>

            <Field>
              <Label>Remarks</Label>
              <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks" className="h-11" />
            </Field>
          </FieldGroup>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {record ? "Save Changes" : "Save Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ───────────────────────── Daily overview ─────────────────────────

function DailyView({ onSet }: { onSet: (employeeId: string, date: string) => void }) {
  const { dailyReport, loading, fetchDailyReport } = useHrStore();
  const canCreate = useHasPermission("employee-attendance.create");
  const canUpdate = useHasPermission("employee-attendance.update");
  const canWrite = canCreate || canUpdate;
  const [date, setDate] = useState(todayStr());
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDailyReport(date).catch((e) => toastError(e, "Failed to load the daily report"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const rows = (dailyReport?.rows ?? []).filter(
    (r) => (statusFilter === ALL || r.status === statusFilter) && (!search.trim() || `${r.employee.name} ${r.employee.employeeCode}`.toLowerCase().includes(search.trim().toLowerCase()))
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:w-56">
          <DateField value={date} onChange={setDate} />
        </div>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee" className="h-11 sm:max-w-xs" />
      </div>

      {dailyReport && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setStatusFilter(ALL)} className={`rounded-full border px-3 py-1 text-sm ${statusFilter === ALL ? "bg-foreground text-background" : "hover:bg-muted"}`}>
            All {dailyReport.total}
          </button>
          {Object.entries(dailyReport.counts).map(([status, count]) => (
            <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`flex items-center gap-2 rounded-full border px-2 py-1 ${statusFilter === status ? "ring-2 ring-primary" : "hover:bg-muted"}`}>
              <StatusBadge status={status} />
              <span className="pr-1 text-sm font-medium">{count}</span>
            </button>
          ))}
        </div>
      )}

      {loading && !dailyReport ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No employees to show" />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check in</TableHead>
                <TableHead>Check out</TableHead>
                <TableHead>Late by</TableHead>
                <TableHead>Leave</TableHead>
                {canWrite && <TableHead className="w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.employee.id}>
                  <TableCell>
                    <p className="font-medium">{r.employee.name}</p>
                    <p className="text-xs text-muted-foreground">{r.employee.employeeCode}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell>{formatTime(r.checkIn)}</TableCell>
                  <TableCell>{formatTime(r.checkOut)}</TableCell>
                  <TableCell>{r.lateMinutes ? minutesText(r.lateMinutes) : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.leave ? `${r.leave.typeName}${r.leave.halfDay ? " (half day)" : ""}` : "—"}</TableCell>
                  {canWrite && (
                    <TableCell>
                      <Button variant="outline" size="sm" className="h-8" onClick={() => onSet(r.employee.id, date)}>
                        Set
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Records ─────────────────────────

function RecordsView({ employees, onEdit }: { employees: EmployeeLookup[]; onEdit: (record: AttendanceRecord) => void }) {
  const { attendances, loading, fetchAttendances, deleteAttendance } = useHrStore();
  const canUpdate = useHasPermission("employee-attendance.update");
  const canDelete = useHasPermission("employee-attendance.delete");

  const month = monthBounds(currentPeriodKey());
  const [from, setFrom] = useState(month.from);
  const [to, setTo] = useState(month.to);
  const [employeeId, setEmployeeId] = useState("");
  const [status, setStatus] = useState(ALL);
  const [deleting, setDeleting] = useState<AttendanceRecord | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchAttendances({ from: from || undefined, to: to || undefined, employeeId: employeeId || undefined, status: status === ALL ? undefined : status }).catch((e) => toastError(e, "Failed to load attendance"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, employeeId, status]);

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteAttendance(deleting.id);
      toast.success("Attendance reset to automatic");
      setDeleting(null);
    } catch (error) {
      toastError(error, "Failed to delete attendance");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DateField value={from} onChange={setFrom} placeholder="From" />
        <DateField value={to} onChange={setTo} placeholder="To" />
        <EmployeePicker employees={employees} value={employeeId} onChange={setEmployeeId} allLabel="All employees" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {ATTENDANCE_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && attendances.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : attendances.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No attendance records" hint="Records appear here as punches arrive and days are marked." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check in</TableHead>
                <TableHead>Check out</TableHead>
                <TableHead>Worked</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Remarks</TableHead>
                {(canUpdate || canDelete) && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendances.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(r.date, "dd MMM, EEE")}</TableCell>
                  <TableCell>
                    <p className="font-medium">{r.employee.name}</p>
                    <p className="text-xs text-muted-foreground">{r.employee.employeeCode}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell>{formatTime(r.checkIn)}</TableCell>
                  <TableCell>{formatTime(r.checkOut)}</TableCell>
                  <TableCell>{minutesText(r.workedMinutes)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={r.source === "MANUAL" ? "border-indigo-200 bg-indigo-50 text-indigo-700" : ""}>
                      {r.source === "MANUAL" ? "Edited by HR" : "Automatic"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-sm text-muted-foreground">{r.remarks || "—"}</TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canUpdate && (
                            <DropdownMenuItem onClick={() => onEdit(r)}>
                              <Pencil className="mr-2 size-4" />
                              Correct
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem className="text-red-600" onClick={() => setDeleting(r)}>
                              <Trash2 className="mr-2 size-4" />
                              Reset to automatic
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
        title="Reset this day to automatic?"
        description="The record is removed and rebuilt from the punches. If the day is over and there are no punches, it becomes Absent."
        confirmLabel="Reset"
        destructive
        loading={busy}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ───────────────────────── Punches ─────────────────────────

function parsePunches(text: string) {
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim()));
  const items: ImportPunchItem[] = [];
  const errors: string[] = [];

  rows.forEach((r, i) => {
    const code = (r[0] ?? "").trim();
    const when = (r[1] ?? "").trim();
    const d = new Date(when.replace(" ", "T"));

    if (Number.isNaN(d.getTime())) {
      if (i === 0) return; // header row
      return errors.push(`Row ${i + 1}: "${when}" is not a valid date and time`);
    }
    if (!code) return errors.push(`Row ${i + 1}: biometric code is missing`);
    items.push({ biometricCode: code, punchTime: d.toISOString() });
  });

  return { items, errors };
}

function PunchDialog({ open, date, employees, onClose }: { open: boolean; date: string; employees: EmployeeLookup[]; onClose: () => void }) {
  const { createPunch } = useHrStore();
  const [employeeId, setEmployeeId] = useState("");
  const [day, setDay] = useState(todayStr());
  const [time, setTime] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmployeeId("");
    setDay(date);
    setTime("");
    setErrors({});
  }, [open, date]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!employeeId) errs.employeeId = "Select an employee";
    if (!time) errs.time = "Select the punch time";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const res = await createPunch({ employeeId, punchTime: isoFromDateTime(day, time) });
      if (res.result === "DUPLICATE") toast.info("This punch already exists");
      else toast.success("Punch added");
      onClose();
    } catch (error) {
      toastError(error, "Failed to add the punch");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-125 p-0 overflow-hidden">
        <DialogHeading icon={Fingerprint} title="Add Punch" description="Record a punch by hand, for example when the device missed it." />
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <FieldGroup>
            <Field>
              <Label>Employee</Label>
              <EmployeePicker employees={employees} value={employeeId} onChange={setEmployeeId} hasError={!!errors.employeeId} />
              <FieldError message={errors.employeeId} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <Label>Date</Label>
                <DateField value={day} onChange={setDay} />
              </Field>
              <Field>
                <Label>Time</Label>
                <TimePickerPopover value={time} onChange={setTime} icon={<LogIn className="size-4" />} placeholder="Select time" fullWidth />
                <FieldError message={errors.time} />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Add Punch
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PunchImportDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (r: ResultInfo) => void }) {
  const { importPunches } = useHrStore();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  async function handleImport() {
    const { items, errors } = parsePunches(text);
    if (!items.length) {
      toast.error(errors[0] ?? "Nothing to import");
      return;
    }
    if (items.length > 5000) {
      toast.error("Import up to 5000 punches at a time");
      return;
    }

    setSaving(true);
    try {
      const res = await importPunches(items);
      onClose();
      onDone({
        title: "Punch import finished",
        lines: [`Recorded: ${res.recorded}`, `Already existed: ${res.duplicates}`, `Unmatched (no employee has the code yet): ${res.unmatched}`],
        problems: [...errors, ...res.failed.map((f) => `Row ${f.row}: ${f.error}`)],
        problemsTitle: "Not imported",
      });
    } catch (error) {
      toastError(error, "Import failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-150 p-0 overflow-hidden">
        <DialogHeading icon={Upload} title="Import Punches" description="One punch per row: biometric code, then date and time." />
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted">
            <Upload className="size-4" />
            Choose CSV file
            <input
              type="file"
              accept=".csv,text/csv,.txt"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setText(await readFileText(file));
              }}
            />
          </label>
          <textarea className={TEXTAREA_CLASS} rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder={"1001,2026-11-03 09:05\n1002,2026-11-03 09:12"} />
          <p className="text-xs text-muted-foreground">Dates look like 2026-11-03 09:05. A header row is skipped automatically. Repeated punches are ignored.</p>
        </div>
        <DialogFooter className="gap-2 border-t px-6 py-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleImport} disabled={saving || !text.trim()}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PunchesView({ employees }: { employees: EmployeeLookup[] }) {
  const { punches, loading, fetchPunches, deletePunch } = useHrStore();
  const canCreate = useHasPermission("employee-attendance.create");
  const canDelete = useHasPermission("employee-attendance.delete");

  const [date, setDate] = useState(todayStr());
  const [employeeId, setEmployeeId] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResultInfo | null>(null);

  useEffect(() => {
    fetchPunches(date, employeeId || undefined).catch((e) => toastError(e, "Failed to load punches"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, employeeId]);

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deletePunch(deleting);
      toast.success("Punch deleted");
      setDeleting(null);
    } catch (error) {
      toastError(error, "Failed to delete the punch");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-3 sm:grid-cols-2 lg:w-lg">
          <DateField value={date} onChange={setDate} />
          <EmployeePicker employees={employees} value={employeeId} onChange={setEmployeeId} allLabel="All employees" />
        </div>
        {canCreate && (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
              <Upload className="size-4" />
              Import
            </Button>
            <Button className="gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              Add Punch
            </Button>
          </div>
        )}
      </div>

      {loading && punches.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : punches.length === 0 ? (
        <EmptyState icon={Fingerprint} title="No punches on this day" />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Biometric code</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Device</TableHead>
                {canDelete && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {punches.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{formatDateTime(p.punchTime)}</TableCell>
                  <TableCell>
                    {p.employee ? (
                      <>
                        <p className="font-medium">{p.employee.name}</p>
                        <p className="text-xs text-muted-foreground">{p.employee.employeeCode}</p>
                      </>
                    ) : (
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                        Unmatched
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{p.biometricCode}</TableCell>
                  <TableCell>{p.source === "DEVICE" ? "Device" : p.source === "MANUAL" ? "Manual" : "Import"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.deviceId || "—"}</TableCell>
                  {canDelete && (
                    <TableCell>
                      <Button variant="ghost" size="icon" className="size-8 text-red-600" onClick={() => setDeleting(p.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PunchDialog open={addOpen} date={date} employees={employees} onClose={() => setAddOpen(false)} />
      <PunchImportDialog open={importOpen} onClose={() => setImportOpen(false)} onDone={setResult} />
      <ResultDialog result={result} onClose={() => setResult(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
        title="Delete this punch?"
        description="The employee's attendance for that day is recalculated without it."
        confirmLabel="Delete"
        destructive
        loading={busy}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ───────────────────────── Unmatched punches ─────────────────────────

function UnmatchedView({ employees }: { employees: EmployeeLookup[] }) {
  const { unmatchedPunches, loading, fetchUnmatchedPunches, assignUnmatchedPunches } = useHrStore();
  const canAssign = useHasPermission("employee-attendance.update");
  const [target, setTarget] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUnmatchedPunches().catch((e) => toastError(e, "Failed to load unmatched punches"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAssign() {
    if (!target || !employeeId) return;
    setSaving(true);
    try {
      const res = await assignUnmatchedPunches(target, employeeId);
      toast.success(`${res.linked} punch(es) linked, ${res.daysRefreshed} day(s) recalculated`);
      setTarget(null);
      setEmployeeId("");
    } catch (error) {
      toastError(error, "Could not assign the punches");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">These punches came from a biometric code that no employee has yet. Give the code to the right person and their attendance is updated.</p>

      {loading && unmatchedPunches.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : unmatchedPunches.length === 0 ? (
        <EmptyState icon={UserX} title="No unmatched punches" hint="Every punch belongs to an employee." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Biometric code</TableHead>
                <TableHead>Punches</TableHead>
                <TableHead>First punch</TableHead>
                <TableHead>Last punch</TableHead>
                {canAssign && <TableHead className="w-32" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {unmatchedPunches.map((g) => (
                <TableRow key={g.biometricCode}>
                  <TableCell className="font-medium">{g.biometricCode}</TableCell>
                  <TableCell>{g.punchCount}</TableCell>
                  <TableCell>{formatDateTime(g.firstPunch)}</TableCell>
                  <TableCell>{formatDateTime(g.lastPunch)}</TableCell>
                  {canAssign && (
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTarget(g.biometricCode);
                          setEmployeeId("");
                        }}
                      >
                        Assign to employee
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={!!target}
        onOpenChange={(o) => {
          if (!o) setTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-125 p-0 overflow-hidden">
          <DialogHeading icon={UserX} title={`Assign code ${target ?? ""}`} description="This employee gets the biometric code, and the stored punches are applied to their attendance." />
          <div className="space-y-6 p-6">
            <Field>
              <Label>Employee</Label>
              <EmployeePicker employees={employees} value={employeeId} onChange={setEmployeeId} />
            </Field>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAssign} disabled={saving || !employeeId}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Assign
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ───────────────────────── Tab ─────────────────────────

export default function AttendanceTab() {
  const { employeeLookup, fetchEmployeeLookup } = useHrStore();
  const canDaily = useHasPermission("hr-report.read");
  const canCreate = useHasPermission("employee-attendance.create");

  const [view, setView] = useState<View | null>(null);
  const [entry, setEntry] = useState<EntryState | null>(null);

  useEffect(() => {
    fetchEmployeeLookup().catch((e) => toastError(e, "Failed to load employees"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const views: { id: View; label: string; icon: LucideIcon }[] = [
    ...(canDaily ? [{ id: "daily" as View, label: "Daily", icon: CalendarCheck }] : []),
    { id: "records", label: "Records", icon: ClipboardList },
    { id: "punches", label: "Punches", icon: Fingerprint },
    { id: "unmatched", label: "Unmatched", icon: UserX },
  ];
  const current = views.find((v) => v.id === view)?.id ?? views[0].id;

  // Open the dialog on the existing record for that day, or an empty entry.
  async function openFor(employeeId: string, date: string) {
    try {
      const res = await hrService.attendance.getAll({ from: date, to: date, employeeId });
      const rows: AttendanceRecord[] = res.data?.data ?? [];
      setEntry({ record: rows[0] ?? null, employeeId, date });
    } catch (error) {
      toastError(error, "Could not load the attendance");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedTabs tabs={views} value={current} onChange={setView} />
        {canCreate && (
          <Button className="gap-2" onClick={() => setEntry({ record: null })}>
            <Plus className="size-4" />
            Add Entry
          </Button>
        )}
      </div>

      {current === "daily" && <DailyView onSet={openFor} />}
      {current === "records" && <RecordsView employees={employeeLookup} onEdit={(record) => setEntry({ record })} />}
      {current === "punches" && <PunchesView employees={employeeLookup} />}
      {current === "unmatched" && <UnmatchedView employees={employeeLookup} />}

      <AttendanceDialog entry={entry} employees={employeeLookup} onClose={() => setEntry(null)} />
    </div>
  );
}