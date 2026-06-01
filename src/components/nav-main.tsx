"use client";

import Link from "next/link";

import { ChevronRight, LayoutDashboard, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;

    url: string;

    icon: LucideIcon;

    isActive?: boolean;

    items?: {
      title: string;

      url: string;
    }[];
  }[];
}) {
  return (
    <SidebarGroup className="flex flex-col gap-2">
      {/* Dashboard */}
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            className="
              transition-all
              duration-200
              hover:bg-sky-50
              hover:text-sky-600
              hover:translate-x-1
            "
          >
            <Link href="/dashboard">
              <LayoutDashboard className="h-5 w-5" />

              <span className="text-base">Dashboard</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Maintenance — group header. Made bolder + slightly larger so the
          items underneath visibly belong to a section, not the top level. */}
      <SidebarMenu>
        <SidebarGroupLabel className="mt-3 mb-1 text-foreground text-sm font-bold uppercase tracking-wider">
          Maintenance
        </SidebarGroupLabel>

        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem className="py-1">
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={item.isActive}
                className="
                    transition-all
                    duration-200
                    hover:bg-sky-50
                    hover:text-sky-600
                    hover:translate-x-1

                    data-[active=true]:bg-sky-600
                    data-[active=true]:text-white
                    data-[active=true]:shadow-sm
                  "
              >
                <Link href={item.url}>
                  <item.icon className="h-5 w-5" />

                  <span className="text-base">{item.title}</span>
                </Link>
              </SidebarMenuButton>

              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight className="h-4 w-4" />

                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
