"use client";

import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">

        {/* Left - form */}
        <div className="flex items-center justify-center px-8 py-10 bg-white">
          <div className="w-full max-w-md">

            {/* Brand accent bar */}
            <div className="h-1 w-16 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 mb-10" />

            {/* Logo */}
            <Link href="/" className="block mb-8">
              <img
                src="/Ecole2.png"
                alt="Ecole ERP"
                className="h-16 object-contain"
              />
            </Link>

            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Welcome back!
              </h2>
              <p className="text-muted-foreground mt-1">
                Sign in to your account to continue
              </p>
            </div>

            <LoginForm />

            <p className="mt-8 text-center text-xs text-muted-foreground">
              {new Date().getFullYear()} Ecole School Management System
            </p>
          </div>
        </div>

        {/* Right - hero panel */}
        <div className="hidden lg:flex p-5">
          <div className="relative flex h-full w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 overflow-hidden p-10">

            {/* Background blobs */}
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-sky-200/40 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-indigo-200/40 blur-3xl pointer-events-none" />

            {/* Illustration */}
            <img
              src="/login-hero.svg"
              alt="Dashboard Preview"
              className="object-contain mb-10 relative z-10 drop-shadow-lg"
              width={420}
            />

            {/* Content */}
            <div className="max-w-md text-center relative z-10">
              <h1 className="text-3xl font-bold text-foreground leading-tight">
                Manage Your School{" "}
                <span className="text-primary">Smarter</span>
              </h1>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Track students, manage staff, streamline operations, and create
                a better learning experience - all from one dashboard.
              </p>

              {/* Feature pills */}
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {["Maintenance Tickets", "Role Management", "Technicians", "Departments"].map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center rounded-full border border-primary/20 bg-white/70 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-primary"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
