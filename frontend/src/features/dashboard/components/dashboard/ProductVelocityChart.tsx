import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import type { ProductVelocity } from '@/api/analytics';

interface ProductVelocityChartProps {
  loading: boolean;
  velocity: ProductVelocity[];
}

const velocityChartConfig: ChartConfig = {
  units_sold: {
    label: 'Units Sold',
    color: 'var(--chart-2)',
  },
};

export default function ProductVelocityChart({ loading, velocity }: ProductVelocityChartProps) {
  return (
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
  );
}
