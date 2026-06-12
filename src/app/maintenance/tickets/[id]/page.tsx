"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, Save, Upload, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Field, FieldGroup } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useComplaintStore, useTechnicianStore, useDepartmentStore, Complaint } from "@/store/maintenanceStore";
import { complaintService } from "@/services/maintenance.service";
import apiClient from "@/services/api";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Video from "yet-another-react-lightbox/plugins/video";

export default function TicketManagementPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { technicians, fetchTechnicians } = useTechnicianStore();
  const { departments, fetchDepartments } = useDepartmentStore();
  const { updateComplaint, loading: saving } = useComplaintStore();

  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [adminAttachments, setAdminAttachments] = useState<
    {
      url: string;
      type: "IMAGE" | "VIDEO";
    }[]
  >([]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxFiles, setLightboxFiles] = useState<
    {
      id?: string;
      url: string;
      type: "IMAGE" | "VIDEO";
    }[]
  >([]);

  const fetchData = async () => {
    try {
      const cRes = await complaintService.getById(id);
      const cData = cRes.data.data || cRes.data;

      await Promise.all([fetchTechnicians(), fetchDepartments()]);

      setComplaint(cData);
      setStatus(cData.status || "");
      setPriority(cData.priority || "");
      setTechnicianId(cData.assignedTechnician?.id || "");
      setAdminAttachments([]);
      setDepartmentId(cData.department?.id || "");
    } catch (error) {
      toast.error("Failed to fetch administrative records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id)
      setTimeout(() => {
        fetchData();
      }, 0);
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    try {
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

      setAdminAttachments((prev) => [
        ...prev,
        ...uploadedFiles.map((file: any) => ({
          url: file.url,
          type: file.type,
        })),
      ]);
    } catch {
      toast.error("Upload failed");
    }
  };

  const saveChanges = async () => {
    if (!complaint) return;
    try {
      await updateComplaint(id, {
        description: complaint.description,
        status,
        priority,
        technicianId: technicianId || null,
        departmentId: departmentId || null,
        attachments: adminAttachments.map((file) => ({ ...file, owner: "ADMIN" })),
      });
      toast.success("Ticket Updated Successfully");
      await fetchData();
    } catch (error) {
      toast.error("Failed To Update Ticket");
    }
  };

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
            <Card className="lg:col-span-8">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72 mt-2" />
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-[180px] w-full rounded-md" />
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

            {/* Right Card */}
            <Card className="lg:col-span-4">
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

  return (
    <DashboardLayout>
      <div className="space-y-8 mx-auto max-w-7xl w-full">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ticket #{complaint.ticketCode}</h1>
            <p className="text-muted-foreground">Ticket Detail Page</p>
          </div>
          <Button className="bg-primary text-white hover:bg-primary/90" onClick={() => router.back()}>
            <ArrowLeft size={18} /> Back
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <Card className="lg:col-span-8">
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
              <CardDescription>Update ticket information, assignment and status.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <FieldGroup>
                <Field>
                  <Label htmlFor="description">Ticket Description</Label>
                  <Textarea
                    id="description"
                    value={complaint.description}
                    onChange={(e) =>
                      setComplaint({
                        ...complaint,
                        description: e.target.value,
                      })
                    }
                    className="min-h-[180px]"
                  />
                </Field>
              </FieldGroup>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FieldGroup>
                  <Field>
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
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
                    <Select value={priority} onValueChange={setPriority}>
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
                    <Select value={technicianId} onValueChange={setTechnicianId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Technician" />
                      </SelectTrigger>
                      <SelectContent>
                        {technicians.map((technician) => (
                          <SelectItem key={technician.id} value={technician.id}>
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
                    <Select value={departmentId} onValueChange={setDepartmentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((department) => (
                          <SelectItem key={department.id} value={department.id}>
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
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 size-4" /> Upload Image
                  </Button>
                  <Input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleImageUpload} accept="image/*,video/*" />
                  {adminAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {adminAttachments.map((file, idx) => (
                        <div key={idx} className="relative group rounded overflow-hidden">
                          {file.type === "IMAGE" ? <img src={file.url} alt="" className="h-16 w-16 rounded border object-cover" /> : <video src={file.url} className="h-16 w-16 rounded border object-cover" />}

                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                            <button type="button" onClick={() => setAdminAttachments((prev) => prev.filter((_, i) => i !== idx))} className="px-2 py-1 rounded bg-red-500 text-white text-xs font-medium">
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}{" "}
                </div>
              </div>

              <Button onClick={saveChanges} disabled={saving} className="h-11 px-6">
                <Save className="size-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
          <Card className="lg:col-span-4">
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Activity Timeline</h2>
              <p className="text-muted-foreground">Complaint history and updates</p>
            </div>

            <Badge variant="secondary">{complaint.activities?.length || 0} Events</Badge>
          </div>

          <div className="space-y-6">
            {complaint.activities?.map((activity, index) => (
              <div key={activity.id} className="flex gap-5">
                {/* Timeline */}
                <div className="relative flex flex-col items-center shrink-0">
                  <div className="h-4 w-4 rounded-full bg-primary z-10" />

                  {index !== (complaint.activities?.length ?? 0) - 1 && <div className="absolute top-4 w-px h-[calc(100%+1.5rem)] bg-border" />}
                </div>

                {/* Activity Card */}
                <Card className="flex-1">
                  <CardContent className="p-5">
                    <div className="font-medium">
                      {activity.action === "TICKET_CREATED" && "Ticket Created"}

                      {activity.action === "STATUS_CHANGED" && `Status changed from ${activity.oldValue} to ${activity.newValue}`}

                      {activity.action === "TECHNICIAN_ASSIGNED" && "Technician Assigned"}

                      {activity.action === "DEPARTMENT_CHANGED" && "Department Assigned"}

                      {activity.action === "ATTACHMENT_ADDED" && "Attachments Added"}
                    </div>

                    <div className="text-sm text-muted-foreground mt-1">{activity.createdBy?.name || "System"}</div>

                    {activity.message && <div className="text-sm text-muted-foreground mt-2">{activity.message}</div>}

                    <div className="text-xs text-muted-foreground mt-3">
                      {new Date(activity.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>

                    {activity.attachments?.length ? (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {activity.attachments.map((file, index) => (
                          <button key={file.id || index} onClick={() => openLightbox(activity.attachments!, index)} className="h-16 w-16 overflow-hidden rounded-md border cursor-pointer">
                            {file.type === "IMAGE" ? <img src={file.url} alt="" className="h-full w-full object-cover" /> : <video src={file.url} className="h-full w-full object-cover" />}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={currentIndex}
        plugins={[Zoom, Thumbnails, Video]}
        carousel={{finite:true,}}
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
