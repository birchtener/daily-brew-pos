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
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface SalesTrendChartProps {
  loading: boolean;
  trendData: { date: string; revenue: number }[];
}

const trendChartConfig: ChartConfig = {
  revenue: {
    label: 'Revenue (₱)',
    color: 'var(--chart-1)',
  },
};

export default function SalesTrendChart({ loading, trendData }: SalesTrendChartProps) {
  return (
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
  );
}
