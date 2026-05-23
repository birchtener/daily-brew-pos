import {
  DollarSign,
  Package,
  Percent,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { FinancialMetrics } from '@/api/analytics';

interface MetricSummaryCardsProps {
  loading: boolean;
  financials: FinancialMetrics | null;
}

export default function MetricSummaryCards({ loading, financials }: MetricSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Net Revenue Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-36">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Net Sales Revenue</span>
            {loading ? (
              <Skeleton className="h-8 w-28 mt-1" />
            ) : (
              <h2 className="text-2xl font-black text-foreground mt-1">
                ₱{Number(financials?.metrics?.net_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            )}
          </div>
          <div className="size-9 rounded-xl bg-linear-to-tr from-emerald-500/10 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 flex items-center justify-center">
            <DollarSign className="size-4.5" />
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold border-t border-border/40 pt-3 mt-3">
          <TrendingUp className="size-3.5" /> Active completed order checkouts
        </div>
      </div>

      {/* COGS Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-36">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cost of Goods Sold</span>
            {loading ? (
              <Skeleton className="h-8 w-28 mt-1" />
            ) : (
              <h2 className="text-2xl font-black text-foreground mt-1">
                ₱{Number(financials?.metrics?.cost_of_goods_sold || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            )}
          </div>
          <div className="size-9 rounded-xl bg-linear-to-tr from-rose-500/10 to-rose-500/5 text-rose-600 dark:text-rose-400 border border-rose-500/10 flex items-center justify-center">
            <Package className="size-4.5" />
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold border-t border-border/40 pt-3 mt-3">
          <TrendingDown className="size-3.5" /> Raw batch deductions from sales
        </div>
      </div>

      {/* Gross Profit Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-36">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gross Profit Margin</span>
            {loading ? (
              <Skeleton className="h-8 w-28 mt-1" />
            ) : (
              <h2 className="text-2xl font-black text-foreground mt-1">
                ₱{Number(financials?.metrics?.gross_profit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            )}
          </div>
          <div className="size-9 rounded-xl bg-linear-to-tr from-primary/10 to-primary/5 text-primary border border-primary/10 flex items-center justify-center">
            <Percent className="size-4.5" />
          </div>
        </div>
        <div className="flex justify-between items-center text-[10px] text-primary font-bold border-t border-border/40 pt-3 mt-3">
          <span className="flex items-center gap-1">
            <TrendingUp className="size-3.5" /> Margin percentage rate
          </span>
          <span className="font-mono bg-primary/10 px-2 py-0.5 rounded-md">
            {financials?.metrics?.gross_margin_percentage || 0}%
          </span>
        </div>
      </div>
    </div>
  );
}
