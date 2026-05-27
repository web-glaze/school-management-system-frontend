"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

import axios from "axios";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Location {
  id: string;

  name: string;

  parentId?: string | null;
}

export default function LocationPage() {
  const [locations, setLocations] = useState<Location[]>([]);

  const [rootName, setRootName] = useState("");

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [subLocationMap, setSubLocationMap] = useState<{
    [key: string]: string;
  }>({});

  /* FETCH */
  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/api/locations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLocations(
        Array.isArray(response.data) ? response.data : response.data.data || [],
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

  /* CREATE */
  const createLocation = async (name: string, parentId?: string) => {
    if (!name) return;

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/api/locations`,
        {
          name,

          parentId: parentId || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchLocations();
    } catch (error) {
      console.log(error);
    }
  };

  /* DELETE */
  const deleteLocation = async (id: string) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(`${API_URL}/api/locations/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchLocations();
    } catch (error) {
      console.log(error);
    }
  };

  /* CHILDREN */
  const getChildren = (parentId: string | null) => {
    return locations.filter((location) => location.parentId === parentId);
  };

  /* TREE */
  const renderTree = (parentId: string | null = null, level = 0) => {
    return getChildren(parentId)
      .filter((location) =>
        location.name.toLowerCase().includes(search.toLowerCase()),
      )
      .map((location) => (
        <div key={location.id} className="space-y-4">
          <div
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            style={{
              marginLeft: level * 35,
            }}
          >
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
              <div className="flex-1">
                {/* Title */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold shadow-lg">
                    {location.name.charAt(0)}
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {location.name}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Nested Location
                    </p>
                  </div>
                </div>

                {/* Add Sublocation */}
                <div className="flex flex-col md:flex-row gap-4 mt-6">
                  <input
                    type="text"
                    placeholder="Add sub location..."
                    value={subLocationMap[location.id] || ""}
                    onChange={(e) =>
                      setSubLocationMap((prev) => ({
                        ...prev,

                        [location.id]: e.target.value,
                      }))
                    }
                    className="flex-1 h-12 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
                  />

                  <button
                    onClick={async () => {
                      await createLocation(
                        subLocationMap[location.id],
                        location.id,
                      );

                      setSubLocationMap((prev) => ({
                        ...prev,

                        [location.id]: "",
                      }));
                    }}
                    className="h-12 px-6 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  >
                    Add Sub Location
                  </button>
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => deleteLocation(location.id)}
                className="h-12 px-6 rounded-2xl bg-red-100 text-red-600 font-semibold hover:bg-red-200 transition"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Children */}
          {renderTree(location.id, level + 1)}
        </div>
      ));
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-10">
          <h1 className="text-5xl font-bold text-gray-800">
            Location Management
          </h1>

          <p className="mt-4 text-lg text-gray-500">
            Create unlimited nested campus locations for complaints and
            maintenance tracking.
          </p>
        </div>

        {/* Root */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Create Root Location
          </h2>

          <div className="flex flex-col md:flex-row gap-5">
            <input
              type="text"
              placeholder="Location Name"
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              className="flex-1 h-14 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
            />

            <button
              onClick={async () => {
                setLoading(true);

                await createLocation(rootName);

                setRootName("");

                setLoading(false);
              }}
              className="h-14 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-semibold shadow-lg hover:scale-[1.01] transition"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <input
            type="text"
            placeholder="Search locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
          />
        </div>

        {/* Tree */}
        <div className="space-y-5">{renderTree()}</div>

        {/* Empty */}
        {locations.length === 0 && (
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-16 text-center text-gray-500">
            No locations created yet.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
