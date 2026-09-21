import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatCard } from "@/components/dashboard-preview/stat-card";
import { spreadColorClass } from "@/lib/spread-color";
import type { SpreadRecord } from "@/lib/dashboard-api-types";

const symbolIcon: Record<string, "openai" | "kalshi" | "spacex"> = {
  "T-OpenAI": "openai",
  "T-Kalshi": "kalshi",
  "T-SpaceX": "spacex",
};

const GLASS_CARD = "glass-panel rounded-xl p-4";

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
          className={GLASS_CARD}
          valueClassName={spreadColorClass(s.spreadPct)}
          extra={
            <div className="mt-3 space-y-1 border-t border-white/5 pt-3 text-xs">
              <p>
                <span className="text-muted">Mark: </span>
                <span className="text-white">${s.markPrice.toFixed(2)}</span>
              </p>
              <p>
                <span className="text-muted">DEX: </span>
                <span className="text-white">${s.dexPrice.toFixed(2)}</span>
              </p>
              <Link
                href={`/dashboard/trade?token=${encodeURIComponent(s.symbol)}`}
                className="inline-flex items-center gap-1 pt-1 text-white/60 transition hover:text-white"
              >
                Trade <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          }
        />
      ))}
      <StatCard
        label="Total Holders Tracked"
        value={totalHolders.toLocaleString("en-US")}
        trend="up"
        trendLabel={`across ${spreads.length} token${spreads.length === 1 ? "" : "s"}`}
        icon="holders"
        className={GLASS_CARD}
      />
    </div>
  );
}
