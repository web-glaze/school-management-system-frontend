"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

import axios from "axios";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface User {
  id: string;

  email: string;

  userRoles: {
    role: {
      name: string;
    };
  }[];
}

export default function UserPage() {
  const [users, setUsers] = useState<User[]>([]);

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [role, setRole] = useState("TEACHER");

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [passwordMap, setPasswordMap] = useState<{
    [key: string]: string;
  }>({});

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/api/user-management`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(
        Array.isArray(response.data) ? response.data : response.data.data || [],
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchUsers();
    }, 0);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/api/user-management`,
        {
          name,
          email,
          password,
          role,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setName("");
      setEmail("");
      setPassword("");
      setRole("TEACHER");

      fetchUsers();
    } catch (error: any) {
      console.log(error.response?.data);

      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (userId: string, newPassword: string) => {
    if (!newPassword) return;

    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_URL}/api/user-management/${userId}/password`,
        {
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Password updated");

      setPasswordMap((prev) => ({
        ...prev,
        [userId]: "",
      }));
    } catch (error) {
      console.log(error);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(`${API_URL}/api/user-management/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchUsers();
    } catch (error) {
      console.log(error);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-10">
          <h1 className="text-5xl font-bold text-gray-800">User Management</h1>

          <p className="mt-4 text-lg text-gray-500">
            Create and manage teachers, staff, managers and admins across the
            ERP system.
          </p>
        </div>

        {/* Create User */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Create New ID
          </h2>

          <form
            onSubmit={handleCreate}
            className="grid md:grid-cols-2 xl:grid-cols-5 gap-5"
          >
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-14 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-14 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
            />

            <input
              type="text"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-14 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-14 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
            >
              <option value="TEACHER">TEACHER</option>

              <option value="STAFF">STAFF</option>

              <option value="MANAGER">MANAGER</option>

              <option value="ADMIN">ADMIN</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-semibold shadow-lg hover:scale-[1.01] transition"
            >
              {loading ? "Creating..." : "Create ID"}
            </button>
          </form>
        </div>

        {/* Search */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
          />
        </div>

        {/* Users */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-100">
            <h2 className="text-3xl font-bold text-gray-800">Existing Users</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="p-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 hover:bg-gray-50 transition"
              >
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {user.email}
                  </h3>

                  <div className="flex flex-wrap gap-3 mt-3">
                    {user.userRoles.map((item, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-sm font-medium"
                      >
                        {item.role.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="New Password"
                    value={passwordMap[user.id] || ""}
                    onChange={(e) =>
                      setPasswordMap((prev) => ({
                        ...prev,
                        [user.id]: e.target.value,
                      }))
                    }
                    className="h-12 rounded-2xl border border-gray-200 px-5 outline-none focus:border-blue-400"
                  />

                  <button
                    onClick={() =>
                      changePassword(user.id, passwordMap[user.id])
                    }
                    className="h-12 px-6 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  >
                    Change Password
                  </button>

                  <button
                    onClick={() => deleteUser(user.id)}
                    className="h-12 px-6 rounded-2xl bg-red-100 text-red-600 font-semibold hover:bg-red-200 transition"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="p-16 text-center text-gray-500">
                No users found.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
