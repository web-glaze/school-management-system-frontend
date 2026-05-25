"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

export default function ManagerDashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* HERO SECTION */}
        <div className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-400 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">

          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <p className="uppercase tracking-[0.3em] text-sm text-white/80">
              ECOLE MAINTENANCE PORTAL
            </p>

            <h1 className="text-5xl font-bold mt-4">
              Manager Dashboard
            </h1>

            <p className="mt-5 text-lg text-white/90">
              Track complaints and assign technicians efficiently.
            </p>
          </div>
        </div>

        {/* STATS */}
        <div className="grid xl:grid-cols-4 gap-6">

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border">
            <p className="text-gray-500">
              Total Complaints
            </p>

            <h2 className="text-5xl font-bold mt-4">
              124
            </h2>
          </div>

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border">
            <p className="text-gray-500">
              Pending
            </p>

            <h2 className="text-5xl font-bold mt-4 text-yellow-500">
              18
            </h2>
          </div>

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border">
            <p className="text-gray-500">
              In Progress
            </p>

            <h2 className="text-5xl font-bold mt-4 text-blue-500">
              32
            </h2>
          </div>

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border">
            <p className="text-gray-500">
              Resolved
            </p>

            <h2 className="text-5xl font-bold mt-4 text-green-500">
              74
            </h2>
          </div>
        </div>

        {/* RECENT COMPLAINTS */}
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border">

          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">
                Recent Complaints
              </h2>

              <p className="text-gray-500 mt-1">
                Assign technicians and track issue progress.
              </p>
            </div>
          </div>

          <div className="space-y-5">

            {/* Complaint 1 */}
            <div className="flex items-center justify-between p-5 rounded-2xl border hover:shadow-md transition">

              <div>
                <h3 className="font-semibold text-lg">
                  Water Leakage in Hostel Block A
                </h3>

                <p className="text-gray-500 mt-1">
                  Reported by Rahul Sharma
                </p>
              </div>

              <div className="flex items-center gap-4">

                <span className="bg-yellow-100 text-yellow-700 px-5 py-2 rounded-full">
                  Pending
                </span>

                <button className="bg-violet-600 text-white px-5 py-2 rounded-xl hover:bg-violet-700 transition">
                  Assign
                </button>
              </div>
            </div>

            {/* Complaint 2 */}
            <div className="flex items-center justify-between p-5 rounded-2xl border hover:shadow-md transition">

              <div>
                <h3 className="font-semibold text-lg">
                  Electrical Issue in Lab 3
                </h3>

                <p className="text-gray-500 mt-1">
                  Reported by Priya Singh
                </p>
              </div>

              <div className="flex items-center gap-4">

                <span className="bg-blue-100 text-blue-700 px-5 py-2 rounded-full">
                  In Progress
                </span>

                <button className="bg-violet-600 text-white px-5 py-2 rounded-xl hover:bg-violet-700 transition">
                  View
                </button>
              </div>
            </div>

            {/* Complaint 3 */}
            <div className="flex items-center justify-between p-5 rounded-2xl border hover:shadow-md transition">

              <div>
                <h3 className="font-semibold text-lg">
                  Broken Fan in Classroom 204
                </h3>

                <p className="text-gray-500 mt-1">
                  Reported by Ankit Verma
                </p>
              </div>

              <div className="flex items-center gap-4">

                <span className="bg-green-100 text-green-700 px-5 py-2 rounded-full">
                  Resolved
                </span>

                <button className="bg-gray-900 text-white px-5 py-2 rounded-xl hover:bg-black transition">
                  Details
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}