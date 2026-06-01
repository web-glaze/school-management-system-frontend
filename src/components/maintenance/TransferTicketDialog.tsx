"use client";

/**
 * Drop-in dialog used on the ticket detail page.
 *
 *   <TransferTicketDialog
 *     ticketId={id}
 *     currentTechnicianId={complaint.assignedTechnician?.id}
 *     onTransferred={() => fetchData()}
 *   />
 *
 * Why: admins / heads frequently need to bounce a ticket from one tech
 * to another (sick leave, hospital, overload, etc.). Reason is
 * mandatory — the backend writes a TicketTransfer audit row.
 */

import { useEffect, useMemo, useState } from "react";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { api, type Technician } from "@/lib/api";
import { logError } from "@/lib/api-helpers";
import { notify } from "@/lib/notify";

interface Props {
  ticketId: string;
  currentTechnicianId?: string | null;
  /** Restrict the dropdown to the current tech's department. */
  sameDepartmentOnly?: boolean;
  /** Refresh handler — typically your page's fetchData(). */
  onTransferred?: () => void;
}

const REASON_PRESETS = [
  "Technician on leave",
  "Technician in hospital",
  "Technician unavailable today",
  "Out of working hours",
  "Workload too high — handing over",
  "Needs different specialisation",
  "Extra time required — escalating",
];

export function TransferTicketDialog({
  ticketId,
  currentTechnicianId,
  sameDepartmentOnly = false,
  onTransferred,
}: Props) {
  const [open, setOpen] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [toTechnicianId, setToTechnicianId] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Load the technicians list the first time the dialog opens. Cached
  // for the lifetime of the dialog so subsequent opens are instant.
  useEffect(() => {
    if (!open || technicians.length > 0) return;
    setLoadingTechs(true);
    api.technicians
      .list()
      .then((list) => setTechnicians(list))
      .catch((err) => {
        logError("transfer.loadTechs", err);
        notify.error(err, "Failed to load technicians");
      })
      .finally(() => setLoadingTechs(false));
  }, [open, technicians.length]);

  // Find the current tech's department once so we can filter by it.
  const currentDepartmentId = useMemo(() => {
    return (
      technicians.find((t) => t.id === currentTechnicianId)?.department?.id ??
      null
    );
  }, [technicians, currentTechnicianId]);

  const choices = useMemo(() => {
    return technicians
      .filter((t) => t.isActive !== false)
      .filter((t) => t.id !== currentTechnicianId)
      .filter((t) => {
        if (!sameDepartmentOnly || !currentDepartmentId) return true;
        return t.department?.id === currentDepartmentId;
      });
  }, [technicians, currentTechnicianId, currentDepartmentId, sameDepartmentOnly]);

  const submit = async () => {
    const trimmedReason = reason.trim();
    if (!toTechnicianId) {
      notify.error("Pick a technician to transfer to");
      return;
    }
    if (!trimmedReason) {
      notify.error("A reason is required so we can audit the transfer");
      return;
    }
    try {
      setSaving(true);
      await api.complaints.transfer(ticketId, {
        toTechnicianId,
        reason: trimmedReason,
      });
      notify.success("Ticket transferred");
      setOpen(false);
      setToTechnicianId("");
      setReason("");
      onTransferred?.();
    } catch (err) {
      logError("transfer.submit", err);
      notify.error(err, "Failed to transfer ticket");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <Send className="size-3.5" />
          Transfer Ticket
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Transfer this ticket</DialogTitle>
          <DialogDescription>
            Pick the new technician and tell us why. The reason is logged
            for audit so anyone reviewing the ticket can see the history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">New technician</Label>
            <Select
              value={toTechnicianId}
              onValueChange={setToTechnicianId}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    loadingTechs ? "Loading technicians…" : "Select a technician"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {choices.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                    {t.department?.name ? ` · ${t.department.name}` : ""}
                  </SelectItem>
                ))}
                {choices.length === 0 && !loadingTechs && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No other technicians available.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Reason (required)</Label>
            <Textarea
              placeholder="e.g. Technician on leave until Friday — handing over to keep the SLA"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px] text-xs"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {REASON_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={saving}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={submit}
            disabled={saving || !toTechnicianId || !reason.trim()}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Transferring…
              </>
            ) : (
              <>
                <Send className="size-3.5" />
                Transfer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
