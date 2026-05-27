"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

import axios from "axios";

import { useRouter } from "next/navigation";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Complaint {
  id: string;

  title: string;

  description: string;

  locationType: string;

  subLocation: string;

  priority: string;

  status: string;

  createdAt: string;

  managerRemark?: string;

  technicianRemark?: string;
}

export default function MyComplaintsPage() {
  const router = useRouter();

  const [complaints, setComplaints] =
    useState<Complaint[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const fetchComplaints =
    async () => {
      try {
        const token =
          localStorage.getItem(
            "token"
          );

        const response =
          await axios.get(
            `${API_URL}/api/complaints/my`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        setComplaints(
          Array.isArray(
            response.data
          )
            ? response.data
            : response.data
                .data || []
        );
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    const token =
      localStorage.getItem(
        "token"
      );

    if (!token) {
      router.push("/login");

      return;
    }

    setTimeout(() => {
      fetchComplaints();
    }, 0);
  }, [router]);

  const filteredComplaints =
    useMemo(() => {
      return complaints.filter(
        (complaint) => {
          const matchesSearch =
            complaint.title
              .toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||
            complaint.description
              .toLowerCase()
              .includes(
                search.toLowerCase()
              );

          const matchesStatus =
            statusFilter ===
              "ALL" ||
            complaint.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      complaints,
      search,
      statusFilter,
    ]);

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Hero */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <p className="uppercase tracking-[0.3em] text-sm text-white/80">
              ECOLE ERP
            </p>

            <h1 className="text-5xl font-bold mt-4">
              My Complaints
            </h1>

            <p className="mt-5 text-lg text-white/90 max-w-2xl">
              Track all complaints you have registered and monitor their progress in real-time.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100 flex flex-col lg:flex-row gap-4 justify-between">
          
          <input
            type="text"
            placeholder="Search complaints..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-blue-400 w-full lg:w-96"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-blue-400"
          >
            <option value="ALL">
              All Status
            </option>

            <option value="PENDING">
              Pending
            </option>

            <option value="ASSIGNED">
              Assigned
            </option>

            <option value="IN_PROGRESS">
              In Progress
            </option>

            <option value="RESOLVED">
              Resolved
            </option>

            <option value="CLOSED">
              Closed
            </option>
          </select>
        </div>

        {/* Complaints */}
        <div className="space-y-6">

          {loading ? (
            <div className="bg-white rounded-[2rem] p-10 shadow-lg border border-gray-100 text-center">
              Loading complaints...
            </div>
          ) : filteredComplaints.length ===
            0 ? (
            <div className="bg-white rounded-[2rem] p-16 shadow-lg border border-gray-100 text-center">
              
              <h2 className="text-3xl font-bold text-gray-800">
                No Complaints Found
              </h2>

              <p className="text-gray-500 mt-4">
                You have not registered any complaints yet.
              </p>
            </div>
          ) : (
            filteredComplaints.map(
              (complaint) => (
                <div
                  key={complaint.id}
                  className="bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden"
                >

                  {/* Top */}
                  <div className="p-8 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    
                    <div>
                      <h2 className="text-3xl font-bold text-gray-800">
                        {
                          complaint.title
                        }
                      </h2>

                      <p className="text-gray-500 mt-3 max-w-3xl">
                        {
                          complaint.description
                        }
                      </p>

                      <div className="flex flex-wrap gap-3 mt-5">

                        <span className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                          {
                            complaint.locationType
                          }
                          {" • "}
                          {
                            complaint.subLocation
                          }
                        </span>

                        <span
                          className={`px-4 py-2 rounded-full text-sm font-medium ${
                            complaint.priority ===
                            "HIGH"
                              ? "bg-red-100 text-red-600"
                              : complaint.priority ===
                                "MEDIUM"
                              ? "bg-yellow-100 text-yellow-600"
                              : complaint.priority ===
                                "URGENT"
                              ? "bg-purple-100 text-purple-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {
                            complaint.priority
                          }
                        </span>
                      </div>
                    </div>

                    <div>
                      <span
                        className={`px-6 py-3 rounded-2xl text-sm font-semibold ${
                          complaint.status ===
                          "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : complaint.status ===
                              "ASSIGNED"
                            ? "bg-cyan-100 text-cyan-700"
                            : complaint.status ===
                              "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-700"
                            : complaint.status ===
                              "RESOLVED"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {
                          complaint.status
                        }
                      </span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="p-8">

                    <h3 className="text-xl font-bold text-gray-800 mb-6">
                      Progress Timeline
                    </h3>

                    <div className="grid md:grid-cols-4 gap-5">

                      {[
                        "PENDING",
                        "ASSIGNED",
                        "IN_PROGRESS",
                        "RESOLVED",
                      ].map(
                        (
                          step,
                          index
                        ) => {
                          const active =
                            [
                              "PENDING",
                              "ASSIGNED",
                              "IN_PROGRESS",
                              "RESOLVED",
                            ].indexOf(
                              complaint.status
                            ) >=
                            index;

                          return (
                            <div
                              key={step}
                              className={`rounded-2xl border p-5 transition ${
                                active
                                  ? "bg-blue-50 border-blue-200"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <div
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                                  active
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-500"
                                }`}
                              >
                                {index + 1}
                              </div>

                              <p className="mt-4 font-semibold text-gray-800">
                                {step.replaceAll(
                                  "_",
                                  " "
                                )}
                              </p>
                            </div>
                          );
                        }
                      )}
                    </div>

                    {/* Remarks */}
                    {(complaint.managerRemark ||
                      complaint.technicianRemark) && (
                      <div className="mt-8 grid md:grid-cols-2 gap-6">

                        {complaint.managerRemark && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                            
                            <h4 className="font-bold text-yellow-700">
                              Manager Remark
                            </h4>

                            <p className="text-gray-600 mt-3">
                              {
                                complaint.managerRemark
                              }
                            </p>
                          </div>
                        )}

                        {complaint.technicianRemark && (
                          <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-6">
                            
                            <h4 className="font-bold text-cyan-700">
                              Technician Remark
                            </h4>

                            <p className="text-gray-600 mt-3">
                              {
                                complaint.technicianRemark
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}