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
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
import { Separator } from "@/components/ui/separator";
import { Field, FieldGroup } from "@/components/ui/field";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  ticketCode?: string;
  description: string;
  locationType: string;
  subLocation: string;
  priority: string;
  status: string;
  managerRemark?: string;
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
  const [departmentId, setDepartmentId] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);

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

      const departmentResponse = await axios.get(`${API_URL}/api/departments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const complaintData =
        complaintResponse.data.data || complaintResponse.data;

      const technicianData = Array.isArray(technicianResponse.data)
        ? technicianResponse.data
        : technicianResponse.data.data || [];

      const departmentData = Array.isArray(departmentResponse.data)
        ? departmentResponse.data
        : departmentResponse.data.data || [];

      setComplaint(complaintData);

      setTechnicians(technicianData);
      setDepartments(departmentData);
      setStatus(complaintData.status || "");
      setPriority(complaintData.priority || "");
      setTechnicianId(complaintData.assignedTechnician?.id || "");
      setDepartmentId(complaintData.department?.id || "");
    } catch (error) {
      console.log(error);
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

      if (departmentId) {
        await axios.patch(
          `${API_URL}/api/complaints/${id}/department`,
          {
            departmentId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      }

      toast.success("Ticket Updated Successfully");

      fetchData();
    } catch (error) {
      console.log(error);

      toast.error("Failed To Update Ticket");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !complaint) {
    return (
      <DashboardLayout>
        <div className="p-10">Loading...</div>
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

                  <span className="font-medium">Electrical</span>
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
