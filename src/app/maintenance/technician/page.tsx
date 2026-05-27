"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

import axios from "axios";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Department {
  id: string;

  name: string;

  departmentCode?: string;
}

interface Technician {
  id: string;

  name: string;

  phone?: string;

  isActive: boolean;

  department?: {
    id: string;

    name: string;

    departmentCode?: string;
  };
}

export default function TechnicianPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  const [departments, setDepartments] = useState<Department[]>([]);

  const [name, setName] = useState("");

  const [phone, setPhone] = useState("");

  const [departmentId, setDepartmentId] = useState("");

  const [loading, setLoading] = useState(false);

  /* FETCH TECHNICIANS */
  const fetchTechnicians = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${API_URL}/api/technicians`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setTechnicians(
        Array.isArray(response.data) ? response.data : response.data.data || [],
      );
    } catch (error) {
      console.log(error);
    }
  };

  /* FETCH DEPARTMENTS */
  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${API_URL}/api/departments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setDepartments(
        Array.isArray(response.data) ? response.data : response.data.data || [],
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchTechnicians();

      fetchDepartments();
    }, 0);
  }, []);

  /* CREATE */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/api/technicians`,
        {
          name,

          phone,

          departmentId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setName("");
      setPhone("");
      setDepartmentId("");

      fetchTechnicians();
    } catch (error) {
      console.log(error);

      alert("Failed to add technician");
    } finally {
      setLoading(false);
    }
  };

  /* DELETE */
  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(`${API_URL}/api/technicians/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchTechnicians();
    } catch (error) {
      console.log(error);
    }
  };

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

            <h1 className="text-5xl font-bold mt-4">Technician Management</h1>

            <p className="mt-5 text-lg text-white/90 max-w-2xl">
              Manage maintenance technicians and assign departments for
              complaint workflows.
            </p>
          </div>
        </div>

        {/* Add Technician */}
        <div className="bg-white rounded-[2rem] shadow-lg border border-gray-100 p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Add Technician</h2>

            <p className="text-gray-500 mt-2">
              Create technician profiles and connect them to maintenance
              departments.
            </p>
          </div>

          <form onSubmit={handleCreate} className="grid md:grid-cols-4 gap-5">
            <input
              type="text"
              placeholder="Technician Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-14 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
            />

            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              maxLength={10}
              className="h-14 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
            />

            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required
              className="h-14 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
            >
              <option value="">Select Department</option>

              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name} ({department.departmentCode})
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={loading}
              className="h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-semibold shadow-lg hover:scale-[1.01] transition"
            >
              {loading ? "Adding..." : "Add Technician"}
            </button>
          </form>
        </div>

        {/* Technician List */}
        <div className="bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100">
            <h2 className="text-3xl font-bold text-gray-800">
              Technician List
            </h2>

            <p className="text-gray-500 mt-2">
              Active technicians available for complaint assignments.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f5f7fb]">
                <tr>
                  <th className="p-6 text-left">Name</th>

                  <th className="p-6 text-left">Phone</th>

                  <th className="p-6 text-left">Department</th>

                  <th className="p-6 text-left">Department ID</th>

                  <th className="p-6 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {technicians.map((technician) => (
                  <tr
                    key={technician.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="p-6 font-semibold text-gray-800">
                      {technician.name}
                    </td>

                    <td className="p-6 text-gray-600">
                      {technician.phone || "-"}
                    </td>

                    <td className="p-6">
                      <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                        {technician.department?.name || "No Department"}
                      </span>
                    </td>

                    <td className="p-6 text-gray-600 font-medium">
                      {technician.department?.departmentCode || "-"}
                    </td>

                    <td className="p-6">
                      <button
                        onClick={() => handleDelete(technician.id)}
                        className="px-5 py-2 rounded-xl bg-red-100 text-red-600 font-medium hover:bg-red-200 transition"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
