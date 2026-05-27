"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Department {
  id: string;
  name: string;
  departmentCode?: string | null;
  createdAt: string;
  technicians?: { id: string; name: string }[];
}

export default function DepartmentsPage() {
  const { user, loading: authLoading } = useAuth({
    allowedRoles: ["admin", "superadmin"],
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", departmentCode: "" });

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/api/departments");
      const data = res.data?.data ?? res.data;
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg =
        (err as { displayMessage?: string })?.displayMessage ||
        "Failed to load departments";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) fetchDepartments();
  }, [authLoading, user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Department name is required");
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/api/departments", {
        name: form.name,
        ...(form.departmentCode && {
          departmentCode: form.departmentCode,
        }),
      });
      toast.success(`Department "${form.name}" created`);
      setForm({ name: "", departmentCode: "" });
      setShowForm(false);
      fetchDepartments();
    } catch (err: unknown) {
      const msg =
        (err as { displayMessage?: string })?.displayMessage ||
        "Failed to create department";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Linked technicians will lose this department.`)) return;
    try {
      await api.delete(`/api/departments/${id}`);
      toast.success("Department deleted");
      fetchDepartments();
    } catch (err: unknown) {
      const msg =
        (err as { displayMessage?: string })?.displayMessage ||
        "Failed to delete department";
      toast.error(msg);
    }
  };

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">Verifying access...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader
          kicker="Departments"
          title="Maintenance Departments"
          subtitle="Organize technicians into specialized teams."
          accent="cyan"
          action={
            <button
              onClick={() => setShowForm((s) => !s)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-md"
            >
              {showForm ? "✕ Close" : "+ Add Department"}
            </button>
          }
        />

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-[2rem] p-8 shadow-lg border border-gray-100 space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-800">
              New Department
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-700">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Electrical"
                  className="w-full h-14 rounded-2xl border border-gray-200 bg-[#f8fafc] px-5 outline-none focus:border-purple-400"
                  required
                />
              </div>
              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-700">
                  Department Code (optional)
                </label>
                <input
                  type="text"
                  value={form.departmentCode}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      departmentCode: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="e.g. ELEC"
                  className="w-full h-14 rounded-2xl border border-gray-200 bg-[#f8fafc] px-5 outline-none focus:border-purple-400 uppercase"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-4 rounded-2xl font-semibold disabled:opacity-50 shadow-lg"
              >
                {submitting ? "Creating..." : "Create Department"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-gray-200 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* List */}
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            All Departments{" "}
            <span className="text-base font-normal text-gray-500">
              ({departments.length})
            </span>
          </h2>

          {loading ? (
            <p className="text-gray-400 py-8 text-center">Loading...</p>
          ) : departments.length === 0 ? (
            <p className="text-gray-400 py-12 text-center">
              No departments yet. Click &quot;+ Add Department&quot; to create one.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {departments.map((d) => (
                <div
                  key={d.id}
                  className="border border-gray-100 rounded-2xl p-6 hover:shadow-md transition bg-gradient-to-br from-purple-50/50 to-pink-50/30"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {d.name}
                      </h3>
                      {d.departmentCode && (
                        <span className="inline-block mt-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-bold">
                          {d.departmentCode}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(d.id, d.name)}
                      className="text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg text-sm"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    {d.technicians?.length ?? 0} technician
                    {(d.technicians?.length ?? 0) !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-gray-400 mt-3">
                    Created {new Date(d.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
