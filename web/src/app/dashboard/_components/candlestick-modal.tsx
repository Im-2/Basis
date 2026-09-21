"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { CandlestickSeries, ColorType, createChart } from "lightweight-charts";
import type { IChartApi, ISeriesApi, UTCTimestamp } from "lightweight-charts";
import { dashboardSpreadColorClass } from "@/lib/spread-color";
import { OpenAIIcon, KalshiIcon, SpaceXIcon } from "@/components/token-icons";
import { useTheme } from "@/lib/theme";
import type { SpreadRecord } from "@/lib/dashboard-api-types";

const tokenIcon: Record<string, ComponentType<{ className?: string }>> = {
  "T-OpenAI": OpenAIIcon,
  "T-Kalshi": KalshiIcon,
  "T-SpaceX": SpaceXIcon,
};

// Bucket size scales with the window so each timeframe renders a sensible
// number of candles from our point-in-time snapshots (not native OHLC data).
const candleTimeframes = [
  { label: "6H", rangeMs: 6 * 60 * 60 * 1000, bucketMs: 15 * 60 * 1000 },
  { label: "24H", rangeMs: 24 * 60 * 60 * 1000, bucketMs: 60 * 60 * 1000 },
  { label: "7D", rangeMs: 7 * 24 * 60 * 60 * 1000, bucketMs: 4 * 60 * 60 * 1000 },
  { label: "All", rangeMs: Infinity, bucketMs: 24 * 60 * 60 * 1000 },
] as const;

interface Candle {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

/** Derives OHLC candles from real point-in-time DEX price snapshots -- no fabricated data, just bucketed real readings. */
function buildCandles(history: SpreadRecord[], symbol: string, rangeMs: number, bucketMs: number, now: number): Candle[] {
  const cutoff = Number.isFinite(rangeMs) ? now - rangeMs : -Infinity;
  const points = history
    .filter((r) => r.symbol === symbol)
    .filter((r) => new Date(r.fetchedAt).getTime() >= cutoff)
    .map((r) => ({ t: new Date(r.fetchedAt).getTime(), price: r.dexPrice }))
    .sort((a, b) => a.t - b.t);

  const buckets = new Map<number, number[]>();
  for (const p of points) {
    const key = Math.floor(p.t / bucketMs) * bucketMs;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(p.price);
    else buckets.set(key, [p.price]);
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bucketStart, prices]) => ({
      time: Math.floor(bucketStart / 1000) as UTCTimestamp,
      open: prices[0],
      high: Math.max(...prices),
      low: Math.min(...prices),
      close: prices[prices.length - 1],
    }));
}

export function CandlestickModal({
  token,
  history,
  now,
  onClose,
}: {
  token: SpreadRecord;
  history: SpreadRecord[];
  now: number;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const [timeframe, setTimeframe] = useState<(typeof candleTimeframes)[number]["label"]>("24H");
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const Icon = tokenIcon[token.symbol] ?? OpenAIIcon;
  const tf = candleTimeframes.find((t) => t.label === timeframe) ?? candleTimeframes[1];
  const candles = useMemo(
    () => buildCandles(history, token.symbol, tf.rangeMs, tf.bucketMs, now),
    [history, token.symbol, tf.rangeMs, tf.bucketMs, now],
  );

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Create the chart once per theme (lightweight-charts colors are literal
  // strings, not CSS vars, so a theme flip needs a fresh chart instance).
  useEffect(() => {
    if (!containerRef.current) return;
    const colors =
      theme === "light"
        ? { text: "#4b5563", grid: "rgba(17,17,17,0.08)", border: "rgba(17,17,17,0.12)" }
        : { text: "#989898", grid: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)" };

    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: colors.text },
      grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { borderColor: colors.border, timeVisible: true, secondsVisible: false },
      width: containerRef.current.clientWidth,
      height: 320,
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
    chartRef.current = chart;
    seriesRef.current = series;

    function handleResize() {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    }
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [theme]);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(candles);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  const positive = token.spreadPct >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-panel modal-panel w-full max-w-2xl rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Icon className="h-9 w-9 flex-shrink-0 rounded-full text-white" />
            <div>
              <p className="text-lg font-semibold text-white">{token.symbol}</p>
              <p className="text-xs text-muted">{token.sector}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
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
              {positive ? "+" : ""}
              {token.spreadPct.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <div className="flex gap-1 rounded-full border border-white/10 p-1">
            {candleTimeframes.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => setTimeframe(t.label)}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  timeframe === t.label ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-4 h-80">
          <div ref={containerRef} className="h-full w-full rounded-xl border border-white/5 bg-white/[0.03]" />
          {candles.length < 2 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-xl text-center">
              <p className="text-sm text-white/70">Building candle history — check back soon.</p>
              <p className="mt-1 text-xs text-muted">Not enough snapshots yet for this window.</p>
            </div>
          )}
        </div>

        <Link
          href={`/dashboard/trade?token=${encodeURIComponent(token.symbol)}`}
          className="btn-primary mt-5 block w-full rounded-full py-3 text-center text-sm font-medium transition"
        >
          Trade →
        </Link>
      </div>
    </div>
  );
}
