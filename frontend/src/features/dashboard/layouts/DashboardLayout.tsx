import { Bell, BellDot, Moon, Sun } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { AppSidebar } from '@/components/shared/sidebar/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

function DashboardShell() {
  const { pathname } = useLocation();
  const { dark, toggleDark } = useStore();
  const user = localStorage.getItem('daily_brew_user');

  const routes: Record<string, string> = {
    '/': 'Dashboard',
    '/pos-terminal': 'POS Terminal',
    '/products': 'Products',
    '/inventory': 'Inventory',
    '/suppliers': 'Suppliers',
    '/settings': 'Settings',
  };

  const headerText = () => {
    if (routes[pathname]) return routes[pathname];

    for (const route in routes) {
      if (pathname.startsWith(route)) {
        return routes[route];
      }
    }

    return 'Daily Brew';
  };

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
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">{headerText()}</p>
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

      <main className="flex-1 overflow-y-auto bg-background p-8">
        <section className="mb-8 grid gap-4 md:grid-cols-[1.5fr_0.8fr]">
          <div className="rounded-3xl border border-border/60 bg-card/90 p-6 shadow-sm backdrop-blur">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Session status</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">You are signed in.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              The dashboard sidebar is now the primary navigation surface for POS and inventory work.
            </p>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/90 p-6 shadow-sm backdrop-blur">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Backend token</p>
            <p className="mt-2 break-all text-sm text-muted-foreground">Session is secured with HttpOnly cookies.</p>
            <p className="mt-4 text-sm text-muted-foreground">{user ? `User: ${user}` : 'User payload not cached.'}</p>
          </div>
        </section>

        <div className="rounded-3xl border border-border/60 bg-card/90 p-6 shadow-sm backdrop-blur">
          <Outlet />
        </div>
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
