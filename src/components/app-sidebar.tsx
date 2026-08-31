"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import {
  Hammer,
  LifeBuoy,
  MapPin,
  Send,
  Ticket,
  VectorSquare,
  Users,
  Scroll,
  ClipboardMinus,
  User,
  Calendars,
  School,
  Landmark,
  BookOpenText,
  BookUser,
  FileUser,
  BookOpenCheck,
  UserStar,
  CalendarDays,
  ClipboardCheck,
  CalendarCheck2,
  Briefcase,
  BookCheck,
  Cog,
  CalendarFold,
  Summary,
  NotebookTabs,
  ClipboardList,
  ClipboardClock,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { NavMain } from "@/components/nav-main";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const sidebarContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem("sidebar-scroll");

    if (savedScroll && sidebarContentRef.current) {
      sidebarContentRef.current.scrollTop = Number(savedScroll);
    }
  }, []);

  const handleScroll = () => {
    if (sidebarContentRef.current) {
      sessionStorage.setItem("sidebar-scroll", sidebarContentRef.current.scrollTop.toString());
    }
  };
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};

  const permissions = user.permissions || [];

  const maintenanceItems = [
    permissions.includes("ticket.read") && {
      title: "Tickets",
      url: "/maintenance/tickets",
      icon: Ticket,
      isActive: pathname.startsWith("/maintenance/tickets"),
    },

    // permissions.includes("generator.read") && {
    //   title: "Generator management",
    //   url: "/maintenance/generator",
    //   icon: Cog,
    //   isActive: pathname.startsWith("/maintenance/generator"),
    // },

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

    permissions.includes("schedule.read") && {
      title: "Academic Schedule",
      url: "/academic/schedule",
      icon: CalendarFold,
      isActive: pathname.startsWith("/academic/schedule"),
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
      icon: Briefcase,
      isActive: pathname.startsWith("/academic/teachers"),
    },

    permissions.includes("teacher-transfer.read") && {
      title: "Teacher Transfer",
      url: "/academic/teacher-transfer",
      icon: Summary,
      isActive: pathname.startsWith("/academic/teacher-transfer"),
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

    permissions.includes("student-attendance.read") && {
      title: "Student Attendance",
      url: "/academic/student-attendance",
      icon: ClipboardClock,
      isActive: pathname.startsWith("/academic/student-attendance"),
    },

    permissions.includes("subject-allocation.read") && {
      title: "Subject Allocation",
      url: "/academic/subject-allocation",
      icon: BookOpenCheck,
      isActive: pathname.startsWith("/academic/subject-allocation"),
    },

    permissions.includes("student-subject-allocation.read") && {
      title: "Student Subject Allocation",
      url: "/academic/student-subject-allocation",
      icon: BookCheck,
      isActive: pathname.startsWith("/academic/student-subject-allocation"),
    },

    permissions.includes("assignment.read") && {
      title: "Assignments",
      url: "/academic/assignments",
      icon: NotebookTabs,
      isActive: pathname.startsWith("/academic/assignments"),
    },

    // permissions.includes("exam.read") && {
    //   title: "Exams",
    //   url: "/academic/exams",
    //   icon: ClipboardList,
    //   isActive: pathname.startsWith("/academic/exams"),
    // },

    // permissions.includes("marks.read") && {
    //   title: "Exam Marks",
    //   url: "/academic/exam-mark",
    //   icon: ClipboardCheck,
    //   isActive: pathname.startsWith("/academic/exam-mark"),
    // },

    permissions.includes("teacher-assignment.read") && {
      title: "Teacher Assisgnment",
      url: "/academic/teacher-assignment",
      icon: UserStar,
      isActive: pathname.startsWith("/academic/teacher-assignment"),
    },

    permissions.includes("faculty-attendance.read") && {
      title: "Faculty Attendance",
      url: "/academic/faculty-attendance",
      icon: CalendarCheck2,
      isActive: pathname.startsWith("/academic/faculty-attendance"),
    },

    permissions.includes("timetable.read") && {
      title: "Timetable",
      url: "/academic/timetables",
      icon: CalendarDays,
      isActive: pathname.startsWith("/academic/timetables"),
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
      <SidebarContent ref={sidebarContentRef} onScroll={handleScroll}>
        <NavMain maintenanceItems={maintenanceItems} academicItems={academicItems} settingItems={settingItems} />
      </SidebarContent>
    </Sidebar>
  );
}