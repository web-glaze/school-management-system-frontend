"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

import api from "@/lib/axios";

import { useRouter } from "next/navigation";

import { useEffect, useMemo, useState } from "react";

import toast from "react-hot-toast";

interface Complaint {
  id: string;

  title: string;

  description: string;

  locationType: string;

  subLocation: string;

  priority: string;

  status: string;

  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      const response = await api.get("/api/complaints");
      const data = response.data;
      setComplaints(
        Array.isArray(data) ? data : data?.data || [],
      );
    } catch (error: unknown) {
      const msg =
        (error as { displayMessage?: string })?.displayMessage ||
        "Failed to load complaints";
      toast.error(msg);
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

  const stats = useMemo(() => {
    return {
      total: complaints.length,

      pending: complaints.filter((c) => c.status === "PENDING").length,

      completed: complaints.filter(
        (c) => c.status === "RESOLVED" || c.status === "CLOSED",
      ).length,

      inProgress: complaints.filter(
        (c) => c.status === "IN_PROGRESS" || c.status === "ASSIGNED",
      ).length,
    };
  }, [complaints]);

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

            <h1 className="text-5xl font-bold mt-4">Dashboard</h1>

            <p className="mt-5 text-lg text-white/90 max-w-2xl">
              Manage complaints, technicians, maintenance requests and monitor
              the complete ECOLE maintenance ecosystem in real-time.
            </p>

            <button className="mt-8 bg-white text-blue-600 px-7 py-4 rounded-2xl font-semibold hover:bg-blue-50 transition duration-200 shadow-lg">
              View Reports
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-gray-100">
            <p className="text-gray-500 font-medium">Total Complaints</p>

            <h2 className="text-5xl font-bold mt-4 text-gray-800">
              {stats.total}
            </h2>
          </div>

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-gray-100">
            <p className="text-gray-500 font-medium">Pending</p>

            <h2 className="text-5xl font-bold mt-4 text-yellow-500">
              {stats.pending}
            </h2>
          </div>

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-gray-100">
            <p className="text-gray-500 font-medium">Completed</p>

            <h2 className="text-5xl font-bold mt-4 text-green-500">
              {stats.completed}
            </h2>
          </div>

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-gray-100">
            <p className="text-gray-500 font-medium">In Progress</p>

            <h2 className="text-5xl font-bold mt-4 text-blue-600">
              {stats.inProgress}
            </h2>
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">
                Recent Complaints
              </h2>

              <p className="text-gray-500 mt-2">
                Latest maintenance activities
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {loading ? (
              <p>Loading...</p>
            ) : (
              complaints.slice(0, 5).map((complaint) => (
                <div
                  key={complaint.id}
                  className="flex items-center justify-between p-5 rounded-2xl border hover:bg-gray-50 transition"
                >
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      {complaint.title}
                    </h3>

                    <p className="text-gray-500 mt-1">
                      {complaint.locationType}
                      {" • "}
                      {complaint.subLocation}
                    </p>
                  </div>

                  <span
                    className={`px-5 py-2 rounded-full font-medium ${
                      complaint.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : complaint.status === "RESOLVED"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {complaint.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
