// Shared by /api/ohlcv (server) and the candlestick modal (client).

export const CANDLE_TIMEFRAMES = ["6H", "24H", "7D", "All"] as const;
export type CandleTimeframe = (typeof CANDLE_TIMEFRAMES)[number];

/** Candle size per timeframe, in seconds. */
export const CANDLE_SECONDS: Record<CandleTimeframe, number> = {
  "6H": 5 * 60,
  "24H": 15 * 60,
  "7D": 60 * 60,
  All: 24 * 60 * 60,
};

export interface OhlcvCandle {
  /** Candle start, seconds since epoch (UTC). */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface OhlcvResponse {
  source: "GeckoTerminal";
  /** Human-readable pool name, e.g. "Meteora tOpenAI/USDC". */
  pool: string;
  timeframe: CandleTimeframe;
  /** Oldest first. Only intervals with trades; empty intervals are not invented. */
  candles: OhlcvCandle[];
}
