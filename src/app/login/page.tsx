"use client";

import { LoginForm } from "@/components/login-form";
import Link from "next/link";



export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">

  {/* Left */}
  <div className="flex flex-col gap-4 p-6 md:p-10">

    <Link
      href="/"
      className="flex items-center gap-2 font-medium"
    >
      <div className="flex items-center justify-center rounded-md">
        
        <img
          src="/Ecole2.png"
          alt="Ecole"
          className="h-20 w-auto object-contain"
        />
      </div>
    </Link>

    <div className="flex flex-1 items-center justify-center">
      
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  </div>

  {/* Right */}
  <div className="relative hidden bg-muted lg:block">
    
    <img
      src="/Ecole5.jpg"
      alt="Login"
      className="absolute inset-0 h-full w-full object-cover"
    />
  </div>
</div>
  );
}