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

const data = {
  mainMenu: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "POS Terminal",
      url: "/pos-terminal",
      icon: MonitorPlay,
    },
    {
      title: "Products",
      url: "/products",
      icon: Package,
    },
    {
      title: "Categories",
      url: "/categories",
      icon: Tag,
    },
    {
      title: "Discounts",
      url: "/discounts",
      icon: Ticket,
    },
  ],
  systemMenu: [
    {
      title: "Inventory",
      url: "/inventory",
      icon: Boxes,
    },
    {
      title: "Suppliers",
      url: "/suppliers",
      icon: Truck,
    },
    {
      title: "Notifications",
      url: "/notifications-admin",
      icon: Bell,
    },
    {
      title: "Users",
      url: "/users",
      icon: MonitorPlay,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
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
            {data.mainMenu.map((item) => (
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
            {data.systemMenu.map((item) => (
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
