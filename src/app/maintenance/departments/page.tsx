"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

import axios from "axios";

import {
  useEffect,
  useState,
} from "react";

interface Department {
  id: string;

  name: string;

  departmentCode?: string;
}

export default function DepartmentPage() {
  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [name, setName] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [search, setSearch] =
    useState("");

  /* FETCH */
  const fetchDepartments =
    async () => {
      try {
        const token =
          localStorage.getItem(
            "token",
          );

        const response =
          await axios.get(
            "http://localhost:3000/api/departments",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

        setDepartments(
          Array.isArray(
            response.data,
          )
            ? response.data
            : response.data
                .data || [],
        );
      } catch (error) {
        console.log(error);
      }
    };

  useEffect(() => {
    setTimeout(() => {
      fetchDepartments();
    }, 0);
  }, []);

  /* CREATE */
  const createDepartment =
    async (
      e: React.FormEvent,
    ) => {
      e.preventDefault();

      try {
        setLoading(true);

        const token =
          localStorage.getItem(
            "token",
          );

        await axios.post(
          "http://localhost:3000/api/departments",
          {
            name,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setName("");

        fetchDepartments();

      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

  /* DELETE */
  const deleteDepartment =
    async (id: string) => {
      try {
        const token =
          localStorage.getItem(
            "token",
          );

        await axios.delete(
          `http://localhost:3000/api/departments/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        fetchDepartments();

      } catch (error) {
        console.log(error);
      }
    };

  /* FILTER */
  const filteredDepartments =
    departments.filter(
      (department) =>
        department.name
          .toLowerCase()
          .includes(
            search.toLowerCase(),
          ),
    );

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-10">

          <h1 className="text-5xl font-bold text-gray-800">
            Department Management
          </h1>

          <p className="mt-4 text-lg text-gray-500">
            Manage maintenance departments like electrician, carpenter, plumbing and network support.
          </p>
        </div>

        {/* Create */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">

          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Create Department
          </h2>

          <form
            onSubmit={
              createDepartment
            }
            className="flex flex-col md:flex-row gap-5"
          >

            <input
              type="text"
              placeholder="Department Name"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value,
                )
              }
              required
              className="flex-1 h-14 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
            />

            <button
              type="submit"
              disabled={loading}
              className="h-14 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-semibold shadow-lg hover:scale-[1.01] transition"
            >
              {loading
                ? "Creating..."
                : "Create"}
            </button>
          </form>
        </div>

        {/* Search */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">

          <input
            type="text"
            placeholder="Search departments..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value,
              )
            }
            className="w-full h-14 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
          />
        </div>

        {/* Departments */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

          {filteredDepartments.map(
            (
              department,
            ) => (
              <div
                key={
                  department.id
                }
                className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 hover:shadow-lg transition"
              >

                <div className="flex items-center gap-4">

                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white flex items-center justify-center font-bold shadow-lg text-xl">
                    {department.name.charAt(
                      0,
                    )}
                  </div>

                  <div>

                    <h3 className="text-xl font-bold text-gray-800">
                      {
                        department.name
                      }
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Maintenance Department
                    </p>

                    <p className="text-sm font-semibold text-blue-600 mt-2">
                      {department.departmentCode}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    deleteDepartment(
                      department.id,
                    )
                  }
                  className="mt-6 w-full h-12 rounded-2xl bg-red-100 text-red-600 font-semibold hover:bg-red-200 transition"
                >
                  Delete Department
                </button>
              </div>
            ),
          )}
        </div>

        {/* Empty */}
        {departments.length ===
          0 && (
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-16 text-center text-gray-500">
            No departments created yet.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}