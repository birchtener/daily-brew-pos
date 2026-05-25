import { useEffect, useState, useCallback, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import {
  getFinancials,
  getProductVelocity,
  getInventoryHealth,
  type FinancialMetrics,
  type ProductVelocity,
  type StockHealth,
} from "@/api/analytics";
import { getCompletedOrders, type Order } from "@/api/orders";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import StaffWelcomeView from "../components/dashboard/StaffWelcomeView";
import MetricSummaryCards from "../components/dashboard/MetricSummaryCards";
import SalesTrendChart from "../components/dashboard/SalesTrendChart";
import ProductVelocityChart from "../components/dashboard/ProductVelocityChart";
import InventoryAlerts from "../components/dashboard/InventoryAlerts";

type PresetKey = "7d" | "30d" | "mtd" | "ytd";

export default function DashboardPage() {
  const currentUser = useStore((s) => s.user);
  const isAdmin = currentUser?.role === "admin";

  // ── STATE ──
  const [preset, setPreset] = useState<PresetKey>("30d");
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
      case "7d":
        start.setDate(end.getDate() - 7);
        break;
      case "30d":
        start.setDate(end.getDate() - 30);
        break;
      case "mtd":
        // Start of current month
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case "ytd":
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
      const message =
        "We could not load the dashboard analytics right now. Please try again in a moment.";
      setError(message);
      toast.error(message);
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
      const dateStr = temp.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      dailyMap[dateStr] = 0;
      temp.setDate(temp.getDate() + 1);
    }

    // Accumulate sales
    windowOrders.forEach((order) => {
      const dateStr = new Date(order.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      dailyMap[dateStr] = (dailyMap[dateStr] || 0) + Number(order.total);
    });

    // Format for charting
    return Object.entries(dailyMap).map(([date, revenue]) => ({
      date,
      revenue: parseFloat(revenue.toFixed(2)),
    }));
  }, [completedOrders, dateRange]);

  // Filter stock alerts
  const stockAlerts = useMemo(() => {
    return health.filter(
      (h) => h.status === "OUT_OF_STOCK" || h.status === "LOW_STOCK_ALERT",
    );
  }, [health]);

  // ── STAFF WELCOME VIEW (FALLBACK VIEW) ──
  if (!isAdmin) {
    return <StaffWelcomeView firstName={currentUser?.first_name} />;
  }

  // ── ADMIN VIEW (FULL REPORTING VIEW) ──
  return (
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-7xl mx-auto select-none">
      <DashboardHeader preset={preset} onPresetChange={setPreset} />

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex gap-2">
          <AlertTriangle className="size-4 shrink-0 mt-0.5 animate-bounce" />
          <span>{error}</span>
        </div>
      )}

      <MetricSummaryCards loading={loading} financials={financials} />

      {/* ── CHARTS SECTIONS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        <SalesTrendChart loading={loading} trendData={trendData} />
        <ProductVelocityChart loading={loading} velocity={velocity} />
      </div>

      <InventoryAlerts loading={loading} stockAlerts={stockAlerts} />
    </div>
  );
}
