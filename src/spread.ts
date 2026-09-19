import { getTesseraTokens } from "./tessera.js";
import { getDexPrices } from "./jupiter.js";
import type { SpreadRecord } from "./types.js";

/**
 * Fetches Tessera mark prices and live Jupiter DEX prices for all known T-Tokens,
 * and combines them into normalized spread records. A token is skipped (not crashed
 * on) if Jupiter has no reliable price for its mint.
 */
export async function computeSpreads(): Promise<SpreadRecord[]> {
  const tokens = await getTesseraTokens();
  const dexPrices = await getDexPrices(tokens.map((t) => t.mint));
  const fetchedAt = new Date().toISOString();

  const records: SpreadRecord[] = [];
  for (const token of tokens) {
    const dex = dexPrices.get(token.mint);
    if (!dex) {
      console.warn(`[spread] no Jupiter DEX price available for ${token.symbol} (${token.mint}), skipping`);
      continue;
    }

    const spreadPct = ((dex.usdPrice - token.markPrice) / token.markPrice) * 100;

    records.push({
      symbol: token.symbol,
      name: token.name,
      sector: token.sector,
      mint: token.mint,
      markPrice: token.markPrice,
      dexPrice: dex.usdPrice,
      spreadPct,
      holders: token.holders,
      markValuation: token.markValuation,
      fetchedAt,
    });
  }

  return records;
}
