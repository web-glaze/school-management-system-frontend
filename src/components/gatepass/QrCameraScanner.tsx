"use client";

import { Scanner } from "@yudiel/react-qr-scanner";

interface Props {
  onScan: (value: string) => void;
  onError: (message: string) => void;
}

export default function QrCameraScanner({ onScan, onError }: Props) {
  return (
    <Scanner
      formats={["qr_code"]}
      constraints={{ facingMode: "environment" }}
      onScan={(codes) => {
        const value = codes[0]?.rawValue;
        if (value) onScan(value);
      }}
      onError={(error) =>
        onError(error instanceof Error ? error.message : "Could not open the camera")
      }
    />
  );
}