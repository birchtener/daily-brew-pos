import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { StockHealth } from '@/api/analytics';

interface InventoryAlertsProps {
  loading: boolean;
  stockAlerts: StockHealth[];
}

export default function InventoryAlerts({ loading, stockAlerts }: InventoryAlertsProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-bold text-foreground text-sm tracking-tight flex items-center gap-1.5">
            Inventory Safety Thresholds
          </h3>
          <p className="text-[11px] text-muted-foreground">Tracks ingredients that have fallen below safety limits or have expired stocks.</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/inventory')}
          className="h-7 text-[10px] font-semibold border-primary/20 text-primary hover:bg-primary/5 inline-flex items-center gap-1 shrink-0"
        >
          Manage Batches <ArrowUpRight className="size-3" />
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2 mt-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ) : stockAlerts.length === 0 ? (
        <div className="text-center py-6 px-4 rounded-xl border border-dashed border-muted-foreground/20 bg-muted/10 text-muted-foreground text-xs italic">
          Excellent! All raw ingredient inventory levels reside above stock trigger margins.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stockAlerts.map((item) => {
            const isOut = item.status === 'OUT_OF_STOCK';
            return (
              <div
                key={item.ingredient_id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isOut
                    ? 'border-destructive/20 bg-destructive/5'
                    : 'border-yellow-500/20 bg-yellow-500/5'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    On Hand: <span className="font-bold text-foreground">{item.current_on_hand_balance} {item.unit}</span>
                  </p>
                </div>

                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0 ${
                    isOut
                      ? 'bg-destructive/15 text-destructive'
                      : 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'
                  }`}
                >
                  {isOut ? 'Out of Stock' : 'Low Stock'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
