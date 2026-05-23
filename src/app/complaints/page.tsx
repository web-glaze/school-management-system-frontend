"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const complaints = [
  {
    id: "#1021",
    title: "AC Repair Complaint",
    location: "Block A • Room 203",
    status: "Pending",
    priority: "High",
  },
  {
    id: "#1022",
    title: "Water Leakage",
    location: "Hostel B • Floor 2",
    status: "Completed",
    priority: "Medium",
  },
  {
    id: "#1023",
    title: "WiFi Issue",
    location: "Library • 1st Floor",
    status: "In Progress",
    priority: "Low",
  },
  {
    id: "#1024",
    title: "Broken Chair",
    location: "Classroom C12",
    status: "Pending",
    priority: "Low",
  },
];

export default function ComplaintsPage() {
  const router = useRouter();

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      router.push("/login");
    }
  }, [router]);

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

            <h1 className="text-5xl font-bold mt-4">
              Complaints Portal
            </h1>

            <p className="mt-5 text-lg text-white/90 max-w-2xl">
              Manage and track all maintenance
              complaints raised inside the
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
            className="border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-blue-400 w-full lg:w-96"
          />

          <div className="flex gap-4">
            <select className="border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-blue-400">
              <option>All Status</option>
              <option>Pending</option>
              <option>Completed</option>
              <option>In Progress</option>
            </select>

            <select className="border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-blue-400">
              <option>All Priority</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden">

          <div className="p-8 border-b">
            <h2 className="text-3xl font-bold text-gray-800">
              Recent Complaints
            </h2>

            <p className="text-gray-500 mt-2">
              Monitor all complaint activities
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">

              <thead className="bg-[#f5f7fb]">
                <tr className="text-left">
                  <th className="p-6 text-gray-600 font-semibold">
                    Ticket ID
                  </th>

                  <th className="p-6 text-gray-600 font-semibold">
                    Complaint
                  </th>

                  <th className="p-6 text-gray-600 font-semibold">
                    Location
                  </th>

                  <th className="p-6 text-gray-600 font-semibold">
                    Priority
                  </th>

                  <th className="p-6 text-gray-600 font-semibold">
                    Status
                  </th>

                  <th className="p-6 text-gray-600 font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {complaints.map((complaint) => (
                  <tr
                    key={complaint.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="p-6 font-semibold text-blue-600">
                      {complaint.id}
                    </td>

                    <td className="p-6 font-semibold text-gray-800">
                      {complaint.title}
                    </td>

                    <td className="p-6 text-gray-500">
                      {complaint.location}
                    </td>

                    <td className="p-6">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          complaint.priority ===
                          "High"
                            ? "bg-red-100 text-red-600"
                            : complaint.priority ===
                              "Medium"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {complaint.priority}
                      </span>
                    </td>

                    <td className="p-6">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          complaint.status ===
                          "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : complaint.status ===
                              "Completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {complaint.status}
                      </span>
                    </td>

                    <td className="p-6">
                      <button className="bg-gradient-to-r from-blue-600 to-cyan-400 text-white px-5 py-2 rounded-xl font-medium hover:scale-105 transition">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}