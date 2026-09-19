export interface SpreadStat {
  symbol: string;
  label: string;
  spreadPct: number;
  trend: "up" | "down";
}

export interface SpreadHistoryPoint {
  time: string;
  markPrice: number;
  dexPrice: number;
}

export type AlertTone = "premium" | "discount" | "neutral";

export interface PriceAlert {
  id: string;
  message: string;
  timestamp: string;
  tone: AlertTone;
}
