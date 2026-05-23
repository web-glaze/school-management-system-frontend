"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

export default function ManagersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">

        <div className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-400 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">

          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <p className="uppercase tracking-[0.3em] text-sm text-white/80">
              ECOLE ERP
            </p>

            <h1 className="text-5xl font-bold mt-4">
              Managers
            </h1>

            <p className="mt-5 text-lg text-white/90">
              Manage complaint supervisors.
            </p>
          </div>
        </div>

        <div className="grid xl:grid-cols-3 gap-6">

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border">
            <p className="text-gray-500">
              Total Managers
            </p>

            <h2 className="text-5xl font-bold mt-4">
              8
            </h2>
          </div>

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border">
            <p className="text-gray-500">
              Active
            </p>

            <h2 className="text-5xl font-bold mt-4 text-green-500">
              7
            </h2>
          </div>

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border">
            <p className="text-gray-500">
              Complaints Managed
            </p>

            <h2 className="text-5xl font-bold mt-4 text-blue-500">
              320
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-lg border">

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">
              Manager List
            </h2>

            <button className="bg-gradient-to-r from-violet-600 to-pink-400 text-white px-5 py-3 rounded-2xl">
              Add Manager
            </button>
          </div>

          <div className="space-y-5">

            <div className="flex items-center justify-between p-5 rounded-2xl border">
              <div>
                <h3 className="font-semibold text-lg">
                  Aman Verma
                </h3>

                <p className="text-gray-500">
                  Electrical Department
                </p>
              </div>

              <span className="bg-green-100 text-green-700 px-5 py-2 rounded-full">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between p-5 rounded-2xl border">
              <div>
                <h3 className="font-semibold text-lg">
                  Neha Kapoor
                </h3>

                <p className="text-gray-500">
                  Hostel Maintenance
                </p>
              </div>

              <span className="bg-blue-100 text-blue-700 px-5 py-2 rounded-full">
                Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}