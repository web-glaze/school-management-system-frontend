"use client";

import * as React from "react";
import {
  ChartColumnBig,
  Hammer,
  LifeBuoy,
  MapPin,
  Send,
  Ticket,
  VectorSquare,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Ecole Globale Admin",
    email: "it@ecoleglobale.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navSingle: [
    {
      title: "Tickets",
      url: "#",
      icon: Ticket,
    },
    {
      title: "Departments",
      url: "#",
      icon: VectorSquare,
    },
    {
      title: "Technicians",
      url: "#",
      icon: Hammer,
    },
    {
      title: "Locations",
      url: "#",
      icon: MapPin,
    },
    {
      title: "Reports",
      url: "#",
      icon: ChartColumnBig,
    },
  ],
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader className="h-20 border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <a href="#">
              <div className="flex">
                <img src="/Ecole2.png" alt="" width={200} />
              </div>
            </a>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navSingle} />
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
