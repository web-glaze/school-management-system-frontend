"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

/**
 * Polished sidebar nav.
 *
 * Design choices (intentional):
 *   • Smaller icons (size-4) + text-sm — tighter visual rhythm
 *   • Compact item height (h-9) — more items visible without scrolling
 *   • Subtle hover: light slate background, no x-translate (was distracting)
 *   • Active state: brand blue fill with a left accent bar — easy to spot
 *   • Group label: tiny uppercase tracking-wide, properly spaced
 */

const itemBase =
  "group relative h-9 rounded-lg px-3 transition-colors";
const itemHover =
  "hover:bg-slate-100 hover:text-slate-900";
const itemActive =
  // Brand blue pill + a small left accent bar drawn with a pseudo-element
  // (the ::before from `before:` utilities).
  "data-[active=true]:bg-[#00AEF2] data-[active=true]:text-white " +
  "data-[active=true]:font-semibold data-[active=true]:shadow-sm";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items?: { title: string; url: string }[];
  }[];
}) {
  const pathname = usePathname() ?? "";
  const dashboardActive = pathname === "/dashboard";

  return (
    <SidebarGroup className="flex flex-col gap-1 px-2 py-3">
      {/* ─── Top-level: Dashboard ─── */}
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={dashboardActive}
            className={`${itemBase} ${itemHover} ${itemActive}`}
          >
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <LayoutDashboard className="size-4 shrink-0" />
              <span className="text-sm">Dashboard</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* ─── Section: Maintenance ─── */}
      <SidebarMenu className="mt-4">
        <SidebarGroupLabel
          className="
            px-2 mb-1
            text-[10px] font-bold uppercase tracking-[0.12em]
            text-slate-500
          "
        >
          Maintenance
        </SidebarGroupLabel>

        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={item.isActive}
                className={`${itemBase} ${itemHover} ${itemActive}`}
              >
                <Link href={item.url} className="flex items-center gap-2.5">
                  <item.icon className="size-4 shrink-0" />
                  <span className="text-sm">{item.title}</span>
                </Link>
              </SidebarMenuButton>

              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90 text-slate-400 hover:text-slate-700">
                      <ChevronRight className="size-3.5" />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub className="ml-3 mt-0.5 border-l border-slate-200 pl-3">
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link
                              href={subItem.url}
                              className="text-xs text-slate-600 hover:text-slate-900"
                            >
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
