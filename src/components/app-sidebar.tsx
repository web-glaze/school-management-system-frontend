"use client";

import * as React from "react";
import { Hammer, LifeBuoy, MapPin, Send, Ticket, VectorSquare, Users, Scroll, ClipboardMinus, User, Calendars, School, Landmark, BookOpenText, ContactRound, BookUser, FileUser, BookOpenCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { NavMain } from "@/components/nav-main";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};

  const permissions = user.permissions || [];

  const maintenanceItems = [
    permissions.includes("ticket.read") && {
      title: "Tickets",
      url: "/maintenance/tickets",
      icon: Ticket,
      isActive: pathname.startsWith("/maintenance/tickets"),
    },

    permissions.includes("department.read") && {
      title: "Departments",
      url: "/maintenance/departments",
      icon: VectorSquare,
      isActive: pathname === "/maintenance/departments",
    },

    permissions.includes("technician.read") && {
      title: "Technicians",
      url: "/maintenance/technician",
      icon: Hammer,
      isActive: pathname === "/maintenance/technician",
    },

    permissions.includes("location.read") && {
      title: "Locations",
      url: "/maintenance/location",
      icon: MapPin,
      isActive: pathname === "/maintenance/location",
    },

    permissions.includes("report.read") && {
      title: "Reports",
      url: "/maintenance/reports",
      icon: ClipboardMinus,
      isActive: pathname.startsWith("/maintenance/reports"),
    },
  ].filter(Boolean);

  const settingItems = [
    {
      title: "My Profile",
      url: "/my-profile",
      icon: User,
      isActive: pathname === "/my-profile",
    },

    permissions.includes("user.read") && {
      title: "Users",
      url: "/user",
      icon: Users,
      isActive: pathname === "/user",
    },

    permissions.includes("role.read") && {
      title: "Roles",
      url: "/roles",
      icon: Scroll,
      isActive: pathname === "/roles",
    },
  ].filter(Boolean);

  const academicItems = [
    permissions.includes("academic-session.read") && {
      title: "Academic Sessions",
      url: "/academic/sessions",
      icon: Calendars,
      isActive: pathname.startsWith("/academic/sessions"),
    },

    permissions.includes("class.read") && {
      title: "Classes",
      url: "/academic/classes",
      icon: School,
      isActive: pathname.startsWith("/academic/classes"),
    },

    permissions.includes("section.read") && {
      title: "Sections",
      url: "/academic/sections",
      icon: Landmark,
      isActive: pathname.startsWith("/academic/sections"),
    },

    permissions.includes("section.read") && {
      title: "Subjects",
      url: "/academic/subjects",
      icon: BookOpenText,
      isActive: pathname.startsWith("/academic/subjects"),
    },

    permissions.includes("teacher.read") && {
      title: "Teachers",
      url: "/academic/teachers",
      icon: ContactRound,
      isActive: pathname.startsWith("/academic/teachers"),
    },

    permissions.includes("student.read") && {
      title: "Students",
      url: "/academic/students",
      icon: BookUser,
      isActive: pathname.startsWith("/academic/students"),
    },

    permissions.includes("student-enrollment.read") && {
      title: "Student Enrollment",
      url: "/academic/enrollment",
      icon: FileUser,
      isActive: pathname.startsWith("/academic/enrollment"),
    },

    permissions.includes("subject-allocation.read") && {
      title: "Subject Allocation",
      url: "/academic/subjectAllocation",
      icon: BookOpenCheck,
      isActive: pathname.startsWith("/academic/subjectAllocation"),
    },
  ].filter(Boolean);

  const data = {
    user: {
      name: user.name || "",
      email: user.email || "",
      avatar: "",
    },

    navSingle: maintenanceItems,

    navSecondary: [
      {
        title: "Support",
        url: "#",
        icon: LifeBuoy,
      },
      {
        title: "Feedback",
        url: "#",
        icon: Send,
      },
    ],
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* Header */}
      <SidebarHeader className="h-20 border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <a href="/dashboard">
              <div className="flex items-center px-2">
                <img src="/Ecole2.png" alt="Ecole" width={180} className="object-contain" />
              </div>
            </a>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        <NavMain maintenanceItems={maintenanceItems} academicItems={academicItems} settingItems={settingItems} />
      </SidebarContent>
    </Sidebar>
  );
}
