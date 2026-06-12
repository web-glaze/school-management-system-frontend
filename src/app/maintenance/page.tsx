// "use client";

// import DashboardLayout from "@/components/layout/DashboardLayout";

// import Link from "next/link";

// export default function MaintenancePage() {
//   const storedUser =
//     typeof window !== "undefined" ? localStorage.getItem("user") : null;

//   const user = storedUser ? JSON.parse(storedUser) : null;

//   const role = user?.role || "user";

//   const userCards = [
//     {
//       title: "Raise Ticket",
//       description: "Register a new complaint.description.slice(0, 60) quickly.",
//       href: "/maintenance/complaints/raise-ticket",
//     },

//     {
//       title: "My Complaints",
//       description: "Track status and progress of your complaints.",
//       href: "/maintenance/my-complaints",
//     },
//   ];

//   const managerCards = [
//     {
//       title: "Complaint Management",
//       description: "Assign technicians and manage complaint workflow.",
//       href: "/maintenance/complaints",
//     },

//     {
//       title: "Technician Management",
//       description: "View and manage maintenance technicians.",
//       href: "/maintenance/technician",
//     },

//     {
//       title: "Raise Ticket",
//       description: "Register complaints on behalf of departments.",
//       href: "/maintenance/complaints/raise-ticket",
//     },
//     {
//       title: "My Complaints",
//       description: "Track status and progress of your complaints.",
//       href: "/maintenance/my-complaints",
//     },

//     {
//       title: "Location Management",
//       description:
//         "Create buildings, blocks, labs and nested campus locations.",
//       href: "/maintenance/location",
//     },
//   ];

//   const adminCards = [
//     {
//       title: "Complaint Management",
//       description: "Manage all complaint.description.slice(0, 60)s system-wide.",
//       href: "/maintenance/complaints",
//     },

//     {
//       title: "Technician Management",
//       description: "Add and manage technicians and assignments.",
//       href: "/maintenance/technician",
//     },

//     {
//       title: "Raise Ticket",
//       description: "Create and manage maintenance requests.",
//       href: "/maintenance/complaints/raise-ticket",
//     },

//     {
//       title: "My Complaints",
//       description: "Track your personal maintenance requests.",
//       href: "/maintenance/my-complaints",
//     },
//     {
//       title: "User Management",
//       description: "Create and manage ERP IDs, roles and passwords.",
//       href: "/maintenance/user",
//     },

//     {
//       title: "Location Management",
//       description:
//         "Create buildings, blocks, labs and nested campus locations.",
//       href: "/maintenance/location",
//     },
//     {
//       title: "Department Management",
//       description:
//         "Manage electrician, carpenter, plumbing and maintenance departments.",
//       href: "/maintenance/departments",
//     },
//   ];

//   let cards = userCards;

//   if (role === "manager") {
//     cards = managerCards;
//   }

//   if (role === "admin" || role === "superadmin") {
//     cards = adminCards;
//   }

//   return (
//     <DashboardLayout>
//       <div className="space-y-8">
//         {/* Hero */}
//         <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
//           <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

//           <div className="relative z-10">
//             <p className="uppercase tracking-[0.3em] text-sm text-white/80">
//               ECOLE ERP
//             </p>

//             <h1 className="text-5xl font-bold mt-4">Maintenance Dashboard</h1>

//             <p className="mt-5 text-lg text-white/90 max-w-3xl">
//               Centralized maintenance management system for complaints,
//               technician assignments, tracking and workflow control.
//             </p>

//             <div className="mt-6 inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm px-5 py-3 rounded-2xl">
//               <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />

//               <span className="font-medium capitalize">
//                 Logged in as {role}
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Quick Stats */}
//         <div className="grid md:grid-cols-3 gap-6">
//           <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-gray-100">
//             <p className="text-gray-500 font-medium">Module Status</p>

//             <h2 className="text-4xl font-bold mt-4 text-green-600">Active</h2>
//           </div>

//           <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-gray-100">
//             <p className="text-gray-500 font-medium">Role Access</p>

//             <h2 className="text-4xl font-bold mt-4 text-blue-600 capitalize">
//               {role}
//             </h2>
//           </div>

//           <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-gray-100">
//             <p className="text-gray-500 font-medium">Available Actions</p>

//             <h2 className="text-4xl font-bold mt-4 text-cyan-500">
//               {cards.length}
//             </h2>
//           </div>
//         </div>

//         {/* Action Cards */}
//         <div>
//           <div className="mb-8">
//             <h2 className="text-4xl font-bold text-gray-800">
//               Maintenance Controls
//             </h2>

//             <p className="text-gray-500 mt-3 text-lg">
//               Access maintenance operations based on your role permissions.
//             </p>
//           </div>

//           <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
//             {cards.map((card) => (
//               <Link
//                 key={card.title}
//                 href={card.href}
//                 className="group bg-white rounded-[2rem] p-8 shadow-lg border border-gray-100 hover:border-blue-200 hover:shadow-2xl transition duration-300 relative overflow-hidden"
//               >
//                 <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition duration-300" />

//                 <div className="relative z-10">
//                   <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
//                     {card.title.charAt(0)}
//                   </div>

//                   <h3 className="text-2xl font-bold text-gray-800 mt-7">
//                     {card.title}
//                   </h3>

//                   <p className="text-gray-500 mt-4 leading-relaxed">
//                     {card.description}
//                   </p>

//                   <div className="mt-8 inline-flex items-center gap-2 text-blue-600 font-semibold">
//                     Open Module
//                     <span className="group-hover:translate-x-1 transition">
//                       →
//                     </span>
//                   </div>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// }





"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return null;
}