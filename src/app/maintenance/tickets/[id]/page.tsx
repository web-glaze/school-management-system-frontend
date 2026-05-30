"use client";
import { logError } from "@/lib/api-helpers";


import axios from "axios";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";

import {
  ArrowLeft,
  Calendar,
  Clock3,
  MapPin,
  Save,
  Ticket,
  User,
  Wrench,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Card, CardContent } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Technician {
  id: string;

  name: string;
}

interface ComplaintItem {
  id: string;
  description: string;
  priority: string;
  status?: string;
  imageUrl?: string | null;
}

interface Complaint {
  id: string;
  ticketCode?: string;
  description: string;
  locationType: string;
  subLocation: string;
  priority: string;
  status: string;
  managerRemark?: string;
  createdAt: string;
  imageUrl?: string;
  adminImageUrl?: string;
  // Multi-item tickets carry their issue rows here. Older tickets that
  // only used the parent description will have an empty array.
  items?: ComplaintItem[];
  user?: {
    email: string;
  };

  assignedTechnician?: {
    id: string;

    name: string;
  };
}

export default function TicketManagementPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [adminImageUrl, setAdminImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const complaintResponse = await axios.get(
        `${API_URL}/api/complaints/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const technicianResponse = await axios.get(`${API_URL}/api/technicians`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const complaintData =
        complaintResponse.data.data || complaintResponse.data;

      const technicianData = Array.isArray(technicianResponse.data)
        ? technicianResponse.data
        : technicianResponse.data.data || [];

      setComplaint(complaintData);
      setTechnicians(technicianData);
      setStatus(complaintData.status || "");
      setPriority(complaintData.priority || "");
      setTechnicianId(complaintData.assignedTechnician?.id || "");
      setAdminImageUrl(complaintData.adminImageUrl || "");
    } catch (error) {
      logError("tickets.[id].page", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setTimeout(() => {
        fetchData();
      }, 0);
    }
  }, [id]);

  const saveChanges = async () => {
    try {
      if (!complaint) return;
      setSaving(true);

      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_URL}/api/complaints/${id}`,
        {
          description: complaint.description,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      await axios.patch(
        `${API_URL}/api/complaints/${id}/status`,
        {
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      await axios.patch(
        `${API_URL}/api/complaints/${id}/priority`,
        {
          priority,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (technicianId) {
        await axios.patch(
          `${API_URL}/api/complaints/${id}/assign`,
          {
            technicianId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      }

      alert("Ticket Updated Successfully");

      fetchData();
    } catch (error) {
      logError("tickets.[id].page", error);

      alert("Failed To Update Ticket");
    } finally {
      setSaving(false);
    }
  };

  const handleAdminImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploadingImage(true);

      const token = localStorage.getItem("token");

      const formData = new FormData();

      formData.append("file", file);

      const uploadResponse = await axios.post(
        `${API_URL}/api/uploads/image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const imageUrl = uploadResponse.data.data.url;

      await axios.patch(
        `${API_URL}/api/complaints/${id}/admin-image`,
        {
          adminImageUrl: imageUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setAdminImageUrl(imageUrl);

      alert("Status image uploaded");
    } catch (error) {
      logError("tickets.[id].page", error);

      alert("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading || !complaint) {
    return (
      <DashboardLayout>
        <div className="p-10">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="size-4" />
            </Button>

            <div>
              <h1 className="text-3xl font-black">Ticket Management</h1>

              <p className="text-muted-foreground mt-1">
                Manage complaint ticket
              </p>
            </div>
          </div>

          <Button onClick={saveChanges} disabled={saving} className="h-11 px-6">
            <Save className="size-4 mr-2" />

            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left */}
          <div className="xl:col-span-2">
            <Card>
              <CardContent className="p-8 space-y-6">
                <div>
                  <Label>Ticket Description</Label>
                  <Textarea
                    value={complaint.description}
                    onChange={(e) =>
                      setComplaint({
                        ...complaint,
                        description: e.target.value,
                      })
                    }
                    className="mt-2 min-h-[140px]"
                  />
                </div>

                {complaint.imageUrl && (
                  <div className="space-y-3">
                    <Label>User Submitted Image</Label>

                    <img
                      src={complaint.imageUrl}
                      alt="Complaint"
                      className="w-full rounded-xl border max-h-96 object-cover"
                    />
                  </div>
                )}

                {/* Multi-item issues: if the ticket has more than one issue
                    (or even just one stored as an item), list each below the
                    primary description so the manager sees every reported
                    problem at a glance. */}
                {complaint.items && complaint.items.length > 1 && (
                  <div className="space-y-3">
                    <Label className="text-sm">
                      All Issues in This Ticket ({complaint.items.length})
                    </Label>
                    <div className="space-y-2.5">
                      {complaint.items.map((it, idx) => (
                        <div
                          key={it.id}
                          className="rounded-lg border border-border/70 bg-muted/20 p-3"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Issue {idx + 1}
                            </span>
                            <span
                              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                                it.priority === "URGENT"
                                  ? "bg-rose-500/10 text-rose-600"
                                  : it.priority === "HIGH"
                                    ? "bg-orange-500/10 text-orange-600"
                                    : it.priority === "MEDIUM"
                                      ? "bg-amber-500/10 text-amber-600"
                                      : "bg-emerald-500/10 text-emerald-600"
                              }`}
                            >
                              {it.priority}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed text-foreground">
                            {it.description}
                          </p>
                          {it.imageUrl && (
                            <img
                              src={it.imageUrl}
                              alt={`Issue ${idx + 1}`}
                              className="mt-2 rounded-md border max-h-48 object-cover"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label>Status</Label>

                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>

                        <SelectItem value="ASSIGNED">Assigned</SelectItem>

                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>

                        <SelectItem value="RESOLVED">Resolved</SelectItem>

                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Priority</Label>

                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>

                        <SelectItem value="MEDIUM">Medium</SelectItem>

                        <SelectItem value="HIGH">High</SelectItem>

                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Assign Technician</Label>

                  <Select value={technicianId} onValueChange={setTechnicianId}>
                    <SelectTrigger className="mt-2">
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
                </div>
                <div className="space-y-4">
                  <Label>Admin Status Image</Label>

                  <input
                    id="admin-image"
                    type="file"
                    accept="image/*"
                    onChange={handleAdminImageUpload}
                    className="hidden"
                  />

                  <label
                    htmlFor="admin-image"
                    className="cursor-pointer border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3"
                  >
                    <Upload className="h-6 w-6" />

                    <span>Upload Status Image</span>
                  </label>

                  {uploadingImage && (
                    <p className="text-sm text-blue-600">Uploading...</p>
                  )}

                  {adminImageUrl && (
                    <img
                      src={adminImageUrl}
                      alt="Admin Update"
                      className="w-full rounded-xl border max-h-96 object-cover"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right */}
          <div>
            <Card>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Ticket Info</h2>

                  <Badge>{complaint.status}</Badge>
                </div>

                <div className="space-y-5">
                  <div className="flex gap-3">
                    <Ticket className="size-5 text-sky-600 mt-1" />

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Ticket Number
                      </p>

                      <p className="font-bold">
                        {complaint.ticketCode || "TKT-001"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
