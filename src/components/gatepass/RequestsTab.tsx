"use client";

import { useEffect, useState } from "react";
import { Eye, Loader2, Plus, QrCode, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGatepassStore } from "@/store/gatepassStore";
import QrDialog from "./QrDialog";
import RaiseRequestDialog from "./RaiseRequestDialog";
import RequestDetailDialog from "./RequestDetailDialog";
import { RowActions, StatusBadge, TH, THEAD_CLASS, TYPE_LABEL, TableCard, TableEmptyRow, TableLoadingRow, apiError, formatDateTime, studentsLabel, RequestPeriod } from "./shared";

const PAGE_SIZE = 10;
const CANCELLABLE = ["PENDING_HOUSEMOTHER", "PENDING_PCH", "APPROVED"];
const QR_STATUSES = ["APPROVED", "OUT", "OVERDUE", "INSIDE"];

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

      <TableCard>
        <Table>
          <TableHeader className={THEAD_CLASS}>
            <TableRow className="hover:bg-transparent">
              <TableHead className={`${TH} pl-4 sm:pl-6`}>Request</TableHead>
              <TableHead className={`${TH} hidden md:table-cell`}>Students</TableHead>
              <TableHead className={`${TH} hidden md:table-cell`}>Period</TableHead>
              <TableHead className={`${TH} hidden sm:table-cell`}>Status</TableHead>
              <TableHead className={`${TH} w-14 pr-4 text-right sm:pr-6 md:w-28`}>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border/30">
            {loading && requests.length === 0 ? (
              <TableLoadingRow colSpan={5} />
            ) : requests.length === 0 ? (
              <TableEmptyRow colSpan={5} title="No requests yet" text="Raise a new request to get started." />
            ) : (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="py-4 pl-4 align-middle sm:pl-6">
                    <div className="min-w-0 max-w-56 space-y-1 sm:max-w-none">
                      <p className="font-semibold leading-tight">{request.requestNo}</p>
                      <p className="text-xs text-muted-foreground">{TYPE_LABEL[request.type]}</p>
                      <p className="truncate text-sm text-foreground/60 md:hidden">{studentsLabel(request)}</p>
                      <p className="text-xs text-muted-foreground md:hidden">
                        {formatDateTime(request.requestedFrom)} to {formatDateTime(request.requestedTo)}
                      </p>
                      <div className="pt-1 sm:hidden">
                        <StatusBadge status={request.status} />
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="hidden max-w-56 py-4 align-middle md:table-cell">
                    <p className="truncate">{studentsLabel(request)}</p>
                  </TableCell>

                  <TableCell className="hidden py-4 align-middle text-sm md:table-cell">
                    <RequestPeriod request={request} />
                  </TableCell>

                  <TableCell className="hidden py-4 align-middle sm:table-cell">
                    <StatusBadge status={request.status} />
                  </TableCell>

                  <TableCell className="py-4 pr-4 text-right align-middle sm:pr-6">
                    <RowActions
                      actions={[
                        { label: "View", icon: Eye, onClick: () => setDetailId(request.id) },
                        { label: "Show QR", icon: QrCode, onClick: () => setQrId(request.id), hidden: !(request.pass && QR_STATUSES.includes(request.status)) },
                        { label: "Cancel request", icon: XCircle, danger: true, onClick: () => setCancelId(request.id), hidden: !CANCELLABLE.includes(request.status) },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableCard>

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
        <AlertDialogContent className="sm:max-w-105">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="size-6 text-destructive" />
            </div>

            <AlertDialogTitle className="w-full text-center text-xl">Cancel this request?</AlertDialogTitle>

            <AlertDialogDescription className="text-center wrap-break-word">The request will be withdrawn and any QR code for it stops working. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={cancelling} className="h-11">
              Keep request
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmCancel();
              }}
              disabled={cancelling}
              className="h-11 bg-destructive text-white hover:bg-destructive/90"
            >
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 size-4" />
                  Cancel request
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
