"use client";

import { useEffect, useMemo, useState, type ElementType } from "react";
import { BadgeCheck, CalendarClock, CheckCircle2, ContactRound, Inbox, Loader2, Plus, QrCode, Search, ShieldCheck, Users, XCircle } from "lucide-react";
import { toast } from "sonner";

import DashboardLayout from "@/components/layout/DashboardLayout";
import apiClient from "@/services/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Section = "visitors" | "requests" | "scan";

type Visitor = {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  idProofType?: string | null;
  idProofNumber?: string | null;
  company?: string | null;
  photoUrl?: string | null;
  createdAt?: string;
};

type VisitorRequest = {
  id: string;
  visitorId: string;
  hostType: "STUDENT" | "STAFF";
  hostId: string;
  slotId?: string | null;
  purpose?: string | null;
  timeFrom?: string;
  timeTo?: string;
  qrToken?: string | null;
  status?: string;
  createdAt?: string;
  visitor?: Visitor;
};

type VisitingSlot = {
  id: string;
  slotDate: string;
  timeFrom: string;
  timeTo: string;
  slotPurpose: "VISITING" | "OUTING";
  capacity: number;
  bookedCount: number;
  status: "OPEN" | "FULL" | "CLOSED";
};

type VisitorForm = {
  fullName: string;
  phone: string;
  email: string;
  idProofType: string;
  idProofNumber: string;
  company: string;
};

type VisitorRequestForm = {
  visitorId: string;
  hostType: "STUDENT" | "STAFF";
  hostId: string;
  slotId: string;
  purpose: string;
  timeFrom: string;
  timeTo: string;
};

type ScanForm = {
  deviceToken: string;
  qrToken: string;
  gateId: string;
  direction: "IN" | "OUT";
  badgeNo: string;
};

function unwrap<T>(response: unknown): T {
  const value = response as {
    data?: T | { data?: T };
  };

  const nested = value?.data;

  if (nested && typeof nested === "object" && "data" in nested) {
    return (nested as { data?: T }).data as T;
  }

  return nested as T;
}

