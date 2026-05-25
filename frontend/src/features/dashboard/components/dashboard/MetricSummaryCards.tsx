import {
  PhilippinePeso,
  Package,
  Percent,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { FinancialMetrics } from '@/api/analytics';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MetricSummaryCardsProps {
  loading: boolean;
  financials: FinancialMetrics | null;

  // Z-Report Exports
  exportingZReport: boolean;
  handleZReportExport: () => void;

  // Stock Valuation Exports
  exportingStock: boolean;
  handleStockExport: () => void;

  // Product Profitability Exports
  exportingProfit: boolean;
  handleProfitExport: () => void;

  // PO PDF Exports
  recentOrders: any[];
  selectedPoId: string;
  setSelectedPoId: (id: string) => void;
  exportingPO: boolean;
  handlePOExport: () => void;
}

export default function MetricSummaryCards({
  loading,
  financials,
  exportingZReport,
  handleZReportExport,
  exportingStock,
  handleStockExport,
  exportingProfit,
  handleProfitExport,
  recentOrders,
  selectedPoId,
  setSelectedPoId,
  exportingPO,
  handlePOExport,
}: MetricSummaryCardsProps) {
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
            <PhilippinePeso className="size-4.5" />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-4 gap-2">
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            <TrendingUp className="size-3.5" /> Active checkouts
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={handleZReportExport}
            disabled={exportingZReport}
            className="flex items-center gap-1 text-[10px] h-7 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer shrink-0 border border-emerald-500/10 hover:border-emerald-500/20 rounded-lg transition-all"
          >
            {exportingZReport ? (
              <span className="size-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText className="size-3 text-emerald-600 dark:text-emerald-400" />
            )}
            Download Report
          </Button>
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
          <div className="size-9 rounded-xl bg-linear-to-tr from-destructive/10 to-destructive/5 text-destructive border border-destructive/10 flex items-center justify-center">
            <Package className="size-4.5" />
          </div>
        </div>
        <div className="flex flex-col gap-2.5 border-t border-border/40 pt-3 mt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-[10px] text-destructive font-bold">
              <TrendingDown className="size-3.5" /> Raw deductions
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={handleStockExport}
              disabled={exportingStock}
              className="flex items-center gap-1 text-[10px] h-7 px-2.5 bg-destructive/10 hover:bg-destructive/20 text-destructive font-bold cursor-pointer shrink-0 border border-destructive/10 hover:border-destructive/20 rounded-lg transition-all"
            >
              {exportingStock ? (
                <span className="size-3 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="size-3 text-destructive" />
              )}
              Valuation
            </Button>
          </div>

          {recentOrders.length > 0 && (
            <div className="flex items-center justify-between gap-1.5 bg-background/50 rounded-lg p-1 border border-border shrink-0">
              <Select value={selectedPoId} onValueChange={setSelectedPoId}>
                <SelectTrigger size="sm" className="text-[10px] h-6 border-none bg-transparent hover:bg-muted font-semibold max-w-27.5 sm:max-w-36.25 pr-5 pl-1.5 py-0.5 text-card-foreground outline-none shadow-none cursor-pointer">
                  <SelectValue placeholder="Select PO" />
                </SelectTrigger>
                <SelectContent className="min-w-44 select-none">
                  {recentOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id} className="text-[10px] font-medium cursor-pointer">
                      {order.supplier.name} ({new Date(order.ordered_at).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="xs"
                onClick={handlePOExport}
                disabled={exportingPO}
                className="flex items-center gap-1 text-[10px] h-6 px-2 bg-destructive/10 hover:bg-destructive/20 text-destructive cursor-pointer shrink-0 font-bold border border-destructive/10 rounded-md transition-all"
              >
                {exportingPO ? (
                  <span className="size-3 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileText className="size-3 text-destructive" />
                )}
                Purchase Order
              </Button>
            </div>
          )}
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
        <div className="flex flex-col gap-2.5 border-t border-border/40 pt-3 mt-4">
          <div className="flex justify-between items-center text-[10px] text-primary font-bold">
            <span className="flex items-center gap-1">
              <TrendingUp className="size-3.5" /> Margin percentage rate
            </span>
            <span className="font-mono bg-primary/10 px-2 py-0.5 rounded-md">
              {financials?.metrics?.gross_margin_percentage || 0}%
            </span>
          </div>

          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="xs"
              onClick={handleProfitExport}
              disabled={exportingProfit}
              className="flex items-center gap-1 text-[10px] h-7 px-2.5 bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary font-bold cursor-pointer shrink-0 border border-primary/10 hover:border-primary/20 rounded-lg transition-all"
            >
              {exportingProfit ? (
                <span className="size-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="size-3 text-primary" />
              )}
              Profitability
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
