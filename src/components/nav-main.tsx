"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const MANAGEMENT_ITEMS = ["Users", "Roles & Permissions"];

export function NavMain({
  items,
  role,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
  }[];
  role?: string;
}) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";

  const operationalItems = items.filter(
    (i) => !MANAGEMENT_ITEMS.includes(i.title)
  );
  const managementItems = items.filter((i) =>
    MANAGEMENT_ITEMS.includes(i.title)
  );

  const navItemClass = `
    h-10 rounded-lg text-sm font-medium
    text-sidebar-foreground/75
    transition-all duration-150
    hover:bg-primary/10 hover:text-primary
    data-[active=true]:bg-primary data-[active=true]:text-primary-foreground
    data-[active=true]:shadow-sm
    outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0
    border-0
  `;

  return (
    <SidebarGroup className="px-3 py-3 flex flex-col gap-0">

      {/* Top accent line */}
      <div className="mx-1 mb-3 h-[3px] rounded-full bg-gradient-to-r from-primary/30 via-sky-300/40 to-transparent" />

      {/* Dashboard */}
      <SidebarMenu className="mb-1">
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={isDashboard}
            tooltip="Dashboard"
            className={navItemClass}
          >
            <Link href="/dashboard" className="flex items-center gap-3">
              <LayoutDashboard className="size-[17px] shrink-0" />
              <span>Dashboard</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* MAINTENANCE section label */}
      <div className="mt-3 mb-1.5 flex items-center gap-1.5 px-2">
        <Wrench className="size-3 text-primary/70 shrink-0" />
        <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.12em] text-primary/80 p-0">
          Maintenance
        </SidebarGroupLabel>
      </div>

      {/* Operational items: Tickets, Departments, Technicians, Locations */}
      <SidebarMenu className="flex flex-col gap-0.5">
        {operationalItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              isActive={item.isActive}
              className={navItemClass}
            >
              <Link href={item.url} className="flex items-center gap-3">
                <item.icon className="size-[17px] shrink-0" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      {/* Management sub-section: Users, Roles & Permissions (admin/superadmin only) */}
      {managementItems.length > 0 && (
        <>
          <div className="mt-4 mb-1.5 px-2 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/70"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-primary/80">
              Management
            </span>
          </div>
          <SidebarMenu className="flex flex-col gap-0.5">
            {managementItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={item.isActive}
                  className={navItemClass}
                >
                  <Link href={item.url} className="flex items-center gap-3">
                    <item.icon className="size-[17px] shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </>
      )}

    </SidebarGroup>
  );
}
