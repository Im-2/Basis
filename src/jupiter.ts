import type { DexPrice } from "./types.js";

// Jupiter Price API V3. `lite-api.jup.ag` is the free, no-API-key tier (rate limited);
// if a JUPITER_API_KEY env var is set, we switch to the paid `api.jup.ag` host instead.
const JUPITER_API_KEY = process.env.JUPITER_API_KEY;
const PRICE_API_BASE = JUPITER_API_KEY ? "https://api.jup.ag/price/v3" : "https://lite-api.jup.ag/price/v3";

interface JupiterPriceV3Entry {
  usdPrice: number;
  liquidity?: number;
  blockId?: number;
  priceChange24h?: number;
}

type JupiterPriceV3Response = Record<string, JupiterPriceV3Entry>;

/** Fetches live USD prices for multiple mints in a single request (Jupiter allows up to 50 ids per call). */
export async function getDexPrices(mints: string[]): Promise<Map<string, DexPrice>> {
  if (mints.length === 0) return new Map();
  if (mints.length > 50) {
    throw new Error(`Jupiter Price API supports at most 50 ids per request, got ${mints.length}`);
  }

  const url = `${PRICE_API_BASE}?ids=${mints.join(",")}`;
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      ...(JUPITER_API_KEY ? { "x-api-key": JUPITER_API_KEY } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Jupiter Price API responded with ${res.status} ${res.statusText}`);
  }

  const body = (await res.json()) as JupiterPriceV3Response;

  const result = new Map<string, DexPrice>();
  for (const mint of mints) {
    const entry = body[mint];
    if (!entry || typeof entry.usdPrice !== "number") continue;
    result.set(mint, {
      usdPrice: entry.usdPrice,
      liquidity: entry.liquidity ?? null,
      blockId: entry.blockId ?? null,
      priceChange24h: entry.priceChange24h ?? null,
    });
  }
  return result;
}

/** Fetches the current live DEX (USD) price for a single mint, or null if Jupiter has no reliable price for it. */
export async function getDexPrice(mint: string): Promise<DexPrice | null> {
  const prices = await getDexPrices([mint]);
  return prices.get(mint) ?? null;
}

// Jupiter Swap "quote" endpoint (Metis onchain router). `lite-api.jup.ag/swap/v1/quote` is the
// free, no-API-key mirror of the legacy `/v6/quote` endpoint — used here only for diagnostics
// (trade-size sensitivity, route plan), not by getDexPrice/getDexPrices.
const QUOTE_API_BASE = "https://lite-api.jup.ag/swap/v1/quote";
const TOKEN_SEARCH_API_BASE = "https://lite-api.jup.ag/tokens/v2/search";

export interface QuoteRouteHop {
  label: string;
  ammKey: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  percent: number;
}

export interface QuoteResult {
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  routePlan: QuoteRouteHop[];
}

/** Fetches a swap quote (no transaction, price-check only) for a given input/output mint pair and raw input amount. */
export async function getQuote(inputMint: string, outputMint: string, amount: number, slippageBps = 50): Promise<QuoteResult> {
  const url = `${QUOTE_API_BASE}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter quote API responded with ${res.status} ${res.statusText}: ${text}`);
  }

  const body = (await res.json()) as {
    error?: string;
    inAmount: string;
    outAmount: string;
    priceImpactPct: string;
    routePlan?: Array<{
      swapInfo: {
        label: string;
        ammKey: string;
        inputMint: string;
        outputMint: string;
        inAmount: string;
        outAmount: string;
      };
      percent: number;
    }>;
  };

  if (body.error) {
    throw new Error(`Jupiter quote API error: ${body.error}`);
  }

  return {
    inAmount: body.inAmount,
    outAmount: body.outAmount,
    priceImpactPct: Number(body.priceImpactPct),
    routePlan: (body.routePlan ?? []).map((hop) => ({
      label: hop.swapInfo.label,
      ammKey: hop.swapInfo.ammKey,
      inputMint: hop.swapInfo.inputMint,
      outputMint: hop.swapInfo.outputMint,
      inAmount: hop.swapInfo.inAmount,
      outAmount: hop.swapInfo.outAmount,
      percent: hop.percent,
    })),
  };
}

/** Looks up a mint's decimal places via Jupiter's token search API (needed to turn raw quote amounts into human units). */
export async function getMintDecimals(mint: string): Promise<number> {
  const res = await fetch(`${TOKEN_SEARCH_API_BASE}?query=${mint}`, {
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Jupiter token search API responded with ${res.status} ${res.statusText}`);
  }

  const body = (await res.json()) as Array<{ id: string; decimals: number }>;
  const match = body.find((t) => t.id === mint);

  if (!match) {
    throw new Error(`Could not find token metadata for mint ${mint}`);
  }

  return match.decimals;
}
