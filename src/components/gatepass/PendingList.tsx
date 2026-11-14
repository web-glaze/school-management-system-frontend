"use client";

import { useEffect, useState } from "react";
import { Inbox, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MovementRequest } from "@/services/gatepass.service";
import { useGatepassStore } from "@/store/gatepassStore";
import DecisionDialog from "./DecisionDialog";
import RequestDetailDialog from "./RequestDetailDialog";
import { StudentAvatar, TYPE_LABEL, apiError, formatDateTime, fullName } from "./shared";

const SHOWN_STUDENTS = 3;

function StudentLine({ item }: { item: MovementRequest["students"][number] }) {
  const student = item.student;
  const name = fullName(student);
  const enrollment = student.enrollments?.[0];

  return (
    <div className="flex items-center gap-3">
      <StudentAvatar name={name} photoUrl={student.photoUrl} size={36} />

      <div className="min-w-0 text-sm">
        <p className="truncate font-medium">{name}</p>
        <p className="text-muted-foreground">
          Adm. no. {student.admissionNo}
          {enrollment ? ` · ${enrollment.class.name} - ${enrollment.section.name}` : ""}
          {student.hostel ? ` · ${student.hostel.name}` : ""}
        </p>
      </div>
    </div>
  );
}

interface Props {
  mode: "housemother" | "final";
}

export default function PendingList({ mode }: Props) {
  const pending = useGatepassStore((s) => (mode === "housemother" ? s.pendingHousemother : s.pendingFinal));
  const loading = useGatepassStore((s) => s.loading.approvals);
  const fetchHousemother = useGatepassStore((s) => s.fetchPendingHousemother);
  const fetchFinal = useGatepassStore((s) => s.fetchPendingFinal);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [decision, setDecision] = useState<{
    request: MovementRequest;
    action: "APPROVED" | "REJECTED";
  } | null>(null);

  useEffect(() => {
    const load = mode === "housemother" ? fetchHousemother : fetchFinal;

    load().catch((error) => toast.error(apiError(error, "Could not load the requests")));
  }, [mode, fetchHousemother, fetchFinal]);

  if (loading && pending.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
        <Inbox className="mx-auto mb-2 size-6" />
        Nothing is waiting for your approval.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {pending.length} request{pending.length === 1 ? "" : "s"} waiting for you
      </p>

      {pending.map((request) => {
        const housemothers = request.approvals?.filter((a) => a.stage === "HOUSEMOTHER") ?? [];
        const approvedCount = housemothers.filter((a) => a.action === "APPROVED").length;
        const extra = request.students.length - SHOWN_STUDENTS;

        return (
          <div key={request.id} className="space-y-4 rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{request.requestNo}</p>
                <p className="text-sm text-muted-foreground">
                  Raised by {request.raisedBy?.name ?? "—"} on {formatDateTime(request.createdAt)}
                </p>
              </div>

              <Badge variant="secondary">{TYPE_LABEL[request.type]}</Badge>
            </div>

            <div className="space-y-2">
              {request.students.slice(0, SHOWN_STUDENTS).map((item) => (
                <StudentLine key={item.id} item={item} />
              ))}

              {extra > 0 && (
                <p className="text-sm text-muted-foreground">
                  and {extra} more student{extra === 1 ? "" : "s"}
                </p>
              )}
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Leaves</p>
                <p className="font-medium">{formatDateTime(request.requestedFrom)}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Returns by</p>
                <p className="font-medium">{formatDateTime(request.requestedTo)}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Reason / event</p>
                <p className="font-medium">{request.purpose || "—"}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Destination</p>
                <p className="font-medium">{request.destination || "—"}</p>
              </div>

              {request.accompanyingPerson && (
                <div>
                  <p className="text-xs text-muted-foreground">Maitre / home mother</p>
                  <p className="font-medium">{request.accompanyingPerson}</p>
                </div>
              )}

              {request.pickupPersons && request.pickupPersons.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Pickup persons</p>
                  <p className="font-medium">
                    {request.pickupPersons.map((p) => `${p.name} (${p.relation})`).join(", ")}
                  </p>
                </div>
              )}
            </div>

            {housemothers.length > 1 && (
              <p className="text-sm text-muted-foreground">
                Housemothers: {approvedCount} of {housemothers.length} have approved
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setDetailId(request.id)}>
                View details and ID proof
              </Button>

              <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setDecision({ request, action: "REJECTED" })}>
                Reject
              </Button>

              <Button onClick={() => setDecision({ request, action: "APPROVED" })}>Approve</Button>
            </div>
          </div>
        );
      })}

      <RequestDetailDialog requestId={detailId} onClose={() => setDetailId(null)} />

      {decision && (
        <DecisionDialog
          key={`${decision.request.id}-${decision.action}`}
          mode={mode}
          request={decision.request}
          action={decision.action}
          onClose={() => setDecision(null)}
        />
      )}
    </div>
  );
}