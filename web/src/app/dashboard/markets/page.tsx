"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { dashboardSpreadColorClass } from "@/lib/spread-color";
import { OpenAIIcon, KalshiIcon, SpaceXIcon } from "@/components/token-icons";
import { SpreadHistoryChart } from "@/components/dashboard-preview/spread-history-chart";
import { useDashboardData } from "../use-dashboard-data";
import type { SpreadRecord } from "@/lib/dashboard-api-types";

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
] as const;

function formatCompactUsd(value: number): string {
  return `$${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value)}`;
}

export default function MarketsPage() {
  const { spreads, history, now, loading } = useDashboardData();

  const totalMarketCap = spreads.reduce((sum, s) => sum + s.markValuation, 0);
  const totalHolders = spreads.reduce((sum, s) => sum + s.holders, 0);
  const avgSpread = spreads.length > 0 ? spreads.reduce((sum, s) => sum + s.spreadPct, 0) / spreads.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Markets</h1>
        <p className="mt-1 text-sm text-muted">Every Basis-tracked token, side by side.</p>
      </div>

      {loading && spreads.length === 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-panel h-[104px] animate-pulse rounded-xl" />
            ))}
          </div>
          <div className="glass-panel h-[420px] animate-pulse rounded-2xl" />
        </>
      ) : spreads.length === 0 ? (
        <div className="glass-panel rounded-2xl p-6 text-center text-sm text-muted">No live token data available yet.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="glass-panel rounded-xl p-4">
              <p className="text-sm text-muted">Total Market Cap Tracked</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCompactUsd(totalMarketCap)}</p>
              <p className="mt-1 text-xs text-muted">
                across {spreads.length} token{spreads.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="glass-panel rounded-xl p-4">
              <p className="text-sm text-muted">Total Holders</p>
              <p className="mt-2 text-2xl font-semibold text-white">{totalHolders.toLocaleString("en-US")}</p>
              <p className="mt-1 text-xs text-muted">
                across {spreads.length} token{spreads.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="glass-panel rounded-xl p-4">
              <p className="text-sm text-muted">Avg Spread</p>
              <p className={`mt-2 text-2xl font-semibold ${dashboardSpreadColorClass(avgSpread)}`}>
                {avgSpread >= 0 ? "+" : ""}
                {avgSpread.toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-muted">vs mark price</p>
            </div>
          </div>

          <div className="space-y-6">
            {spreads.map((token) => (
              <TokenCard key={token.symbol} token={token} history={history} now={now} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TokenCard({ token, history, now }: { token: SpreadRecord; history: SpreadRecord[]; now: number }) {
  const [timeframe, setTimeframe] = useState<(typeof timeframes)[number]["label"]>("24H");
  const Icon = tokenIcon[token.symbol] ?? OpenAIIcon;

  const points = useMemo(() => {
    const rangeMs = timeframes.find((t) => t.label === timeframe)?.ms ?? Infinity;
    const cutoff = Number.isFinite(rangeMs) ? now - rangeMs : -Infinity;

    return history
      .filter((r) => r.symbol === token.symbol)
      .filter((r) => new Date(r.fetchedAt).getTime() >= cutoff)
      .sort((a, b) => new Date(a.fetchedAt).getTime() - new Date(b.fetchedAt).getTime())
      .map((r) => ({
        time: new Date(r.fetchedAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        markPrice: r.markPrice,
        dexPrice: r.dexPrice,
      }));
  }, [history, token.symbol, timeframe, now]);

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon className="h-9 w-9 flex-shrink-0 rounded-full text-white" />
          <div>
            <p className="text-base font-semibold text-white">{token.symbol}</p>
            <p className="text-xs text-muted">{token.sector}</p>
          </div>
        </div>
        <Link
          href={`/dashboard/trade?token=${encodeURIComponent(token.symbol)}`}
          className="inline-flex items-center gap-1 text-sm text-white/70 transition hover:text-white"
        >
          Trade <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4 text-center sm:text-left">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Mark Price</p>
          <p className="mt-1 text-xl font-semibold text-white">${token.markPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">DEX Price</p>
          <p className="mt-1 text-xl font-semibold text-white">${token.dexPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Spread</p>
          <p className={`mt-1 text-xl font-semibold ${dashboardSpreadColorClass(token.spreadPct)}`}>
            {token.spreadPct >= 0 ? "+" : ""}
            {token.spreadPct.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">{token.holders.toLocaleString("en-US")} holders</p>
        <div className="flex gap-1 rounded-full border border-white/10 p-1">
          {timeframes.map((tf) => (
            <button
              key={tf.label}
              type="button"
              onClick={() => setTimeframe(tf.label)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                timeframe === tf.label ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {points.length >= 2 ? (
          <SpreadHistoryChart data={points} symbol={token.symbol} heightClass="h-64" hideHeader />
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-center">
            <p className="text-sm text-white/70">Building history — check back soon.</p>
            <p className="mt-1 text-xs text-muted">
              {points.length === 1 ? "Only one snapshot recorded so far for this window." : "No snapshots recorded yet for this window."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
