"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SpreadHistoryChart } from "@/components/dashboard-preview/spread-history-chart";
import { OpenAIIcon, KalshiIcon, SpaceXIcon } from "@/components/token-icons";
import { dashboardSpreadColorClass } from "@/lib/spread-color";
import { useDashboardData } from "../use-dashboard-data";
import { usePreferences, type PreferenceTimeframe } from "../use-preferences";

const tokenIcon: Record<string, ComponentType<{ className?: string }>> = {
  "T-OpenAI": OpenAIIcon,
  "T-Kalshi": KalshiIcon,
  "T-SpaceX": SpaceXIcon,
};

const timeframes = [
  { label: "6H", ms: 6 * 60 * 60 * 1000 },
  { label: "24H", ms: 24 * 60 * 60 * 1000 },
  { label: "7D", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "All", ms: Infinity },
] satisfies { label: PreferenceTimeframe; ms: number }[];

const ROWS_PER_PAGE = 15;

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function SpreadHistoryPage() {
  const { spreads, history, now, loading } = useDashboardData();
  const { prefs } = usePreferences();

  const symbols = spreads.length > 0 ? spreads.map((s) => s.symbol) : ["T-OpenAI", "T-Kalshi", "T-SpaceX"];
  const [selectedOverride, setSelectedOverride] = useState<string | null>(null);
  const selected = selectedOverride ?? (symbols.includes(prefs.defaultToken) ? prefs.defaultToken : symbols[0]);

  const [timeframeOverride, setTimeframeOverride] = useState<(typeof timeframes)[number]["label"] | null>(null);
  const timeframe = timeframeOverride ?? prefs.defaultTimeframe;

  const [page, setPage] = useState(0);

  // React Compiler declines to auto-memoize this one (it's conservative about `history`
  // possibly being mutated later, since rowsDescending below re-sorts a copy of its output)
  // -- not a correctness issue, just an optimization it skips; the explicit useMemo still
  // works as plain React memoization.
  /* eslint-disable react-hooks/preserve-manual-memoization */
  const tokenHistory = useMemo(() => {
    const rangeMs = timeframes.find((t) => t.label === timeframe)?.ms ?? Infinity;
    const cutoff = Number.isFinite(rangeMs) ? now - rangeMs : -Infinity;
    return history
      .filter((r) => r.symbol === selected)
      .filter((r) => new Date(r.fetchedAt).getTime() >= cutoff)
      .sort((a, b) => new Date(a.fetchedAt).getTime() - new Date(b.fetchedAt).getTime());
  }, [history, selected, timeframe, now]);
  /* eslint-enable react-hooks/preserve-manual-memoization */

  const chartPoints = useMemo(
    () =>
      tokenHistory.map((r) => ({
        time: new Date(r.fetchedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        markPrice: r.markPrice,
        dexPrice: r.dexPrice,
      })),
    [tokenHistory],
  );

  const stats = useMemo(() => {
    if (tokenHistory.length === 0) return null;
    const pcts = tokenHistory.map((r) => r.spreadPct);
    return {
      highest: Math.max(...pcts),
      lowest: Math.min(...pcts),
      average: pcts.reduce((sum, p) => sum + p, 0) / pcts.length,
    };
  }, [tokenHistory]);

  const rowsDescending = useMemo(
    () => [...tokenHistory].sort((a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime()),
    [tokenHistory],
  );
  const pageCount = Math.max(1, Math.ceil(rowsDescending.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = rowsDescending.slice(currentPage * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE + ROWS_PER_PAGE);

  function selectToken(symbol: string) {
    setSelectedOverride(symbol);
    setPage(0);
  }

  function selectTimeframe(label: (typeof timeframes)[number]["label"]) {
    setTimeframeOverride(label);
    setPage(0);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Spread History</h1>
        <p className="mt-1 text-sm text-muted">Full spread history for every Basis-tracked token, in depth.</p>
      </div>

      {loading && spreads.length === 0 ? (
        <div className="glass-panel h-[500px] animate-pulse rounded-2xl" />
      ) : (
        <>
          <div className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
            <div className="flex flex-wrap gap-2">
              {symbols.map((symbol) => {
                const Icon = tokenIcon[symbol] ?? OpenAIIcon;
                return (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => selectToken(symbol)}
                    className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${
                      selected === symbol
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0 rounded-full" />
                    {symbol}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1 rounded-full border border-white/10 p-1">
              {timeframes.map((tf) => (
                <button
                  key={tf.label}
                  type="button"
                  onClick={() => selectTimeframe(tf.label)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    timeframe === tf.label ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="glass-panel rounded-xl p-4">
              <p className="text-sm text-muted">Highest Spread</p>
              <p className={`mt-2 text-2xl font-semibold ${stats ? dashboardSpreadColorClass(stats.highest) : "text-white"}`}>
                {stats ? `${stats.highest >= 0 ? "+" : ""}${stats.highest.toFixed(1)}%` : "—"}
              </p>
              <p className="mt-1 text-xs text-muted">{selected} · {timeframe}</p>
            </div>
            <div className="glass-panel rounded-xl p-4">
              <p className="text-sm text-muted">Lowest Spread</p>
              <p className={`mt-2 text-2xl font-semibold ${stats ? dashboardSpreadColorClass(stats.lowest) : "text-white"}`}>
                {stats ? `${stats.lowest >= 0 ? "+" : ""}${stats.lowest.toFixed(1)}%` : "—"}
              </p>
              <p className="mt-1 text-xs text-muted">{selected} · {timeframe}</p>
            </div>
            <div className="glass-panel rounded-xl p-4">
              <p className="text-sm text-muted">Average Spread</p>
              <p className={`mt-2 text-2xl font-semibold ${stats ? dashboardSpreadColorClass(stats.average) : "text-white"}`}>
                {stats ? `${stats.average >= 0 ? "+" : ""}${stats.average.toFixed(1)}%` : "—"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {tokenHistory.length} snapshot{tokenHistory.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            {chartPoints.length >= 2 ? (
              <SpreadHistoryChart data={chartPoints} symbol={selected} heightClass="h-96" />
            ) : (
              <div className="flex h-96 flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-center">
                <p className="text-sm text-white/70">Building history. Check back soon.</p>
                <p className="mt-1 text-xs text-muted">
                  {chartPoints.length === 1
                    ? "Only one snapshot recorded so far for this window."
                    : "No snapshots recorded yet for this window."}
                </p>
              </div>
            )}
          </div>

          <div className="glass-panel overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between p-6 pb-0">
              <p className="text-sm font-medium text-white">Raw Snapshot History</p>
              <p className="text-xs text-muted">
                {rowsDescending.length} record{rowsDescending.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-xs uppercase tracking-wide text-muted">
                    <th className="px-6 py-3 font-medium">Timestamp</th>
                    <th className="px-6 py-3 font-medium">Mark Price</th>
                    <th className="px-6 py-3 font-medium">DEX Price</th>
                    <th className="px-6 py-3 font-medium">Spread</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pageRows.map((r, i) => (
                    <tr key={`${r.fetchedAt}-${i}`}>
                      <td className="px-6 py-2.5 text-white/70">{formatTimestamp(r.fetchedAt)}</td>
                      <td className="px-6 py-2.5 text-white">${r.markPrice.toFixed(2)}</td>
                      <td className="px-6 py-2.5 text-white">${r.dexPrice.toFixed(2)}</td>
                      <td className={`px-6 py-2.5 font-medium ${dashboardSpreadColorClass(r.spreadPct)}`}>
                        {r.spreadPct >= 0 ? "+" : ""}
                        {r.spreadPct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rowsDescending.length === 0 && (
                <p className="py-8 text-center text-sm text-muted">No snapshots recorded in this window yet.</p>
              )}
            </div>

            {rowsDescending.length > ROWS_PER_PAGE && (
              <div className="flex items-center justify-between border-t border-white/5 px-6 py-4">
                <p className="text-xs text-muted">
                  Page {currentPage + 1} of {pageCount}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={currentPage >= pageCount - 1}
                    className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
