import { Bell, BellDot, Moon, Sun } from 'lucide-react';
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

  const notifications = [
    { id: 1, type: 'alert', title: 'Low Stocks Alert', message: 'Inventory low for Espresso Beans', read: false },
    { id: 2, type: 'info', title: 'New Supplier', message: 'A new supplier has been added', read: true },
    { id: 3, type: 'success', title: 'Order Received', message: 'A new order has been received', read: false },
  ];

  const readNotifications = notifications.filter((notification) => !notification.read).length === 0;

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-background backdrop-blur-xl">
        <div className="mx-auto flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">POS and Inventory System</p>
              <p className="text-sm text-muted-foreground/50">{currentDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleDark}
              className="aspect-square inline-flex items-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-muted"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            <button
              type="button"
              className="aspect-square inline-flex items-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-muted"
            >
              {readNotifications ? <Bell className="size-4 " /> : <BellDot className="size-4 " />}
            </button>
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
