"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

export default function UsersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Hero */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">

          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <p className="uppercase tracking-[0.3em] text-sm text-white/80">
              ECOLE ERP
            </p>

            <h1 className="text-5xl font-bold mt-4">
              Users
            </h1>

            <p className="mt-5 text-lg text-white/90 max-w-2xl">
              Manage students and portal users.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid xl:grid-cols-3 md:grid-cols-2 gap-6">

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border">
            <p className="text-gray-500 font-medium">
              Total Users
            </p>

            <h2 className="text-5xl font-bold mt-4 text-gray-800">
              1,240
            </h2>
          </div>

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border">
            <p className="text-gray-500 font-medium">
              Active
            </p>

            <h2 className="text-5xl font-bold mt-4 text-green-500">
              1,102
            </h2>
          </div>

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border">
            <p className="text-gray-500 font-medium">
              Blocked
            </p>

            <h2 className="text-5xl font-bold mt-4 text-red-500">
              18
            </h2>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border">

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              Recent Users
            </h2>

            <button className="bg-gradient-to-r from-indigo-600 to-cyan-400 text-white px-5 py-3 rounded-2xl font-medium">
              Add User
            </button>
          </div>

          <div className="space-y-5">

            <div className="flex items-center justify-between p-5 rounded-2xl border">
              <div>
                <h3 className="font-semibold text-lg">
                  Rahul Sharma
                </h3>

                <p className="text-gray-500">
                  rahul@school.local
                </p>
              </div>

              <span className="bg-green-100 text-green-700 px-5 py-2 rounded-full">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between p-5 rounded-2xl border">
              <div>
                <h3 className="font-semibold text-lg">
                  Priya Singh
                </h3>

                <p className="text-gray-500">
                  priya@school.local
                </p>
              </div>

              <span className="bg-yellow-100 text-yellow-700 px-5 py-2 rounded-full">
                Pending
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}