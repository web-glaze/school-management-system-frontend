"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

import axios from "axios";

import { useRouter } from "next/navigation";

import { useEffect, useMemo, useState } from "react";

interface Complaint {
  id: string;

  title: string;

  description: string;

  locationType: string;

  subLocation: string;

  priority: string;

  status: string;

  createdAt: string;

  user: {
    email: string;
  };
}

export default function ComplaintsPage() {
  const router = useRouter();

  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get("http://localhost:3000/api/complaints", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

     setComplaints(response.data.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");

      return;
    }

    setTimeout(() => {
      fetchComplaints();
    }, 0);
  }, [router]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const matchesSearch =
        complaint.title.toLowerCase().includes(search.toLowerCase()) ||
        complaint.subLocation.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || complaint.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" || complaint.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [complaints, search, statusFilter, priorityFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <p className="uppercase tracking-[0.3em] text-sm text-white/80">
              COMPLAINT MANAGEMENT
            </p>

            <h1 className="text-5xl font-bold mt-4">Complaints Portal</h1>

            <p className="mt-5 text-lg text-white/90 max-w-2xl">
              Manage and track all maintenance complaints raised inside the
              ECOLE ecosystem.
            </p>

            <button className="mt-8 bg-white text-blue-600 px-7 py-4 rounded-2xl font-semibold hover:bg-blue-50 transition duration-200 shadow-lg">
              Create Complaint
            </button>
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

          <div className="flex gap-4">
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

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-blue-400"
            >
              <option value="ALL">All Priority</option>

              <option value="LOW">Low</option>

              <option value="MEDIUM">Medium</option>

              <option value="HIGH">High</option>

              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-8 border-b">
            <h2 className="text-3xl font-bold text-gray-800">
              Recent Complaints
            </h2>

            <p className="text-gray-500 mt-2">
              Total Complaints: {filteredComplaints.length}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f5f7fb]">
                <tr className="text-left">
                  <th className="p-6">Complaint</th>

                  <th className="p-6">User</th>

                  <th className="p-6">Location</th>

                  <th className="p-6">Priority</th>

                  <th className="p-6">Status</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((complaint) => (
                    <tr
                      key={complaint.id}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="p-6">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {complaint.title}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            {complaint.description}
                          </p>
                        </div>
                      </td>

                      <td className="p-6 text-gray-600">
                        {complaint.user?.email}
                      </td>

                      <td className="p-6 text-gray-500">
                        {complaint.locationType}
                        {" • "}
                        {complaint.subLocation}
                      </td>

                      <td className="p-6">
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
                      </td>

                      <td className="p-6">
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-medium ${
                            complaint.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : complaint.status === "IN_PROGRESS"
                                ? "bg-blue-100 text-blue-700"
                                : complaint.status === "RESOLVED"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {complaint.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
