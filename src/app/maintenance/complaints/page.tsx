"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

import axios from "axios";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Complaint {
  id: string;

  title: string;

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

interface Technician {
  id: string;

  name: string;
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const [technicians, setTechnicians] = useState<Technician[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const [complaintsRes, techniciansRes] = await Promise.all([
        axios.get(`${API_URL}/api/complaints`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        axios.get(`${API_URL}/api/technicians`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      setComplaints(
        Array.isArray(complaintsRes.data)
          ? complaintsRes.data
          : complaintsRes.data.data || [],
      );

      setTechnicians(
        Array.isArray(techniciansRes.data)
          ? techniciansRes.data
          : techniciansRes.data.data || [],
      );
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchData();
    }, 0);
  }, []);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const matchesSearch =
        complaint.title.toLowerCase().includes(search.toLowerCase()) ||
        complaint.description.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || complaint.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [complaints, search, statusFilter]);

  const updateStatus = async (complaintId: string, status: string) => {
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_URL}/api/complaints/${complaintId}/status`,
        {
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  const updatePriority = async (complaintId: string, priority: string) => {
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_URL}/api/complaints/${complaintId}/priority`,
        {
          priority,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  const assignTechnician = async (
    complaintId: string,
    technicianId: string,
  ) => {
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_URL}/api/complaints/${complaintId}/assign`,
        {
          technicianId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  const deleteComplaint = async (complaintId: string) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `${API_URL}/api/complaints/${complaintId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchData();
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <p className="uppercase tracking-[0.3em] text-sm text-white/80">
              ECOLE ERP
            </p>

            <h1 className="text-5xl font-bold mt-4">Complaint Management</h1>

            <p className="mt-5 text-lg text-white/90 max-w-2xl">
              Manage complaints, assign technicians, update statuses and control
              maintenance workflow.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-6">
          {/* Total */}
          <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-gray-100">
            <p className="text-gray-500 text-sm font-medium">
              Total Complaints
            </p>

            <h2 className="text-5xl font-bold text-gray-800 mt-4">
              {complaints.length}
            </h2>
          </div>

          {/* Pending */}
          <div className="bg-yellow-50 rounded-[2rem] p-8 shadow-lg border border-yellow-100">
            <p className="text-yellow-700 text-sm font-medium">Pending</p>

            <h2 className="text-5xl font-bold text-yellow-700 mt-4">
              {complaints.filter((c) => c.status === "PENDING").length}
            </h2>
          </div>

          {/* In Progress */}
          <div className="bg-blue-50 rounded-[2rem] p-8 shadow-lg border border-blue-100">
            <p className="text-blue-700 text-sm font-medium">In Progress</p>

            <h2 className="text-5xl font-bold text-blue-700 mt-4">
              {complaints.filter((c) => c.status === "IN_PROGRESS").length}
            </h2>
          </div>

          {/* Resolved */}
          <div className="bg-green-50 rounded-[2rem] p-8 shadow-lg border border-green-100">
            <p className="text-green-700 text-sm font-medium">Resolved</p>

            <h2 className="text-5xl font-bold text-green-700 mt-4">
              {complaints.filter((c) => c.status === "RESOLVED").length}
            </h2>
          </div>

          {/* Closed */}
          <div className="bg-gray-100 rounded-[2rem] p-8 shadow-lg border border-gray-200">
            <p className="text-gray-700 text-sm font-medium">Closed</p>

            <h2 className="text-5xl font-bold text-gray-700 mt-4">
              {complaints.filter((c) => c.status === "CLOSED").length}
            </h2>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100 flex flex-col lg:flex-row gap-4 justify-between">
          <input
            type="text"
            placeholder="Search complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-blue-400 w-full lg:w-96"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-blue-400"
          >
            <option value="ALL">All Status</option>

            <option value="PENDING">Pending</option>

            <option value="ASSIGNED">Assigned</option>

            <option value="IN_PROGRESS">In Progress</option>

            <option value="RESOLVED">Resolved</option>

            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Complaints */}
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white rounded-[2rem] p-10 shadow-lg border border-gray-100">
              Loading complaints...
            </div>
          ) : (
            filteredComplaints.map((complaint) => (
              <div
                key={complaint.id}
                className="bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden"
              >
                {/* Header */}
                <div className="p-8 border-b border-gray-100">
                  <div className="flex flex-col xl:flex-row gap-8 justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-3">
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-medium ${
                            complaint.priority === "HIGH"
                              ? "bg-red-100 text-red-600"
                              : complaint.priority === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-600"
                                : complaint.priority === "URGENT"
                                  ? "bg-purple-100 text-purple-600"
                                  : "bg-green-100 text-green-600"
                          }`}
                        >
                          {complaint.priority}
                        </span>

                        <span
                          className={`px-4 py-2 rounded-full text-sm font-medium ${
                            complaint.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : complaint.status === "ASSIGNED"
                                ? "bg-cyan-100 text-cyan-700"
                                : complaint.status === "IN_PROGRESS"
                                  ? "bg-blue-100 text-blue-700"
                                  : complaint.status === "RESOLVED"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {complaint.status}
                        </span>
                      </div>

                      <div>
                        <h2 className="text-3xl font-bold text-gray-800">
                          {complaint.title}
                        </h2>

                        <p className="text-gray-500 mt-3 max-w-3xl">
                          {complaint.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>User: {complaint.user?.email}</span>

                        <span>
                          {complaint.locationType}
                          {" • "}
                          {complaint.subLocation}
                        </span>

                        <span>
                          Assigned:{" "}
                          {complaint.assignedTechnician?.name || "Not Assigned"}
                        </span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="grid md:grid-cols-2 xl:grid-cols-1 gap-4 min-w-[280px]">
                      {/* Status */}
                      <select
                        value={complaint.status}
                        onChange={(e) =>
                          updateStatus(complaint.id, e.target.value)
                        }
                        className="h-14 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
                      >
                        <option value="PENDING">PENDING</option>

                        <option value="ASSIGNED">ASSIGNED</option>

                        <option value="IN_PROGRESS">IN_PROGRESS</option>

                        <option value="RESOLVED">RESOLVED</option>

                        <option value="CLOSED">CLOSED</option>
                      </select>

                      {/* Priority */}
                      <select
                        value={complaint.priority}
                        onChange={(e) =>
                          updatePriority(complaint.id, e.target.value)
                        }
                        className="h-14 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
                      >
                        <option value="LOW">LOW</option>

                        <option value="MEDIUM">MEDIUM</option>

                        <option value="HIGH">HIGH</option>

                        <option value="URGENT">URGENT</option>
                      </select>

                      {/* Technician */}
                      <select
                        onChange={(e) =>
                          assignTechnician(complaint.id, e.target.value)
                        }
                        className="h-14 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
                      >
                        <option value="">Assign Technician</option>

                        {technicians.map((technician) => (
                          <option key={technician.id} value={technician.id}>
                            {technician.name}
                          </option>
                        ))}
                      </select>

                      {/* Delete */}
                      <button
                        onClick={() => deleteComplaint(complaint.id)}
                        className="h-14 rounded-2xl bg-red-100 text-red-600 font-semibold hover:bg-red-200 transition"
                      >
                        Delete Complaint
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
