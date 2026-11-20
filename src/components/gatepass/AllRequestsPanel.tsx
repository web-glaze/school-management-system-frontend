"use client";

import { useEffect, useState } from "react";
import { Ban, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGatepassStore } from "@/store/gatepassStore";
import RequestDetailDialog from "./RequestDetailDialog";
import { RowActions, StatusBadge, TH, THEAD_CLASS, TYPE_LABEL, TableCard, TableEmptyRow, TableLoadingRow, apiError, formatDateTime, studentsLabel } from "./shared";

const PAGE_SIZE = 10;

export default function AllRequestsPanel() {
  const requests = useGatepassStore((s) => s.allRequests);
  const total = useGatepassStore((s) => s.allTotal);
  const loading = useGatepassStore((s) => s.loading.allRequests);
  const fetchAllRequests = useGatepassStore((s) => s.fetchAllRequests);
  const revokeRequest = useGatepassStore((s) => s.revokeRequest);

  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

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
      <TableCard>
        <Table>
          <TableHeader className={THEAD_CLASS}>
            <TableRow className="hover:bg-transparent">
              <TableHead className={`${TH} pl-4 sm:pl-6`}>Request</TableHead>
              <TableHead className={`${TH} hidden lg:table-cell`}>Raised by</TableHead>
              <TableHead className={`${TH} hidden md:table-cell`}>Students</TableHead>
              <TableHead className={`${TH} hidden md:table-cell`}>Period</TableHead>
              <TableHead className={`${TH} hidden sm:table-cell`}>Status</TableHead>
              <TableHead className={`${TH} w-14 pr-4 text-right sm:pr-6 md:w-28`}>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border/30">
            {loading && requests.length === 0 ? (
              <TableLoadingRow colSpan={6} />
            ) : requests.length === 0 ? (
              <TableEmptyRow colSpan={6} title="No requests yet" />
            ) : (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="py-4 pl-4 align-middle sm:pl-6">
                    <div className="min-w-0 max-w-56 space-y-1 sm:max-w-none">
                      <p className="font-semibold leading-tight">{request.requestNo}</p>
                      <p className="text-xs text-muted-foreground">{TYPE_LABEL[request.type]}</p>
                      <p className="text-xs text-muted-foreground lg:hidden">By {request.raisedBy?.name ?? "—"}</p>
                      <p className="truncate text-sm text-foreground/60 md:hidden">{studentsLabel(request)}</p>
                      <p className="text-xs text-muted-foreground md:hidden">
                        {formatDateTime(request.requestedFrom)} to {formatDateTime(request.requestedTo)}
                      </p>
                      <div className="pt-1 sm:hidden">
                        <StatusBadge status={request.status} />
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="hidden py-4 align-middle text-sm lg:table-cell">{request.raisedBy?.name ?? "—"}</TableCell>

                  <TableCell className="hidden max-w-56 py-4 align-middle md:table-cell">
                    <p className="truncate">{studentsLabel(request)}</p>
                  </TableCell>

                  <TableCell className="hidden py-4 align-middle text-sm md:table-cell">
                    <p>{formatDateTime(request.requestedFrom)}</p>
                    <p className="text-muted-foreground">to {formatDateTime(request.requestedTo)}</p>
                  </TableCell>

                  <TableCell className="hidden py-4 align-middle sm:table-cell">
                    <StatusBadge status={request.status} />
                  </TableCell>

                  <TableCell className="py-4 pr-4 text-right align-middle sm:pr-6">
                    <RowActions
                      actions={[
                        { label: "View", icon: Eye, onClick: () => setDetailId(request.id) },
                        { label: "Revoke pass", icon: Ban, danger: true, onClick: () => setRevokeId(request.id), hidden: request.status !== "APPROVED" },
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

      <RequestDetailDialog requestId={detailId} onClose={() => setDetailId(null)} />

      <AlertDialog open={!!revokeId} onOpenChange={(open) => !open && setRevokeId(null)}>
        <AlertDialogContent className="sm:max-w-105">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Ban className="size-6 text-destructive" />
            </div>

            <AlertDialogTitle className="w-full text-center text-xl">Revoke this pass?</AlertDialogTitle>

            <AlertDialogDescription className="text-center wrap-break-word">
              The request is cancelled and its QR code stops working. This is only possible before the student has left. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={revoking} className="h-11">
              Keep pass
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmRevoke();
              }}
              disabled={revoking}
              className="h-11 bg-destructive text-white hover:bg-destructive/90"
            >
              {revoking ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                <>
                  <Ban className="mr-2 size-4" />
                  Revoke pass
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
