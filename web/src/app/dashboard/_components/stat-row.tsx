import { StatCard } from "@/components/dashboard-preview/stat-card";
import type { SpreadRecord } from "@/lib/dashboard-api-types";

const symbolIcon: Record<string, "openai" | "kalshi" | "spacex"> = {
  "T-OpenAI": "openai",
  "T-Kalshi": "kalshi",
  "T-SpaceX": "spacex",
};

export function StatRow({ spreads }: { spreads: SpreadRecord[] }) {
  const totalHolders = spreads.reduce((sum, s) => sum + s.holders, 0);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {spreads.map((s) => (
        <StatCard
          key={s.symbol}
          label={`${s.symbol} Spread`}
          value={`${s.spreadPct >= 0 ? "+" : ""}${s.spreadPct.toFixed(1)}%`}
          trend={s.spreadPct >= 0 ? "up" : "down"}
          trendLabel="vs mark price"
          icon={symbolIcon[s.symbol] ?? "openai"}
        />
      ))}
      <StatCard
        label="Total Holders Tracked"
        value={totalHolders.toLocaleString("en-US")}
        trend="up"
        trendLabel={`across ${spreads.length} token${spreads.length === 1 ? "" : "s"}`}
        icon="holders"
      />
    </div>
  );
}
