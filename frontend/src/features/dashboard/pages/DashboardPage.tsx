import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  Package,
  TrendingDown,
  Percent,
  AlertTriangle,
  ArrowUpRight,
  MonitorPlay,
  Coffee,
  ListTodo,
} from 'lucide-react';
import {
  getFinancials,
  getProductVelocity,
  getInventoryHealth,
  type FinancialMetrics,
  type ProductVelocity,
  type StockHealth,
} from '@/api/analytics';
import { getCompletedOrders, type Order } from '@/api/orders';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

type PresetKey = '7d' | '30d' | 'mtd' | 'ytd';

export default function DashboardPage() {
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';

  // ── STATE ──
  const [preset, setPreset] = useState<PresetKey>('30d');
  const [financials, setFinancials] = useState<FinancialMetrics | null>(null);
  const [velocity, setVelocity] = useState<ProductVelocity[]>([]);
  const [health, setHealth] = useState<StockHealth[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── DATE CALCULATIONS FOR PRESETS ──
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();

    switch (preset) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case 'mtd':
        // Start of current month
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'ytd':
        // Start of current year
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
    }
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, [preset]);

  // Fetching Data
  const fetchData = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [finData, velData, healthData, completedData] = await Promise.all([
        getFinancials(dateRange.start, dateRange.end),
        getProductVelocity(dateRange.start, dateRange.end),
        getInventoryHealth(),
        getCompletedOrders(),
      ]);

      setFinancials(finData);
      setVelocity(velData);
      setHealth(healthData);
      setCompletedOrders(completedData);
    } catch (err: any) {
      console.error(err);
      setError('Failed to query dashboard analytics. Ensure server is running and database is seeded.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── DYNAMIC SALES TREND AGGREGATION ──
  const trendData = useMemo(() => {
    if (!completedOrders.length) return [];

    const startTime = new Date(dateRange.start).getTime();
    const endTime = new Date(dateRange.end).getTime();

    // Filter orders in current window
    const windowOrders = completedOrders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return t >= startTime && t <= endTime;
    });

    // Group by Date
    const dailyMap: Record<string, number> = {};
    
    // Prefill days in the range to avoid gaps
    const temp = new Date(dateRange.start);
    while (temp.getTime() <= endTime) {
      const dateStr = temp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyMap[dateStr] = 0;
      temp.setDate(temp.getDate() + 1);
    }

    // Accumulate sales
    windowOrders.forEach((order) => {
      const dateStr = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyMap[dateStr] = (dailyMap[dateStr] || 0) + Number(order.total);
    });

    // Format for charting
    return Object.entries(dailyMap).map(([date, revenue]) => ({
      date,
      revenue: parseFloat(revenue.toFixed(2)),
    }));
  }, [completedOrders, dateRange]);

  // ── CONFIG FOR SHADCN CHARTS ──
  const trendChartConfig: ChartConfig = {
    revenue: {
      label: 'Revenue (₱)',
      color: 'var(--chart-1)',
    },
  };

  const velocityChartConfig: ChartConfig = {
    units_sold: {
      label: 'Units Sold',
      color: 'var(--chart-2)',
    },
  };

  // Filter stock alerts
  const stockAlerts = useMemo(() => {
    return health.filter((h) => h.status === 'OUT_OF_STOCK' || h.status === 'LOW_STOCK_ALERT');
  }, [health]);

  // ── STAFF WELCOME VIEW (FALLBACK VIEW) ──
  if (!isAdmin) {
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
              Welcome back, {currentUser?.first_name || 'Barista'}!
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

  // ── ADMIN VIEW (FULL REPORTING VIEW) ──
  return (
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-7xl mx-auto select-none">
      {/* Admin Title Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Aggregate revenue performance, map product velocity trends, and trace stock thresholds.
          </p>
        </div>

        {/* Date Presets Selector */}
        <div className="flex items-center rounded-xl border border-border bg-card p-1 shadow-sm self-start shrink-0">
          {(
            [
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: 'mtd', label: 'Month' },
              { key: 'ytd', label: 'Year' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setPreset(item.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                preset === item.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex gap-2">
          <AlertTriangle className="size-4 shrink-0 mt-0.5 animate-bounce" />
          <span>{error}</span>
        </div>
      )}

      {/* ── METRIC SUMMARY CARDS ── */}
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

      {/* ── CHARTS SECTIONS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        
        {/* Sales Trend Line Area Chart */}
        <div className="xl:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between min-h-96">
          <div>
            <h3 className="font-bold text-foreground text-sm tracking-tight">Sales Revenue Trend</h3>
            <p className="text-[11px] text-muted-foreground">Chronological order value totals generated within this timeframe.</p>
          </div>

          <div className="h-72 w-full mt-4 flex items-center justify-center">
            {loading ? (
              <div className="w-full h-full flex flex-col gap-2 p-2">
                <Skeleton className="h-full w-full rounded-xl" />
              </div>
            ) : trendData.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground italic">No sales logs processed for this period.</div>
            ) : (
              <ChartContainer config={trendChartConfig} className="w-full h-full min-h-62.5 aspect-auto">
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-[10px] fill-muted-foreground font-mono"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-[10px] fill-muted-foreground font-mono"
                    tickFormatter={(val) => `₱${val}`}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* Product Velocity Bar Chart */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between min-h-96">
          <div>
            <h3 className="font-bold text-foreground text-sm tracking-tight">Top Product Velocity</h3>
            <p className="text-[11px] text-muted-foreground">List of products sorted by gross quantity count sold.</p>
          </div>

          <div className="h-72 w-full mt-4 flex items-center justify-center">
            {loading ? (
              <div className="w-full h-full flex flex-col gap-2 p-2">
                <Skeleton className="h-full w-full rounded-xl" />
              </div>
            ) : velocity.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground italic">No sales logs processed for this period.</div>
            ) : (
              <ChartContainer config={velocityChartConfig} className="w-full h-full min-h-62.5 aspect-auto">
                <BarChart
                  data={velocity.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-[10px] fill-muted-foreground font-mono"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={90}
                    className="text-[10px] fill-muted-foreground font-semibold truncate"
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        formatter={(val: any, _name: any, item: any) => (
                          <div className="flex flex-col gap-0.5">
                            <div>Units: <span className="font-bold">{val}</span></div>
                            <div className="text-[10px] text-muted-foreground">Revenue: ₱{Number(item.payload.gross_revenue_generated).toFixed(2)}</div>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar
                    dataKey="units_sold"
                    fill="var(--chart-2)"
                    radius={4}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </div>

      </div>

      {/* ── INVENTORY HEALTH ALERTS PANELS ── */}
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
            🎉 Excellent! All raw ingredient inventory levels reside above stock trigger margins.
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

    </div>
  );
}
