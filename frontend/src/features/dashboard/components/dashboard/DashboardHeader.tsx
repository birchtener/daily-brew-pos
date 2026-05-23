import { LayoutDashboard } from 'lucide-react';

type PresetKey = '7d' | '30d' | 'mtd' | 'ytd';

interface DashboardHeaderProps {
  preset: PresetKey;
  onPresetChange: (key: PresetKey) => void;
}

const PRESETS = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: 'mtd', label: 'Month' },
  { key: 'ytd', label: 'Year' },
] as const;

export default function DashboardHeader({ preset, onPresetChange }: DashboardHeaderProps) {
  return (
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
        {PRESETS.map((item) => (
          <button
            key={item.key}
            onClick={() => onPresetChange(item.key)}
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
  );
}
