"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useAuthStore, type AppRole } from "@/store/auth-store";

import { Button } from "@/components/ui/button";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await api.post("/api/auth/login", {
        identifier: email,
        password,
      });

      const user = response.data?.data?.user;
      const accessToken = response.data?.data?.accessToken;
      const roles: string[] = user?.roles || [];
      const permissions: string[] = user?.permissions || [];

      if (!user || !accessToken) {
        toast.error("Invalid response from server");
        return;
      }

      // Derive primary role label for routing
      let role: AppRole = "user";
      if (roles.includes("SUPER_ADMIN")) role = "superadmin";
      else if (roles.includes("ADMIN")) role = "admin";
      else if (roles.includes("MANAGER")) role = "manager";
      else if (roles.includes("TECHNICIAN")) role = "technician";

      // Save to Zustand store (auto-persists to localStorage)
      login(accessToken, {
        id: user.id,
        email: user.email,
        role,
        roles,
        permissions,
      });

      toast.success(`Welcome back, ${user.email}`);

      // Role-based redirect
      if (role === "superadmin" || role === "admin") {
        router.push("/admin");
      } else if (role === "manager") {
        router.push("/manager");
      } else if (role === "technician") {
        router.push("/technician");
      } else {
        router.push("/dashboard");
      }
    } catch (error: unknown) {
      const message =
        (error as { displayMessage?: string })?.displayMessage ||
        "Login failed. Check your credentials.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="Enter Your Email"
            required
            className="bg-background"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            placeholder="Enter Your Password"
            required
            className="bg-background"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </Field>

        <Field>
          <Button type="submit" disabled={loading}>
            {loading ? "Signing In..." : "Login"}
          </Button>
        </Field>

        <FieldDescription className="text-center"></FieldDescription>
      </FieldGroup>
    </form>
  );
}