function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value;

  const data = value as {
    data?: unknown;
    items?: unknown;
    results?: unknown;
  };

  if (Array.isArray(data.data)) return data.data as T[];
  if (Array.isArray(data.items)) return data.items as T[];
  if (Array.isArray(data.results)) return data.results as T[];

  return [];
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClasses(status?: string) {
  switch (status?.toUpperCase()) {
    case "APPROVED":
    case "CHECKED_IN":
    case "ACTIVE":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400";

    case "REJECTED":
    case "CANCELLED":
      return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400";

    case "PENDING":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400";

    case "CHECKED_OUT":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400";

    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export default function VisitorPage() {
  const [activeSection, setActiveSection] = useState<Section>("visitors");

  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [visitorRequests, setVisitorRequests] = useState<VisitorRequest[]>([]);
  const [slots, setSlots] = useState<VisitingSlot[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const [visitorDialogOpen, setVisitorDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState<VisitorRequest | null>(null);

  const [visitorForm, setVisitorForm] = useState<VisitorForm>({
    fullName: "",
    phone: "",
    email: "",
    idProofType: "",
    idProofNumber: "",
    company: "",
  });

  const [requestForm, setRequestForm] = useState<VisitorRequestForm>({
    visitorId: "",
    hostType: "STUDENT",
    hostId: "",
    slotId: "",
    purpose: "",
    timeFrom: "",
    timeTo: "",
  });

  const [scanForm, setScanForm] = useState<ScanForm>({
    deviceToken: "",
    qrToken: "",
    gateId: "",
    direction: "IN",
    badgeNo: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);

      const [visitorsResponse, requestsResponse, slotsResponse] = await Promise.all([apiClient.get("/visitors"), apiClient.get("/visitors/requests"), apiClient.get("/gate-config/slots")]);

      setVisitors(normalizeArray<Visitor>(unwrap(visitorsResponse)));

      setVisitorRequests(normalizeArray<VisitorRequest>(unwrap(requestsResponse)));

      setSlots(normalizeArray<VisitingSlot>(unwrap(slotsResponse)));
    } catch (error) {
      console.error("Failed to load visitor data:", error);
      toast.error("Failed to load visitor data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredVisitors = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return visitors;

    return visitors.filter((visitor) =>
      [visitor.fullName, visitor.phone, visitor.email, visitor.company, visitor.idProofType, visitor.idProofNumber].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))
    );
  }, [visitors, search]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return visitorRequests;

    return visitorRequests.filter((request) =>
      [request.id, request.visitor?.fullName, request.visitor?.phone, request.hostId, request.hostType, request.purpose, request.status].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))
    );
  }, [visitorRequests, search]);

  const pendingRequests = visitorRequests.filter((request) => request.status?.toUpperCase() === "PENDING").length;

  const approvedRequests = visitorRequests.filter((request) => request.status?.toUpperCase() === "APPROVED").length;

  const activeSlots = slots.filter((slot) => slot.status === "OPEN").length;

  const resetVisitorForm = () => {
    setVisitorForm({
      fullName: "",
      phone: "",
      email: "",
      idProofType: "",
      idProofNumber: "",
      company: "",
    });
  };

  const resetRequestForm = () => {
    setRequestForm({
      visitorId: "",
      hostType: "STUDENT",
      hostId: "",
      slotId: "",
      purpose: "",
      timeFrom: "",
      timeTo: "",
    });
  };

  const resetScanForm = () => {
    setScanForm({
      deviceToken: "",
      qrToken: "",
      gateId: "",
      direction: "IN",
      badgeNo: "",
    });
  };

  const handleCreateVisitor = async () => {
    if (!visitorForm.fullName.trim()) {
      toast.error("Visitor name is required.");
      return;
    }

    if (!visitorForm.phone.trim()) {
      toast.error("Phone number is required.");
      return;
    }

    try {
      setSubmitting(true);

      await apiClient.post("/visitors", {
        fullName: visitorForm.fullName.trim(),
        phone: visitorForm.phone.trim(),
        email: visitorForm.email.trim() || undefined,
        idProofType: visitorForm.idProofType.trim() || undefined,
        idProofNumber: visitorForm.idProofNumber.trim() || undefined,
        company: visitorForm.company.trim() || undefined,
      });

      toast.success("Visitor created successfully.");

      setVisitorDialogOpen(false);
      resetVisitorForm();

      await loadData();
    } catch (error) {
      console.error("Failed to create visitor:", error);
      toast.error("Failed to create visitor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!requestForm.visitorId) {
      toast.error("Please select a visitor.");
      return;
    }

    if (!requestForm.hostId.trim()) {
      toast.error("Host ID is required.");
      return;
    }

    if (!requestForm.timeFrom || !requestForm.timeTo) {
      toast.error("Visit time is required.");
      return;
    }

    try {
      setSubmitting(true);

      await apiClient.post("/visitors/requests", {
        visitorId: requestForm.visitorId,
        hostType: requestForm.hostType,
        hostId: requestForm.hostId,
        slotId: requestForm.slotId || undefined,
        purpose: requestForm.purpose.trim() || undefined,
        timeFrom: requestForm.timeFrom,
        timeTo: requestForm.timeTo,
      });

      toast.success("Visitor request created.");

      setRequestDialogOpen(false);
      resetRequestForm();

      await loadData();
    } catch (error) {
      console.error("Failed to create visitor request:", error);
      toast.error("Failed to create visitor request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestDecision = async (action: "approve" | "reject") => {
    if (!selectedRequest) return;

    try {
      setSubmitting(true);

      if (action === "approve") {
        await apiClient.post(`/visitors/requests/${selectedRequest.id}/approve`);

        toast.success("Visitor request approved.");
      } else {
        await apiClient.post(`/visitors/requests/${selectedRequest.id}/reject`);

        toast.success("Visitor request rejected.");
      }

      setReviewDialogOpen(false);
      setSelectedRequest(null);

      await loadData();
    } catch (error) {
      console.error("Failed to update visitor request:", error);
      toast.error("Failed to update visitor request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleScan = async () => {
    if (!scanForm.deviceToken.trim()) {
      toast.error("Device token is required.");
      return;
    }

    if (!scanForm.qrToken.trim()) {
      toast.error("QR token is required.");
      return;
    }

    if (!scanForm.gateId.trim()) {
      toast.error("Gate ID is required.");
      return;
    }

    try {
      setSubmitting(true);

      await apiClient.post("/visitors/scan", {
        deviceToken: scanForm.deviceToken.trim(),
        qrToken: scanForm.qrToken.trim(),
        gateId: scanForm.gateId.trim(),
        direction: scanForm.direction,
        badgeNo: scanForm.badgeNo.trim() || undefined,
      });

      toast.success(scanForm.direction === "IN" ? "Visitor check-in recorded." : "Visitor check-out recorded.");

      setScanDialogOpen(false);
      resetScanForm();
    } catch (error) {
      console.error("Visitor scan failed:", error);
      toast.error("Visitor scan failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const sections: {
    key: Section;
    title: string;
    description: string;
    icon: ElementType;
  }[] = [
    {
      key: "visitors",
      title: "Visitors",
      description: "Manage registered visitors.",
      icon: Users,
    },
    {
      key: "requests",
      title: "Visitor Requests",
      description: "Manage visitor visit requests.",
      icon: CalendarClock,
    },
    {
      key: "scan",
      title: "Check-in / Check-out",
      description: "Record visitor gate movement.",
      icon: QrCode,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 w-full">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Visitors</h1>

            <p className="text-muted-foreground mt-1.5 text-sm">Manage visitors, visit requests and gate movement.</p>
          </div>

          {activeSection === "visitors" && (
            <Button onClick={() => setVisitorDialogOpen(true)} className="gap-2">
              <Plus className="size-4" />
              Add Visitor
            </Button>
          )}

          {activeSection === "requests" && (
            <Button onClick={() => setRequestDialogOpen(true)} className="gap-2">
              <Plus className="size-4" />
              New Visit Request
            </Button>
          )}

          {activeSection === "scan" && (
            <Button onClick={() => setScanDialogOpen(true)} className="gap-2">
              <QrCode className="size-4" />
              Scan Visitor
            </Button>
          )}
        </div>

        {/* Section selector */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;
            const active = activeSection === section.key;

            return (
              <button
                key={section.key}
                type="button"
                onClick={() => {
                  setActiveSection(section.key);
                  setSearch("");
                }}
                className={`rounded-2xl border p-4 text-left transition-all ${active ? "border-primary/30 bg-primary/4 shadow-sm" : "border-border bg-card hover:border-primary/20 hover:bg-muted/30"}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="size-5" />
                  </div>

                  <div>
                    <p className="text-sm font-bold">{section.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardDescription>Total Visitors</CardDescription>
              <CardTitle className="text-2xl">{visitors.length}</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="size-4" />
                Registered visitors
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardDescription>Pending Requests</CardDescription>
              <CardTitle className="text-2xl">{pendingRequests}</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <CalendarClock className="size-4" />
                Awaiting approval
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardDescription>Approved Visits</CardDescription>
              <CardTitle className="text-2xl">{approvedRequests}</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                Approved requests
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardDescription>Open Slots</CardDescription>
              <CardTitle className="text-2xl">{activeSlots}</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                <BadgeCheck className="size-4" />
                Available visiting slots
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>{activeSection === "visitors" ? "Registered Visitors" : activeSection === "requests" ? "Visitor Requests" : "Visitor Gate Scan"}</CardTitle>

                <CardDescription className="mt-1">
                  {activeSection === "visitors"
                    ? "Search and manage visitors registered with the school."
                    : activeSection === "requests"
                      ? "Review scheduled visitor requests and approvals."
                      : "Use the visitor QR token to record gate entry or exit."}
                </CardDescription>
              </div>

              {activeSection !== "scan" && (
                <div className="relative w-full lg:w-70">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={activeSection === "visitors" ? "Search visitors..." : "Search requests..."} className="pl-9" />
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {/* Visitors */}
            {activeSection === "visitors" && (
              <>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <div key={item} className="h-14 rounded-lg bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : filteredVisitors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                      <Users className="size-6 text-muted-foreground" />
                    </div>

                    <h3 className="text-base font-bold">No Visitors Found</h3>

                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">{search ? "No visitors match your search." : "No visitors have been registered yet."}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Visitor</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Contact</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">ID Proof</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Company</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Registered</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {filteredVisitors.map((visitor) => (
                          <TableRow key={visitor.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <ContactRound className="size-4" />
                                </div>

                                <div>
                                  <p className="font-semibold">{visitor.fullName}</p>

                                  <p className="text-xs text-muted-foreground">#{visitor.id.slice(0, 8)}</p>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div>
                                <p className="font-medium">{visitor.phone}</p>

                                <p className="text-xs text-muted-foreground">{visitor.email || "No email"}</p>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div>
                                <p className="font-medium">{visitor.idProofType || "—"}</p>

                                <p className="text-xs text-muted-foreground">{visitor.idProofNumber || "—"}</p>
                              </div>
                            </TableCell>

                            <TableCell>{visitor.company || "—"}</TableCell>

                            <TableCell className="text-sm text-muted-foreground">{formatDate(visitor.createdAt)}</TableCell>

                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1.5"
                                onClick={() => {
                                  setRequestForm((prev) => ({
                                    ...prev,
                                    visitorId: visitor.id,
                                  }));
                                  setRequestDialogOpen(true);
                                }}
                              >
                                <Plus className="size-4" />
                                Request Visit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}

            {/* Requests */}
            {activeSection === "requests" && (
              <>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="h-14 rounded-lg bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                      <Inbox className="size-6 text-muted-foreground" />
                    </div>

                    <h3 className="text-base font-bold">No Visitor Requests</h3>

                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">{search ? "No requests match your search." : "No visitor requests have been created yet."}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Visitor</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Host</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Visit Time</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Purpose</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {filteredRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <div>
                                <p className="font-semibold">{request.visitor?.fullName || request.visitorId}</p>

                                <p className="text-xs text-muted-foreground">{request.visitor?.phone || "—"}</p>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div>
                                <p className="font-medium">{request.hostId}</p>

                                <p className="text-xs text-muted-foreground">{request.hostType}</p>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="min-w-45">
                                <p className="text-sm">{formatDateTime(request.timeFrom)}</p>

                                <p className="text-xs text-muted-foreground">to {formatDateTime(request.timeTo)}</p>
                              </div>
                            </TableCell>

                            <TableCell className="max-w-55">
                              <p className="truncate">{request.purpose || "—"}</p>
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline" className={statusClasses(request.status)}>
                                {request.status || "PENDING"}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right">
                              {request.status?.toUpperCase() === "PENDING" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1.5"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setReviewDialogOpen(true);
                                  }}
                                >
                                  <ShieldCheck className="size-4" />
                                  Review
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}

            {/* Scan */}
            {activeSection === "scan" && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border bg-muted/20 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <QrCode className="size-6" />
                    </div>

                    <div>
                      <h3 className="font-bold">Visitor Gate Scan</h3>

                      <p className="mt-1 text-sm text-muted-foreground">Scan an approved visitor QR token to record their campus entry or exit.</p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border bg-background p-4">
                      <p className="text-xs font-semibold text-muted-foreground">Visitor Requests</p>
                      <p className="mt-1 text-2xl font-bold">{visitorRequests.length}</p>
                    </div>

                    <div className="rounded-xl border bg-background p-4">
                      <p className="text-xs font-semibold text-muted-foreground">Approved</p>
                      <p className="mt-1 text-2xl font-bold">{approvedRequests}</p>
                    </div>
                  </div>

                  <Button onClick={() => setScanDialogOpen(true)} className="mt-6 w-full gap-2 sm:w-auto">
                    <QrCode className="size-4" />
                    Start Visitor Scan
                  </Button>
                </div>

                <div className="rounded-2xl border p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                      <ShieldCheck className="size-5 text-muted-foreground" />
                    </div>

                    <div>
                      <p className="font-bold text-sm">Gate Verification</p>

                      <p className="text-xs text-muted-foreground">Approved visitors can be verified at the gate.</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      QR token verification
                    </div>

                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      Gate and device validation
                    </div>

                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      Check-in / check-out tracking
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Visitor */}
      <Dialog open={visitorDialogOpen} onOpenChange={setVisitorDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Visitor</DialogTitle>
            <DialogDescription>Register a visitor before creating their visit request.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={visitorForm.fullName}
                  onChange={(event) =>
                    setVisitorForm((prev) => ({
                      ...prev,
                      fullName: event.target.value,
                    }))
                  }
                  placeholder="Enter visitor name"
                />
              </div>

              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  value={visitorForm.phone}
                  onChange={(event) =>
                    setVisitorForm((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={visitorForm.email}
                onChange={(event) =>
                  setVisitorForm((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                placeholder="Enter email address"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>ID Proof Type</Label>
                <Input
                  value={visitorForm.idProofType}
                  onChange={(event) =>
                    setVisitorForm((prev) => ({
                      ...prev,
                      idProofType: event.target.value,
                    }))
                  }
                  placeholder="Aadhaar, Passport, etc."
                />
              </div>

              <div className="space-y-2">
                <Label>ID Proof Number</Label>
                <Input
                  value={visitorForm.idProofNumber}
                  onChange={(event) =>
                    setVisitorForm((prev) => ({
                      ...prev,
                      idProofNumber: event.target.value,
                    }))
                  }
                  placeholder="Enter ID number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Company / Organization</Label>
              <Input
                value={visitorForm.company}
                onChange={(event) =>
                  setVisitorForm((prev) => ({
                    ...prev,
                    company: event.target.value,
                  }))
                }
                placeholder="Enter company name"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVisitorDialogOpen(false)}>
              Cancel
            </Button>

            <Button onClick={handleCreateVisitor} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Add Visitor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visitor Request */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Visitor Request</DialogTitle>
            <DialogDescription>Schedule a visitor and select the host and visit timing.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="space-y-2">
              <Label>Visitor *</Label>

              <Select
                value={requestForm.visitorId}
                onValueChange={(value) =>
                  setRequestForm((prev) => ({
                    ...prev,
                    visitorId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visitor" />
                </SelectTrigger>

                <SelectContent>
                  {visitors.map((visitor) => (
                    <SelectItem key={visitor.id} value={visitor.id}>
                      {visitor.fullName} · {visitor.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Host Type *</Label>

                <Select
                  value={requestForm.hostType}
                  onValueChange={(value) =>
                    setRequestForm((prev) => ({
                      ...prev,
                      hostType: value as "STUDENT" | "STAFF",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Host ID *</Label>

                <Input
                  value={requestForm.hostId}
                  onChange={(event) =>
                    setRequestForm((prev) => ({
                      ...prev,
                      hostId: event.target.value,
                    }))
                  }
                  placeholder="Enter host ID"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Visiting Slot</Label>

              <Select
                value={requestForm.slotId}
                onValueChange={(value) => {
                  const slot = slots.find((item) => item.id === value);

                  setRequestForm((prev) => ({
                    ...prev,
                    slotId: value,
                    timeFrom: slot ? `${slot.slotDate.slice(0, 10)}T${slot.timeFrom}` : prev.timeFrom,
                    timeTo: slot ? `${slot.slotDate.slice(0, 10)}T${slot.timeTo}` : prev.timeTo,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select slot or use free-form time" />
                </SelectTrigger>

                <SelectContent>
                  {slots
                    .filter((slot) => slot.status === "OPEN" && slot.slotPurpose === "VISITING")
                    .map((slot) => (
                      <SelectItem key={slot.id} value={slot.id}>
                        {formatDate(slot.slotDate)} · {slot.timeFrom} - {slot.timeTo} · {slot.bookedCount}/{slot.capacity}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Time From *</Label>
                <Input
                  type="datetime-local"
                  value={requestForm.timeFrom}
                  onChange={(event) =>
                    setRequestForm((prev) => ({
                      ...prev,
                      timeFrom: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Time To *</Label>
                <Input
                  type="datetime-local"
                  value={requestForm.timeTo}
                  onChange={(event) =>
                    setRequestForm((prev) => ({
                      ...prev,
                      timeTo: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Purpose</Label>

              <Textarea
                value={requestForm.purpose}
                onChange={(event) =>
                  setRequestForm((prev) => ({
                    ...prev,
                    purpose: event.target.value,
                  }))
                }
                placeholder="Enter purpose of visit"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
              Cancel
            </Button>

            <Button onClick={handleCreateRequest} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Create Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Request */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Visitor Request</DialogTitle>
            <DialogDescription>Approve or reject this visitor request.</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-5">
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Visitor</p>

                    <p className="mt-1 font-semibold">{selectedRequest.visitor?.fullName || selectedRequest.visitorId}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>

                    <p className="mt-1 font-semibold">{selectedRequest.visitor?.phone || "—"}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Host</p>

                    <p className="mt-1 font-semibold">{selectedRequest.hostId}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Host Type</p>

                    <p className="mt-1 font-semibold">{selectedRequest.hostType}</p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Visit Time</p>

                    <p className="mt-1 font-semibold">
                      {formatDateTime(selectedRequest.timeFrom)} — {formatDateTime(selectedRequest.timeTo)}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Purpose</p>

                    <p className="mt-1 text-sm">{selectedRequest.purpose || "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => handleRequestDecision("reject")} disabled={submitting} className="gap-2">
              <XCircle className="size-4" />
              Reject
            </Button>

            <Button onClick={() => handleRequestDecision("approve")} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              <CheckCircle2 className="size-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scan */}
      <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Visitor Gate Scan</DialogTitle>
            <DialogDescription>Record visitor entry or exit using the visitor QR token.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <QrCode className="size-5" />
                </div>

                <div>
                  <p className="font-semibold text-sm">QR Verification</p>

                  <p className="text-xs text-muted-foreground">Enter the device, gate and visitor QR information.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Device Token *</Label>

              <Input
                value={scanForm.deviceToken}
                onChange={(event) =>
                  setScanForm((prev) => ({
                    ...prev,
                    deviceToken: event.target.value,
                  }))
                }
                placeholder="Enter scanner device token"
              />
            </div>

            <div className="space-y-2">
              <Label>Visitor QR Token *</Label>

              <Input
                value={scanForm.qrToken}
                onChange={(event) =>
                  setScanForm((prev) => ({
                    ...prev,
                    qrToken: event.target.value,
                  }))
                }
                placeholder="Scan or enter visitor QR token"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Gate ID *</Label>

                <Input
                  value={scanForm.gateId}
                  onChange={(event) =>
                    setScanForm((prev) => ({
                      ...prev,
                      gateId: event.target.value,
                    }))
                  }
                  placeholder="Enter gate ID"
                />
              </div>

              <div className="space-y-2">
                <Label>Direction *</Label>

                <Select
                  value={scanForm.direction}
                  onValueChange={(value) =>
                    setScanForm((prev) => ({
                      ...prev,
                      direction: value as "IN" | "OUT",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="IN">Check In</SelectItem>

                    <SelectItem value="OUT">Check Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Badge Number</Label>

              <Input
                value={scanForm.badgeNo}
                onChange={(event) =>
                  setScanForm((prev) => ({
                    ...prev,
                    badgeNo: event.target.value,
                  }))
                }
                placeholder="Optional visitor badge number"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScanDialogOpen(false)}>
              Cancel
            </Button>

            <Button onClick={handleScan} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              <QrCode className="size-4" />
              Record Scan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
