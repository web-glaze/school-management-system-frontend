"use client";

import Link from "next/link";
import { LayoutDashboard, type LucideIcon } from "lucide-react";

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

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
  return (
    <SidebarGroup className="flex flex-col gap-0">
      {/* Dashboard */}
      <SidebarMenu className="gap-1">
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="h-6 w-6" />
              <span className="text-base">Dashboard</span>
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
                <SidebarMenuButton
                  asChild
                  isActive={item.isActive}
                  className="
                    hover:bg-sky-50
                    hover:text-sky-600

                    data-[active=true]:bg-sky-600
                    data-[active=true]:text-white
                  "
                >
                  <Link href={item.url}>
                    <item.icon className="w-20 h-20" />
                    <span className="text-base">{item.title}</span>
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
                <SidebarMenuButton
                  asChild
                  isActive={item.isActive}
                  className="
                    hover:bg-sky-50
                    hover:text-sky-600

                    data-[active=true]:bg-sky-600
                    data-[active=true]:text-white
                  "
                >
                  <Link href={item.url}>
                    <item.icon className="w-20 h-20" />
                    <span className="text-base">{item.title}</span>
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
