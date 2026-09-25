import { NextResponse, type NextRequest } from "next/server";
import { CANDLE_TIMEFRAMES, type CandleTimeframe, type OhlcvCandle, type OhlcvResponse } from "@/lib/ohlcv-types";

const GECKOTERMINAL = "https://api.geckoterminal.com/api/v2/networks/solana/pools";

// Each T-Token's highest-liquidity pool on GeckoTerminal: Meteora, T-Token as
// the base token, quoted in USDC. Only these pools are served, so this route
// can't be used as an open proxy.
const POOLS: Record<string, { address: string; name: string }> = {
  oPAiAikWTaFj9RYoRFD35ccfwhnMcB3ThgBZRHSkjTZ: {
    address: "2ZWxT3niYjyudmDMDVar9ajNE42RkwYdzZBh6TiMuKQY",
    name: "Meteora tOpenAI/USDC",
  },
  TKLSidmLVt3cqGaaodG8tyRzoANfQwoh67AccjmubeZ: {
    address: "CGYxcqLiJEoYapZrU7uVGBGfEE15pXDV4mB9AQ8Fsuff",
    name: "Meteora tKalshi/USDC",
  },
  TSPXcLV76s6V2zDiZQ18kBfcbnjaE2ZzNT3ga2Pd99v: {
    address: "8obGpjiUu7QTJHK58YHCoz5HxobmrVP2x5zpMZu3c4BT",
    name: "Meteora tSpaceX/USDC",
  },
};

// GeckoTerminal's public API allows roughly 10 calls/minute, so responses are
// cached in Next's shared fetch cache: 5 minutes for intraday candles, an
// hour for daily ones.
const RESOLUTIONS: Record<
  CandleTimeframe,
  { path: "minute" | "hour" | "day"; aggregate: number; limit: number; windowMs: number; revalidate: number }
> = {
  "6H": { path: "minute", aggregate: 5, limit: 72, windowMs: 6 * 3_600_000, revalidate: 300 },
  "24H": { path: "minute", aggregate: 15, limit: 96, windowMs: 24 * 3_600_000, revalidate: 300 },
  "7D": { path: "hour", aggregate: 1, limit: 168, windowMs: 7 * 24 * 3_600_000, revalidate: 300 },
  All: { path: "day", aggregate: 1, limit: 1000, windowMs: Infinity, revalidate: 3600 },
};

// A single daily request returns at most ~6 months, so "All" pages back.
const MAX_DAILY_PAGES = 4;

type RawCandle = [number, number, number, number, number, number]; // [time, open, high, low, close, volume]

async function fetchCandles(pool: string, mint: string, timeframe: CandleTimeframe, beforeTimestamp?: number): Promise<RawCandle[]> {
  const res = RESOLUTIONS[timeframe];
  const params = new URLSearchParams({
    aggregate: String(res.aggregate),
    limit: String(res.limit),
    currency: "usd",
    // The T-Token's own price in USD, whichever side of the pair it's on.
    token: mint,
  });
  if (beforeTimestamp) params.set("before_timestamp", String(beforeTimestamp));

  const response = await fetch(`${GECKOTERMINAL}/${pool}/ohlcv/${res.path}?${params}`, {
    headers: { accept: "application/json;version=20230203" },
    next: { revalidate: res.revalidate },
  });
  if (!response.ok) {
    throw new Error(`GeckoTerminal responded with ${response.status}`);
  }
  const body = (await response.json()) as { data?: { attributes?: { ohlcv_list?: RawCandle[] } } };
  return body.data?.attributes?.ohlcv_list ?? [];
}

export async function GET(request: NextRequest) {
  const mint = request.nextUrl.searchParams.get("mint") ?? "";
  const timeframe = request.nextUrl.searchParams.get("timeframe") as CandleTimeframe | null;
  const pool = POOLS[mint];

  if (!pool || !timeframe || !CANDLE_TIMEFRAMES.includes(timeframe)) {
    return NextResponse.json({ error: "Unknown mint or timeframe." }, { status: 400 });
  }

  try {
    let raw = await fetchCandles(pool.address, mint, timeframe);

    if (timeframe === "All") {
      for (let page = 1; page < MAX_DAILY_PAGES && raw.length > 0; page++) {
        const oldest = Math.min(...raw.map((c) => c[0]));
        let older: RawCandle[];
        try {
          older = await fetchCandles(pool.address, mint, timeframe, oldest);
        } catch {
          // Rate-limited partway back: serve the history we already have rather
          // than nothing. The earlier pages are cached, so a later request only
          // has to fetch the missing ones.
          break;
        }
        if (older.length === 0) break;
        raw = raw.concat(older);
      }
    }

    const cutoff = Number.isFinite(RESOLUTIONS[timeframe].windowMs)
      ? (Date.now() - RESOLUTIONS[timeframe].windowMs) / 1000
      : -Infinity;
    const byTime = new Map<number, OhlcvCandle>();
    for (const [time, open, high, low, close] of raw) {
      if (time >= cutoff) byTime.set(time, { time, open, high, low, close });
    }
    const candles = [...byTime.values()].sort((a, b) => a.time - b.time);

    const body: OhlcvResponse = { source: "GeckoTerminal", pool: pool.name, timeframe, candles };
    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load historical candles." },
      { status: 502 },
    );
  }
}
