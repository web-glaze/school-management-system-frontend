"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PortalPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [priority, setPriority] =
    useState("LOW");

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setLoading(true);

      const token =
        localStorage.getItem("token");

      await axios.post(
        "http://localhost:3000/api/complaints",
        {
          title,
          description,
          location,
          priority,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Complaint Submitted");

      setTitle("");
      setDescription("");
      setLocation("");
      setPriority("LOW");
    } catch (error) {
      console.log(error);

      alert("Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 rounded-[2rem] p-10 text-white shadow-2xl">
          <h1 className="text-5xl font-bold">
            Complaint Portal
          </h1>

          <p className="mt-4 text-lg text-white/90">
            Register your maintenance
            complaints here.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-gray-100">
          
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Create Complaint
          </h2>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Complaint Title
              </label>

              <input
                type="text"
                placeholder="Enter complaint title"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                className="w-full border border-gray-200 rounded-2xl p-4 outline-none focus:border-blue-400"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Description
              </label>

              <textarea
                placeholder="Describe the issue..."
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                className="w-full border border-gray-200 rounded-2xl p-4 outline-none focus:border-blue-400 min-h-[150px]"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Location
              </label>

              <input
                type="text"
                placeholder="Room / Block / Floor"
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
                className="w-full border border-gray-200 rounded-2xl p-4 outline-none focus:border-blue-400"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Priority
              </label>

              <select
                value={priority}
                onChange={(e) =>
                  setPriority(
                    e.target.value
                  )
                }
                className="w-full border border-gray-200 rounded-2xl p-4 outline-none focus:border-blue-400"
              >
                <option value="LOW">
                  Low
                </option>

                <option value="MEDIUM">
                  Medium
                </option>

                <option value="HIGH">
                  High
                </option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-cyan-400 text-white px-8 py-4 rounded-2xl font-semibold hover:scale-105 transition"
            >
              {loading
                ? "Submitting..."
                : "Submit Complaint"}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}