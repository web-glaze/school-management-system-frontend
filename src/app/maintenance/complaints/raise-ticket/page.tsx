"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

import axios from "axios";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Location {
  id: string;

  name: string;

  parentId?: string | null;
}

export default function RaiseTicketPage() {
  const [locations, setLocations] =
    useState<Location[]>([]);

  const [description, setDescription] =
    useState("");

  const [priority, setPriority] =
    useState("MEDIUM");

  const [selectedPath, setSelectedPath] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(false);

  /* FETCH LOCATIONS */
  const fetchLocations =
    async () => {
      try {
        const token =
          localStorage.getItem(
            "token"
          );

        const response =
          await axios.get(
            `${API_URL}/api/locations`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        setLocations(
          Array.isArray(
            response.data
          )
            ? response.data
            : response.data
                .data || []
        );

      } catch (error) {
        console.log(error);
      }
    };

  useEffect(() => {
    setTimeout(() => {
      fetchLocations();
    }, 0);
  }, []);

  /* GET CHILDREN */
  const getChildren = (
    parentId: string | null,
  ) => {
    return locations.filter(
      (location) =>
        location.parentId ===
        parentId
    );
  };

  /* ROOT LOCATIONS */
  const rootLocations =
    useMemo(() => {
      return getChildren(null);
    }, [locations]);

  /* SELECT LOCATION */
  const handleSelect =
    (
      level: number,
      locationId: string,
    ) => {
      const updated =
        selectedPath.slice(
          0,
          level,
        );

      updated[level] =
        locationId;

      setSelectedPath(updated);
    };

  /* BUILD LOCATION PATH */
  const locationPath =
    selectedPath
      .map((id) =>
        locations.find(
          (loc) =>
            loc.id === id,
        )?.name
      )
      .filter(Boolean)
      .join(" > ");

  /* SUBMIT */
  const handleSubmit =
    async (
      e: React.FormEvent,
    ) => {
      e.preventDefault();

      try {
        setLoading(true);

        const token =
          localStorage.getItem(
            "token"
          );

        await axios.post(
          `${API_URL}/api/complaints`,
          {

            description,

            priority,

            locationType:
              locationPath,

            subLocation:
              selectedPath[
                selectedPath.length -
                  1
              ],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        alert(
          "Complaint registered successfully",
        );

        setDescription("");
        setPriority(
          "MEDIUM",
        );
        setSelectedPath([]);

      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-10">

          <h1 className="text-5xl font-bold text-gray-800">
            Raise Ticket
          </h1>

          <p className="mt-4 text-lg text-gray-500">
            Register complaints with structured campus locations.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={
            handleSubmit
          }
          className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-8"
        >

          {/* Description */}
          <div>
            <label className="text-lg font-semibold text-gray-700">
              Description
            </label>

            <textarea
              value={
                description
              }
              onChange={(e) =>
                setDescription(
                  e.target.value,
                )
              }
              required
              placeholder="Explain the issue clearly..."
              className="mt-3 w-full min-h-[160px] rounded-2xl border border-gray-200 p-5 outline-none focus:border-blue-400"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="text-lg font-semibold text-gray-700">
              Priority
            </label>

            <select
              value={priority}
              onChange={(e) =>
                setPriority(
                  e.target.value,
                )
              }
              className="mt-3 w-full h-14 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
            >
              <option value="LOW">
                LOW
              </option>

              <option value="MEDIUM">
                MEDIUM
              </option>

              <option value="HIGH">
                HIGH
              </option>

              <option value="URGENT">
                URGENT
              </option>
            </select>
          </div>

          {/* Dynamic Locations */}
          <div className="space-y-6">

            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Select Location
              </h2>

              <p className="text-gray-500 mt-2">
                Choose the exact complaint location hierarchy.
              </p>
            </div>

            {/* Level Selectors */}
            <div className="space-y-5">

              {/* ROOT */}
              <select
                value={
                  selectedPath[0] ||
                  ""
                }
                onChange={(e) =>
                  handleSelect(
                    0,
                    e.target.value,
                  )
                }
                className="w-full h-14 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
              >
                <option value="">
                  Select Root Location
                </option>

                {rootLocations.map(
                  (
                    location,
                  ) => (
                    <option
                      key={
                        location.id
                      }
                      value={
                        location.id
                      }
                    >
                      {
                        location.name
                      }
                    </option>
                  ),
                )}
              </select>

              {/* DYNAMIC LEVELS */}
              {selectedPath.map(
                (
                  parentId,
                  index,
                ) => {
                  const children =
                    getChildren(
                      parentId,
                    );

                  if (
                    children.length ===
                    0
                  ) {
                    return null;
                  }

                  return (
                    <select
                      key={
                        parentId
                      }
                      value={
                        selectedPath[
                          index +
                            1
                        ] || ""
                      }
                      onChange={(
                        e,
                      ) =>
                        handleSelect(
                          index +
                            1,
                          e.target
                            .value,
                        )
                      }
                      className="w-full h-14 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
                    >
                      <option value="">
                        Select Sub Location
                      </option>

                      {children.map(
                        (
                          child,
                        ) => (
                          <option
                            key={
                              child.id
                            }
                            value={
                              child.id
                            }
                          >
                            {
                              child.name
                            }
                          </option>
                        ),
                      )}
                    </select>
                  );
                },
              )}
            </div>

            {/* Selected Path */}
            {locationPath && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">

                <p className="text-sm text-blue-600 font-semibold">
                  Selected Location
                </p>

                <p className="text-lg font-bold text-gray-800 mt-2">
                  {locationPath}
                </p>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="h-14 px-10 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-semibold shadow-lg hover:scale-[1.01] transition"
          >
            {loading
              ? "Submitting..."
              : "Register Complaint"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}