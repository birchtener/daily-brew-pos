import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronsUpDownIcon, BellIcon, LogOutIcon, ScrollText, Settings } from "lucide-react"
import { useNavigate } from "react-router-dom";
import { logoutRequest } from "@/api/auth";
import type { ParsedUser } from "@/types/userTypes"

export function NavUser({
  user,
}: {
  user: ParsedUser
}) {
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar()

  const handleLogout = async () => {
    setOpenMobile(false);

    try {
      await logoutRequest();
    } finally {
      localStorage.removeItem('daily_brew_user');
      window.requestAnimationFrame(() => {
        navigate('/login', { replace: true });
      });
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.avatar_url || undefined} alt={user?.first_name + " " + user?.last_name} />
                <AvatarFallback className="rounded-lg">
                  {user?.first_name && user?.last_name &&
                    `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
                  }
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.first_name} {user?.last_name}</span>
                <span className="truncate text-xs uppercase">{user?.role}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.avatar_url || undefined} alt={user?.first_name + " " + user?.last_name} />
                  <AvatarFallback className="rounded-lg">
                    {user?.first_name && user?.last_name &&
                      `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
                    }
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.first_name} {user?.last_name}</span>
                  <span className="truncate text-xs uppercase">{user?.role}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => {
                setOpenMobile(false);
                navigate('/settings');
              }}>
                <Settings />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => {
                setOpenMobile(false);
                navigate('/logs');
              }}>
                <ScrollText />
                Logs
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon
                />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOutIcon
              />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
