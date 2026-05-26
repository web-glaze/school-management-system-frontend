"use client";

import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-[0.85fr_1.15fr]">
        {/* Left Hero */}
        <div className="flex items-center justify-center px-8 py-10">
          <div className="w-full max-w-md">
            {/* Logo */}
            <Link href="/" className="mb-10">
              <img
                src="/Ecole2.png"
                alt="Logo"
                className="h-20 object-contain"
              />
            </Link>

            <div className="my-10">
              <h2 className="text-3xl font-bold tracking-tight text-black">
                Welcome back!
              </h2>

              <p className="text-lg">
                Please enter your credentials to sign in
              </p>
            </div>

            <LoginForm />
          </div>
        </div>

        {/* Right Login */}

        <div className="hidden lg:flex p-5">
          <div className="relative flex h-full p-5 w-full flex-col items-center justify-center rounded-[28px] bg-[#e8f8fe] overflow-hidden">
            {/* Illustration */}
            <img
              src="/login-hero.svg"
              alt="Dashboard Preview"
              className="object-contain mb-14"
              width={450}
            />

            {/* Content */}
            <div className="max-w-xl text-center">
              <h1 className="text-4xl font-bold text-black leading-tight">
                Manage Your School Smarter
              </h1>

              <p className="mt-6 text-lg text-black/90 leading-8">
                Track students, manage staff, streamline operations, and create
                a better learning experience — all from one dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
