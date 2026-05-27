"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import BrandHero from "@/components/BrandHero";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Department {
  id: string;
  name: string;
  departmentCode?: string | null;
}

interface Technician {
  id: string;
  name: string;
  phone?: string | null;
  departmentId?: string | null;
  isActive: boolean;
  createdAt: string;
  department?: Department | null;
}

export default function TechniciansPage() {
  const { user, loading: authLoading } = useAuth({
    allowedRoles: ["admin", "superadmin", "manager"],
  });

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    departmentId: "",
  });

  const fetchData = async () => {
    try {
      const [techRes, deptRes] = await Promise.all([
        api.get("/api/technicians"),
        api.get("/api/departments"),
      ]);
      const techData = techRes.data?.data ?? techRes.data;
      const deptData = deptRes.data?.data ?? deptRes.data;
      setTechnicians(Array.isArray(techData) ? techData : []);
      setDepartments(Array.isArray(deptData) ? deptData : []);
    } catch (err: unknown) {
      const msg =
        (err as { displayMessage?: string })?.displayMessage ||
        "Failed to load data";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Technician name is required");
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/api/technicians", {
        name: form.name,
        ...(form.phone && { phone: form.phone }),
        ...(form.departmentId && { departmentId: form.departmentId }),
      });
      toast.success(`Technician "${form.name}" added`);
      setForm({ name: "", phone: "", departmentId: "" });
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { displayMessage?: string })?.displayMessage ||
        "Failed to add technician";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete technician "${name}"?`)) return;
    try {
      await api.delete(`/api/technicians/${id}`);
      toast.success("Technician deleted");
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { displayMessage?: string })?.displayMessage ||
        "Failed to delete technician";
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

  const canManage = user.role === "admin" || user.role === "superadmin";

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <BrandHero
          kicker="Maintenance · Technicians"
          title="Technicians"
          subtitle="Manage your maintenance staff and link them to departments."
          accent="green"
          action={
            canManage && (
              <button
                onClick={() => setShowForm((s) => !s)}
                className="bg-white text-indigo-900 px-6 py-3 rounded-2xl font-semibold hover:bg-indigo-50 transition-all shadow-lg shadow-black/10"
              >
                {showForm ? "✕ Close" : "+ Add Technician"}
              </button>
            )
          }
        />

        {showForm && canManage && (
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-[2rem] p-8 shadow-lg border border-gray-100 space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-800">
              New Technician
            </h2>
            <div className="grid md:grid-cols-3 gap-5">
              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-700">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Rakesh Kumar"
                  className="w-full h-14 rounded-2xl border border-gray-200 bg-[#f8fafc] px-5 outline-none focus:border-cyan-400"
                  required
                />
              </div>
              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="+91 98765 43210"
                  className="w-full h-14 rounded-2xl border border-gray-200 bg-[#f8fafc] px-5 outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-700">
                  Department
                </label>
                <select
                  value={form.departmentId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, departmentId: e.target.value }))
                  }
                  className="w-full h-14 rounded-2xl border border-gray-200 bg-[#f8fafc] px-5 outline-none focus:border-cyan-400"
                >
                  <option value="">— None —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-cyan-600 to-emerald-400 text-white px-8 py-4 rounded-2xl font-semibold disabled:opacity-50 shadow-lg"
              >
                {submitting ? "Adding..." : "Add Technician"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-gray-200 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
            {departments.length === 0 && (
              <p className="text-sm text-amber-600">
                No departments yet. Create a department first to assign one.
              </p>
            )}
          </form>
        )}

        <div className="bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800">
              All Technicians{" "}
              <span className="text-base font-normal text-gray-500">
                ({technicians.length})
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f5f7fb]">
                <tr className="text-left text-sm">
                  <th className="p-5">Name</th>
                  <th className="p-5">Phone</th>
                  <th className="p-5">Department</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Added</th>
                  {canManage && <th className="p-5">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={canManage ? 6 : 5}
                      className="p-10 text-center text-gray-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : technicians.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canManage ? 6 : 5}
                      className="p-10 text-center text-gray-400"
                    >
                      No technicians yet
                    </td>
                  </tr>
                ) : (
                  technicians.map((t) => (
                    <tr
                      key={t.id}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="p-5 font-semibold text-gray-800">
                        {t.name}
                      </td>
                      <td className="p-5 text-gray-600">{t.phone || "—"}</td>
                      <td className="p-5">
                        {t.department ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                            {t.department.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="p-5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            t.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {t.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td className="p-5 text-gray-500 text-sm">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      {canManage && (
                        <td className="p-5">
                          <button
                            onClick={() => handleDelete(t.id, t.name)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
