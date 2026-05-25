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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response =
        await axios.post(
          "http://localhost:3000/api/auth/login",
          {
            identifier: email,
            password,
          }
        );

      const user =
        response.data.data.user;

      const roles =
        user?.roles || [];

      let role = "user";

      if (
        roles.includes(
          "SUPER_ADMIN"
        )
      ) {
        role = "superadmin";
      } else if (
        roles.includes(
          "ADMIN"
        )
      ) {
        role = "admin";
      } else if (
        roles.includes(
          "MANAGER"
        )
      ) {
        role = "manager";
      }

      localStorage.setItem(
        "token",
        response.data.data
          .accessToken
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: user.id,
          email: user.email,
          role,
          roles,
        })
      );

      console.log({
        user,
        frontendRole: role,
      });

      // EVERYONE GOES HERE
      router.push("/dashboard");

    } catch (error) {
      console.log(error);

      alert("Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className={cn(
        "flex flex-col gap-6",
        className
      )}
      {...props}
    >
      <FieldGroup>
        
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">
            Sign In
          </h1>

          <p className="text-sm text-muted-foreground"></p>
        </div>

        {/* Email */}
        <Field>
          <FieldLabel htmlFor="email">
            Email
          </FieldLabel>

          <Input
            id="email"
            type="email"
            placeholder="email"
            required
            className="bg-background"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />
        </Field>

        {/* Password */}
        <Field>
          <FieldLabel htmlFor="password">
            Password
          </FieldLabel>

          <Input
            id="password"
            type="password"
            required
            className="bg-background"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
          />
        </Field>

        {/* Button */}
        <Field>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Signing In..."
              : "Login"}
          </Button>
        </Field>

        <FieldDescription className="text-center"></FieldDescription>
      </FieldGroup>
    </form>
  );
}