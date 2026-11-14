"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { gatepassService, type QrResponse } from "@/services/gatepass.service";
import { apiError, formatDateTime } from "./shared";

interface Props {
  requestId: string | null;
  onClose: () => void;
}

export default function QrDialog({ requestId, onClose }: Props) {
  const [qr, setQr] = useState<QrResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!requestId) {
      setQr(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    gatepassService.movement
      .getQr(requestId)
      .then((data) => {
        if (!cancelled) setQr(data);
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error(apiError(error, "Could not load the QR code"));
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
      <DialogContent className="w-[95vw] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Gate pass</DialogTitle>
          <DialogDescription>Show this QR code to the guard at the gate.</DialogDescription>
        </DialogHeader>

        {loading || !qr ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-xl border bg-white p-4">
              <QRCodeSVG value={qr.qrToken} size={240} level="M" />
            </div>

            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={() =>
                navigator.clipboard
                  .writeText(qr.qrToken)
                  .then(() => toast.success("Code copied"))
                  .catch(() => toast.error("Could not copy"))
              }
            >
              Copy code text
            </button>

            <div className="text-center text-sm">
              <p className="font-medium">{qr.requestNo}</p>
              <p className="text-muted-foreground">
                Valid {formatDateTime(qr.validFrom)} to {formatDateTime(qr.validTo)}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
