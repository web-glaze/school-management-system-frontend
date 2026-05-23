"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
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

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <p className="uppercase tracking-[0.3em] text-sm text-white/80">
              ECOLE ERP
            </p>

            <h1 className="text-5xl font-bold mt-4">
              Admin Dashboard
            </h1>

            <p className="mt-5 text-lg text-white/90 max-w-2xl">
              Manage complaints, technicians,
              maintenance requests and monitor
              the complete ECOLE maintenance
              ecosystem in real-time.
            </p>

            <button className="mt-8 bg-white text-blue-600 px-7 py-4 rounded-2xl font-semibold hover:bg-blue-50 transition duration-200 shadow-lg">
              View Reports
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-6">

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-gray-100 hover:-translate-y-1 transition duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium">
                  Total Complaints
                </p>

                <h2 className="text-5xl font-bold mt-4 text-gray-800">
                  120
                </h2>
              </div>

              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-400" />
            </div>

            <p className="mt-5 text-sm text-green-500 font-medium">
              +12% this month
            </p>
          </div>

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-gray-100 hover:-translate-y-1 transition duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium">
                  Pending
                </p>

                <h2 className="text-5xl font-bold mt-4 text-yellow-500">
                  32
                </h2>
              </div>

              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500" />
            </div>

            <p className="mt-5 text-sm text-yellow-500 font-medium">
              Needs attention
            </p>
          </div>

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-gray-100 hover:-translate-y-1 transition duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium">
                  Completed
                </p>

                <h2 className="text-5xl font-bold mt-4 text-green-500">
                  88
                </h2>
              </div>

              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-600" />
            </div>

            <p className="mt-5 text-sm text-green-500 font-medium">
              Successfully resolved
            </p>
          </div>

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-gray-100 hover:-translate-y-1 transition duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium">
                  Technicians
                </p>

                <h2 className="text-5xl font-bold mt-4 text-blue-600">
                  14
                </h2>
              </div>

              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-500" />
            </div>

            <p className="mt-5 text-sm text-blue-500 font-medium">
              Active workers
            </p>
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

            <button className="bg-gradient-to-r from-blue-600 to-cyan-400 text-white px-5 py-3 rounded-2xl font-medium shadow-md hover:scale-105 transition">
              View All
            </button>
          </div>

          <div className="space-y-5">

            <div className="flex items-center justify-between p-5 rounded-2xl border hover:bg-gray-50 transition">
              <div>
                <h3 className="font-semibold text-lg text-gray-800">
                  AC Repair Complaint
                </h3>

                <p className="text-gray-500 mt-1">
                  Block A • Room 203
                </p>
              </div>

              <span className="bg-yellow-100 text-yellow-700 px-5 py-2 rounded-full font-medium">
                Pending
              </span>
            </div>

            <div className="flex items-center justify-between p-5 rounded-2xl border hover:bg-gray-50 transition">
              <div>
                <h3 className="font-semibold text-lg text-gray-800">
                  Water Leakage
                </h3>

                <p className="text-gray-500 mt-1">
                  Hostel B • Floor 2
                </p>
              </div>

              <span className="bg-green-100 text-green-700 px-5 py-2 rounded-full font-medium">
                Completed
              </span>
            </div>

            <div className="flex items-center justify-between p-5 rounded-2xl border hover:bg-gray-50 transition">
              <div>
                <h3 className="font-semibold text-lg text-gray-800">
                  WiFi Issue
                </h3>

                <p className="text-gray-500 mt-1">
                  Library • 1st Floor
                </p>
              </div>

              <span className="bg-blue-100 text-blue-700 px-5 py-2 rounded-full font-medium">
                In Progress
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}