"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import BrandHero from "@/components/BrandHero";

import api from "@/lib/axios";

import { PhotoUpload, type UploadedFile } from "@/components/PhotoUpload";
import { useComplaintsStore } from "@/store/complaints-store";

import { useRouter } from "next/navigation";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import toast from "react-hot-toast";

export default function RaiseTicketPage() {
  const router = useRouter();
  const createComplaint = useComplaintsStore((s) => s.createComplaint);

  const [title, setTitle] =
    useState("");

  const [locationType, setLocationType] =
    useState("");

  const [subLocation, setSubLocation] =
    useState("");

  const [priority, setPriority] =
    useState("LOW");

  const [description, setDescription] =
    useState("");

  const [attachments, setAttachments] = useState<UploadedFile[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  // Locations loaded from /api/locations
  interface Location {
    id: string;
    name: string;
    parentId: string | null;
  }
  const [allLocations, setAllLocations] = useState<Location[]>([]);

  // Auth handled by DashboardLayout — just fetch locations
  useEffect(() => {
    api
      .get("/api/locations")
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setAllLocations(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setAllLocations([]);
      });
  }, []);

  // Top-level locations (no parent) become "locationType" options.
  // Their children become "subLocation" options.
  const topLevelLocations = useMemo(
    () => allLocations.filter((l) => !l.parentId),
    [allLocations],
  );

  const childLocations = useMemo(
    () =>
      allLocations.filter(
        (l) =>
          l.parentId ===
          allLocations.find((p) => p.name === locationType)?.id,
      ),
    [allLocations, locationType],
  );

  // Fallback hardcoded list when no locations seeded
  const hasRealLocations = topLevelLocations.length > 0;
  const FALLBACK = {
    HOSTEL: ["Room 101", "Room 102", "Room 103", "Room 104"],
    CLASS: ["Section A", "Section B", "Lab 1"],
    OFFICE: ["Admin Office", "Reception"],
  } as const;
  const fallbackSubs =
    locationType in FALLBACK
      ? FALLBACK[locationType as keyof typeof FALLBACK]
      : [];

  const isFormValid =
    title &&
    locationType &&
    subLocation &&
    priority &&
    description;

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    const created = await createComplaint({
      title,
      locationType,
      subLocation,
      priority: priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      description,
      attachments,
    });
    setLoading(false);

    if (created) {
      setSuccess(true);
      setTitle("");
      setLocationType("");
      setSubLocation("");
      setPriority("LOW");
      setDescription("");
      setAttachments([]);

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    }
  };

  const descriptionCount =
    useMemo(() => {
      return description.length;
    }, [description]);

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Hero */}
        <BrandHero
          kicker="Ecole ERP"
          title="Raise Ticket"
          subtitle="Register maintenance issues quickly and track them in real-time."
          accent="action"
        />

        {/* Success */}
        {success && (
          <div className="bg-green-100 border border-green-300 text-green-700 rounded-2xl p-5 font-medium shadow">
            Complaint registered successfully.
          </div>
        )}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-lg border border-gray-100 p-8">

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800">
                Complaint Details
              </h2>

              <p className="text-gray-500 mt-2">
                Fill in all required information carefully.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-7"
            >

              {/* Title */}
              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-700">
                  Complaint Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target.value
                    )
                  }
                  placeholder="Example: AC not working"
                  className="w-full h-14 rounded-2xl border border-gray-200 bg-[#f8fafc] px-5 outline-none focus:border-blue-400 transition"
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-700">
                  Location Type
                </label>

                <select
                  value={locationType}
                  onChange={(e) => {
                    setLocationType(
                      e.target.value
                    );

                    setSubLocation("");
                  }}
                  className="w-full h-14 rounded-2xl border border-gray-200 bg-[#f8fafc] px-5 outline-none focus:border-blue-400 transition"
                  required
                >
                  <option value="">
                    Select Location
                  </option>

                  {hasRealLocations ? (
                    topLevelLocations.map((l) => (
                      <option key={l.id} value={l.name}>
                        {l.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="HOSTEL">Hostel</option>
                      <option value="CLASS">Classroom</option>
                      <option value="OFFICE">Office</option>
                    </>
                  )}
                </select>
                {!hasRealLocations && (
                  <p className="text-xs text-amber-600 mt-2">
                    💡 Admin can add custom locations in Locations page
                  </p>
                )}
              </div>

              {/* Sub Location */}
              {locationType && (
                <div>
                  <label className="block mb-3 text-sm font-semibold text-gray-700">
                    Sub Location
                  </label>

                  <select
                    value={subLocation}
                    onChange={(e) =>
                      setSubLocation(e.target.value)
                    }
                    className="w-full h-14 rounded-2xl border border-gray-200 bg-[#f8fafc] px-5 outline-none focus:border-blue-400 transition"
                    required
                  >
                    <option value="">Select Sub Location</option>

                    {hasRealLocations
                      ? childLocations.map((l) => (
                          <option key={l.id} value={l.name}>
                            {l.name}
                          </option>
                        ))
                      : fallbackSubs.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                  </select>
                  {hasRealLocations && childLocations.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2">
                      No sub-locations under &quot;{locationType}&quot;. Admin
                      can add them in Locations page.
                    </p>
                  )}
                </div>
              )}

              {/* Priority */}
              <div>
                <label className="block mb-4 text-sm font-semibold text-gray-700">
                  Priority
                </label>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                  {[
                    "LOW",
                    "MEDIUM",
                    "HIGH",
                    "URGENT",
                  ].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setPriority(
                          item
                        )
                      }
                      className={`h-14 rounded-2xl border font-semibold transition ${
                        priority ===
                        item
                          ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                          : "bg-white text-gray-700 border-gray-200 hover:border-blue-400"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  
                  <label className="text-sm font-semibold text-gray-700">
                    Description
                  </label>

                  <span className="text-xs text-gray-400">
                    {
                      descriptionCount
                    }
                    /500
                  </span>
                </div>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value.slice(
                        0,
                        500
                      )
                    )
                  }
                  placeholder="Describe the issue in detail..."
                  className="w-full min-h-[180px] rounded-2xl border border-gray-200 bg-[#f8fafc] p-5 outline-none focus:border-blue-400 transition resize-none"
                  required
                />
              </div>

              {/* Photo attachments */}
              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-700">
                  Attach Photos (optional, max 5)
                </label>
                <PhotoUpload
                  value={attachments}
                  onChange={setAttachments}
                  max={5}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={
                  loading ||
                  !isFormValid
                }
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-700 via-violet-600 to-indigo-500 text-white font-semibold text-lg shadow-lg shadow-indigo-500/25 hover:scale-[1.01] transition duration-200 disabled:opacity-50"
              >
                {loading
                  ? "Submitting..."
                  : "Register Complaint"}
              </button>
            </form>
          </div>

          {/* Side Info */}
          <div className="space-y-6">

            <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-gray-100">
              
              <h3 className="text-2xl font-bold text-gray-800">
                Ticket Preview
              </h3>

              <div className="mt-6 space-y-5">

                <div>
                  <p className="text-sm text-gray-400">
                    Title
                  </p>

                  <p className="font-semibold text-gray-800 mt-1">
                    {title ||
                      "Not added"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">
                    Location
                  </p>

                  <p className="font-semibold text-gray-800 mt-1">
                    {locationType
                      ? `${locationType} • ${subLocation}`
                      : "Not selected"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">
                    Priority
                  </p>

                  <p className="font-semibold text-gray-800 mt-1">
                    {priority}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">
                    Photos attached
                  </p>

                  <p className="font-semibold text-gray-800 mt-1">
                    {attachments.length} photo{attachments.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-gray-100">
              
              <h3 className="text-2xl font-bold text-gray-800">
                Tips
              </h3>

              <ul className="mt-5 space-y-4 text-gray-500 text-sm">
                
                <li>
                  • Add clear complaint titles
                </li>

                <li>
                  • Mention exact location
                </li>

                <li>
                  • Explain issue properly
                </li>

                <li>
                  • Use urgent only when necessary
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}