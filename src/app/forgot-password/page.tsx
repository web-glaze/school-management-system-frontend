import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-[0.85fr_1.15fr]">
        <div className="flex items-center justify-center px-8 py-10 relative">
          <div className="w-full max-w-md relative">
            <Link href="/" className="mb-10">
              <img src="/Ecole2.png" alt="Logo" className="h-20 object-contain" />
            </Link>

            <div className="my-10">
              <h2 className="text-3xl font-bold tracking-tight text-black">Forgot Password?</h2>

              <p className="text-lg">Enter your email to reset your password</p>
            </div>

            <div className="space-y-4">
              <ForgotPasswordForm />
            </div>
          </div>
        </div>

        <div className="hidden lg:flex p-5">
          <div className="relative flex h-full p-5 w-full flex-col items-center justify-center rounded-[28px] bg-[#e8f8fe] overflow-hidden">
            <img src="/login-hero.svg" alt="Illustration" className="object-contain mb-14" width={450} />

            <div className="max-w-xl text-center">
              <h1 className="text-4xl font-bold text-black leading-tight">Secure Account Recovery</h1>

              <p className="mt-6 text-lg text-black/90 leading-8">We&apos;ll help you regain access to your account safely and securely.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
