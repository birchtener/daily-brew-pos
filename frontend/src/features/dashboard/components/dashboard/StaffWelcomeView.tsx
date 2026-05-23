import { useNavigate } from 'react-router-dom';
import { MonitorPlay, Coffee, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StaffWelcomeViewProps {
  firstName?: string;
}

export default function StaffWelcomeView({ firstName }: StaffWelcomeViewProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-1 sm:px-4 pb-12 select-none">
      {/* Staff Header */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 size-48 bg-linear-to-tr from-primary/10 to-primary/5 rounded-full blur-3xl" />
        <div className="flex flex-col gap-2 relative">
          <span className="inline-flex self-start items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-black text-emerald-600 dark:text-emerald-400">
            Terminal Logged In
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {firstName || 'Barista'}!
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Daily Brew Terminal is fully active. You carry standard operator clearance to trigger POS checkout transactions and modify parked receipt drafts.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => navigate('/pos-terminal')}
          className="h-12 px-6 font-bold shrink-0 self-start md:self-center inline-flex items-center gap-2 shadow"
        >
          <MonitorPlay className="size-5" /> Switch to POS Terminal
        </Button>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between h-44">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MonitorPlay className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">POS Terminal</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Take checkout billing logs</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/pos-terminal')}
            className="w-full text-xs font-semibold mt-4"
          >
            Launch Register
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between h-44">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Coffee className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Products Catalog</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Check ingredients recipe formulas</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/products')}
            className="w-full text-xs font-semibold mt-4"
          >
            Browse Catalog
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between h-44">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ListTodo className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Audit Logbook</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Check recent workstation activities</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/logs')}
            className="w-full text-xs font-semibold mt-4"
          >
            View System Logs
          </Button>
        </div>
      </div>
    </div>
  );
}
