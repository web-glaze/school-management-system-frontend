"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, Copy, Fingerprint, KeyRound, Loader2, MoreVertical, Pencil, Plus, RefreshCw, ScrollText, ShieldOff, SlidersHorizontal, Tag, Trash2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHasPermission, usePermissions } from "@/hooks/usePermission";
import type { DayOfWeek, LeaveFrequency, PayDayBasis } from "@/services/hr.service";
import { useHrStore, type AttendanceDevice, type AttendanceDeviceWithKey, type AttendanceShift, type LeavePolicy, type LeaveType } from "@/store/hrStore";
import {
  ConfirmDialog,
  DAY_BASIS_OPTIONS,
  DAY_OPTIONS,
  DateField,
  DialogHeading,
  EmployeePicker,
  EmptyState,
  FieldError,
  LEAVE_FREQUENCY_OPTIONS,
  SegmentedTabs,
  TimePickerPopover,
  dateKey,
  daysText,
  fieldErrors,
  formatDate,
  formatDateTime,
  labelOf,
  to12hLabel,
  toastError,
} from "@/components/hr/shared";
import { CheckField, TEXTAREA_CLASS } from "@/components/hr/parts";

const SWATCHES = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#64748b"];

const Spinner = () => (
  <div className="flex justify-center py-16">
    <Loader2 className="size-6 animate-spin text-muted-foreground" />
  </div>
);

function FooterButtons({ saving, label }: { saving: boolean; label: string }) {
  return (
    <DialogFooter className="gap-2">
      <DialogClose asChild>
        <Button variant="outline" type="button">
          Cancel
        </Button>
      </DialogClose>
      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
        {label}
      </Button>
    </DialogFooter>
  );
}

// ═════════════════════════ Shifts ═════════════════════════

