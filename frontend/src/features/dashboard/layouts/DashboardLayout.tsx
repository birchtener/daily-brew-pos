import { Moon, Sun } from 'lucide-react';
//import NotificationsDropdown from '@/components/shared/NotificationsDropdown.tsx';
import { 
  Outlet, 
  //useLocation 
} from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { AppSidebar } from '@/components/shared/sidebar/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

function DashboardShell() {
  // const { pathname } = useLocation();
  const { dark, toggleDark } = useStore();

  // const routes: Record<string, string> = {
  //   '/': 'Dashboard',
  //   '/pos-terminal': 'POS Terminal',
  //   '/products': 'Products',
  //   '/inventory': 'Inventory',
  //   '/suppliers': 'Suppliers',
  //   '/settings': 'Settings',
  //   '/logs': 'Audit Logs',
  // };

  // const headerText = () => {
  //   if (routes[pathname]) return routes[pathname];

  //   for (const route in routes) {
  //     if (pathname.startsWith(route)) {
  //       return routes[route];
  //     }
  //   }

  //   return 'Daily Brew';
  // };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-background backdrop-blur-xl">
        <div className="mx-auto flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div>
              <p className="text-sm font-semibold uppercase text-primary">POS and Inventory System</p>
              <p className="text-sm text-muted-foreground/50">{currentDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" className="relative" onClick={toggleDark}>
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            {/* <NotificationsDropdown /> */}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-8">
        <Outlet />
      </main>
    </>
  );
}

export default function DashboardLayout() {
  const { dark } = useStore();

  return (
    <div className={dark ? 'dark' : undefined}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardShell />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
