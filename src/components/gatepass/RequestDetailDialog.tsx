"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { gatepassService, mediaUrl, type MovementRequest } from "@/services/gatepass.service";
import { StatusBadge, StudentAvatar, TYPE_LABEL, apiError, formatDateTime, fullName } from "./shared";

interface Props {
  requestId: string | null;
  onClose: () => void;
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

const ACTION_CLASS = {
  PENDING: "border-gray-200 bg-gray-50 text-gray-600",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
} as const;

export default function RequestDetailDialog({ requestId, onClose }: Props) {
  const [request, setRequest] = useState<MovementRequest | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!requestId) {
      setRequest(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    gatepassService.movement
      .getById(requestId)
      .then((data) => {
        if (!cancelled) setRequest(data);
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error(apiError(error, "Could not load the request"));
        onClose();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  return (
    <Dialog open={!!requestId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] w-[95vw] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-3">
            {request?.requestNo ?? "Request"}
            {request && <StatusBadge status={request.status} />}
          </DialogTitle>
          <DialogDescription>{request ? TYPE_LABEL[request.type] : "Loading request details"}</DialogDescription>
        </DialogHeader>

        {loading || !request ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Info label="Leaves" value={formatDateTime(request.requestedFrom)} />
              <Info label="Returns by" value={formatDateTime(request.requestedTo)} />
              <Info label="Reason / event" value={request.purpose} />
              <Info label="Destination" value={request.destination} />
              {request.accompanyingPerson && <Info label="Maitre / home mother" value={request.accompanyingPerson} />}
              <Info label="Raised by" value={request.raisedBy?.name} />
              <Info label="Actual exit" value={formatDateTime(request.actualExitAt)} />
              <Info label="Actual return" value={formatDateTime(request.actualReturnAt)} />
            </div>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Students ({request.students.length})</h3>

              <div className="space-y-2">
                {request.students.map(({ id, student }) => {
                  const enrollment = student.enrollments?.[0];
                  const name = fullName(student);

                  return (
                    <div key={id} className="flex items-center gap-3 rounded-lg border p-3">
                      <StudentAvatar name={name} photoUrl={student.photoUrl} />
                      <div className="text-sm">
                        <p className="font-medium">{name}</p>
                        <p className="text-muted-foreground">
                          Adm. no. {student.admissionNo}
                          {enrollment ? ` · ${enrollment.class.name} - ${enrollment.section.name}` : ""}
                          {student.hostel ? ` · ${student.hostel.name}` : ""}
                          {student.room ? ` · Room ${student.room.roomNo}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {request.pickupPersons && request.pickupPersons.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Pickup persons ({request.pickupPersons.length})</h3>

                <div className="space-y-2">
                  {request.pickupPersons.map((person) => (
                    <div key={person.id} className="flex flex-wrap items-center gap-4 rounded-lg border p-3">
                      <a href={mediaUrl(person.idProofUrl)} target="_blank" rel="noreferrer">
                        <img src={mediaUrl(person.idProofUrl)} alt={`${person.name} ID proof`} className="h-20 w-32 rounded-md border object-cover" />
                      </a>

                      <div className="text-sm">
                        <p className="font-medium">
                          {person.name} <span className="text-muted-foreground">({person.relation})</span>
                        </p>
                        <p className="text-muted-foreground">
                          {person.idProofType}
                          {person.idProofNumber ? ` · ${person.idProofNumber}` : ""}
                        </p>
                        {person.phone && <p className="text-muted-foreground">{person.phone}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {request.approvals && request.approvals.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Approvals</h3>

                <div className="space-y-2">
                  {request.approvals.map((approval) => {
                    const who = approval.stage === "PCH" ? "Head – Pastoral Care" : `Housemother${approval.housemotherUser?.name ? `: ${approval.housemotherUser.name}` : ""}`;

                    return (
                      <div key={approval.id} className="rounded-lg border p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">{who}</p>
                          <Badge variant="outline" className={ACTION_CLASS[approval.action]}>
                            {approval.action === "PENDING" ? "Pending" : approval.action === "APPROVED" ? "Approved" : "Rejected"}
                          </Badge>
                        </div>

                        {approval.actedAt && (
                          <p className="text-muted-foreground">
                            {approval.approver?.name ? `${approval.approver.name} · ` : ""}
                            {formatDateTime(approval.actedAt)}
                          </p>
                        )}

                        {approval.remarks && <p className="mt-1">{approval.remarks}</p>}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
