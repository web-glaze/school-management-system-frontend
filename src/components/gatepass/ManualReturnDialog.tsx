"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { gatepassService, type MovementStatus, type MovementType } from "@/services/gatepass.service";
import { DateTimePicker, TimeSelect, parseLocalValue, toDateString, toLocalValue } from "./pickers";
import { apiError, formatDay } from "./shared";

export interface ManualTarget {
  id: string;
  requestNo: string;
  type: MovementType;
  status: MovementStatus;
  requestedFrom?: string;
  requestedTo: string;
  actualExitAt?: string | null;
}

interface Props {
  target: ManualTarget | null;
  onClose: () => void;
  onDone: () => void;
}

function ManualForm({ target, onClose, onDone }: { target: ManualTarget } & Omit<Props, "target">) {
  const isVisitor = target.type === "VISITOR";
  const neverScanned = target.status === "APPROVED" || target.status === "EXPIRED";

  // A visitor pass is for one day, so only the time can be chosen.
  const visitDay = toDateString(new Date(target.requestedTo));

  const [when, setWhen] = useState(() => toLocalValue(new Date()));
  const [time, setTime] = useState(() => toLocalValue(new Date()).slice(11));
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const earliest = target.actualExitAt ? new Date(target.actualExitAt) : target.requestedFrom ? new Date(target.requestedFrom) : undefined;

  const submit = async () => {
    const occurred = isVisitor ? new Date(`${visitDay}T${time}`) : parseLocalValue(when);

    if (!occurred || Number.isNaN(occurred.getTime())) {
      toast.error("Choose the date and time");
      return;
    }

    if (occurred.getTime() > Date.now() + 60_000) {
      toast.error("The time cannot be in the future");
      return;
    }

    if (earliest && occurred < earliest) {
      toast.error("This cannot be earlier than the pass start or the recorded exit");
      return;
    }

    if (!remarks.trim()) {
      toast.error("Give a reason");
      return;
    }

    try {
      setSubmitting(true);

      await gatepassService.gate.manual({
        requestId: target.id,
        remarks: remarks.trim(),
        occurredAt: occurred.toISOString(),
      });

      toast.success(isVisitor ? "Visitor recorded as left" : "Return recorded");
      onDone();
      onClose();
    } catch (error) {
      toast.error(apiError(error, "Could not record this"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogContent className="w-[95vw] sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {isVisitor ? "Record that the visitor left" : "Record the return"} · {target.requestNo}
        </DialogTitle>
        <DialogDescription>
          {neverScanned
            ? "Nobody scanned this pass at the gate. Recording this closes it so it cannot be used again."
            : "Use this when the gate scan was missed. The pass is closed and this is saved as a manual entry with your name."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {isVisitor ? (
          <div className="space-y-2">
            <Label>Time the visitor left, on {formatDay(target.requestedTo)}</Label>
            <TimeSelect value={time} onChange={setTime} />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Date and time of the return</Label>
            <DateTimePicker value={when} onChange={setWhen} minDate={earliest} maxDate={new Date()} />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="manual-remarks">Reason</Label>
          <Textarea id="manual-remarks" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="For example: the parent forgot to scan the pass at the gate" />
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={submitting} className="gap-2">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Record
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export default function ManualReturnDialog({ target, onClose, onDone }: Props) {
  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      {target && <ManualForm key={target.id} target={target} onClose={onClose} onDone={onDone} />}
    </Dialog>
  );
}
