"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MovementRequest } from "@/services/gatepass.service";
import { useGatepassStore } from "@/store/gatepassStore";
import { apiError } from "./shared";

interface Props {
  mode: "housemother" | "final";
  request: MovementRequest;
  action: "APPROVED" | "REJECTED";
  onClose: () => void;
}

/** Approve or reject one request. Mount it with a key so it starts fresh each time. */
export default function DecisionDialog({ mode, request, action, onClose }: Props) {
  const housemotherDecision = useGatepassStore((s) => s.housemotherDecision);
  const finalDecision = useGatepassStore((s) => s.finalDecision);

  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const approving = action === "APPROVED";

  const submit = async () => {
    if (!approving && !remarks.trim()) {
      toast.error("Please give a reason for rejecting");
      return;
    }

    try {
      setSubmitting(true);

      const decide = mode === "housemother" ? housemotherDecision : finalDecision;
      await decide(request.id, { action, remarks: remarks.trim() || undefined });

      toast.success(
        approving
          ? mode === "final"
            ? `${request.requestNo} approved. The QR code is now available.`
            : `${request.requestNo} approved`
          : `${request.requestNo} rejected`,
      );

      onClose();
    } catch (error) {
      toast.error(apiError(error, "Could not save your decision"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {approving ? "Approve" : "Reject"} {request.requestNo}
          </DialogTitle>
          <DialogDescription>
            {approving
              ? mode === "final"
                ? "This is the final approval. The QR code is created and the parent can use it at the gate."
                : "After your approval the request goes on to the Head – Pastoral Care."
              : "The request will be rejected and the person who raised it will be told."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="remarks">{approving ? "Remarks (optional)" : "Reason for rejecting"}</Label>
          <Textarea
            id="remarks"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={approving ? "Anything the next approver should know" : "Why is this being rejected?"}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={submitting}
            variant={approving ? "default" : "destructive"}
            className="gap-2"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {approving ? "Approve" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}