function ShiftDialog({ entry, onClose }: { entry: { shift: AttendanceShift | null } | null; onClose: () => void }) {
  const { createShift, updateShift } = useHrStore();
  const shift = entry?.shift ?? null;

  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("16:00");
  const [grace, setGrace] = useState("10");
  const [halfAfter, setHalfAfter] = useState("120");
  const [fullHours, setFullHours] = useState("6");
  const [halfHours, setHalfHours] = useState("3");
  const [weeklyOffs, setWeeklyOffs] = useState<DayOfWeek[]>(["SUNDAY"]);
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!entry) return;
    const s = entry.shift;
    setName(s?.name ?? "");
    setStartTime(s?.startTime ?? "09:00");
    setEndTime(s?.endTime ?? "16:00");
    setGrace(String(s?.graceMinutes ?? 10));
    setHalfAfter(String(s?.halfDayAfterMinutes ?? 120));
    setFullHours(String((s?.fullDayMinMinutes ?? 360) / 60));
    setHalfHours(String((s?.halfDayMinMinutes ?? 180) / 60));
    setWeeklyOffs(s?.weeklyOffs ?? ["SUNDAY"]);
    setIsDefault(s?.isDefault ?? false);
    setIsActive(s?.isActive ?? true);
    setErrors({});
  }, [entry]);

  const toggleDay = (d: DayOfWeek) => setWeeklyOffs((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs: Record<string, string> = {};
    const graceN = Number(grace);
    const halfAfterN = Number(halfAfter);
    const fullMin = Math.round(Number(fullHours) * 60);
    const halfMin = Math.round(Number(halfHours) * 60);

    if (!name.trim()) errs.name = "Shift name is required";
    if (!startTime) errs.startTime = "Pick the start time";
    if (!endTime) errs.endTime = "Pick the end time";
    if (!Number.isInteger(graceN) || graceN < 0 || graceN > 240) errs.graceMinutes = "Enter 0 to 240 minutes";
    if (!Number.isInteger(halfAfterN) || halfAfterN < 1 || halfAfterN > 600) errs.halfDayAfterMinutes = "Enter 1 to 600 minutes";
    if (!(fullMin >= 1 && fullMin <= 1440)) errs.fullDayMinMinutes = "Enter a valid number of hours";
    if (!(halfMin >= 1 && halfMin <= 1440)) errs.halfDayMinMinutes = "Enter a valid number of hours";
    if (!errs.fullDayMinMinutes && !errs.halfDayMinMinutes && halfMin >= fullMin) errs.halfDayMinMinutes = "Must be less than the full-day hours";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      name: name.trim(),
      startTime,
      endTime,
      graceMinutes: graceN,
      halfDayAfterMinutes: halfAfterN,
      fullDayMinMinutes: fullMin,
      halfDayMinMinutes: halfMin,
      weeklyOffs,
      isDefault,
      isActive,
    };

    setSaving(true);
    try {
      if (shift) await updateShift(shift.id, payload);
      else await createShift(payload);
      toast.success(shift ? "Shift updated successfully" : "Shift created successfully");
      onClose();
    } catch (error) {
      const fe = fieldErrors(error);
      if (Object.keys(fe).length) setErrors(fe);
      toastError(error, "Failed to save the shift");
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
      <DialogContent className="sm:max-w-150 p-0 overflow-hidden">
        <DialogHeading icon={Clock} title={shift ? "Edit Shift" : "Add Shift"} description="Working hours and the rules used to mark late and half-day attendance." />

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
          <FieldGroup>
            <Field>
              <Label>Shift Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" placeholder="e.g. General" />
              <FieldError message={errors.name} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <Label>Start Time</Label>
                <TimePickerPopover value={startTime} onChange={setStartTime} placeholder="Select time" fullWidth />
                <FieldError message={errors.startTime} />
              </Field>
              <Field>
                <Label>End Time</Label>
                <TimePickerPopover value={endTime} onChange={setEndTime} placeholder="Select time" fullWidth />
                <FieldError message={errors.endTime} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <Label>Grace Period (minutes)</Label>
                <Input value={grace} onChange={(e) => setGrace(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="h-11" />
                <p className="mt-1 text-xs text-muted-foreground">Arriving within this time is still on time.</p>
                <FieldError message={errors.graceMinutes} />
              </Field>
              <Field>
                <Label>Half Day If Later Than (minutes)</Label>
                <Input value={halfAfter} onChange={(e) => setHalfAfter(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="h-11" />
                <p className="mt-1 text-xs text-muted-foreground">Arriving this late counts as a half day.</p>
                <FieldError message={errors.halfDayAfterMinutes} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <Label>Full Day Minimum (hours)</Label>
                <Input value={fullHours} onChange={(e) => setFullHours(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" className="h-11" />
                <p className="mt-1 text-xs text-muted-foreground">Working less than this makes it a half day.</p>
                <FieldError message={errors.fullDayMinMinutes} />
              </Field>
              <Field>
                <Label>Half Day Minimum (hours)</Label>
                <Input value={halfHours} onChange={(e) => setHalfHours(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" className="h-11" />
                <p className="mt-1 text-xs text-muted-foreground">Working less than this counts as absent.</p>
                <FieldError message={errors.halfDayMinMinutes} />
              </Field>
            </div>

            <Field>
              <Label>Weekly Offs</Label>
              <div className="flex flex-wrap gap-2">
                {DAY_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${weeklyOffs.includes(d.value) ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    {d.short}
                  </button>
                ))}
              </div>
            </Field>

            <CheckField checked={isDefault} onChange={setIsDefault} label="Default shift" hint="Used for every employee who has no shift of their own. Only one shift can be the default." />
            {shift && <CheckField checked={isActive} onChange={setIsActive} label="Active" />}
          </FieldGroup>

          <FooterButtons saving={saving} label={shift ? "Save Changes" : "Add Shift"} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ShiftsPanel() {
  const { shifts, loading, fetchShifts, deleteShift } = useHrStore();
  const canCreate = useHasPermission("hr-shift.create");
  const canUpdate = useHasPermission("hr-shift.update");
  const canDelete = useHasPermission("hr-shift.delete");

  const [entry, setEntry] = useState<{ shift: AttendanceShift | null } | null>(null);
  const [removing, setRemoving] = useState<AttendanceShift | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchShifts().catch((e) => toastError(e, "Failed to load shifts"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete() {
    if (!removing) return;
    setBusy(true);
    try {
      await deleteShift(removing.id);
      toast.success("Shift deleted");
      setRemoving(null);
    } catch (error) {
      toastError(error, "Failed to delete the shift");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Define working hours. Employees without a shift use the default one.</p>
        {canCreate && (
          <Button className="gap-2" onClick={() => setEntry({ shift: null })}>
            <Plus className="size-4" />
            Add Shift
          </Button>
        )}
      </div>

      {loading && shifts.length === 0 ? (
        <Spinner />
      ) : shifts.length === 0 ? (
        <EmptyState icon={Clock} title="No shifts yet" hint="Until you add one, the system assumes 9:00 AM with 10 minutes grace and Sunday off." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shift</TableHead>
                <TableHead>Timing</TableHead>
                <TableHead>Late rules</TableHead>
                <TableHead>Minimum hours</TableHead>
                <TableHead>Weekly offs</TableHead>
                <TableHead>Employees</TableHead>
                {(canUpdate || canDelete) && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((s) => (
                <TableRow key={s.id} className={s.isActive ? "" : "opacity-60"}>
                  <TableCell>
                    <p className="font-medium">{s.name}</p>
                    <div className="mt-1 flex gap-1">
                      {s.isDefault && (
                        <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                          Default
                        </Badge>
                      )}
                      {!s.isActive && <Badge variant="outline">Inactive</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {to12hLabel(s.startTime)} – {to12hLabel(s.endTime)}
                  </TableCell>
                  <TableCell className="text-sm">
                    Grace {s.graceMinutes} min
                    <br />
                    <span className="text-muted-foreground">Half day after {s.halfDayAfterMinutes} min late</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    Full day {daysText(s.fullDayMinMinutes / 60)} h
                    <br />
                    <span className="text-muted-foreground">Half day {daysText(s.halfDayMinMinutes / 60)} h</span>
                  </TableCell>
                  <TableCell className="text-sm">{s.weeklyOffs.length ? DAY_OPTIONS.filter((d) => s.weeklyOffs.includes(d.value)).map((d) => d.short).join(", ") : "None"}</TableCell>
                  <TableCell>{s._count?.employees ?? 0}</TableCell>
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
                            <DropdownMenuItem onClick={() => setEntry({ shift: s })}>
                              <Pencil className="mr-2 size-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem className="text-red-600" onClick={() => setRemoving(s)}>
                              <Trash2 className="mr-2 size-4" />
                              Delete
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

      <ShiftDialog entry={entry} onClose={() => setEntry(null)} />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => {
          if (!o) setRemoving(null);
        }}
        title="Delete this shift?"
        description="A shift that employees are assigned to cannot be deleted. Reassign them first."
        confirmLabel="Delete"
        destructive
        loading={busy}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ═════════════════════════ Leave types ═════════════════════════

function LeaveTypeDialog({ entry, onClose }: { entry: { type: LeaveType | null } | null; onClose: () => void }) {
  const { createLeaveType, updateLeaveType } = useHrStore();
  const type = entry?.type ?? null;

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);
  const [isPaid, setIsPaid] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!entry) return;
    const t = entry.type;
    setName(t?.name ?? "");
    setCode(t?.code ?? "");
    setDescription(t?.description ?? "");
    setColor(t?.color ?? SWATCHES[0]);
    setIsPaid(t?.isPaid ?? true);
    setIsActive(t?.isActive ?? true);
    setErrors({});
  }, [entry]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!/^[A-Z0-9_-]{1,10}$/.test(code)) errs.code = "1-10 letters, numbers, - or _";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = { name: name.trim(), code, description: description.trim(), color, isPaid, isActive };

    setSaving(true);
    try {
      if (type) await updateLeaveType(type.id, payload);
      else await createLeaveType(payload);
      toast.success(type ? "Leave type updated successfully" : "Leave type created successfully");
      onClose();
    } catch (error) {
      const fe = fieldErrors(error);
      if (Object.keys(fe).length) setErrors(fe);
      toastError(error, "Failed to save the leave type");
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
        <DialogHeading icon={Tag} title={type ? "Edit Leave Type" : "Add Leave Type"} description="Examples: Casual Leave, Sick Leave, Loss of Pay." />

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
              <Field>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" placeholder="Casual Leave" />
                <FieldError message={errors.name} />
              </Field>
              <Field>
                <Label>Code</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={10} className="h-11" placeholder="CL" />
                <FieldError message={errors.code} />
              </Field>
            </div>

            <Field>
              <Label>Description</Label>
              <textarea className={TEXTAREA_CLASS} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
            </Field>

            <Field>
              <Label>Color</Label>
              <div className="flex flex-wrap items-center gap-2">
                {SWATCHES.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)} className={`size-7 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`} style={{ backgroundColor: c }} />
                ))}
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="size-7 cursor-pointer rounded border" />
              </div>
            </Field>

            <Field>
              <Label>Pay</Label>
              <Select value={isPaid ? "PAID" : "UNPAID"} onValueChange={(v) => setIsPaid(v === "PAID")}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">Paid (no salary deduction)</SelectItem>
                  <SelectItem value="UNPAID">Unpaid (deducted from salary)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {type && <CheckField checked={isActive} onChange={setIsActive} label="Active" hint="Inactive types cannot be used for new leaves." />}
          </FieldGroup>

          <FooterButtons saving={saving} label={type ? "Save Changes" : "Add Leave Type"} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LeaveTypesPanel() {
  const { leaveTypes, loading, fetchLeaveTypes, deleteLeaveType } = useHrStore();
  const canCreate = useHasPermission("leave-type.create");
  const canUpdate = useHasPermission("leave-type.update");
  const canDelete = useHasPermission("leave-type.delete");

  const [entry, setEntry] = useState<{ type: LeaveType | null } | null>(null);
  const [removing, setRemoving] = useState<LeaveType | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchLeaveTypes().catch((e) => toastError(e, "Failed to load leave types"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete() {
    if (!removing) return;
    setBusy(true);
    try {
      await deleteLeaveType(removing.id);
      toast.success("Leave type deleted");
      setRemoving(null);
    } catch (error) {
      toastError(error, "Failed to delete the leave type");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">The kinds of leave your school gives. How many days each person gets is set under Leave Policies.</p>
        {canCreate && (
          <Button className="gap-2" onClick={() => setEntry({ type: null })}>
            <Plus className="size-4" />
            Add Leave Type
          </Button>
        )}
      </div>

      {loading && leaveTypes.length === 0 ? (
        <Spinner />
      ) : leaveTypes.length === 0 ? (
        <EmptyState icon={Tag} title="No leave types yet" />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leave type</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Pay</TableHead>
                <TableHead>Policies</TableHead>
                <TableHead>Leaves taken</TableHead>
                <TableHead>Status</TableHead>
                {(canUpdate || canDelete) && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveTypes.map((t) => (
                <TableRow key={t.id} className={t.isActive ? "" : "opacity-60"}>
                  <TableCell>
                    <span className="flex items-center gap-2 font-medium">
                      <span className="size-3 rounded-full" style={{ backgroundColor: t.color ?? "#94a3b8" }} />
                      {t.name}
                    </span>
                    {t.description && <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>}
                  </TableCell>
                  <TableCell>{t.code}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={t.isPaid ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
                      {t.isPaid ? "Paid" : "Unpaid"}
                    </Badge>
                  </TableCell>
                  <TableCell>{t._count?.policies ?? 0}</TableCell>
                  <TableCell>{t._count?.leaves ?? 0}</TableCell>
                  <TableCell>{t.isActive ? "Active" : "Inactive"}</TableCell>
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
                            <DropdownMenuItem onClick={() => setEntry({ type: t })}>
                              <Pencil className="mr-2 size-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem className="text-red-600" onClick={() => setRemoving(t)}>
                              <Trash2 className="mr-2 size-4" />
                              Delete
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

      <LeaveTypeDialog entry={entry} onClose={() => setEntry(null)} />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => {
          if (!o) setRemoving(null);
        }}
        title="Delete this leave type?"
        description="A type that already has leave records cannot be deleted. Deactivate it instead."
        confirmLabel="Delete"
        destructive
        loading={busy}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ═════════════════════════ Leave policies ═════════════════════════

function PolicyDialog({ entry, onClose }: { entry: { policy: LeavePolicy | null } | null; onClose: () => void }) {
  const { leaveTypes, employeeLookup, createLeavePolicy, updateLeavePolicy } = useHrStore();
  const policy = entry?.policy ?? null;

  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [scope, setScope] = useState<"ALL" | "ONE">("ALL");
  const [employeeId, setEmployeeId] = useState("");
  const [allotment, setAllotment] = useState("");
  const [frequency, setFrequency] = useState<LeaveFrequency>("YEARLY");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [carryForward, setCarryForward] = useState(false);
  const [maxCarry, setMaxCarry] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!entry) return;
    const p = entry.policy;
    const year = new Date().getFullYear();
    setLeaveTypeId(p?.leaveTypeId ?? "");
    setScope(p?.employeeId ? "ONE" : "ALL");
    setEmployeeId(p?.employeeId ?? "");
    setAllotment(p ? String(Number(p.allotmentDays)) : "");
    setFrequency(p?.frequency ?? "YEARLY");
    setValidFrom(p ? dateKey(p.validFrom) : `${year}-01-01`);
    setValidTo(p ? dateKey(p.validTo) : `${year}-12-31`);
    setCarryForward(p?.carryForward ?? false);
    setMaxCarry(p?.maxCarryForwardDays != null ? String(Number(p.maxCarryForwardDays)) : "");
    setIsActive(p?.isActive ?? true);
    setErrors({});
  }, [entry]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs: Record<string, string> = {};
    const days = Number(allotment);
    if (!leaveTypeId) errs.leaveTypeId = "Select a leave type";
    if (scope === "ONE" && !employeeId) errs.employeeId = "Select an employee";
    if (!allotment.trim() || !Number.isFinite(days) || days < 0 || days > 366) errs.allotmentDays = "Enter 0 to 366 days";
    if (!validFrom) errs.validFrom = "Pick the start date";
    if (!validTo) errs.validTo = "Pick the end date";
    if (validFrom && validTo && validTo < validFrom) errs.validTo = "The end date cannot be before the start date";
    if (carryForward && maxCarry.trim() && (!Number.isFinite(Number(maxCarry)) || Number(maxCarry) < 0)) errs.maxCarryForwardDays = "Enter a valid number of days";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      leaveTypeId,
      employeeId: scope === "ONE" ? employeeId : null,
      allotmentDays: days,
      frequency,
      validFrom,
      validTo,
      carryForward,
      maxCarryForwardDays: carryForward && maxCarry.trim() ? Number(maxCarry) : null,
      isActive,
    };

    setSaving(true);
    try {
      if (policy) await updateLeavePolicy(policy.id, payload);
      else await createLeavePolicy(payload);
      toast.success(policy ? "Policy updated successfully" : "Policy created successfully");
      onClose();
    } catch (error) {
      const fe = fieldErrors(error);
      if (Object.keys(fe).length) setErrors(fe);
      toastError(error, "Failed to save the policy");
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
      <DialogContent className="sm:max-w-150 p-0 overflow-hidden">
        <DialogHeading icon={ScrollText} title={policy ? "Edit Leave Policy" : "Add Leave Policy"} description="How many days of a leave type are given, and when they can be used." />

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
          <FieldGroup>
            <Field>
              <Label>Leave Type</Label>
              <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes
                    .filter((t) => t.isActive || t.id === policy?.leaveTypeId)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.leaveTypeId} />
            </Field>

            <Field>
              <Label>Applies To</Label>
              <Select value={scope} onValueChange={(v) => setScope(v as "ALL" | "ONE")}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Every employee</SelectItem>
                  <SelectItem value="ONE">One employee only (override)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {scope === "ONE" && (
              <Field>
                <Label>Employee</Label>
                <EmployeePicker employees={employeeLookup} value={employeeId} onChange={setEmployeeId} hasError={!!errors.employeeId} />
                <FieldError message={errors.employeeId} />
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <Label>Days Given</Label>
                <Input value={allotment} onChange={(e) => setAllotment(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" className="h-11" placeholder="e.g. 12" />
                <FieldError message={errors.allotmentDays} />
              </Field>
              <Field>
                <Label>Given</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as LeaveFrequency)}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAVE_FREQUENCY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">{frequency === "MONTHLY" ? "The days are given again every month." : "The days cover the whole usable period below."}</p>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <Label>Usable From</Label>
                <DateField value={validFrom} onChange={setValidFrom} hasError={!!errors.validFrom} />
                <FieldError message={errors.validFrom} />
              </Field>
              <Field>
                <Label>Usable Until</Label>
                <DateField value={validTo} onChange={setValidTo} hasError={!!errors.validTo} />
                <FieldError message={errors.validTo} />
              </Field>
            </div>

            <CheckField checked={carryForward} onChange={setCarryForward} label="Carry forward unused days" hint="Unused days move into the next month or the next policy period." />
            {carryForward && (
              <Field>
                <Label>Carry Forward Limit (days)</Label>
                <Input value={maxCarry} onChange={(e) => setMaxCarry(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" className="h-11" placeholder="No limit" />
                <FieldError message={errors.maxCarryForwardDays} />
              </Field>
            )}

            {policy && <CheckField checked={isActive} onChange={setIsActive} label="Active" />}
          </FieldGroup>

          <FooterButtons saving={saving} label={policy ? "Save Changes" : "Add Policy"} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PoliciesPanel() {
  const { leavePolicies, leaveTypes, loading, fetchLeavePolicies, fetchLeaveTypes, fetchEmployeeLookup, deleteLeavePolicy } = useHrStore();
  const canCreate = useHasPermission("leave-policy.create");
  const canUpdate = useHasPermission("leave-policy.update");
  const canDelete = useHasPermission("leave-policy.delete");

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [entry, setEntry] = useState<{ policy: LeavePolicy | null } | null>(null);
  const [removing, setRemoving] = useState<LeavePolicy | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchLeaveTypes().catch(() => {});
    fetchEmployeeLookup().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchLeavePolicies(typeFilter === "ALL" ? undefined : typeFilter).catch((e) => toastError(e, "Failed to load policies"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  async function handleDelete() {
    if (!removing) return;
    setBusy(true);
    try {
      await deleteLeavePolicy(removing.id);
      toast.success("Policy deleted");
      setRemoving(null);
    } catch (error) {
      toastError(error, "Failed to delete the policy");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-10 w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All leave types</SelectItem>
            {leaveTypes.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canCreate && (
          <Button className="gap-2" onClick={() => setEntry({ policy: null })}>
            <Plus className="size-4" />
            Add Policy
          </Button>
        )}
      </div>

      {loading && leavePolicies.length === 0 ? (
        <Spinner />
      ) : leavePolicies.length === 0 ? (
        <EmptyState icon={ScrollText} title="No leave policies yet" hint="Without a policy, paid leave cannot be recorded for that leave type." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leave type</TableHead>
                <TableHead>Applies to</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Usable period</TableHead>
                <TableHead>Carry forward</TableHead>
                <TableHead>Status</TableHead>
                {(canUpdate || canDelete) && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leavePolicies.map((p) => (
                <TableRow key={p.id} className={p.isActive ? "" : "opacity-60"}>
                  <TableCell className="font-medium">{p.leaveType?.name}</TableCell>
                  <TableCell>{p.employee ? `${p.employee.name} (${p.employee.employeeCode})` : "Every employee"}</TableCell>
                  <TableCell>
                    {daysText(p.allotmentDays)} <span className="text-muted-foreground">{labelOf(LEAVE_FREQUENCY_OPTIONS, p.frequency).toLowerCase()}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(p.validFrom)} – {formatDate(p.validTo)}
                  </TableCell>
                  <TableCell>{p.carryForward ? (p.maxCarryForwardDays != null ? `Up to ${daysText(p.maxCarryForwardDays)} days` : "Yes") : "No"}</TableCell>
                  <TableCell>{p.isActive ? "Active" : "Inactive"}</TableCell>
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
                            <DropdownMenuItem onClick={() => setEntry({ policy: p })}>
                              <Pencil className="mr-2 size-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem className="text-red-600" onClick={() => setRemoving(p)}>
                              <Trash2 className="mr-2 size-4" />
                              Delete
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

      <PolicyDialog entry={entry} onClose={() => setEntry(null)} />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => {
          if (!o) setRemoving(null);
        }}
        title="Delete this policy?"
        description="Balances for this leave type are recalculated without it. Leaves already taken are kept."
        confirmLabel="Delete"
        destructive
        loading={busy}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ═════════════════════════ Devices ═════════════════════════

function DeviceDialog({ entry, onClose, onKey }: { entry: { device: AttendanceDevice | null } | null; onClose: () => void; onKey: (d: AttendanceDeviceWithKey) => void }) {
  const { createDevice, updateDevice } = useHrStore();
  const device = entry?.device ?? null;

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [serial, setSerial] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!entry) return;
    setName(entry.device?.name ?? "");
    setLocation(entry.device?.location ?? "");
    setSerial(entry.device?.serialNumber ?? "");
    setErrors({});
  }, [entry]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Device name is required";
    if (!device && !serial.trim()) errs.serialNumber = "Serial number is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      if (device) {
        await updateDevice(device.id, { name: name.trim(), location: location.trim() });
        toast.success("Device updated successfully");
        onClose();
      } else {
        const created = await createDevice({ name: name.trim(), serialNumber: serial.trim(), ...(location.trim() && { location: location.trim() }) });
        onClose();
        onKey(created);
      }
    } catch (error) {
      const fe = fieldErrors(error);
      if (Object.keys(fe).length) setErrors(fe);
      toastError(error, "Failed to save the device");
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
        <DialogHeading icon={Fingerprint} title={device ? "Edit Device" : "Register Device"} description="Each biometric device is registered once and gets its own key." />
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <FieldGroup>
            <Field>
              <Label>Device Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" placeholder="e.g. Main Gate" />
              <FieldError message={errors.name} />
            </Field>
            <Field>
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} className="h-11" placeholder="Optional" />
            </Field>
            <Field>
              <Label>Serial Number</Label>
              <Input value={serial} onChange={(e) => setSerial(e.target.value)} disabled={!!device} className="h-11" placeholder="Printed on the device or shown in its menu" />
              <FieldError message={errors.serialNumber} />
            </Field>
          </FieldGroup>
          <FooterButtons saving={saving} label={device ? "Save Changes" : "Register"} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DevicesPanel() {
  const { devices, loading, fetchDevices, updateDevice, regenerateDeviceKey, deleteDevice } = useHrStore();
  const canCreate = useHasPermission("attendance-device.create");
  const canUpdate = useHasPermission("attendance-device.update");
  const canDelete = useHasPermission("attendance-device.delete");

  const [entry, setEntry] = useState<{ device: AttendanceDevice | null } | null>(null);
  const [keyInfo, setKeyInfo] = useState<AttendanceDeviceWithKey | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "regen" | "revoke" | "delete"; device: AttendanceDevice } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchDevices().catch((e) => toastError(e, "Failed to load devices"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleConfirm() {
    if (!confirm) return;
    const { kind, device } = confirm;
    setBusy(true);
    try {
      if (kind === "regen") {
        setKeyInfo(await regenerateDeviceKey(device.id));
      } else if (kind === "revoke") {
        await updateDevice(device.id, { name: device.name, status: device.status === "ACTIVE" ? "REVOKED" : "ACTIVE" });
        toast.success(device.status === "ACTIVE" ? "Device revoked" : "Device activated");
      } else {
        await deleteDevice(device.id);
        toast.success("Device deleted");
      }
      setConfirm(null);
    } catch (error) {
      toastError(error, "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const copyKey = async () => {
    if (!keyInfo) return;
    await navigator.clipboard.writeText(keyInfo.key);
    toast.success("Key copied");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Register every biometric device. A device sends its punches with its own key, so unknown devices cannot post attendance.</p>
        {canCreate && (
          <Button className="gap-2" onClick={() => setEntry({ device: null })}>
            <Plus className="size-4" />
            Register Device
          </Button>
        )}
      </div>

      {loading && devices.length === 0 ? (
        <Spinner />
      ) : devices.length === 0 ? (
        <EmptyState icon={Fingerprint} title="No devices registered" />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Serial number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last seen</TableHead>
                {(canUpdate || canDelete) && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.location || "No location"}</p>
                  </TableCell>
                  <TableCell>{d.serialNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={d.status === "ACTIVE" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}>
                      {d.status === "ACTIVE" ? "Active" : "Revoked"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.lastSeenAt ? formatDateTime(d.lastSeenAt) : "Never"}</TableCell>
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
                            <>
                              <DropdownMenuItem onClick={() => setEntry({ device: d })}>
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setConfirm({ kind: "regen", device: d })}>
                                <RefreshCw className="mr-2 size-4" />
                                New key
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setConfirm({ kind: "revoke", device: d })}>
                                <ShieldOff className="mr-2 size-4" />
                                {d.status === "ACTIVE" ? "Revoke" : "Activate"}
                              </DropdownMenuItem>
                            </>
                          )}
                          {canDelete && (
                            <DropdownMenuItem className="text-red-600" onClick={() => setConfirm({ kind: "delete", device: d })}>
                              <Trash2 className="mr-2 size-4" />
                              Delete
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

      <DeviceDialog entry={entry} onClose={() => setEntry(null)} onKey={setKeyInfo} />

      <Dialog
        open={!!keyInfo}
        onOpenChange={(o) => {
          if (!o) setKeyInfo(null);
        }}
      >
        <DialogContent className="sm:max-w-125 p-0 overflow-hidden">
          <DialogHeading icon={KeyRound} title="Device key" description={keyInfo?.name} />
          <div className="space-y-4 p-6">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Copy this key now. For security it is shown only once and cannot be viewed again. If it is lost, generate a new key.</div>
            <div className="flex gap-2">
              <Input readOnly value={keyInfo?.key ?? ""} className="h-11 font-mono text-xs" />
              <Button type="button" variant="outline" className="h-11 shrink-0 gap-2" onClick={copyKey}>
                <Copy className="size-4" />
                Copy
              </Button>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Done</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => {
          if (!o) setConfirm(null);
        }}
        title={confirm?.kind === "regen" ? "Generate a new key?" : confirm?.kind === "revoke" ? (confirm.device.status === "ACTIVE" ? "Revoke this device?" : "Activate this device?") : "Delete this device?"}
        description={
          confirm?.kind === "regen"
            ? "The current key stops working immediately. Update the device with the new key."
            : confirm?.kind === "revoke"
              ? confirm.device.status === "ACTIVE"
                ? "The device can no longer send punches until it is activated again."
                : "The device can send punches again."
              : "The device is removed from the list. Punches it already sent are kept."
        }
        confirmLabel={confirm?.kind === "regen" ? "Generate key" : confirm?.kind === "revoke" ? (confirm.device.status === "ACTIVE" ? "Revoke" : "Activate") : "Delete"}
        destructive={confirm?.kind !== "regen" && !(confirm?.kind === "revoke" && confirm.device.status !== "ACTIVE")}
        loading={busy}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

// ═════════════════════════ General settings ═════════════════════════

function cycleExample(startDay: number) {
  if (!startDay || startDay <= 1) return "With start day 1, the November payslip covers 1 Nov to 30 Nov.";
  return `With start day ${startDay}, the November payslip covers ${startDay} Oct to ${startDay - 1} Nov.`;
}

function GeneralPanel() {
  const { settings, loading, fetchSettings, updateSettings } = useHrStore();
  const canUpdate = useHasPermission("hr-setting.update");

  const [absentTime, setAbsentTime] = useState("23:00");
  const [cycleDay, setCycleDay] = useState("1");
  const [basis, setBasis] = useState<PayDayBasis>("WORKING_DAYS");
  const [lateRule, setLateRule] = useState(false);
  const [lateCount, setLateCount] = useState("3");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings().catch((e) => toastError(e, "Failed to load settings"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!settings) return;
    setAbsentTime(settings.absentMarkTime);
    setCycleDay(String(settings.cycleStartDay));
    setBasis(settings.dayBasis);
    setLateRule(settings.lateCountForHalfDay != null);
    setLateCount(settings.lateCountForHalfDay != null ? String(settings.lateCountForHalfDay) : "3");
  }, [settings]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs: Record<string, string> = {};
    const day = Number(cycleDay);
    const lates = Number(lateCount);
    if (!absentTime) errs.absentMarkTime = "Pick a time";
    if (!Number.isInteger(day) || day < 1 || day > 28) errs.cycleStartDay = "Enter a day from 1 to 28";
    if (lateRule && (!Number.isInteger(lates) || lates < 1)) errs.lateCountForHalfDay = "Enter a whole number, 1 or more";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      await updateSettings({ absentMarkTime: absentTime, cycleStartDay: day, dayBasis: basis, lateCountForHalfDay: lateRule ? lates : null });
      toast.success("Settings saved successfully");
    } catch (error) {
      const fe = fieldErrors(error);
      if (Object.keys(fe).length) setErrors(fe);
      toastError(error, "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !settings) return <Spinner />;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <FieldGroup>
        <Field>
          <Label>Mark absent after</Label>
          <div className="w-48">
            <TimePickerPopover value={absentTime} onChange={setAbsentTime} placeholder="Select time" fullWidth className={canUpdate ? "" : "pointer-events-none opacity-60"} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">After this time each day, anyone with no punch and no leave is marked absent, and the minimum-hours rule is applied.</p>
          <FieldError message={errors.absentMarkTime} />
        </Field>

        <Field>
          <Label>Pay cycle starts on day</Label>
          <Input value={cycleDay} onChange={(e) => setCycleDay(e.target.value.replace(/\D/g, ""))} disabled={!canUpdate} inputMode="numeric" className="h-11 w-32" />
          <p className="mt-1 text-xs text-muted-foreground">{cycleExample(Number(cycleDay))}</p>
          <FieldError message={errors.cycleStartDay} />
        </Field>

        <Field>
          <Label>Daily salary is calculated on</Label>
          <Select value={basis} onValueChange={(v) => setBasis(v as PayDayBasis)} disabled={!canUpdate}>
            <SelectTrigger className="h-11 w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAY_BASIS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">One day&apos;s pay is the monthly salary divided by the working days, the calendar days of the period, or a fixed 30.</p>
        </Field>

        <CheckField checked={lateRule} onChange={setLateRule} disabled={!canUpdate} label="Deduct half a day for repeated late arrivals" hint="Every set number of late marks in a pay period costs half a day's pay." />
        {lateRule && (
          <Field>
            <Label>Late marks for half a day</Label>
            <Input value={lateCount} onChange={(e) => setLateCount(e.target.value.replace(/\D/g, ""))} disabled={!canUpdate} inputMode="numeric" className="h-11 w-32" />
            <FieldError message={errors.lateCountForHalfDay} />
          </Field>
        )}
      </FieldGroup>

      {canUpdate && (
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save Settings
        </Button>
      )}
    </form>
  );
}

// ═════════════════════════ Tab ═════════════════════════

type Section = "shifts" | "leave-types" | "policies" | "devices" | "general";

const SECTIONS: { id: Section; label: string; icon: LucideIcon; permission: string }[] = [
  { id: "shifts", label: "Shifts", icon: Clock, permission: "hr-shift.read" },
  { id: "leave-types", label: "Leave Types", icon: Tag, permission: "leave-type.read" },
  { id: "policies", label: "Leave Policies", icon: ScrollText, permission: "leave-policy.read" },
  { id: "devices", label: "Devices", icon: Fingerprint, permission: "attendance-device.read" },
  { id: "general", label: "General", icon: SlidersHorizontal, permission: "hr-setting.read" },
];

export default function SettingsTab() {
  const { has } = usePermissions();
  const [section, setSection] = useState<Section | null>(null);

  const visible = SECTIONS.filter((s) => has(s.permission));
  const current = visible.find((s) => s.id === section)?.id ?? visible[0]?.id;
  if (!current) return null;

  return (
    <div className="space-y-6">
      <SegmentedTabs tabs={visible} value={current} onChange={setSection} />

      {current === "shifts" && <ShiftsPanel />}
      {current === "leave-types" && <LeaveTypesPanel />}
      {current === "policies" && <PoliciesPanel />}
      {current === "devices" && <DevicesPanel />}
      {current === "general" && <GeneralPanel />}
    </div>
  );
}