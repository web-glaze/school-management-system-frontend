"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PortalPage() {
  const router = useRouter();

  const [locationType, setLocationType] = useState("");

  const [subLocation, setSubLocation] = useState("");

  const [priority, setPriority] = useState("LOW");

  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const hostelRooms = ["Room 101", "Room 102", "Room 103", "Room 104"];

  const classSections = ["Section A", "Section B", "Section C"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      console.log(localStorage.getItem("token"));

      await axios.post(
        "http://localhost:3000/api/complaints",
        {
          locationType,
          subLocation,
          priority,
          description,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      alert("Complaint Registered Successfully");

      setLocationType("");
      setSubLocation("");
      setPriority("LOW");
      setDescription("");
    } catch (error) {
      console.log(error);

      alert("Failed To Register Complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 p-10 text-white">
          <p className="uppercase tracking-[0.3em] text-sm text-white/80">
            ECOLE ERP
          </p>

          <h1 className="text-5xl font-bold mt-4">Complaint Portal</h1>

          <p className="mt-4 text-white/90 text-lg">
            Register maintenance issues quickly and efficiently.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-10 space-y-7">
          {/* Location */}
          <div>
            <label className="block mb-3 text-sm font-semibold text-gray-700">
              Location
            </label>

            <select
              value={locationType}
              onChange={(e) => {
                setLocationType(e.target.value);

                setSubLocation("");
              }}
              className="w-full h-14 rounded-2xl border border-gray-200 bg-[#f8fafc] px-5 outline-none focus:border-blue-400 transition"
              required
            >
              <option value="">Select Location</option>

              <option value="HOSTEL">Hostel</option>

              <option value="CLASS">Classroom</option>
            </select>
          </div>

          {/* Sub Location */}
          {locationType && (
            <div>
              <label className="block mb-3 text-sm font-semibold text-gray-700">
                Sub Location
              </label>

              <select
                value={subLocation}
                onChange={(e) => setSubLocation(e.target.value)}
                className="w-full h-14 rounded-2xl border border-gray-200 bg-[#f8fafc] px-5 outline-none focus:border-blue-400 transition"
                required
              >
                <option value="">Select Sub Location</option>

                {locationType === "HOSTEL" &&
                  hostelRooms.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}

                {locationType === "CLASS" &&
                  classSections.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block mb-3 text-sm font-semibold text-gray-700">
              Priority
            </label>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full h-14 rounded-2xl border border-gray-200 bg-[#f8fafc] px-5 outline-none focus:border-blue-400 transition"
            >
              <option value="LOW">Low</option>

              <option value="MEDIUM">Medium</option>

              <option value="HIGH">High</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-3 text-sm font-semibold text-gray-700">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue..."
              className="w-full min-h-[160px] rounded-2xl border border-gray-200 bg-[#f8fafc] p-5 outline-none focus:border-blue-400 transition resize-none"
              required
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 text-white font-semibold text-lg shadow-lg hover:scale-[1.01] transition duration-200"
          >
            {loading ? "Submitting..." : "Register Complaint"}
          </button>
        </form>
      </div>
<div className="mt-10">
        <button
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-4 rounded-2xl font-semibold transition duration-200"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}