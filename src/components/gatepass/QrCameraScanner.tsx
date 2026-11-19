"use client";

import { createPortal } from "react-dom";
import { Scanner } from "@yudiel/react-qr-scanner";
import { X } from "lucide-react";

interface Props {
  onScan: (value: string) => void;
  onError: (message: string) => void;
  onClose: () => void;
}

export default function QrCameraScanner({ onScan, onError, onClose }: Props) {
  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black">
      <Scanner
        formats={["qr_code"]}
        constraints={{ facingMode: "environment" }}
        components={{ finder: true, torch: false, onOff: false, zoom: false }}
        styles={{
          container: { width: "100%", height: "100%" },
          video: { width: "100%", height: "100%", objectFit: "cover" },
        }}
        onScan={(codes) => {
          const value = codes[0]?.rawValue;
          if (value) onScan(value);
        }}
        onError={(error) => onError(error instanceof Error ? error.message : "Could not open the camera")}
      />

      <button
        type="button"
        onClick={onClose}
        aria-label="Close camera"
        style={{ top: "max(1rem, env(safe-area-inset-top))" }}
        className="absolute right-4 z-10 flex size-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
      >
        <X className="size-6" />
      </button>

      <p className="pointer-events-none absolute inset-x-0 bottom-10 text-center text-sm text-white">
        Point the camera at the QR code
      </p>
    </div>,
    document.body,
  );
}