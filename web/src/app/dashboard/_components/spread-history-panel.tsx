"use client";

import { useMemo, useState } from "react";
import { SpreadHistoryChart } from "@/components/dashboard-preview/spread-history-chart";
import type { SpreadRecord } from "@/lib/dashboard-api-types";
import type { SpreadHistoryPoint } from "@/lib/types";

const timeframes = [
  { label: "6H", ms: 6 * 60 * 60 * 1000 },
  { label: "24H", ms: 24 * 60 * 60 * 1000 },
  { label: "7D", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "All", ms: Infinity },
] as const;

export function SpreadHistoryPanel({
  symbols,
  history,
  now,
}: {
  symbols: string[];
  history: SpreadRecord[];
  now: number;
}) {
  const [selected, setSelected] = useState(symbols[0] ?? "T-OpenAI");
  const [timeframe, setTimeframe] = useState<(typeof timeframes)[number]["label"]>("All");

  const points = useMemo(() => {
    const rangeMs = timeframes.find((t) => t.label === timeframe)?.ms ?? Infinity;
    const cutoff = Number.isFinite(rangeMs) ? now - rangeMs : -Infinity;

    const filtered = history
      .filter((r) => r.symbol === selected)
      .filter((r) => new Date(r.fetchedAt).getTime() >= cutoff)
      .sort((a, b) => new Date(a.fetchedAt).getTime() - new Date(b.fetchedAt).getTime());

    const result: SpreadHistoryPoint[] = filtered.map((r) => ({
      time: new Date(r.fetchedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      markPrice: r.markPrice,
      dexPrice: r.dexPrice,
    }));
    return result;
  }, [history, selected, timeframe, now]);

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">Spread History</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {symbols.map((symbol) => (
              <button
                key={symbol}
                type="button"
                onClick={() => setSelected(symbol)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  selected === symbol
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 text-white/60 hover:text-white"
                }`}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1 rounded-full border border-white/10 p-1">
          {timeframes.map((tf) => (
            <button
              key={tf.label}
              type="button"
              onClick={() => setTimeframe(tf.label)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                timeframe === tf.label ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {points.length >= 2 ? (
          <SpreadHistoryChart data={points} symbol={selected} heightClass="h-64" />
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-center">
            <p className="text-sm text-white/70">Building history — check back soon.</p>
            <p className="mt-1 text-xs text-muted">
              {points.length === 1
                ? "Only one snapshot recorded so far for this window."
                : "No snapshots recorded yet for this window."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
