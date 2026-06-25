"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, Save, Upload, Trash2, Loader2, Eye, Clock, Paperclip, AlertCircle, PlusCircle, ArrowRightLeft, UserCheck, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Field, FieldGroup } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useComplaintStore, Complaint } from "@/store/maintenanceStore";
import { complaintService } from "@/services/maintenance.service";
import apiClient from "@/services/api";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Video from "yet-another-react-lightbox/plugins/video";
import { usePermission } from "@/hooks/usePermission";

export default function TicketManagementPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalComplaint, setOriginalComplaint] = useState<Complaint | null>(null);
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const { updateComplaint, loading: saving } = useComplaintStore();
  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [timelineSort, setTimelineSort] = useState<"newest" | "oldest">("newest");
  // Attachments already saved on the server (loaded on mount)
  const [savedAttachments, setSavedAttachments] = useState<{ url: string; type: "IMAGE" | "VIDEO" }[]>([]);
  // Only newly uploaded attachments (not yet saved to the ticket)
  const [newAttachments, setNewAttachments] = useState<{ url: string; type: "IMAGE" | "VIDEO" }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxFiles, setLightboxFiles] = useState<
    {
      id?: string;
      url: string;
      type: "IMAGE" | "VIDEO";
    }[]
  >([]);

  const userRole = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}")?.roles?.[0] || "" : "";
  const canManageTicket = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(userRole);
  const fetchData = async () => {
    try {
      const cRes = await complaintService.getById(id);
      const cData = cRes.data.data || cRes.data;

      if (canManageTicket) {
        const optionsRes = await complaintService.getAssignOptions();

        const { technicians, departments } = optionsRes.data.data;
        setTechnicians(technicians || []);
        setDepartments(departments || []);
      }
      setComplaint(cData);
      setOriginalComplaint(cData);
      setStatus(cData.status || "");
      setPriority(cData.priority || "");
      setTechnicianId(cData.assignedTechnician?.id || "");
      setDepartmentId(cData.department?.id || "");

      // Load existing admin attachments from the server into savedAttachments
      const existingAdmin = cData.attachments?.filter((f: { owner: string; url: string; type: "IMAGE" | "VIDEO" }) => f.owner === "ADMIN") || [];
      setSavedAttachments(
        existingAdmin.map((file: { url: string; type: "IMAGE" | "VIDEO" }) => ({
          url: file.url,
          type: file.type,
        }))
      );
      // Clear any newly uploaded files since we just reloaded from server
      setNewAttachments([]);
    } catch (error) {
      toast.error("Failed to fetch administrative records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && userRole) {
      fetchData();
    }
  }, [id, userRole]);

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;
    try {
      setUploading(true);
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await apiClient.post("/uploads/media", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedFiles = response.data?.data?.files ?? [];

      // Only append to newAttachments — do NOT touch savedAttachments
      setNewAttachments((prev) => [
        ...prev,
        ...uploadedFiles.map((file: { url: string; type: "IMAGE" | "VIDEO" }) => ({
          url: file.url,
          type: file.type,
        })),
      ]);
      toast.success("Uploaded successfully");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await uploadFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      await uploadFiles(files);
    }
  };

  const saveChanges = async () => {
    if (!complaint) return;

    if (!complaint.description?.trim()) {
      toast.error("Description is required");
      return;
    }

    try {
      if (status === "CLOSED" && adminAttachments.length === 0) {
        toast.error("Please upload at least one image or video before closing the ticket");
        return;
      }

      await updateComplaint(id, {
        description: complaint.description.trim(),
        status,
        priority,
        technicianId: technicianId || null,
        departmentId: departmentId || null,
        // Only send newly uploaded files — existing ones are already on the server
        attachments: newAttachments.map((file) => ({
          ...file,
          owner: "ADMIN",
        })),
      });

      toast.success("Ticket Updated Successfully");
      await fetchData();
    } catch {
      toast.error("Failed To Update Ticket");
    }
  };

  const hasChanges =
    complaint?.description?.trim() !== originalComplaint?.description?.trim() ||
    status !== (originalComplaint?.status || "") ||
    priority !== (originalComplaint?.priority || "") ||
    technicianId !== (originalComplaint?.assignedTechnician?.id || "") ||
    departmentId !== (originalComplaint?.department?.id || "") ||
    newAttachments.length > 0;

  // Combined list for display: saved attachments + newly uploaded ones
  const adminAttachments = [...savedAttachments, ...newAttachments];

  const authorized = usePermission("ticket.read");

  if (authorized === null) {
    return null;
  }

  if (loading || !complaint) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl w-full space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <Skeleton className="h-8 w-64 bg-gray-300" />
              <Skeleton className="h-4 w-40 bg-gray-300" />
            </div>

            <Skeleton className="h-10 w-28 rounded-md bg-gray-300" />
          </div>

          {/* Main Grid */}
          <div className="grid gap-4 lg:grid-cols-12">
            {/* Left Card */}
            {canManageTicket && (
              <Card className="lg:col-span-8">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-72 mt-2" />
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Description */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-45 w-full rounded-md" />
                  </div>

                  {/* Select Fields */}
                  <div className="grid grid-cols-1 lg:grid-col-2 gap-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>

                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>

                    <div className="space-y-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>

                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                  </div>

                  {/* Upload */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />

                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-40 rounded-md" />
                      <Skeleton className="h-16 w-16 rounded-md" />
                    </div>
                  </div>

                  {/* Save Button */}
                  <Skeleton className="h-11 w-36 rounded-md" />
                </CardContent>
              </Card>
            )}

            {/* Right Card */}
            <Card className={canManageTicket ? "lg:col-span-4" : "lg:col-span-12"}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-56 mt-2" />
              </CardHeader>

              <CardContent className="space-y-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                ))}

                <Skeleton className="h-px w-full" />

                {/* User Attachment */}
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-48 w-full rounded-lg" />
                </div>

                <Skeleton className="h-px w-full" />

                {/* Reporting Info */}
                <div className="space-y-4">
                  <Skeleton className="h-4 w-40" />

                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-40" />
                  </div>

                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>

                <Skeleton className="h-px w-full" />

                {/* Location */}
                <div className="space-y-3">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-16 w-full rounded-md" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const sortedActivities = [...(complaint.activities || [])].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();

    return timelineSort === "newest" ? bTime - aTime : aTime - bTime;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "IN_PROGRESS":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "RESOLVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CLOSED":
        return "bg-slate-100 text-slate-800 border-slate-200";
      default:
        return "";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "MEDIUM":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "URGENT":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "";
    }
  };

  const userAttachments = complaint.attachments?.filter((f) => f.owner === "USER") || [];

  const openLightbox = (
    files: {
      id?: string;
      url: string;
      type: "IMAGE" | "VIDEO";
    }[],
    index: number
  ) => {
    setLightboxFiles(files);
    setCurrentIndex(index);
    setLightboxOpen(true);
  };
  const getActivityIcon = (action: string) => {
    const iconClass = "h-7 w-7 text-sky-600 bg-sky-100 p-1 rounded-full ";

    switch (action) {
      case "TICKET_CREATED":
        return <PlusCircle className={iconClass} />;
      case "STATUS_CHANGED":
        return <ArrowRightLeft className={iconClass} />;
      case "PRIORITY_CHANGED":
        return <AlertCircle className={iconClass} />;
      case "TECHNICIAN_ASSIGNED":
        return <UserCheck className={iconClass} />;
      case "DEPARTMENT_CHANGED":
        return <Building2 className={iconClass} />;
      case "ATTACHMENT_ADDED":
        return <Paperclip className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  const getActivityTitle = (activity: { action: string }) => {
    switch (activity.action) {
      case "TICKET_CREATED":
        return "Ticket Created";
      case "STATUS_CHANGED":
        return `Status changed`;
      case "PRIORITY_CHANGED":
        return `Priority changed`;
      case "TECHNICIAN_ASSIGNED":
        return "Technician Assigned";
      case "DEPARTMENT_CHANGED":
        return "Department Assigned";
      case "ATTACHMENT_ADDED":
        return "Attachments Added";
      default:
        return activity.action;
    }
  };
  return (
    <DashboardLayout>
      <div className="space-y-8 mx-auto max-w-7xl w-full">
        {/* Top Header */}
        <div className="flex items-start justify-between mb-10 max-sm:gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Ticket #{complaint.ticketCode}</h1>

              {/* <Badge variant="outline" className={getStatusBadge(complaint.status)}>
                {complaint.status.replaceAll("_", " ")}
              </Badge>

              <Badge variant="outline" className={getPriorityBadge(complaint.priority)}>
                {complaint.priority}
              </Badge> */}
            </div>

            <p className="text-muted-foreground">Ticket Detail Page</p>
          </div>

          <Button
            className="bg-primary text-white hover:bg-primary/90"
            onClick={() => {
              const page = new URLSearchParams(window.location.search).get("page") || "1";

              router.push(`/maintenance/tickets?page=${page}`);
            }}
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Left Column: Ticket Info */}
          <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
            {canManageTicket ? (
              /* MANAGER / ADMIN EDIT VIEW */
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Information</CardTitle>
                  <CardDescription>Update ticket information, assignment and status.</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Ticket Description */}
                  <FieldGroup>
                    <Field>
                      <Label htmlFor="description">Ticket Description</Label>
                      <Textarea
                        id="description"
                        required
                        value={complaint.description}
                        onChange={(e) =>
                          setComplaint({
                            ...complaint,
                            description: e.target.value,
                          })
                        }
                        disabled={saving}
                        className="min-h-45"
                      />
                    </Field>
                  </FieldGroup>

                  {/* Dropdowns Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FieldGroup>
                      <Field>
                        <Label>Status</Label>
                        <Select value={status} onValueChange={setStatus} disabled={saving}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="ASSIGNED">Assigned</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </FieldGroup>

                    <FieldGroup>
                      <Field>
                        <Label>Priority</Label>
                        <Select value={priority} onValueChange={setPriority} disabled={saving}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="URGENT">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </FieldGroup>

                    <FieldGroup>
                      <Field>
                        <Label>Assigned Technician</Label>
                        <Select value={technicianId} onValueChange={setTechnicianId} disabled={saving}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Technician" />
                          </SelectTrigger>
                          <SelectContent>
                            {technicians.map((technician) => (
                              <SelectItem key={technician.id} value={String(technician.id)}>
                                {technician.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </FieldGroup>

                    <FieldGroup>
                      <Field>
                        <Label>Department</Label>
                        <Select value={departmentId} onValueChange={setDepartmentId} disabled={saving}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((department) => (
                              <SelectItem key={department.id} value={String(department.id)}>
                                {department.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </FieldGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Issue Resolved</Label>

                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => !uploading && fileInputRef.current?.click()}
                      className={`relative border border-dashed rounded-md p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2
                        ${dragActive ? "border-primary bg-muted" : "border-border hover:bg-muted/50"}
                        ${uploading ? "pointer-events-none opacity-50 bg-muted/10" : ""}
                      `}
                    >
                      <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleImageUpload} accept="image/*,video/*" disabled={uploading || saving} />

                      {uploading ? (
                        <div className="flex flex-col items-center gap-1">
                          <Loader2 className="size-5 text-primary animate-spin" />
                          <p className="text-sm font-medium">Uploading attachments...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <Upload className="size-5 text-muted-foreground" />
                          <p className="text-sm">
                            Drag & drop files here, or <span className="text-primary hover:underline">browse files</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {adminAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {adminAttachments.map((file, idx) => (
                          <div key={idx} className="relative group rounded border overflow-hidden h-16 w-16 bg-muted">
                            {file.type === "IMAGE" ? <img src={file.url} alt="" className="h-full w-full object-cover" /> : <video src={file.url} className="h-full w-full object-cover" />}

                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 rounded">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openLightbox(adminAttachments, idx);
                                }}
                                className="p-1 rounded bg-white/20 hover:bg-white/40 text-white transition-colors"
                              >
                                <Eye className="size-3.5" />
                              </button>
                              {idx >= savedAttachments.length && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const savedCount = savedAttachments.length;
                                    setNewAttachments((prev) => prev.filter((_, i) => i !== idx - savedCount));
                                  }}
                                  className="p-1 rounded bg-red-500 hover:bg-red-600 text-white transition-colors"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button onClick={saveChanges} disabled={saving || uploading || !hasChanges} className="h-11 px-6">
                    {uploading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : saving ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="size-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Information</CardTitle>
                  <CardDescription>Details for ticket #{complaint.ticketCode}.</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Ticket Description</Label>
                    <div className="bg-muted p-4 rounded-md text-foreground whitespace-pre-wrap leading-relaxed text-sm">{complaint.description || "No description provided."}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase font-medium">Assigned Technician</span>
                      <div className="text-sm font-medium">{complaint.assignedTechnician?.name || "Not assigned"}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase font-medium">Department</span>
                      <div className="text-sm font-medium">{complaint.department?.name || "Not assigned"}</div>
                    </div>{" "}
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-muted-foreground">Resolution Proof</Label>

                    {adminAttachments.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {adminAttachments.map((file, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => openLightbox(adminAttachments, idx)}
                            className="relative group rounded border overflow-hidden h-16 w-16 bg-muted hover:opacity-90 transition-opacity"
                          >
                            {file.type === "IMAGE" ? <img src={file.url} alt="" className="h-full w-full object-cover" /> : <video src={file.url} className="h-full w-full object-cover" />}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                              <Eye className="size-4 text-white" />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No resolution proof attachments uploaded yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-6 order-3 lg:order-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Activity Timeline</h2>
                  <p className="text-muted-foreground">Complaint history and updates</p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <Badge variant="outline" className="bg-sky-50 text-sky-600 h-8 px-4 text-sm">
                    {complaint.activities?.length || 0} Events
                  </Badge>

                  {(complaint.activities?.length || 0) > 1 && (
                    <Select value={timelineSort} onValueChange={(value: "newest" | "oldest") => setTimelineSort(value)}>
                      <SelectTrigger className="w-40 h-8 bg-white shadow-none ring-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {sortedActivities.map((activity, index) => (
                  <div key={activity.id} className="flex gap-5">
                    {/* Timeline Line */}
                    <div className="relative flex flex-col items-center shrink-0">
                      <div className="h-4 w-4 rounded-full bg-primary z-10" />

                      {index !== (complaint.activities?.length ?? 0) - 1 && <div className="absolute top-4 w-px h-[calc(100%+1.5rem)] bg-border" />}
                    </div>

                    <Card className="flex-1">
                      <CardContent className="p-4">
                        {/* Action Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-3">
                            <span className="pt-0.5">{getActivityIcon(activity.action)}</span>

                            <div>
                              <div className="font-semibold text-md text-foreground">
                                {getActivityTitle(activity)} - <span className="text-sm text-muted-foreground">{activity.createdBy?.name || "System"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm whitespace-nowrap">
                              {new Date(activity.createdAt).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Message */}
                        {activity.message && <div className="mt-4 py-1 text-sm text-yellow-700 leading-relaxed border-l-2 border-yellow-500 pl-4 bg-yellow-100/60">{activity.message}</div>}

                        {/* Attachments */}
                        {activity.attachments?.length ? (
                          <div className="mt-5">
                            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">Attachments ({activity.attachments.length})</p>
                            <div className="flex flex-wrap gap-3">
                              {activity.attachments.map((file, idx) => (
                                <button
                                  key={file.id || idx}
                                  onClick={() => openLightbox(activity.attachments!, idx)}
                                  className="group relative h-20 w-20 overflow-hidden rounded-xl border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                  {file.type === "IMAGE" ? (
                                    <img src={file.url} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  ) : (
                                    <video src={file.url} className="h-full w-full object-cover" />
                                  )}

                                  {/* Overlay indicator */}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white text-xs font-medium">View</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Ticket Metadata & User Attachments */}
          <Card className="lg:col-span-4 h-fit lg:sticky top-24 order-1 lg:order-2">
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
              <CardDescription>Overview and assignment information</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="outline" className={getStatusBadge(complaint.status)}>
                    {complaint.status.replaceAll("_", " ")}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Priority</span>
                  <Badge variant="outline" className={getPriorityBadge(complaint.priority)}>
                    {complaint.priority}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Department</span>
                  <span className="font-medium">{complaint.department?.name || "Unassigned"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Assigned To</span>
                  <span className="font-medium text-right">{complaint.assignedTechnician?.name || "Unassigned"}</span>
                </div>

                <Separator />

                {/* Issue Attachments */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Issue Attachments</h4>

                  {userAttachments.length > 0 ? (
                    <div className="flex gap-2">
                      {userAttachments.slice(0, 2).map((file, index) => (
                        <button key={file.id} onClick={() => openLightbox(userAttachments, index)} className="h-16 w-16 overflow-hidden rounded-md border cursor-pointer">
                          {file.type === "IMAGE" ? <img src={file.url} alt="" className="h-full w-full object-cover" /> : <video src={file.url} className="h-full w-full object-cover" />}
                        </button>
                      ))}

                      {userAttachments.length > 2 && (
                        <button onClick={() => openLightbox(userAttachments, 0)} className="h-16 w-16 rounded-md border flex items-center justify-center font-semibold text-sm bg-muted">
                          +{userAttachments.length - 2}
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No attachments</p>
                  )}
                </div>

                <Separator />

                {/* Reporting Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Reporting Information</h4>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reported By</span>
                    <span className="text-sm text-right break-all">{complaint.user?.email}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reported At</span>
                    <span className="text-sm text-right">
                      {new Date(complaint.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Location Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Location Information</h4>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm text-muted-foreground">{complaint.locationType}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lightbox for large previews */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={currentIndex}
        plugins={[Zoom, Thumbnails, Video]}
        carousel={{ finite: true }}
        slides={lightboxFiles.map((file) =>
          file.type === "IMAGE"
            ? {
                src: file.url,
              }
            : {
                type: "video",
                sources: [
                  {
                    src: file.url,
                    type: "video/mp4",
                  },
                ],
              }
        )}
      />
    </DashboardLayout>
  );
}
