"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="w-full min-h-full rounded-[2rem] bg-white border border-gray-100 shadow-sm p-10">
        
        <h1 className="text-5xl font-bold text-gray-800">
          ECOLE ERP
        </h1>

        <p className="mt-4 text-lg text-gray-500">
          Main ERP Dashboard
        </p>
      </div>
    </DashboardLayout>
  );
}