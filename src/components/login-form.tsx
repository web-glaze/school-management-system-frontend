"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await axios.post(`${API_URL}/api/auth/login`, {
        identifier: email,
        password,
      });

      const user = response.data.data.user;

      const roles = user?.roles || [];

      let role = "user";

      if (roles.includes("SUPER_ADMIN")) {
        role = "superadmin";
      } else if (roles.includes("ADMIN")) {
        role = "admin";
      } else if (roles.includes("MANAGER")) {
        role = "manager";
      }

      localStorage.setItem("token", response.data.data.accessToken);

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: user.id,
          email: user.email,
          role,
          roles,
        }),
      );

      console.log({
        user,
        frontendRole: role,
      });

      // EVERYONE GOES HERE
      router.push("/dashboard");
    } catch (error: unknown) {
      console.log(error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : null;

      if (typeof message === "string") {
        if (message.toLowerCase().includes("password")) {
          alert("Invalid Password");
        } else if (
          message.toLowerCase().includes("credential") ||
          message.toLowerCase().includes("user") ||
          message.toLowerCase().includes("email")
        ) {
          alert("Invalid Credentials");
        } else {
          alert(message);
        }
      } else {
        alert("Login Failed");
      }
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
        {/* Email */}
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
          />
        </Field>

        {/* Password */}
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
          />
        </Field>

        {/* Button */}
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
