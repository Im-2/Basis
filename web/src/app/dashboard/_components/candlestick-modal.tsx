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
import {
  CANDLE_SECONDS,
  CANDLE_TIMEFRAMES,
  type CandleTimeframe,
  type OhlcvCandle,
  type OhlcvResponse,
} from "@/lib/ohlcv-types";

const tokenIcon: Record<string, ComponentType<{ className?: string }>> = {
  "T-OpenAI": OpenAIIcon,
  "T-Kalshi": KalshiIcon,
  "T-SpaceX": SpaceXIcon,
};

// Fallback only, for when the historical-candle provider is unavailable:
// candles bucketed from our own stored snapshots (not native OHLC data).
const SNAPSHOT_RANGE_MS: Record<CandleTimeframe, number> = {
  "6H": 6 * 60 * 60 * 1000,
  "24H": 24 * 60 * 60 * 1000,
  "7D": 7 * 24 * 60 * 60 * 1000,
  All: Infinity,
};
const SNAPSHOT_BUCKET_MS: Record<CandleTimeframe, number> = {
  "6H": 15 * 60 * 1000,
  "24H": 60 * 60 * 1000,
  "7D": 4 * 60 * 60 * 1000,
  All: 24 * 60 * 60 * 1000,
};

type ProviderResult = { ok: true; data: OhlcvResponse } | { ok: false };

interface Candle {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

// Finest bucket worth showing -- matches our ~30s poll interval, so a
// smaller bucket wouldn't add real resolution, just empty gaps.
const MIN_BUCKET_MS = 30 * 1000;
// Aim for roughly this many candles when data allows it.
const TARGET_CANDLE_COUNT = 24;

/** Derives OHLC candles from real point-in-time DEX price snapshots -- no fabricated data, just bucketed real readings. */
function buildCandles(
  history: SpreadRecord[],
  symbol: string,
  rangeMs: number,
  nominalBucketMs: number,
  now: number,
): Candle[] {
  const cutoff = Number.isFinite(rangeMs) ? now - rangeMs : -Infinity;
  const points = history
    .filter((r) => r.symbol === symbol)
    .filter((r) => new Date(r.fetchedAt).getTime() >= cutoff)
    .map((r) => ({ t: new Date(r.fetchedAt).getTime(), price: r.dexPrice }))
    .sort((a, b) => a.t - b.t);

  if (points.length === 0) return [];

  // Shrink the bucket size to match how much real time our data actually
  // spans, capped at the timeframe's nominal size -- otherwise sparse
  // recent data (e.g. right after a serverless cold start, with only a
  // couple of minutes of real snapshots) collapses into a single bucket
  // and renders as one giant candle stretched across the whole chart,
  // regardless of which timeframe is selected.
  const actualSpanMs = points[points.length - 1].t - points[0].t;
  const bucketMs = Math.min(nominalBucketMs, Math.max(MIN_BUCKET_MS, actualSpanMs / TARGET_CANDLE_COUNT));

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

/**
 * The provider's candles, plus our own snapshots only where they're newer
 * than its last candle (bucketed at the same candle size). The provider
 * stays the source of truth for every interval it covers.
 */
function appendNewerSnapshots(
  candles: OhlcvCandle[],
  history: SpreadRecord[],
  symbol: string,
  candleSeconds: number,
): { candles: Candle[]; appended: boolean } {
  const result: Candle[] = candles.map((c) => ({ ...c, time: c.time as UTCTimestamp }));
  if (candles.length === 0) return { candles: result, appended: false };

  const nextCandleStart = candles[candles.length - 1].time + candleSeconds;
  const newer = history
    .filter((r) => r.symbol === symbol)
    .map((r) => ({ t: Math.floor(new Date(r.fetchedAt).getTime() / 1000), price: r.dexPrice }))
    .filter((p) => p.t >= nextCandleStart)
    .sort((a, b) => a.t - b.t);
  if (newer.length === 0) return { candles: result, appended: false };

  const buckets = new Map<number, number[]>();
  for (const p of newer) {
    const start = Math.floor(p.t / candleSeconds) * candleSeconds;
    const bucket = buckets.get(start);
    if (bucket) bucket.push(p.price);
    else buckets.set(start, [p.price]);
  }
  for (const [start, prices] of buckets) {
    result.push({
      time: start as UTCTimestamp,
      open: prices[0],
      high: Math.max(...prices),
      low: Math.min(...prices),
      close: prices[prices.length - 1],
    });
  }
  return { candles: result, appended: true };
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
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // 7D (hourly candles) reads best with real trading history: a full week of
  // candles for every token, including the thinly traded ones.
  const [timeframe, setTimeframe] = useState<CandleTimeframe>("7D");
  const [provider, setProvider] = useState<Record<string, ProviderResult>>({});
  const key = `${token.mint}:${timeframe}`;
  const result = provider[key];

  // Historical candles come from our own API route (which caches the
  // provider), never from the provider directly.
  useEffect(() => {
    if (provider[key]) return;
    let cancelled = false;
    fetch(`/api/ohlcv?mint=${encodeURIComponent(token.mint)}&timeframe=${timeframe}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`OHLCV request failed with ${res.status}`);
        return (await res.json()) as OhlcvResponse;
      })
      .then((data) => {
        if (!cancelled) setProvider((p) => ({ ...p, [key]: { ok: true, data } }));
      })
      .catch(() => {
        if (!cancelled) setProvider((p) => ({ ...p, [key]: { ok: false } }));
      });
    return () => {
      cancelled = true;
    };
  }, [key, provider, token.mint, timeframe]);

  const view = useMemo(() => {
    if (!result) return { candles: [] as Candle[], source: null, state: "loading" as const };
    if (result.ok) {
      const merged = appendNewerSnapshots(result.data.candles, history, token.symbol, CANDLE_SECONDS[timeframe]);
      return {
        candles: merged.candles,
        source: `Source: GeckoTerminal, ${result.data.pool} pool${merged.appended ? ", plus newer Basis snapshots" : ""}`,
        state: "provider" as const,
      };
    }
    return {
      candles: buildCandles(history, token.symbol, SNAPSHOT_RANGE_MS[timeframe], SNAPSHOT_BUCKET_MS[timeframe], now),
      source: "Source: Basis snapshots (historical candles unavailable right now)",
      state: "fallback" as const,
    };
  }, [result, history, token.symbol, timeframe, now]);

  const Icon = tokenIcon[token.symbol] ?? OpenAIIcon;

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

  // fitContent spreads whatever candles exist across the full width, so a
  // sparse window shows gaps rather than one stretched bar. `theme` is a dep
  // because a theme change rebuilds the chart, which needs its data again.
  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(view.candles);
    chartRef.current?.timeScale().fitContent();
  }, [view.candles, theme]);

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
            {CANDLE_TIMEFRAMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeframe(t)}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  timeframe === t ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-4 h-80">
          <div ref={containerRef} className="h-full w-full rounded-xl border border-white/5 bg-white/[0.03]" />
          {view.candles.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-xl text-center">
              {view.state === "loading" ? (
                <p className="text-sm text-white/70">Loading candles…</p>
              ) : view.state === "provider" ? (
                <p className="text-sm text-white/70">No trades in this window.</p>
              ) : (
                <>
                  <p className="text-sm text-white/70">Building candle history. Check back soon.</p>
                  <p className="mt-1 text-xs text-muted">No snapshots recorded yet for this token.</p>
                </>
              )}
            </div>
          )}
        </div>
        {view.source && <p className="mt-2 text-[11px] text-muted">{view.source}</p>}

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
