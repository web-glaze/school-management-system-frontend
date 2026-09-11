"use client";

import { useEffect, useMemo, useState, type ElementType } from "react";
import { toast } from "sonner";
import { ArrowLeftRight, BadgeCheck, CheckCircle2, Clock3, FileText, Inbox, Loader2, Plus, Search, ShieldCheck, XCircle } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import apiClient from "@/services/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Section = "requests" | "approvals" | "passes";

type MovementRequest = {
  id: string;
  requestTypeId?: string;
  requestType?: {
    id: string;
    code?: string;
    name?: string;
  };
  subjectType?: "STUDENT" | "STAFF";
  subjectId?: string;
  slotId?: string | null;
  requestedFrom?: string;
  requestedTo?: string;
  purpose?: string | null;
  destination?: string | null;
  status?: string;
  createdAt?: string;
  requester?: {
    id?: string;
    name?: string;
  };
};

type ApprovalRecord = MovementRequest & {
  approvalStatus?: string;
};

type RequestType = {
  id: string;
  code: string;
  name: string;
  appliesTo: "STUDENT" | "STAFF";
  slotModel: "FIXED" | "FREE_FORM" | "EITHER";
  isActive: boolean;
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

type CreateForm = {
  requestTypeId: string;
  subjectType: "STUDENT" | "STAFF";
  subjectId: string;
  slotId: string;
  requestedFrom: string;
  requestedTo: string;
  purpose: string;
  destination: string;
};

type ApprovalForm = {
  action: "APPROVED" | "REJECTED";
  remarks: string;
};

type PassForm = {
  holderType: "STUDENT" | "STAFF";
  holderId: string;
  validFrom: string;
  validTo: string;
};

function unwrap<T>(response: unknown): T {
  const value = response as {
    data?:
      | {
          data?: T;
        }
      | T;
  };

  if (value && typeof value.data === "object" && value.data !== null && "data" in value.data) {
    return (value.data as { data?: T }).data as T;
  }

  return value.data as T;
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
    case "ACTIVE":
    case "COMPLETED":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400";

    case "REJECTED":
    case "REVOKED":
    case "CANCELLED":
      return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400";

    case "PENDING":
    case "PENDING_APPROVAL":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400";

    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export default function MovementPage() {
  const [activeSection, setActiveSection] = useState<Section>("requests");

  const [requests, setRequests] = useState<MovementRequest[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [slots, setSlots] = useState<VisitingSlot[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");

  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [passDialogOpen, setPassDialogOpen] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState<MovementRequest | null>(null);

  const [createForm, setCreateForm] = useState<CreateForm>({
    requestTypeId: "",
    subjectType: "STUDENT",
    subjectId: "",
    slotId: "",
    requestedFrom: "",
    requestedTo: "",
    purpose: "",
    destination: "",
  });

  const [approvalForm, setApprovalForm] = useState<ApprovalForm>({
    action: "APPROVED",
    remarks: "",
  });

  const [passForm, setPassForm] = useState<PassForm>({
    holderType: "STUDENT",
    holderId: "",
    validFrom: "",
    validTo: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);

      const [requestsResponse, approvalsResponse, requestTypesResponse, slotsResponse] = await Promise.all([
        apiClient.get("/movement-requests"),
        apiClient.get("/movement-requests/pending-approvals"),
        apiClient.get("/gate-config/request-types"),
        apiClient.get("/gate-config/slots"),
      ]);

      setRequests(normalizeArray<MovementRequest>(unwrap(requestsResponse)));
      setApprovals(normalizeArray<ApprovalRecord>(unwrap(approvalsResponse)));
      setRequestTypes(normalizeArray<RequestType>(unwrap(requestTypesResponse)));
      setSlots(normalizeArray<VisitingSlot>(unwrap(slotsResponse)));
    } catch (error) {
      console.error("Failed to load movement data:", error);
      toast.error("Failed to load movement data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeRequestType = useMemo(() => requestTypes.find((item) => item.id === createForm.requestTypeId), [requestTypes, createForm.requestTypeId]);

  const availableSlots = useMemo(() => {
    if (!activeRequestType) return [];

    if (activeRequestType.slotModel === "FREE_FORM") return [];

    return slots.filter((slot) => slot.status === "OPEN" && new Date(slot.slotDate) >= new Date());
  }, [activeRequestType, slots]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return requests;

    return requests.filter((request) =>
      [request.id, request.subjectId, request.subjectType, request.status, request.purpose, request.destination, request.requestType?.name, request.requestType?.code]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [requests, search]);

  const filteredApprovals = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return approvals;

    return approvals.filter((request) =>
      [request.id, request.subjectId, request.subjectType, request.status, request.purpose, request.destination, request.requestType?.name].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))
    );
  }, [approvals, search]);

  const resetCreateForm = () => {
    setCreateForm({
      requestTypeId: "",
      subjectType: "STUDENT",
      subjectId: "",
      slotId: "",
      requestedFrom: "",
      requestedTo: "",
      purpose: "",
      destination: "",
    });
  };

  const handleCreateRequest = async () => {
    if (!createForm.requestTypeId || !createForm.subjectId || !createForm.requestedFrom || !createForm.requestedTo) {
      toast.error("Please fill all required fields.");
      return;
    }

    if (activeRequestType?.slotModel !== "FREE_FORM" && !createForm.slotId) {
      toast.error("Please select a visiting slot.");
      return;
    }

    try {
      setSubmitting(true);

      await apiClient.post("/movement-requests", {
        requestTypeId: createForm.requestTypeId,
        subjectType: createForm.subjectType,
        subjectId: createForm.subjectId,
        slotId: activeRequestType?.slotModel === "FREE_FORM" ? undefined : createForm.slotId || undefined,
        requestedFrom: createForm.requestedFrom,
        requestedTo: createForm.requestedTo,
        purpose: createForm.purpose || undefined,
        destination: createForm.destination || undefined,
      });

      toast.success("Movement request created.");
      setRequestDialogOpen(false);
      resetCreateForm();
      await loadData();
    } catch (error) {
      console.error("Failed to create movement request:", error);
      toast.error("Failed to create movement request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecision = async () => {
    if (!selectedRequest) return;

    try {
      setSubmitting(true);

      await apiClient.post(`/movement-requests/${selectedRequest.id}/decision`, {
        action: approvalForm.action,
        remarks: approvalForm.remarks || undefined,
      });

      toast.success(approvalForm.action === "APPROVED" ? "Request approved." : "Request rejected.");

      setApprovalDialogOpen(false);
      setSelectedRequest(null);

      setApprovalForm({
        action: "APPROVED",
        remarks: "",
      });

      await loadData();
    } catch (error) {
      console.error("Failed to update request:", error);
      toast.error("Failed to update request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (request: MovementRequest) => {
    try {
      setSubmitting(true);

      await apiClient.post(`/movement-requests/${request.id}/cancel`);

      toast.success("Movement request cancelled.");
      await loadData();
    } catch (error) {
      console.error("Failed to cancel request:", error);
      toast.error("Failed to cancel request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssuePass = async () => {
    if (!passForm.holderId || !passForm.validFrom || !passForm.validTo) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      await apiClient.post("/gate-passes/permanent", {
        holderType: passForm.holderType,
        holderId: passForm.holderId,
        validFrom: passForm.validFrom,
        validTo: passForm.validTo,
      });

      toast.success("Permanent gate pass issued.");
      setPassDialogOpen(false);

      setPassForm({
        holderType: "STUDENT",
        holderId: "",
        validFrom: "",
        validTo: "",
      });
    } catch (error) {
      console.error("Failed to issue permanent pass:", error);
      toast.error("Failed to issue permanent gate pass.");
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
      key: "requests",
      title: "Movement Requests",
      description: "Create and manage movement requests.",
      icon: ArrowLeftRight,
    },
    {
      key: "approvals",
      title: "Pending Approvals",
      description: "Review requests awaiting approval.",
      icon: ShieldCheck,
    },
    {
      key: "passes",
      title: "Gate Passes",
      description: "Issue and manage permanent gate passes.",
      icon: BadgeCheck,
    },
  ];

  const totalRequests = requests.length;
  const pendingCount = approvals.length;
  const approvedCount = requests.filter((item) => item.status === "APPROVED").length;

  return (
    <DashboardLayout>
      <div className="space-y-8 w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Movement</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">Manage movement requests, approvals and gate passes.</p>
          </div>

          {activeSection === "requests" && (
            <Button onClick={() => setRequestDialogOpen(true)} className="gap-2">
              <Plus className="size-4" />
              New Request
            </Button>
          )}

          {activeSection === "passes" && (
            <Button onClick={() => setPassDialogOpen(true)} className="gap-2">
              <Plus className="size-4" />
              Issue Gate Pass
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.key;

            return (
              <button
                key={section.key}
                type="button"
                onClick={() => {
                  setActiveSection(section.key);
                  setSearch("");
                }}
                className={`group rounded-2xl border p-4 text-left transition-all ${isActive ? "border-primary/30 bg-primary/4 shadow-sm" : "border-border bg-card hover:border-primary/20 hover:bg-muted/30"}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="size-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-sm">{section.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardDescription>Total Requests</CardDescription>
              <CardTitle className="text-2xl">{totalRequests}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="size-4" />
                All movement requests
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardDescription>Pending Approvals</CardDescription>
              <CardTitle className="text-2xl">{pendingCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <Clock3 className="size-4" />
                Awaiting decision
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardDescription>Approved Requests</CardDescription>
              <CardTitle className="text-2xl">{approvedCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                Approved movements
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>{activeSection === "requests" ? "Movement Requests" : activeSection === "approvals" ? "Pending Approvals" : "Permanent Gate Passes"}</CardTitle>
                <CardDescription className="mt-1">
                  {activeSection === "requests"
                    ? "Track movement requests across the campus."
                    : activeSection === "approvals"
                      ? "Review and approve or reject pending requests."
                      : "Issue time-bound permanent gate passes."}
                </CardDescription>
              </div>

              {activeSection !== "passes" && (
                <div className="relative w-full lg:w-70">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests..." className="pl-9" />
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {activeSection === "requests" && (
              <>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <div key={item} className="h-14 rounded-lg bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                      <Inbox className="size-6 text-muted-foreground" />
                    </div>

                    <h3 className="text-base font-bold">No Movement Requests</h3>

                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">{search ? "No requests match your search." : "No movement requests have been created yet."}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Request</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Subject</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Type</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Movement</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Created</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {filteredRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-semibold">#{request.id.slice(0, 8)}</TableCell>

                            <TableCell>
                              <div>
                                <p className="font-medium">{request.subjectId || "—"}</p>
                                <p className="text-xs text-muted-foreground">{request.subjectType || "—"}</p>
                              </div>
                            </TableCell>

                            <TableCell>{request.requestType?.name || request.requestType?.code || "—"}</TableCell>

                            <TableCell>
                              <div className="min-w-42.5">
                                <p className="text-sm">{formatDateTime(request.requestedFrom)}</p>
                                <p className="text-xs text-muted-foreground">to {formatDateTime(request.requestedTo)}</p>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline" className={statusClasses(request.status)}>
                                {request.status || "PENDING"}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-sm text-muted-foreground">{formatDate(request.createdAt)}</TableCell>

                            <TableCell className="text-right">
                              {!["CANCELLED", "REJECTED"].includes(request.status?.toUpperCase() || "") && (
                                <Button variant="ghost" size="sm" disabled={submitting} onClick={() => handleCancel(request)}>
                                  Cancel
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

            {activeSection === "approvals" && (
              <>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="h-14 rounded-lg bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : filteredApprovals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                      <ShieldCheck className="size-6 text-muted-foreground" />
                    </div>

                    <h3 className="text-base font-bold">No Pending Approvals</h3>

                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">All movement requests have been reviewed.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Request</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Subject</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Type</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Date & Time</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {filteredApprovals.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-semibold">#{request.id.slice(0, 8)}</TableCell>

                            <TableCell>
                              <div>
                                <p className="font-medium">{request.subjectId || "—"}</p>
                                <p className="text-xs text-muted-foreground">{request.subjectType || "—"}</p>
                              </div>
                            </TableCell>

                            <TableCell>{request.requestType?.name || request.requestType?.code || "—"}</TableCell>

                            <TableCell>
                              <div className="min-w-42.5">
                                <p className="text-sm">{formatDateTime(request.requestedFrom)}</p>
                                <p className="text-xs text-muted-foreground">to {formatDateTime(request.requestedTo)}</p>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline" className={statusClasses("PENDING")}>
                                Pending
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setApprovalForm({
                                      action: "APPROVED",
                                      remarks: "",
                                    });
                                    setApprovalDialogOpen(true);
                                  }}
                                >
                                  <CheckCircle2 className="size-4" />
                                  Review
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}

            {activeSection === "passes" && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BadgeCheck className="size-7" />
                </div>

                <h3 className="text-lg font-bold">Permanent Gate Passes</h3>

                <p className="mt-1 max-w-md text-sm text-muted-foreground">Issue a permanent pass to a student or staff member with a defined validity period.</p>

                <Button onClick={() => setPassDialogOpen(true)} className="mt-5 gap-2">
                  <Plus className="size-4" />
                  Issue Gate Pass
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Movement Request</DialogTitle>
            <DialogDescription>Raise a new movement request for a student or staff member.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Request Type *</Label>

                <Select
                  value={createForm.requestTypeId}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      requestTypeId: value,
                      slotId: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select request type" />
                  </SelectTrigger>

                  <SelectContent>
                    {requestTypes
                      .filter((item) => item.isActive && (item.appliesTo === createForm.subjectType || item.appliesTo === "STAFF" || item.appliesTo === "STUDENT"))
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subject Type *</Label>

                <Select
                  value={createForm.subjectType}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      subjectType: value as "STUDENT" | "STAFF",
                      requestTypeId: "",
                      slotId: "",
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
            </div>

            <div className="space-y-2">
              <Label>Subject ID *</Label>
              <Input
                value={createForm.subjectId}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    subjectId: event.target.value,
                  }))
                }
                placeholder="Enter student/staff ID"
              />
            </div>

            {activeRequestType && activeRequestType.slotModel !== "FREE_FORM" && (
              <div className="space-y-2">
                <Label>Visiting Slot *</Label>

                <Select
                  value={createForm.slotId}
                  onValueChange={(value) => {
                    const slot = availableSlots.find((item) => item.id === value);

                    setCreateForm((prev) => ({
                      ...prev,
                      slotId: value,
                      requestedFrom: slot ? `${slot.slotDate.slice(0, 10)}T${slot.timeFrom}` : prev.requestedFrom,
                      requestedTo: slot ? `${slot.slotDate.slice(0, 10)}T${slot.timeTo}` : prev.requestedTo,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select available slot" />
                  </SelectTrigger>

                  <SelectContent>
                    {availableSlots.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No slots available
                      </SelectItem>
                    ) : (
                      availableSlots.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id}>
                          {formatDate(slot.slotDate)} · {slot.timeFrom} - {slot.timeTo} · {slot.bookedCount}/{slot.capacity}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Requested From *</Label>
                <Input
                  type="datetime-local"
                  value={createForm.requestedFrom}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      requestedFrom: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Requested To *</Label>
                <Input
                  type="datetime-local"
                  value={createForm.requestedTo}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      requestedTo: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Purpose</Label>
              <Textarea
                value={createForm.purpose}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    purpose: event.target.value,
                  }))
                }
                placeholder="Enter movement purpose"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Destination</Label>
              <Input
                value={createForm.destination}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    destination: event.target.value,
                  }))
                }
                placeholder="Enter destination"
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

      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Movement Request</DialogTitle>
            <DialogDescription>Approve or reject this movement request.</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-5">
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Subject</p>
                    <p className="mt-1 font-semibold">{selectedRequest.subjectId}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="mt-1 font-semibold">{selectedRequest.requestType?.name || "—"}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">From</p>
                    <p className="mt-1 font-semibold">{formatDateTime(selectedRequest.requestedFrom)}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">To</p>
                    <p className="mt-1 font-semibold">{formatDateTime(selectedRequest.requestedTo)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Decision</Label>

                <Select
                  value={approvalForm.action}
                  onValueChange={(value) =>
                    setApprovalForm((prev) => ({
                      ...prev,
                      action: value as "APPROVED" | "REJECTED",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="APPROVED">Approve</SelectItem>
                    <SelectItem value="REJECTED">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  value={approvalForm.remarks}
                  onChange={(event) =>
                    setApprovalForm((prev) => ({
                      ...prev,
                      remarks: event.target.value,
                    }))
                  }
                  placeholder="Add approval remarks"
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancel
            </Button>

            <Button onClick={handleDecision} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="size-4 animate-spin" />}

              {approvalForm.action === "APPROVED" ? (
                <>
                  <CheckCircle2 className="size-4" />
                  Approve
                </>
              ) : (
                <>
                  <XCircle className="size-4" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passDialogOpen} onOpenChange={setPassDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Issue Permanent Gate Pass</DialogTitle>
            <DialogDescription>Create a time-bound permanent pass for a student or staff member.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="space-y-2">
              <Label>Holder Type *</Label>

              <Select
                value={passForm.holderType}
                onValueChange={(value) =>
                  setPassForm((prev) => ({
                    ...prev,
                    holderType: value as "STUDENT" | "STAFF",
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
              <Label>Holder ID *</Label>

              <Input
                value={passForm.holderId}
                onChange={(event) =>
                  setPassForm((prev) => ({
                    ...prev,
                    holderId: event.target.value,
                  }))
                }
                placeholder="Enter student/staff ID"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Valid From *</Label>
                <Input
                  type="datetime-local"
                  value={passForm.validFrom}
                  onChange={(event) =>
                    setPassForm((prev) => ({
                      ...prev,
                      validFrom: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Valid To *</Label>
                <Input
                  type="datetime-local"
                  value={passForm.validTo}
                  onChange={(event) =>
                    setPassForm((prev) => ({
                      ...prev,
                      validTo: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPassDialogOpen(false)}>
              Cancel
            </Button>

            <Button onClick={handleIssuePass} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Issue Pass
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
