"use client";

import { useEffect, useState } from "react";
import { Inbox, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePermissions } from "@/hooks/usePermission";
import { useGatepassStore } from "@/store/gatepassStore";
import ManualReturnDialog, { type ManualTarget } from "./ManualReturnDialog";
import RequestDetailDialog from "./RequestDetailDialog";
import { RequestPeriod, StatusBadge, TYPE_LABEL, apiError, studentsLabel } from "./shared";

const PAGE_SIZE = 10;
const MANUAL_STATUSES = ["APPROVED", "OUT", "OVERDUE", "INSIDE", "EXPIRED"];

export default function AllRequestsPanel() {
  const requests = useGatepassStore((s) => s.allRequests);
  const total = useGatepassStore((s) => s.allTotal);
  const loading = useGatepassStore((s) => s.loading.allRequests);
  const fetchAllRequests = useGatepassStore((s) => s.fetchAllRequests);
  const revokeRequest = useGatepassStore((s) => s.revokeRequest);
  const { has } = usePermissions();
  const canManual = has("gate.manual");

  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [manual, setManual] = useState<ManualTarget | null>(null);

  useEffect(() => {
    fetchAllRequests({ page, limit: PAGE_SIZE }).catch((error) => toast.error(apiError(error, "Could not load the requests")));
  }, [page, fetchAllRequests]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const confirmRevoke = async () => {
    if (!revokeId) return;

    try {
      setRevoking(true);
      await revokeRequest(revokeId);
      await fetchAllRequests({ page, limit: PAGE_SIZE });
      toast.success("Pass revoked");
      setRevokeId(null);
    } catch (error) {
      toast.error(apiError(error, "Could not revoke the pass"));
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request</TableHead>
              <TableHead>Raised by</TableHead>
              <TableHead>Who</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  <Inbox className="mx-auto mb-2 size-6" />
                  No requests yet
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <p className="font-medium">{request.requestNo}</p>
                    <p className="text-xs text-muted-foreground">{TYPE_LABEL[request.type]}</p>
                  </TableCell>

                  <TableCell className="text-sm">{request.raisedBy?.name ?? request.raisedByName ?? "—"}</TableCell>

                  <TableCell className="max-w-56">
                    <p className="truncate">{studentsLabel(request)}</p>
                  </TableCell>

                  <TableCell className="text-sm">
                    <RequestPeriod request={request} />
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={request.status} />
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setDetailId(request.id)}>
                        View
                      </Button>

                      {canManual && MANUAL_STATUSES.includes(request.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setManual({
                              id: request.id,
                              requestNo: request.requestNo,
                              type: request.type,
                              status: request.status,
                              requestedFrom: request.requestedFrom,
                              requestedTo: request.requestedTo,
                              actualExitAt: request.actualExitAt,
                            })
                          }
                        >
                          {request.type === "VISITOR" ? "Record leaving" : "Record return"}
                        </Button>
                      )}

                      {request.status === "APPROVED" && (
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setRevokeId(request.id)}>
                          Revoke
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <RequestDetailDialog requestId={detailId} onClose={() => setDetailId(null)} />

      <ManualReturnDialog target={manual} onClose={() => setManual(null)} onDone={() => void fetchAllRequests({ page, limit: PAGE_SIZE })} />

      <AlertDialog open={!!revokeId} onOpenChange={(open) => !open && setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this pass?</AlertDialogTitle>
            <AlertDialogDescription>The request is cancelled and its QR code stops working. This is only possible before the pass is used. It cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Keep pass</AlertDialogCancel>
            <AlertDialogAction
              disabled={revoking}
              onClick={(event) => {
                event.preventDefault();
                void confirmRevoke();
              }}
            >
              {revoking ? "Revoking..." : "Revoke pass"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
