"use client";

import { useEffect, useState } from "react";
import { ResetPasswordForm } from "@/components/reset-password-form";
import api from "@/services/api";

interface ResetPasswordContentProps {
  token?: string;
}

export default function ResetPasswordContent({ token }: ResetPasswordContentProps) {
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        return;
      }

      try {
        const response = await api.get(`/auth/validate-reset-token?token=${encodeURIComponent(token)}`);

        setTokenValid(response.data.data.valid);
      } catch {
        setTokenValid(false);
      }
    };

    validateToken();
  }, [token]);

  return (
    <div className="min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-[0.85fr_1.15fr]">
        <div className="flex items-center justify-center px-8 py-10">
          <div className="w-full max-w-md">
            <img src="/Ecole2.png" alt="Logo" className="h-20 object-contain" />

            {tokenValid === null ? (
              <div className="my-10">
                <h2 className="text-3xl font-bold tracking-tight text-black">Checking Link...</h2>
              </div>
            ) : tokenValid ? (
              <>
                <div className="my-10">
                  <h2 className="text-3xl font-bold tracking-tight text-black">Reset Password</h2>

                  <p className="text-lg">Enter your new password below.</p>
                </div>

                <ResetPasswordForm token={token} />
              </>
            ) : (
              <div className="my-10 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-black">Link Expired</h2>

                <p className="mt-4 text-lg text-muted-foreground">This password reset link is invalid, expired, or has already been used.</p>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex p-5">
          <div className="relative flex h-full p-5 w-full flex-col items-center justify-center rounded-[28px] bg-[#e8f8fe] overflow-hidden">
            <img src="/login-hero.svg" alt="Illustration" className="object-contain mb-14" width={450} />
          </div>
        </div>
      </div>
    </div>
  );
}
