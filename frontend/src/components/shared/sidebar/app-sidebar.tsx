"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  MonitorPlay,
  Package,
  Tag,
  Ticket,
  Boxes,
  Truck,
  Bell,
  Settings2,
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { NavUser } from "./nav-user"
import { useStore } from "@/store/useStore"
import Logo from "../icon/Logo"
import { useIsMobile } from "@/hooks/use-mobile"
import type { ParsedUser } from "@/types/userTypes"

type SidebarRole = ParsedUser['role'];

type SidebarNavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: readonly SidebarRole[];
};

const data: {
  mainMenu: SidebarNavItem[];
  systemMenu: SidebarNavItem[];
} = {
  mainMenu: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      roles: ['admin', 'staff'] as const,
    },
    {
      title: "POS Terminal",
      url: "/pos-terminal",
      icon: MonitorPlay,
      roles: ['admin', 'staff'] as const,
    },
    {
      title: "Products",
      url: "/products",
      icon: Package,
      roles: ['admin', 'staff'] as const,
    },
    {
      title: "Categories",
      url: "/categories",
      icon: Tag,
      roles: ['admin', 'staff'] as const,
    },
    {
      title: "Discounts",
      url: "/discounts",
      icon: Ticket,
      roles: ['admin', 'staff'] as const,
    },
  ],
  systemMenu: [
    {
      title: "Inventory",
      url: "/inventory",
      icon: Boxes,
      roles: ['admin', 'staff'] as const,
    },
    {
      title: "Suppliers",
      url: "/suppliers",
      icon: Truck,
      roles: ['admin', 'staff'] as const,
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,
      roles: ['admin'] as const,
    },
    {
      title: "Users",
      url: "/users",
      icon: MonitorPlay,
      roles: ['admin'] as const,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      roles: ['admin', 'staff'] as const,
    },
  ],
}

const fallbackUser: ParsedUser = {
  id: '12345',
  username: 'master',
  role: 'admin',
  first_name: 'Master',
  last_name: 'Account',
  avatar_url: null,
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { pathname } = useLocation();
  const { dark } = useStore();
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed" && !isMobile;
  const storeUser = useStore((s) => s.user);
  const user = storeUser ?? fallbackUser;
  const role = user.role;

  const canViewItem = (item: SidebarNavItem) => item.roles.includes(role);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className={`flex items-center gap-2 transition-all ease-in-out ${isCollapsed ? '' : 'p-2'}`}>
          <div className="bg-primary rounded-sm aspect-square w-8 flex items-center justify-center shrink-0">
            <Logo color={dark ? '#18181b' : '#ffffff'} width={20} />
          </div>
          
          <div className={`flex flex-col transition-all duration-200 overflow-hidden ${isCollapsed  ? 'w-0' : 'w-full'}`}>
            <div className="text-lg font-black text-primary uppercase leading-none truncate">DAILY BREW</div>
            <div className="text-xs font-medium text-muted-foreground leading-none mt-1 truncate">POS & Inventory System</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarMenu>
            {data.mainMenu.filter(canViewItem).map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)}>
                  <NavLink to={item.url} end={item.url === "/"}>
                    <item.icon />
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarMenu>
            {data.systemMenu.filter(canViewItem).map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={pathname.startsWith(item.url)}>
                  <NavLink to={item.url} end>
                    <item.icon />
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user}/>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
