"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface Location {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  children?: Location[];
}

interface LocationNode extends Location {
  children: LocationNode[];
  depth: number;
}

export default function LocationsPage() {
  const { user, loading: authLoading } = useAuth({
    requiredPermissions: ["asset.manage"],
  });

  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", parentId: "" });

  // Bulk add — paste multiple names at once
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkParent, setBulkParent] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get("/api/locations");
      const data = res.data?.data ?? res.data;
      setLocations(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      toast.error(
        (err as { displayMessage?: string })?.displayMessage ||
          "Failed to load locations",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user]);

  /** Build tree from flat list. */
  const tree = useMemo<LocationNode[]>(() => {
    const map: Record<string, LocationNode> = {};
    for (const l of locations) {
      map[l.id] = { ...l, children: [], depth: 0 };
    }
    const roots: LocationNode[] = [];
    for (const l of locations) {
      const node = map[l.id];
      if (l.parentId && map[l.parentId]) {
        map[l.parentId].children.push(node);
        node.depth = map[l.parentId].depth + 1;
      } else {
        roots.push(node);
      }
    }
    // Set depths recursively
    const setDepth = (n: LocationNode, d: number) => {
      n.depth = d;
      n.children.forEach((c) => setDepth(c, d + 1));
    };
    roots.forEach((r) => setDepth(r, 0));
    return roots;
  }, [locations]);

  /** Flatten tree → list of { id, name, fullPath, depth } sorted by hierarchy. */
  const flatWithPaths = useMemo(() => {
    type Entry = { id: string; name: string; fullPath: string; depth: number };
    const out: Entry[] = [];
    const walk = (n: LocationNode, ancestors: string[]) => {
      const path = [...ancestors, n.name].join(" → ");
      out.push({ id: n.id, name: n.name, fullPath: path, depth: n.depth });
      n.children.forEach((c) => walk(c, [...ancestors, n.name]));
    };
    tree.forEach((r) => walk(r, []));
    return out;
  }, [tree]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Location name is required");
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/api/locations", {
        name: form.name,
        parentId: form.parentId || null,
      });
      toast.success(`"${form.name}" added`);
      setForm({ name: "", parentId: form.parentId });
      fetchData();
    } catch (err: unknown) {
      toast.error(
        (err as { displayMessage?: string })?.displayMessage ||
          "Failed to add location",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /** Bulk add: paste many names separated by newlines, all become children of selected parent. */
  const handleBulk = async () => {
    const names = bulkText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (names.length === 0) {
      toast.error("Paste some names (one per line)");
      return;
    }

    setBulkSubmitting(true);
    let ok = 0;
    let fail = 0;
    for (const name of names) {
      try {
        await api.post("/api/locations", {
          name,
          parentId: bulkParent || null,
        });
        ok++;
      } catch {
        fail++;
      }
    }
    setBulkSubmitting(false);

    if (ok > 0) toast.success(`Added ${ok} location${ok > 1 ? "s" : ""}`);
    if (fail > 0) toast.error(`${fail} failed`);

    setBulkText("");
    setBulkOpen(false);
    fetchData();
  };

  const handleDelete = async (loc: Location) => {
    const hasChildren = locations.some((l) => l.parentId === loc.id);
    if (hasChildren) {
      toast.error("Cannot delete — has child locations. Remove them first.");
      return;
    }
    if (!confirm(`Delete "${loc.name}"?`)) return;
    try {
      await api.delete(`/api/locations/${loc.id}`);
      toast.success("Deleted");
      fetchData();
    } catch (err: unknown) {
      toast.error(
        (err as { displayMessage?: string })?.displayMessage ||
          "Failed to delete",
      );
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
          kicker="Locations"
          title="Location Hierarchy"
          subtitle="Set up Buildings → Floors → Rooms. Used by Raise Ticket form."
          accent="gold"
        />

        {/* Form */}
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl p-5 sm:p-6 shadow-soft border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-base font-bold text-gray-800">Add Location</h2>
            <button
              type="button"
              onClick={() => setBulkOpen((s) => !s)}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              {bulkOpen ? "✕ Close bulk" : "+ Bulk add (paste list)"}
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Hostel Block A"
                className="w-full h-12 rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 outline-none focus:border-amber-400"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Parent (optional)
              </label>
              <select
                value={form.parentId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, parentId: e.target.value }))
                }
                className="w-full h-12 rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 outline-none focus:border-amber-400 text-sm"
              >
                <option value="">— Top level (no parent) —</option>
                {flatWithPaths.map((l) => (
                  <option key={l.id} value={l.id}>
                    {"  ".repeat(l.depth)}
                    {l.depth > 0 ? "↳ " : "🏢 "}
                    {l.fullPath}
                  </option>
                ))}
              </select>
              {form.parentId && (
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Adding inside:{" "}
                  <span className="font-semibold text-amber-700">
                    {flatWithPaths.find((l) => l.id === form.parentId)?.fullPath}
                  </span>
                </p>
              )}
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold disabled:opacity-50 shadow-md"
              >
                {submitting ? "Adding..." : "+ Add Location"}
              </button>
            </div>
          </div>

          {/* Bulk add panel — paste multiple names */}
          {bulkOpen && (
            <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
              <p className="text-xs text-gray-500">
                💡 Paste multiple names (one per line) — all become children of
                the selected parent. Fast way to add Room 101–120, etc.
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                    Names (one per line) *
                  </label>
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={"Room 101\nRoom 102\nRoom 103\nRoom 104"}
                    rows={6}
                    className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] p-3 text-sm font-mono outline-none focus:border-amber-400 resize-none"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                      Parent *
                    </label>
                    <select
                      value={bulkParent}
                      onChange={(e) => setBulkParent(e.target.value)}
                      className="w-full h-10 rounded-xl border border-gray-200 bg-[#f8fafc] px-3 text-sm outline-none focus:border-amber-400"
                    >
                      <option value="">— Top level —</option>
                      {flatWithPaths.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.fullPath}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleBulk}
                    disabled={bulkSubmitting}
                    className="mt-auto h-10 rounded-xl bg-teal-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-teal-700"
                  >
                    {bulkSubmitting
                      ? "Adding..."
                      : `+ Add All (${bulkText.split("\n").filter((s) => s.trim()).length})`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Tree */}
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-4">
            All Locations{" "}
            <span className="text-base font-normal text-gray-500">
              ({locations.length})
            </span>
          </h2>

          {loading ? (
            <p className="text-gray-400 py-8 text-center">Loading...</p>
          ) : tree.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-3">No locations yet</p>
              <p className="text-sm text-gray-500">
                Start by adding top-level locations like &quot;Main Building&quot;,
                &quot;Hostel Block A&quot;, etc.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {tree.map((node) => (
                <TreeNode key={node.id} node={node} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function TreeNode({
  node,
  onDelete,
}: {
  node: LocationNode;
  onDelete: (loc: Location) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-amber-50/40 transition group"
        style={{ paddingLeft: `${node.depth * 24 + 12}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setOpen((o) => !o)}
            className="w-6 h-6 rounded text-gray-500 hover:bg-amber-100"
          >
            {open ? "▼" : "▶"}
          </button>
        ) : (
          <span className="w-6 h-6 flex items-center justify-center text-gray-300">
            ·
          </span>
        )}
        <span className="text-lg">
          {node.depth === 0 ? "🏢" : node.depth === 1 ? "🚪" : "📍"}
        </span>
        <span className="flex-1 font-medium text-gray-800">{node.name}</span>
        {hasChildren && (
          <span className="text-xs text-gray-500">
            {node.children.length} child{node.children.length > 1 ? "ren" : ""}
          </span>
        )}
        <button
          onClick={() => onDelete(node)}
          className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg text-sm transition"
        >
          ✕
        </button>
      </div>
      {open &&
        node.children.map((child) => (
          <TreeNode key={child.id} node={child} onDelete={onDelete} />
        ))}
    </>
  );
}
