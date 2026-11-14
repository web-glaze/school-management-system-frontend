"use client";

import { useEffect, useState } from "react";
import { Inbox, Loader2, Plus, QrCode } from "lucide-react";
import { toast } from "sonner";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGatepassStore } from "@/store/gatepassStore";
import QrDialog from "./QrDialog";
import RaiseRequestDialog from "./RaiseRequestDialog";
import RequestDetailDialog from "./RequestDetailDialog";
import { StatusBadge, TYPE_LABEL, apiError, formatDateTime, studentsLabel } from "./shared";

const PAGE_SIZE = 10;
const CANCELLABLE = ["PENDING_HOUSEMOTHER", "PENDING_PCH", "APPROVED"];
const QR_STATUSES = ["APPROVED", "OUT", "OVERDUE"];

export default function RequestsTab() {
  const requests = useGatepassStore((s) => s.myRequests);
  const total = useGatepassStore((s) => s.myTotal);
  const loading = useGatepassStore((s) => s.loading.myRequests);
  const fetchMyRequests = useGatepassStore((s) => s.fetchMyRequests);
  const cancelRequest = useGatepassStore((s) => s.cancelRequest);

  const [page, setPage] = useState(1);
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [qrId, setQrId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchMyRequests({ page, limit: PAGE_SIZE }).catch((error) => toast.error(apiError(error, "Could not load your requests")));
  }, [page, fetchMyRequests]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const confirmCancel = async () => {
    if (!cancelId) return;

    try {
      setCancelling(true);
      await cancelRequest(cancelId);
      await fetchMyRequests({ page, limit: PAGE_SIZE });
      toast.success("Request cancelled");
      setCancelId(null);
    } catch (error) {
      toast.error(apiError(error, "Could not cancel the request"));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold">My requests</h2>
          <p className="text-sm text-muted-foreground">Raise a request and follow its approval.</p>
        </div>

        <Button className="gap-2" onClick={() => setRaiseOpen(true)}>
          <Plus className="size-4" />
          New request
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
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

                  <TableCell className="max-w-56">
                    <p className="truncate">{studentsLabel(request)}</p>
                  </TableCell>

                  <TableCell className="text-sm">
                    <p>{formatDateTime(request.requestedFrom)}</p>
                    <p className="text-muted-foreground">to {formatDateTime(request.requestedTo)}</p>
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={request.status} />
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setDetailId(request.id)}>
                        View
                      </Button>

                      {request.pass && QR_STATUSES.includes(request.status) && (
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => setQrId(request.id)}>
                          <QrCode className="size-4" />
                          QR
                        </Button>
                      )}

                      {CANCELLABLE.includes(request.status) && (
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setCancelId(request.id)}>
                          Cancel
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

      <RaiseRequestDialog
        open={raiseOpen}
        onOpenChange={setRaiseOpen}
        onCreated={() => {
          setPage(1);
          fetchMyRequests({ page: 1, limit: PAGE_SIZE }).catch(() => undefined);
        }}
      />

      <RequestDetailDialog requestId={detailId} onClose={() => setDetailId(null)} />
      <QrDialog requestId={qrId} onClose={() => setQrId(null)} />

      <AlertDialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
            <AlertDialogDescription>The request will be withdrawn and any QR code for it stops working. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep request</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelling}
              onClick={(event) => {
                event.preventDefault();
                void confirmCancel();
              }}
            >
              {cancelling ? "Cancelling..." : "Cancel request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
