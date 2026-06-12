"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import api from "@/services/api";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await api.post("/auth/forgot-password", {
        email,
      });

      toast.success("If an account exists, a reset link has been sent.");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel>Email</FieldLabel>
          <Input type="email" placeholder="Enter Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>

        <Field className="flex justify-between gap-2">
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="outline" className="gap-2 border-border/80 hover:bg-muted font-medium transition-all w-12">
                <ArrowLeft size={24} />
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </div>
        </Field>
      </FieldGroup>
    </form>
  );
}
