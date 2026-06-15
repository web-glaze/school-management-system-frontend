"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

export function LoginForm({ className, ...props }: React.ComponentProps<"form">) {
  const router = useRouter();
  const { login, loading } = useAuthStore();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login({ identifier, password });
    if (result.success) {
      toast.success("Welcome back!");
      router.push("/dashboard");
    } else {
      const errMsg = result.error || "";
      if (errMsg.toLowerCase().includes("password")) {
        toast.error("Invalid Password");
      } else if (errMsg.toLowerCase().includes("credential") || errMsg.toLowerCase().includes("user") || errMsg.toLowerCase().includes("email")) {
        toast.error("Invalid Credentials");
      } else {
        toast.error(errMsg || "Login Failed");
      }
    }
  };

  return (
    <form onSubmit={handleLogin} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="identifier">Email / Username</FieldLabel>
          <Input id="identifier" type="text" placeholder="Enter Email or Username" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" type="password" placeholder="Enter Your Password" required className="bg-background" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
        </Field>

        <div className="flex justify-end">
          <Button type="button" variant="link" className="h-auto p-0" onClick={() => router.push("/forgot-password")}>
            Forgot Password?
          </Button>
        </div>

        <Field>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing In..." : "Login"}
          </Button>
        </Field>

        <FieldDescription className="text-center"></FieldDescription>
      </FieldGroup>
    </form>
  );
}
