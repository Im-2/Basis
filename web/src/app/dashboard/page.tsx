"use client";

import { LiveAlerts } from "./_components/live-alerts";
import { MarketActivity } from "./_components/market-activity";
import { SpreadHistoryPanel } from "./_components/spread-history-panel";
import { StatRow } from "./_components/stat-row";
import { useDashboardData } from "./use-dashboard-data";

function StatSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-panel h-[104px] animate-pulse rounded-xl" />
      ))}
    </div>
  );
}

export default function DashboardOverviewPage() {
  const { data, spreads, history, fetchError, loading, now } = useDashboardData();
  const symbols = spreads.length > 0 ? spreads.map((s) => s.symbol) : ["T-OpenAI", "T-Kalshi", "T-SpaceX"];

  return (
    <>
      {(fetchError || data?.stale) && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          {fetchError
            ? fetchError
            : `Live data temporarily unavailable${data?.error ? ` (${data.error})` : ""} — showing the last cached snapshot.`}
        </div>
      )}

      {loading && !data ? (
        <StatSkeleton />
      ) : spreads.length > 0 ? (
        <StatRow spreads={spreads} />
      ) : (
        <div className="glass-panel rounded-2xl p-6 text-center text-sm text-muted">
          No live data available yet. Once Tessera and Jupiter are reachable, spreads will appear here.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SpreadHistoryPanel symbols={symbols} history={history} now={now} />
        </div>
        <LiveAlerts spreads={spreads} history={history} now={now} />
      </div>

      <MarketActivity history={history} now={now} />
    </>
  );
}
