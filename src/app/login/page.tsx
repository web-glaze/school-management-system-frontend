"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:3000/api/auth/login",
        {
          identifier: email,
          password,
        },
      );

      localStorage.setItem("token", response.data.accessToken);

      const role = response.data.user.role;

      if (role === "ADMIN") {
        router.push("/dashboard");
      } else if (role === "MANAGER") {
        router.push("/manager");
      } else {
        router.push("/portal");
      }
    } catch (error: unknown) {
      console.log(error);

      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Login Failed");
      } else {
        alert("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl bg-white rounded-[35px] overflow-hidden shadow-2xl grid lg:grid-cols-2">
        {/* LEFT PANEL */}
        <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-b from-[#005bea] to-[#00c6fb] p-14 text-white flex-col justify-between">
          {/* Decorative Circles */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full" />
          <div className="absolute bottom-0 -left-16 w-60 h-60 bg-white/10 rounded-full" />

          {/* Wave Shape */}
          <div className="absolute top-0 right-0 h-full w-32 bg-white rounded-l-[100px]" />

          <div className="relative z-10">
            <p className="text-lg font-medium mb-10">Welcome to</p>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-[#005bea] text-3xl font-bold shadow-lg">
                E
              </div>

              <h1 className="text-5xl font-bold">ECOLE</h1>
            </div>

            <p className="mt-10 text-white/90 leading-relaxed max-w-sm text-lg">
              Smart maintenance & complaint management system for students,
              technicians, managers and administrators.
            </p>
          </div>

          <div className="relative z-10 flex gap-6 text-sm text-white/80">
            <span>CREATE HERE</span>
            <span>DESIGNED HERE</span>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <h2 className="text-4xl font-bold text-[#1d1d1d]">Sign In</h2>

              <p className="mt-3 text-gray-500">
                Login to continue to your dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* EMAIL */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Email Address
                </label>

                <input
                  type="email"
                  placeholder="admin@school.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-b-2 border-gray-300 py-3 outline-none focus:border-[#005bea] transition bg-transparent"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-b-2 border-gray-300 py-3 outline-none focus:border-[#005bea] transition bg-transparent"
                />
              </div>

              {/* BUTTON */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#005bea] to-[#00c6fb] text-white py-4 rounded-full font-semibold shadow-lg hover:scale-[1.02] transition duration-200"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </div>
            </form>

            {/* DEMO CREDS */}
            <div className="mt-10 rounded-2xl bg-[#f5f7fb] border p-5">
              <p className="text-sm text-center text-gray-500">
                Demo Credentials
              </p>

              <div className="mt-3 text-center">
                <p className="font-semibold text-gray-800">
                  admin@school.local
                </p>

                <p className="text-sm text-gray-500">admin@Ecole123!!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
