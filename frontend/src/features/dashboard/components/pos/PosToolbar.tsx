 
import { ShoppingCart, Clock, CheckCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Props {
  activeTab: 'terminal' | 'parked' | 'completed';
  setActiveTab: (t: 'terminal' | 'parked' | 'completed') => void;
  parkedCount: number;
  searchVal: string;
  setSearchVal: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  categories: any[];
  setFeedback: (f: any) => void;
}

export default function PosToolbar({
  activeTab,
  setActiveTab,
  parkedCount,
  searchVal,
  setSearchVal,
  categoryFilter,
  setCategoryFilter,
  categories,
  setFeedback,
}: Props) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">POS Terminal</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Workstation for live beverage checkouts, pending parked orders, and quick payment settlements.
          </p>
        </div>

        <div className="flex bg-muted/65 p-1 rounded-xl border border-border/40 w-fit shrink-0">
          <button
            onClick={() => { setActiveTab('terminal'); setFeedback(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'terminal' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckCircle className="size-3.5" /> Terminal
          </button>
          <button
            onClick={() => { setActiveTab('parked'); setFeedback(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all relative ${
              activeTab === 'parked' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="size-3.5" /> Parked
            {parkedCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white shadow-sm ring-2 ring-background animate-pulse">
                {parkedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('completed'); setFeedback(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'completed' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingCart className="size-3.5" /> Completed
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col sm:flex-row gap-3 mt-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={searchVal} onChange={(e) => setSearchVal(e.target.value)} placeholder="Filter beverages catalog..." className="pl-9 h-9 text-sm" />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto items-center justify-start sm:justify-end overflow-x-auto select-none">
          <button
            onClick={() => setCategoryFilter('all-categories')}
            className={`h-8 px-3 text-xs font-semibold rounded-lg border transition-all ${
              categoryFilter === 'all-categories' ? 'bg-primary/10 border-primary text-primary' : 'border-border bg-background text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`h-8 px-3 text-xs font-semibold rounded-lg border transition-all ${
                categoryFilter === c.id ? 'bg-primary/10 border-primary text-primary' : 'border-border bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
