"use client";

import { Settings, ChevronsUpDown, LogOut } from "lucide-react";

import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();

  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    router.push("/login");
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="focus-visible:ring-0">
            <SidebarMenuButton
              size="lg"
              className="
                data-[state=open]:bg-sidebar-accent
                data-[state=open]:text-sidebar-accent-foreground
              "
            >
              <Avatar className="h-10 w-10 rounded-md">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-full text-base">EG</AvatarFallback>
              </Avatar>
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="
              w-(--radix-dropdown-menu-trigger-width)
              min-w-56
              rounded-md
            "
            side="bottom"
            align="end"
            sideOffset={4}
          >
            {/* User */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2 text-left text-md">
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name || "USER"}</span>
                  <span className="truncate text-md text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Settings */}
            <DropdownMenuGroup>

              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    "/settings",
                  )
                }
                className="cursor-pointer"
              >

                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuItem
              onClick={handleLogout}
              className="
                cursor-pointer
                text-red-500
                focus:text-red-500
              "
            >
              <LogOut className="h-4 w-4" />

              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
