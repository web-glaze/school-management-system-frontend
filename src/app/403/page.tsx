"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { ShieldX } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-12 w-12 text-destructive" />
          </div>

          <h1 className="text-6xl font-bold tracking-tight">403</h1>

          <h2 className="mt-4 text-2xl font-semibold">
            Access Denied
          </h2>

          <p className="mt-3 text-muted-foreground">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}