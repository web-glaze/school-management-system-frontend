"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
    role?: string;
  };
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  const initials = getInitials(user.name);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="
                h-14 rounded-xl
                hover:bg-primary/8
                data-[state=open]:bg-primary/10
                data-[state=open]:text-primary
                transition-colors
              "
            >
              <Avatar className="h-9 w-9 rounded-xl border border-primary/20">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-xl bg-primary text-primary-foreground text-sm font-bold">{initials}</AvatarFallback>
              </Avatar>

              <div className="grid flex-1 text-left leading-tight min-w-0">
                <span className="truncate text-sm font-semibold text-foreground">{user.name || "User"}</span>
                <span className="truncate text-xs text-muted-foreground">{user.role || user.email}</span>
              </div>

              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl shadow-lg border" side={isMobile ? "bottom" : "right"} align="end" sideOffset={6}>
            {/* User info header */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3">
                <Avatar className="h-9 w-9 rounded-xl border border-primary/20">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-xl bg-primary text-primary-foreground text-sm font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight min-w-0">
                  <span className="truncate text-sm font-semibold text-foreground">{user.name || "User"}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 rounded-lg mx-1 mb-1">
              <LogOut className="size-4 mr-2" />
              <span className="font-medium">Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
