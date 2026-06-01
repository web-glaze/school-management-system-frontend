"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { complaintService, technicianService, departmentService } from "@/services/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, Save, Upload, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Field, FieldGroup } from "@/components/ui/field";

interface Technician {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface Complaint {
  id: string;
  ticketCode: string;
  description: string;
  locationType?: string;
  subLocation?: string;
  location?: { name: string };
  subDeptLocation?: { name: string };
  priority: string;
  status: string;
  imageUrl?: string | null;
  adminImageUrl?: string | null;
  createdAt: string;
  user?: { email: string };
  assignedTechnician?: { id: string; name: string };
  department?: { id: string; name: string };
}

export default function TicketManagementPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [adminImageUrl, setAdminImageUrl] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const fetchData = async () => {
    try {
      const [cRes, tRes, dRes] = await Promise.all([
        complaintService.getById(id),
        technicianService.getAll(),
        departmentService.getAll(),
      ]);

      const cData = cRes.data.data || cRes.data;
      setComplaint(cData);
      setTechnicians(Array.isArray(tRes.data) ? tRes.data : tRes.data.data || []);
      setDepartments(Array.isArray(dRes.data) ? dRes.data : dRes.data.data || []);
      setStatus(cData.status || "");
      setPriority(cData.priority || "");
      setTechnicianId(cData.assignedTechnician?.id || "");
      setAdminImageUrl(cData.adminImageUrl || "");
      setDepartmentId(cData.department?.id || "");
    } catch (error) {
      toast.error("Failed to fetch administrative records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(()=>{
    if (id) fetchData();},0);
  }, [id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAdminImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const saveChanges = async () => {
    if (!complaint) return;
    try {
      setSaving(true);
      await complaintService.update(id, {
        description: complaint.description,
        status,
        priority,
        technicianId: technicianId || null,
        departmentId: departmentId || null,
        adminImageUrl: adminImageUrl || null,
      });
      toast.success("Ticket Updated Successfully");
      await fetchData();
    } catch (error) {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ASSIGNED": return "bg-blue-100 text-blue-800 border-blue-200";
      case "IN_PROGRESS": return "bg-orange-100 text-orange-800 border-orange-200";
      case "RESOLVED": return "bg-green-100 text-green-800 border-green-200";
      case "CLOSED": return "bg-slate-100 text-slate-800 border-slate-200";
      default: return "";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "LOW": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "MEDIUM": return "bg-blue-100 text-blue-800 border-blue-200";
      case "HIGH": return "bg-orange-100 text-orange-800 border-orange-200";
      case "URGENT": return "bg-red-100 text-red-800 border-red-200";
      default: return "";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 mx-auto max-w-7xl w-full">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Ticket #{complaint.ticketCode}
            </h1>
            <p className="text-muted-foreground">Ticket Detail Page</p>
          </div>
          <Button
            className="bg-primary text-white hover:bg-primary/90"
            onClick={() => router.back()}
          >
            <ArrowLeft size={18} /> Back
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <Card className="lg:col-span-8">
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
              <CardDescription>
                Update ticket information, assignment and status.
              </CardDescription>
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
              <div className="grid grid-cols-2 gap-6">
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
                    <Select
                      value={technicianId}
                      onValueChange={setTechnicianId}
                    >
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
                    <Select
                      value={departmentId}
                      onValueChange={setDepartmentId}
                    >
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
                <Label>Admin Response Image</Label>
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 size-4" /> Upload Image
                  </Button>
                  <Input type="file" className="hidden" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
                  {adminImageUrl && <img src={adminImageUrl} alt="Preview" className="h-16 w-16 object-cover rounded border" />}
                </div>
              </div>

              <Button
                onClick={saveChanges}
                disabled={saving}
                className="h-11 px-6"
              >
                <Save className="size-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
              <CardDescription>
                Overview and assignment information
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className={getStatusBadge(complaint.status)}
                  >
                    {complaint.status.replaceAll("_", " ")}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Priority
                  </span>
                  <Badge
                    variant="outline"
                    className={getPriorityBadge(complaint.priority)}
                  >
                    {complaint.priority}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Department
                  </span>
                  <span className="font-medium">
                    {complaint.department?.name || "Unassigned"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Assigned To
                  </span>
                  <span className="font-medium text-right">
                    {complaint.assignedTechnician?.name || "Unassigned"}
                  </span>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">
                    User Attachment
                  </h4>
                  {complaint.imageUrl ? (
                    <img src={complaint.imageUrl} alt="User Attachment" className="w-full rounded border" />
                  ) : (
                    <div className="h-32 flex items-center justify-center border rounded bg-slate-50"><ImageIcon className="text-slate-300" /></div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">
                    Reporting Information
                  </h4>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Reported By
                    </span>
                    <span className="text-sm text-right break-all">
                      {complaint.user?.email}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Reported At
                    </span>
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
                  <h4 className="text-sm font-semibold">
                    Location Information
                  </h4>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm text-muted-foreground">
                      {complaint.locationType}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}