"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Camera, CheckCircle2, Loader2, ScanLine, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  gatepassService,
  mediaUrl,
  type Gate,
  type GateLookupResult,
  type GateRequestSummary,
  type GateScanResult,
} from "@/services/gatepass.service";
import { StudentSummary, TYPE_LABEL, apiError, formatDateTime } from "./shared";

const QrCameraScanner = dynamic(() => import("./QrCameraScanner"), { ssr: false });

const GATE_KEY = "gatepass.gateId";

type Stage = "idle" | "checking" | "review" | "recording" | "done";

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

function RequestBlock({ request }: { request: GateRequestSummary }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold">{request.requestNo}</p>
        <Badge variant="secondary">{TYPE_LABEL[request.type]}</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Info label="Leaves" value={formatDateTime(request.requestedFrom)} />
        <Info label="Returns by" value={formatDateTime(request.requestedTo)} />
        <Info label="Reason / event" value={request.purpose} />
        <Info label="Destination" value={request.destination} />
        {request.accompanyingPerson && <Info label="Maitre / home mother" value={request.accompanyingPerson} />}
        {request.actualExitAt && <Info label="Left at" value={formatDateTime(request.actualExitAt)} />}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Students ({request.students.length})</p>

        <div className="grid gap-2 sm:grid-cols-2">
          {request.students.map((student) => (
            <div key={student.id} className="rounded-lg border p-3">
              <StudentSummary student={student} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GateScanTab() {
  const [gates, setGates] = useState<Gate[]>([]);
  const [gatesLoading, setGatesLoading] = useState(true);
  const [gateId, setGateId] = useState("");

  const [stage, setStage] = useState<Stage>("idle");
  const [typed, setTyped] = useState("");
  const [token, setToken] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [lookup, setLookup] = useState<GateLookupResult | null>(null);
  const [result, setResult] = useState<GateScanResult | null>(null);
  const [pickupPersonId, setPickupPersonId] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  // Stops a camera that reports the same code several times from checking it twice.
  const busyRef = useRef(false);

  useEffect(() => {
    gatepassService.gate
      .gates()
      .then((list) => {
        setGates(list);

        const saved = localStorage.getItem(GATE_KEY);
        const pick = list.find((gate) => gate.id === saved)?.id ?? (list.length === 1 ? list[0].id : "");

        setGateId(pick);
      })
      .catch((error) => toast.error(apiError(error, "Could not load the gates")))
      .finally(() => setGatesLoading(false));
  }, []);

  // Keep the cursor in the box, so a USB scanner can type straight into it.
  useEffect(() => {
    if (stage === "idle" && !cameraOn && gateId) inputRef.current?.focus();
  }, [stage, cameraOn, gateId]);

  const chooseGate = (id: string) => {
    setGateId(id);
    localStorage.setItem(GATE_KEY, id);
  };

  const reset = () => {
    busyRef.current = false;
    setStage("idle");
    setTyped("");
    setToken("");
    setLookup(null);
    setResult(null);
    setPickupPersonId("");
    setCameraOn(false);
  };

  const check = useCallback(
    async (raw: string) => {
      const value = raw.trim();

      if (!value || busyRef.current) return;

      if (!gateId) {
        toast.error("Choose the gate first");
        return;
      }

      busyRef.current = true;
      setCameraOn(false);
      setToken(value);
      setStage("checking");

      try {
        const found = await gatepassService.gate.lookup(value);

        setLookup(found);
        setPickupPersonId("");
        setStage("review");
      } catch (error) {
        toast.error(apiError(error, "Could not check the pass"));
        busyRef.current = false;
        setStage("idle");
      }
    },
    [gateId],
  );

  const request = lookup?.request ?? null;
  const needsPerson = lookup?.valid === true && lookup.action === "EXIT" && request?.type === "OUTPASS";

  const record = async () => {
    if (!lookup?.valid || !request) return;

    if (needsPerson && !pickupPersonId) {
      toast.error("Select the pickup person whose ID you checked");
      return;
    }

    setStage("recording");

    try {
      const response = await gatepassService.gate.scan({
        qrToken: token,
        gateId,
        pickupPersonId: needsPerson ? pickupPersonId : undefined,
      });

      setResult(response);
      setStage("done");
    } catch (error) {
      toast.error(apiError(error, "Could not record the movement"));
      setStage("review");
    }
  };

  if (gatesLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (gates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
        There are no active gates. Ask the school office to add one under Setup, then Gates.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <p className="text-sm font-medium sm:min-w-24">You are at</p>

        <Select value={gateId} onValueChange={chooseGate} disabled={stage !== "idle"}>
          <SelectTrigger className="sm:w-64">
            <SelectValue placeholder="Choose the gate" />
          </SelectTrigger>
          <SelectContent>
            {gates.map((gate) => (
              <SelectItem key={gate.id} value={gate.id}>
                {gate.name}
                {gate.location ? ` (${gate.location})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scan */}
      {(stage === "idle" || stage === "checking") && (
        <div className="space-y-4 rounded-lg border p-5">
          <div className="flex items-center gap-2">
            <ScanLine className="size-5" />
            <h2 className="font-semibold">Scan the pass</h2>
          </div>

          <p className="text-sm text-muted-foreground">
            Scan the QR with a scanner, use the camera, or type the code.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              ref={inputRef}
              value={typed}
              disabled={stage === "checking" || !gateId}
              placeholder={gateId ? "Scan or paste the code here" : "Choose the gate first"}
              autoComplete="off"
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void check(typed);
                }
              }}
            />

            <Button onClick={() => check(typed)} disabled={stage === "checking" || !gateId || !typed.trim()}>
              {stage === "checking" ? <Loader2 className="size-4 animate-spin" /> : "Check pass"}
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              disabled={stage === "checking" || !gateId}
              onClick={() => setCameraOn((on) => !on)}
            >
              <Camera className="size-4" />
              {cameraOn ? "Close camera" : "Use camera"}
            </Button>
          </div>

          {cameraOn && (
            <div className="mx-auto max-w-sm overflow-hidden rounded-lg border">
              <QrCameraScanner
                onScan={(value) => void check(value)}
                onError={(message) => {
                  toast.error(message);
                  setCameraOn(false);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Review */}
      {(stage === "review" || stage === "recording") && lookup && (
        <div className="space-y-5 rounded-lg border p-5">
          {lookup.valid ? (
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg p-4",
                lookup.action === "EXIT" ? "bg-violet-50 text-violet-800" : "bg-emerald-50 text-emerald-800",
              )}
            >
              <CheckCircle2 className="size-6 shrink-0" />
              <div>
                <p className="text-lg font-semibold">
                  {lookup.action === "EXIT" ? "Student is leaving" : "Student is returning"}
                </p>
                <p className="text-sm">{lookup.message}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-800">
              <XCircle className="size-6 shrink-0" />
              <div>
                <p className="text-lg font-semibold">Do not allow</p>
                <p className="text-sm">{lookup.message}</p>
              </div>
            </div>
          )}

          {request && <RequestBlock request={request} />}

          {needsPerson && request && (
            <section className="space-y-3">
              <div>
                <p className="text-sm font-semibold">Who is picking up the student?</p>
                <p className="text-sm text-muted-foreground">
                  Check the person&apos;s ID against the photo below, then select them.
                </p>
              </div>

              {request.pickupPersons.map((person) => (
                <label
                  key={person.id}
                  className={cn(
                    "flex cursor-pointer flex-wrap items-center gap-4 rounded-lg border p-3",
                    pickupPersonId === person.id && "border-primary bg-primary/5",
                  )}
                >
                  <input
                    type="radio"
                    name="pickup-person"
                    className="size-4 accent-primary"
                    checked={pickupPersonId === person.id}
                    onChange={() => setPickupPersonId(person.id)}
                  />

                  <a
                    href={mediaUrl(person.idProofUrl)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={mediaUrl(person.idProofUrl)}
                      alt={`${person.name} ID proof`}
                      className="h-20 w-32 rounded-md border object-cover"
                    />
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
                </label>
              ))}
            </section>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={reset} disabled={stage === "recording"}>
              {lookup.valid ? "Cancel" : "Scan next"}
            </Button>

            {lookup.valid && (
              <Button onClick={record} disabled={stage === "recording"} className="gap-2">
                {stage === "recording" && <Loader2 className="size-4 animate-spin" />}
                {lookup.action === "EXIT" ? "Record exit" : "Record return"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Done */}
      {stage === "done" && result && (
        <div className="space-y-5 rounded-lg border p-5">
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg p-4",
              result.allowed ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800",
            )}
          >
            {result.allowed ? <CheckCircle2 className="size-7 shrink-0" /> : <XCircle className="size-7 shrink-0" />}

            <div>
              <p className="text-xl font-semibold">{result.message}</p>
              {result.requestNo && <p className="text-sm">{result.requestNo}</p>}
              {result.late && <p className="text-sm font-medium">The student returned after the approved time.</p>}
            </div>
          </div>

          {result.allowed && result.students && (
            <div className="grid gap-2 sm:grid-cols-2">
              {result.students.map((student) => (
                <div key={student.id} className="rounded-lg border p-3">
                  <StudentSummary student={student} compact />
                </div>
              ))}
            </div>
          )}

          {!result.allowed && result.request && <RequestBlock request={result.request} />}

          <div className="flex justify-end">
            <Button onClick={reset}>Scan next</Button>
          </div>
        </div>
      )}
    </div>
  );
}