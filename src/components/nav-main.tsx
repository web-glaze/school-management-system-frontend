"use client";

import Link from "next/link";
import { LayoutDashboard, type LucideIcon } from "lucide-react";

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
};

interface NavMainProps {
  maintenanceItems: NavItem[];
  settingItems: NavItem[];
}

export function NavMain({ maintenanceItems, settingItems }: NavMainProps) {
  const pathname = usePathname();
  return (
    <SidebarGroup className="flex flex-col gap-0">
      {/* Dashboard */}
      <SidebarMenu className="gap-1">
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === "/dashboard"} className="h-9 hover:bg-sky-50 hover:text-sky-600 data-[active=true]:bg-sky-50 data-[active=true]:text-sky-600">
            <Link href="/dashboard">
              <LayoutDashboard className="w-5! h-5!" />
              <span className="text-lg">Dashboard</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Maintenance */}
      {maintenanceItems.length > 0 && (
        <>
          <SidebarGroupLabel className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Maintenance</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {maintenanceItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={item.isActive} className="h-9 hover:bg-sky-50 hover:text-sky-600 data-[active=true]:bg-sky-50 data-[active=true]:text-sky-600">
                  <Link href={item.url}>
                    <item.icon className="w-5! h-5!" />
                    <span className="text-lg">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </>
      )}

      {/* Settings */}
      {settingItems.length > 0 && (
        <>
          <SidebarGroupLabel className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Settings</SidebarGroupLabel>
          <SidebarMenu>
            {settingItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={item.isActive} className="h-9 hover:bg-sky-50 hover:text-sky-600 data-[active=true]:bg-sky-50 data-[active=true]:text-sky-600">
                  <Link href={item.url} className="w-full block">
                    <item.icon className="w-5! h-5!" />
                    <span className="text-lg">{item.title}</span>
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
