 
import { Search, Wifi, WifiOff, Pause, Play, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'authentication', label: 'Authentication' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'ingredient', label: 'Ingredient' },
  { value: 'recipe', label: 'Recipe' },
  { value: 'category', label: 'Category' },
  { value: 'product', label: 'Product' },
  { value: 'discount', label: 'Discount' },
  { value: 'order', label: 'Order' },
  { value: 'inventory', label: 'Inventory' },
];

const TYPES = [
  { value: 'all', label: 'All Severities' },
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warn', label: 'Warning' },
  { value: 'error', label: 'Error' },
];

interface Props {
  searchVal: string;
  setSearchVal: (v: string) => void;
  categoryFilter: any;
  setCategoryFilter: (v: any) => void;
  typeFilter: any;
  setTypeFilter: (v: any) => void;
  isSocketConnected: boolean;
  isLivePaused: boolean;
  setIsLivePaused: (v: boolean | ((p: boolean) => boolean)) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export default function LogsToolbar({
  searchVal,
  setSearchVal,
  categoryFilter,
  setCategoryFilter,
  typeFilter,
  setTypeFilter,
  isSocketConnected,
  isLivePaused,
  setIsLivePaused,
  onRefresh,
  loading,
}: Props) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Search className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitor and trace system-wide operations, order entries, inventory audits, and security actions in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all ${
            isSocketConnected
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-muted-foreground/20 bg-muted text-muted-foreground'
          }`}>
            {isSocketConnected ? (
              <>
                <Wifi className="size-3.5 animate-pulse" />
                Live Stream Active
              </>
            ) : (
              <>
                <WifiOff className="size-3.5" />
                Offline Feed
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLivePaused((v: boolean) => !v)}
            className="h-8 text-xs font-medium"
          >
            {isLivePaused ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Play className="size-3.5 fill-current" /> Resume Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Pause className="size-3.5 fill-current" /> Pause Live
              </span>
            )}
          </Button>

          <Button variant="outline" size="icon" onClick={onRefresh} className="size-8" disabled={loading} aria-label="Refresh logs">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col md:flex-row gap-3 mt-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={searchVal} onChange={(e) => setSearchVal(e.target.value)} placeholder="Search log messages or actor names..." className="pl-9 w-full" />
        </div>

        <div className="relative min-w-45">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-card-foreground cursor-pointer dark:bg-card"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-background text-foreground">{c.label}</option>
            ))}
          </select>
        </div>

        <div className="relative min-w-45">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-card-foreground cursor-pointer dark:bg-card"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-background text-foreground">{t.label}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
