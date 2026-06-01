"use client";

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
  ImageIcon,
  Paperclip,
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
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Technician {
  id: string;
  name: string;
}

interface Complaint {
  id: string;
  ticketCode: string; // Added field
  description: string;
  locationType?: string;
  subLocation?: string;
  location?: { name: string };    // Added fallback for relation objects
  subDeptLocation?: { name: string }; // Added fallback for relation objects
  priority: string;
  status: string;
  imageUrl?: string | null;       // User's upload
  adminImageUrl?: string | null;  // Admin's resolution upload
  createdAt: string;
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
  const [adminImageUrl, setAdminImageUrl] = useState(""); // Track admin image input string

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // ✅ OPTIMIZATION: Runs requests concurrently to eliminate waterfall delays
      const [complaintResponse, technicianResponse] = await Promise.all([
        axios.get(`${API_URL}/api/complaints/${id}`, { headers }),
        axios.get(`${API_URL}/api/technicians`, { headers }),
      ]);

      const complaintData = complaintResponse.data.data || complaintResponse.data;
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
      console.error("Error loading ticket layout context data:", error);
      toast.error("Failed to fetch administrative records.");
    } finally {
      loading && setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setTimeout(()=>{
      fetchData();},0);
    }
  }, [id]);

  const saveChanges = async () => {
    try {
      if (!complaint) return;
      setSaving(true);
      const token = localStorage.getItem("token");

      // ✅ FIXED: Payload keys align perfectly with Unified ComplaintController patch specifications
      await axios.patch(
        `${API_URL}/api/complaints/${id}`,
        {
          description: complaint.description,
          status,
          priority,
          technicianId: technicianId || null, 
          adminImageUrl: adminImageUrl || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Ticket Updated Successfully");
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed To Update Ticket");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !complaint) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-20 text-muted-foreground font-medium animate-pulse">
          Loading ticket files...
        </div>
      </DashboardLayout>
    );
  }

  // Resilient render calculations for polymorphic location bindings
  const primaryLocationText = complaint.location?.name || complaint.locationType || "Unknown Area";
  const subLocationText = complaint.subDeptLocation?.name || complaint.subLocation || "";

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Top Operational Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Ticket Administration</h1>
              <p className="text-muted-foreground mt-1">
                Modify classification, prioritize parameters, and update technical resource allocations.
              </p>
            </div>
          </div>

          <Button onClick={saveChanges} disabled={saving} className="h-11 px-6 font-semibold">
            <Save className="size-4 mr-2" />
            {saving ? "Saving Changes..." : "Save Configuration"}
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Operational Settings Layout Column */}
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-8 space-y-6">
                <div>
                  <Label className="font-bold text-sm">Ticket Description</Label>
                  <Textarea
                    value={complaint.description}
                    onChange={(e) =>
                      setComplaint({
                        ...complaint,
                        description: e.target.value,
                      })
                    }
                    className="mt-2 min-h-[140px] focus-visible:ring-sky-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label className="font-bold text-sm">Status Profile</Label>
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
                    <Label className="font-bold text-sm">Priority Urgency Indicator</Label>
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
                  <Label className="font-bold text-sm">Assigned Operations Technician</Label>
                  <Select value={technicianId} onValueChange={setTechnicianId}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select Fleet/Field Resource" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* ✅ NEW: Combined Image Attachment Panel Section */}
            <Card>
              <CardContent className="p-8 space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-3">
                  <Paperclip className="size-5 text-sky-600" />
                  Visual System Attachments
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* User Upload Section */}
                  <div className="space-y-3">
                    <Label className="font-bold text-xs text-muted-foreground uppercase">User Proof Upload</Label>
                    {complaint.imageUrl ? (
                      <div className="space-y-2">
                        <div className="relative aspect-video w-full rounded-md border bg-muted overflow-hidden flex items-center justify-center">
                          <img 
                            src={complaint.imageUrl} 
                            alt="User Problem Upload Documentation" 
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <Button variant="secondary" size="sm" className="w-full" asChild>
                          <a href={complaint.imageUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2">
                            <ImageIcon className="size-3" /> View Original Reference
                          </a>
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center border-2 border-dashed p-8 rounded-md text-muted-foreground text-sm bg-slate-50/50">
                        <ImageIcon className="size-8 text-slate-300 mb-2" />
                        No photo attached by user
                      </div>
                    )}
                  </div>

                  {/* Admin Resolution Upload Section */}
                  <div className="space-y-3">
                    <Label className="font-bold text-xs text-muted-foreground uppercase">Administrative Resolution Photo</Label>
                    <div className="space-y-2">
                      <Input 
                        placeholder="Paste verification / clear down CDN image URL..."
                        value={adminImageUrl}
                        onChange={(e) => setAdminImageUrl(e.target.value)}
                        className="focus-visible:ring-sky-600"
                      />
                      {adminImageUrl ? (
                        <div className="relative aspect-video w-full rounded-md border bg-muted overflow-hidden">
                          <img 
                            src={adminImageUrl} 
                            alt="Admin Verification Resolution Context" 
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center border p-8 rounded-md text-muted-foreground text-xs bg-slate-50/20 text-center">
                          No administrative reference image set. Paste an image URL link above to establish real-time closure validation context.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Core Information System Column */}
          <div>
            <Card>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Metadata File</h2>
                  <Badge className="bg-sky-600 hover:bg-sky-700">{status}</Badge>
                </div>

                <div className="space-y-5">
                  <div className="flex gap-3">
                    <Ticket className="size-5 text-sky-600 mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ticket Index Reference</p>
                      {/* ✅ FIXED: Correctly display string ticketCode tracking key instead of DB uuid */}
                      <p className="font-black tracking-wide text-md text-slate-800">
                        {complaint.ticketCode || "TKT-GENERIC"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <MapPin className="size-5 text-sky-600 mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">System Boundaries Location</p>
                      {/* ✅ FIXED: Conditional display prevents blank text or object keys breakdown */}
                      <p className="font-semibold text-slate-800">{primaryLocationText}</p>
                      {subLocationText && (
                        <p className="text-sm text-muted-foreground font-medium">
                          {subLocationText}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Calendar className="size-5 text-sky-600 mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ingress Processing Date</p>
                      <p className="font-medium text-slate-700">
                        {new Date(complaint.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <User className="size-5 text-sky-600 mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Originating Account User</p>
                      <p className="font-medium text-slate-700">{complaint.user?.email || "System/Anonymous"}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Wrench className="size-5 text-sky-600 mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Assigned Technical Asset</p>
                      <p className="font-semibold text-slate-700">
                        {complaint.assignedTechnician?.name || "Unassigned Operations"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Clock3 className="size-5 text-sky-600 mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Criticality State Strategy</p>
                      <p className="font-bold text-slate-700">{priority}</p>
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