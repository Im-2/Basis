import type { PriceAlert, SpreadHistoryPoint, SpreadStat } from "./types";

// Placeholder data shaped exactly like what tessera.ts / jupiter.ts / spread.ts
// (the backend already built) will produce, so these components can be wired
// to live computeSpreads() output later without changing their props.

export const spreadStats: SpreadStat[] = [
  { symbol: "T-OpenAI", label: "T-OpenAI Spread", spreadPct: 20.8, trend: "up" },
  { symbol: "T-Kalshi", label: "T-Kalshi Spread", spreadPct: 8.1, trend: "up" },
  { symbol: "T-SpaceX", label: "T-SpaceX Spread", spreadPct: 31.8, trend: "up" },
];

export const totalHoldersTracked = 12_138;

export interface HeroStat {
  key: string;
  label: string;
  value: string;
  trend: "up" | "down";
  trendLabel: string;
  icon: "spread" | "holders";
}

export const heroStats: HeroStat[] = [
  ...spreadStats.map((s) => ({
    key: s.symbol,
    label: s.label,
    value: `${s.spreadPct >= 0 ? "+" : ""}${s.spreadPct.toFixed(1)}%`,
    trend: s.trend,
    trendLabel: "vs mark price",
    icon: "spread" as const,
  })),
  {
    key: "holders",
    label: "Total Holders Tracked",
    value: totalHoldersTracked.toLocaleString("en-US"),
    trend: "up" as const,
    trendLabel: "across 3 tokens",
    icon: "holders" as const,
  },
];

export const spreadHistorySymbol = "T-OpenAI";

export const spreadHistory: SpreadHistoryPoint[] = [
  { time: "-6h", markPrice: 810, dexPrice: 940 },
  { time: "-5h", markPrice: 811, dexPrice: 955 },
  { time: "-4h", markPrice: 812, dexPrice: 948 },
  { time: "-3h", markPrice: 812, dexPrice: 965 },
  { time: "-2h", markPrice: 812.5, dexPrice: 972 },
  { time: "-1h", markPrice: 812.79, dexPrice: 978 },
  { time: "now", markPrice: 812.79, dexPrice: 981.88 },
];

export const priceAlerts: PriceAlert[] = [
  { id: "1", message: "T-SpaceX crossed +30% premium", timestamp: "2 min ago", tone: "premium" },
  { id: "2", message: "T-OpenAI spread widened to +20.8%", timestamp: "14 min ago", tone: "premium" },
  { id: "3", message: "T-Kalshi spread narrowed below +10%", timestamp: "1 hr ago", tone: "discount" },
];
