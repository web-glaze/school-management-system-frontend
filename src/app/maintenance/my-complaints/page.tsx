"use client";

// ✅ Centralised API layer — no direct axios calls, no token handling, no
// envelope-unwrap branches. See src/lib/api/* for the full surface.
import { api, type Complaint } from "@/lib/api";
import { logError } from "@/lib/api-helpers";
import { notify } from "@/lib/notify";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { PageHero } from "@/components/ui/PageHero";
import { imageUrl } from "@/lib/image-url";

import { useRouter } from "next/navigation";

import { useEffect, useMemo, useState } from "react";

export default function MyComplaintsPage() {
  const router = useRouter();

  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  // BEFORE: 15 lines of axios + token + try/catch + unwrap branch.
  // AFTER: one call. The centralised client handles token, baseURL, and
  // envelope unwrapping; we only handle UX (toast on error, loading flag).
  const fetchComplaints = async () => {
    try {
      const data = await api.complaints.mine();
      setComplaints(data);
    } catch (error) {
      logError("my-complaints.page", error);
      notify.error(error, "Failed to load complaints");
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
        complaint.description
          .slice(0, 60)
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        complaint.description.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || complaint.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [complaints, search, statusFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero — uses shared PageHero so sizes match dashboard */}
        <PageHero
          title="My Complaints"
          subtitle="Track all complaints you have registered and monitor their progress in real-time."
        />

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
            <div className="bg-white rounded-[2rem] p-10 shadow-lg border border-gray-100 text-center">
              Loading complaints...
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-10 shadow-lg border border-gray-100 text-center">
              <h2 className="text-base font-bold text-gray-800">
                No Complaints Found
              </h2>

              <p className="text-xs text-gray-500 mt-1.5">
                You have not registered any complaints yet.
              </p>
            </div>
          ) : (
            filteredComplaints.map((complaint) => (
              <div
                key={complaint.id}
                className="bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden"
              >
                {/* Top */}
                <div className="p-8 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <h2 className="text-base font-bold text-gray-800">
                      {complaint.description.slice(0, 60)}
                    </h2>

                    <p className="text-xs text-gray-500 mt-1.5 max-w-3xl">
                      {complaint.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium">
                        {complaint.locationType}
                        {" • "}
                        {complaint.subLocation}
                      </span>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                          complaint.priority === "HIGH"
                            ? "bg-red-100 text-red-600"
                            : complaint.priority === "MEDIUM"
                              ? "bg-yellow-100 text-yellow-700"
                              : complaint.priority === "URGENT"
                                ? "bg-purple-100 text-purple-600"
                                : "bg-green-100 text-green-700"
                        }`}
                      >
                        {complaint.priority}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        complaint.status === "PENDING"
                          ? "bg-yellow-50 text-yellow-700"
                          : complaint.status === "ASSIGNED"
                            ? "bg-cyan-50 text-cyan-700"
                            : complaint.status === "IN_PROGRESS"
                              ? "bg-blue-50 text-blue-700"
                              : complaint.status === "RESOLVED"
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {complaint.status}
                    </span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-6">
                  <h3 className="text-sm font-bold text-gray-800 mb-4">
                    Progress Timeline
                  </h3>
                  {complaint.imageUrl && (
                    <div className="mb-8">
                      <h4 className="font-bold text-gray-800 mb-3">
                        Your Uploaded Image
                      </h4>

                      <img
                        src={imageUrl(complaint.imageUrl)}
                        alt="Complaint"
                        className="rounded-2xl border max-h-80 object-cover"
                      />
                    </div>
                  )}
                  {complaint.adminImageUrl && (
                    <div className="mb-8">
                      <h4 className="font-bold text-blue-700 mb-3">
                        Admin Latest Update
                      </h4>

                      <img
                        src={imageUrl(complaint.adminImageUrl)}
                        alt="Admin Update"
                        className="rounded-2xl border max-h-80 object-cover"
                      />
                    </div>
                  )}

                  <div className="grid md:grid-cols-4 gap-5">
                    {["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED"].map(
                      (step, index) => {
                        const active =
                          [
                            "PENDING",
                            "ASSIGNED",
                            "IN_PROGRESS",
                            "RESOLVED",
                          ].indexOf(complaint.status) >= index;

                        return (
                          <div
                            key={step}
                            className={`rounded-2xl border p-5 transition ${
                              active
                                ? "bg-blue-50 border-blue-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                                active
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-200 text-gray-500"
                              }`}
                            >
                              {index + 1}
                            </div>

                            <p className="mt-4 font-semibold text-gray-800">
                              {step.replaceAll("_", " ")}
                            </p>
                          </div>
                        );
                      },
                    )}
                  </div>

                  {/* Remarks */}
                  {(complaint.managerRemark || complaint.technicianRemark) && (
                    <div className="mt-8 grid md:grid-cols-2 gap-6">
                      {complaint.managerRemark && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                          <h4 className="font-bold text-yellow-700">
                            Manager Remark
                          </h4>

                          <p className="text-gray-600 mt-3">
                            {complaint.managerRemark}
                          </p>
                        </div>
                      )}

                      {complaint.technicianRemark && (
                        <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-6">
                          <h4 className="font-bold text-cyan-700">
                            Technician Remark
                          </h4>

                          <p className="text-gray-600 mt-3">
                            {complaint.technicianRemark}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
