"use client";

import { useEffect, useState } from "react";
import type { DashboardApiResponse } from "@/lib/dashboard-api-types";
import { LiveAlerts } from "./_components/live-alerts";
import { MarketActivity } from "./_components/market-activity";
import { Sidebar } from "./_components/sidebar";
import { SpreadHistoryPanel } from "./_components/spread-history-panel";
import { StatRow } from "./_components/stat-row";
import { TopBar } from "./_components/top-bar";
import { useWallet } from "./use-wallet";

const REFRESH_MS = 30_000;

function StatSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-panel h-[104px] animate-pulse rounded-xl" />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const wallet = useWallet();
  const [data, setData] = useState<DashboardApiResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/dashboard", { cache: "no-store" });
        const json = (await res.json()) as DashboardApiResponse;
        if (cancelled) return;
        setData(json);
        setFetchError(null);
        setNow(Date.now());
      } catch {
        if (cancelled) return;
        setFetchError("Could not reach the dashboard API.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const spreads = data?.spreads ?? [];
  const history = data?.history ?? [];
  const symbols = spreads.length > 0 ? spreads.map((s) => s.symbol) : ["T-OpenAI", "T-Kalshi", "T-SpaceX"];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar wallet={wallet} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar wallet={wallet} />

        <main className="flex-1 space-y-6 p-6">
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
            <LiveAlerts spreads={spreads} history={history} />
          </div>

          <MarketActivity history={history} now={now} />
        </main>
      </div>
    </div>
  );
}
