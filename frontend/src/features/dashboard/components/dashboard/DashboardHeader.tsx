import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard } from "lucide-react";

type PresetKey = "7d" | "30d" | "mtd" | "ytd";

interface DashboardHeaderProps {
  preset: PresetKey;
  onPresetChange: (key: PresetKey) => void;
}

const PRESETS = [
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "mtd", label: "Month" },
  { key: "ytd", label: "Year" },
] as const;

export default function DashboardHeader({
  preset,
  onPresetChange,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <LayoutDashboard className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Aggregate revenue performance, map product velocity trends, and trace
          stock thresholds.
        </p>
      </div>

      {/* Date Presets Selector */}
      <Tabs
        className="self-start shrink-0"
        value={preset}
        onValueChange={(value) => onPresetChange(value as PresetKey)}
      >
        <TabsList className="w-fit">
          {PRESETS.map((item) => (
            <TabsTrigger className="gap-1.5" value={item.key}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
