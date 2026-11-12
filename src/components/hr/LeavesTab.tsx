"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Loader2, MoreVertical, Pencil, Plus, Scale, XCircle, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHasPermission } from "@/hooks/usePermission";
import { useHrStore, type EmployeeLeave, type LeaveBalance } from "@/store/hrStore";
import { ConfirmDialog, DateField, DialogHeading, EmployeePicker, EmptyState, FieldError, SegmentedTabs, daysText, dateKey, fieldErrors, formatDate, todayStr, toastError } from "@/components/hr/shared";
import { LeaveBalanceCards, TEXTAREA_CLASS } from "@/components/hr/parts";

const ALL = "ALL";
type DayMode = "SINGLE" | "RANGE" | "HALF";
type PayMode = "DEFAULT" | "PAID" | "UNPAID";

// ───────────────────────── Add / edit leave ─────────────────────────

function LeaveDialog({ entry, onClose }: { entry: { leave: EmployeeLeave | null } | null; onClose: () => void }) {
  const { employeeLookup, leaveTypes, createLeave, updateLeave, getLeaveBalances } = useHrStore();
  const leave = entry?.leave ?? null;

  const [employeeId, setEmployeeId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [dayMode, setDayMode] = useState<DayMode>("SINGLE");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [payMode, setPayMode] = useState<PayMode>("DEFAULT");
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState<LeaveBalance | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!entry) return;
    if (entry.leave) {
      const l = entry.leave;
      const start = dateKey(l.startDate);
      const end = dateKey(l.endDate);
      setEmployeeId(l.employeeId);
      setLeaveTypeId(l.leaveTypeId);
      setDayMode(Number(l.totalDays) === 0.5 && start === end ? "HALF" : start === end ? "SINGLE" : "RANGE");
      setStartDate(start);
      setEndDate(end);
      setPayMode(l.isPaid ? "PAID" : "UNPAID");
      setReason(l.reason ?? "");
    } else {
      setEmployeeId("");
      setLeaveTypeId("");
      setDayMode("SINGLE");
      setStartDate(todayStr());
      setEndDate(todayStr());
      setPayMode("DEFAULT");
      setReason("");
    }
    setErrors({});
    setPreview(null);
  }, [entry]);

  // Show how many days are available for the chosen type on the start date.
  useEffect(() => {
    if (!entry || !employeeId || !leaveTypeId || !startDate) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    getLeaveBalances(employeeId, startDate)
      .then((rows) => {
        if (!cancelled) setPreview(rows.find((r) => r.leaveTypeId === leaveTypeId) ?? null);
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, employeeId, leaveTypeId, startDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs: Record<string, string> = {};
    if (!employeeId) errs.employeeId = "Select an employee";
    if (!leaveTypeId) errs.leaveTypeId = "Select a leave type";
    if (!startDate) errs.startDate = "Pick the start date";
    if (dayMode === "RANGE") {
      if (!endDate) errs.endDate = "Pick the end date";
      else if (endDate < startDate) errs.endDate = "The end date cannot be before the start date";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const finalEnd = dayMode === "RANGE" ? endDate : startDate;
    const isPaid = payMode === "DEFAULT" ? undefined : payMode === "PAID";

    setSaving(true);
    try {
      if (leave) {
        await updateLeave(leave.id, { leaveTypeId, startDate, endDate: finalEnd, isHalfDay: dayMode === "HALF", isPaid, reason: reason.trim() });
        toast.success("Leave updated successfully");
      } else {
        await createLeave({
          employeeId,
          leaveTypeId,
          startDate,
          ...(dayMode === "RANGE" && { endDate }),
          ...(dayMode === "HALF" && { isHalfDay: true }),
          ...(isPaid !== undefined && { isPaid }),
          ...(reason.trim() && { reason: reason.trim() }),
        });
        toast.success("Leave recorded successfully");
      }
      onClose();
    } catch (error) {
      const fe = fieldErrors(error);
      if (Object.keys(fe).length) setErrors(fe);
      toastError(error, "Failed to save the leave");
    } finally {
      setSaving(false);
    }
  }

  const types = leaveTypes.filter((t) => t.isActive || t.id === leave?.leaveTypeId);

  return (
    <Dialog
      open={!!entry}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-125 p-0 overflow-hidden">
        <DialogHeading
          icon={CalendarDays}
          title={leave ? "Edit Leave" : "Record Leave"}
          description="Weekly offs and school holidays inside the dates are not counted."
        />

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
          <FieldGroup>
            <Field>
              <Label>Employee</Label>
              <EmployeePicker employees={employeeLookup} value={employeeId} onChange={setEmployeeId} disabled={!!leave} hasError={!!errors.employeeId} />
              <FieldError message={errors.employeeId} />
            </Field>

            <Field>
              <Label>Leave Type</Label>
              <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.isPaid ? "paid" : "unpaid"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.leaveTypeId} />
            </Field>

            <Field>
              <Label>Duration</Label>
              <Select value={dayMode} onValueChange={(v) => setDayMode(v as DayMode)}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Single day</SelectItem>
                  <SelectItem value="RANGE">Multiple days</SelectItem>
                  <SelectItem value="HALF">Half day</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div className={dayMode === "RANGE" ? "grid gap-4 sm:grid-cols-2" : ""}>
              <Field>
                <Label>{dayMode === "RANGE" ? "From" : "Date"}</Label>
                <DateField value={startDate} onChange={setStartDate} hasError={!!errors.startDate} />
                <FieldError message={errors.startDate} />
              </Field>
              {dayMode === "RANGE" && (
                <Field>
                  <Label>To</Label>
                  <DateField value={endDate} onChange={setEndDate} hasError={!!errors.endDate} />
                  <FieldError message={errors.endDate} />
                </Field>
              )}
            </div>

            {preview && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                {preview.balance === null
                  ? "No leave policy covers this date. Record the leave as unpaid, or create a policy first."
                  : `${daysText(preview.balance)} day(s) of ${preview.name} available${leave ? " (this leave is already counted)" : ""}.`}
              </div>
            )}

            <Field>
              <Label>Pay</Label>
              <Select value={payMode} onValueChange={(v) => setPayMode(v as PayMode)}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEFAULT">Use the leave type setting</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="UNPAID">Unpaid (deducted from salary)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <Label>Reason</Label>
              <textarea className={TEXTAREA_CLASS} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
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
              {leave ? "Save Changes" : "Record Leave"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ───────────────────────── Records ─────────────────────────

function RecordsView({ onEdit }: { onEdit: (leave: EmployeeLeave) => void }) {
  const { leaves, leaveTypes, employeeLookup, loading, fetchLeaves, cancelLeave } = useHrStore();
  const canUpdate = useHasPermission("employee-leave.update");
  const canDelete = useHasPermission("employee-leave.delete");

  const [employeeId, setEmployeeId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState(ALL);
  const [status, setStatus] = useState("ACTIVE");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cancelling, setCancelling] = useState<EmployeeLeave | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchLeaves({
      employeeId: employeeId || undefined,
      leaveTypeId: leaveTypeId === ALL ? undefined : leaveTypeId,
      status: status === ALL ? undefined : status,
      from: from || undefined,
      to: to || undefined,
    }).catch((e) => toastError(e, "Failed to load leaves"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, leaveTypeId, status, from, to]);

  async function handleCancel() {
    if (!cancelling) return;
    setBusy(true);
    try {
      await cancelLeave(cancelling.id);
      toast.success("Leave cancelled");
      setCancelling(null);
    } catch (error) {
      toastError(error, "Failed to cancel the leave");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <EmployeePicker employees={employeeLookup} value={employeeId} onChange={setEmployeeId} allLabel="All employees" />
        <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
          <SelectTrigger className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All leave types</SelectItem>
            {leaveTypes.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value={ALL}>All</SelectItem>
          </SelectContent>
        </Select>
        <DateField value={from} onChange={setFrom} placeholder="From" clearable />
        <DateField value={to} onChange={setTo} placeholder="To" clearable />
      </div>

      {loading && leaves.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : leaves.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No leaves found" />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Pay</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                {(canUpdate || canDelete) && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.map((l) => {
                const active = l.status === "ACTIVE";
                const sameDay = dateKey(l.startDate) === dateKey(l.endDate);

                return (
                  <TableRow key={l.id} className={active ? "" : "opacity-60"}>
                    <TableCell>
                      <p className="font-medium">{l.employee.name}</p>
                      <p className="text-xs text-muted-foreground">{l.employee.employeeCode}</p>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: l.leaveType.color ?? "#94a3b8" }} />
                        {l.leaveType.name}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(l.startDate)}
                      {!sameDay && ` – ${formatDate(l.endDate)}`}
                    </TableCell>
                    <TableCell>{daysText(l.totalDays)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={l.isPaid ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
                        {l.isPaid ? "Paid" : "Unpaid"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-sm text-muted-foreground">{l.reason || "—"}</TableCell>
                    <TableCell>{active ? "Active" : "Cancelled"}</TableCell>
                    {(canUpdate || canDelete) && (
                      <TableCell>
                        {active && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canUpdate && (
                                <DropdownMenuItem onClick={() => onEdit(l)}>
                                  <Pencil className="mr-2 size-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <DropdownMenuItem className="text-red-600" onClick={() => setCancelling(l)}>
                                  <XCircle className="mr-2 size-4" />
                                  Cancel leave
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(o) => {
          if (!o) setCancelling(null);
        }}
        title="Cancel this leave?"
        description={`The leave record is kept for history, but the days are freed and ${cancelling?.employee.name ?? "the employee"}'s attendance for those dates goes back to normal.`}
        confirmLabel="Cancel leave"
        destructive
        loading={busy}
        onConfirm={handleCancel}
      />
    </div>
  );
}

// ───────────────────────── Balances ─────────────────────────

function BalancesView() {
  const { employeeLookup, getLeaveBalances } = useHrStore();
  const [employeeId, setEmployeeId] = useState("");
  const [asOf, setAsOf] = useState(todayStr());
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!employeeId) {
      setBalances([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getLeaveBalances(employeeId, asOf)
      .then((rows) => {
        if (!cancelled) setBalances(rows);
      })
      .catch((e) => toastError(e, "Failed to load balances"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, asOf]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:w-2xl">
        <EmployeePicker employees={employeeLookup} value={employeeId} onChange={setEmployeeId} placeholder="Select an employee" />
        <DateField value={asOf} onChange={setAsOf} />
      </div>

      {!employeeId ? (
        <EmptyState icon={Scale} title="Pick an employee" hint="Their leave balances as of the chosen date appear here." />
      ) : loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <LeaveBalanceCards balances={balances} />
      )}
    </div>
  );
}

// ───────────────────────── Tab ─────────────────────────

export default function LeavesTab() {
  const { fetchEmployeeLookup, fetchLeaveTypes } = useHrStore();
  const canCreate = useHasPermission("employee-leave.create");

  const [view, setView] = useState<"records" | "balances">("records");
  const [entry, setEntry] = useState<{ leave: EmployeeLeave | null } | null>(null);

  useEffect(() => {
    fetchEmployeeLookup().catch(() => {});
    fetchLeaveTypes().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const views: { id: "records" | "balances"; label: string; icon: LucideIcon }[] = [
    { id: "records", label: "Leave Records", icon: CalendarDays },
    { id: "balances", label: "Balances", icon: Scale },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedTabs tabs={views} value={view} onChange={setView} />
        {canCreate && (
          <Button className="gap-2" onClick={() => setEntry({ leave: null })}>
            <Plus className="size-4" />
            Record Leave
          </Button>
        )}
      </div>

      {view === "records" ? <RecordsView onEdit={(leave) => setEntry({ leave })} /> : <BalancesView />}

      <LeaveDialog entry={entry} onClose={() => setEntry(null)} />
    </div>
  );
}