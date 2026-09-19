import { getTesseraTokens } from "./tessera.js";
import { getDexPrices, getMintDecimals, getQuote, type QuoteResult } from "./jupiter.js";

/**
 * Diagnostic script (not part of the core pipeline): probes Jupiter's quote endpoint at
 * several trade sizes for each T-Token to check whether the single-point price used by
 * getDexPrice() (Price API V3) is representative, or whether these pools are thin enough
 * that trade size materially skews the "current price".
 */

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDC_DECIMALS = 6;

// Reference trade sizes in USD, buying the T-Token with USDC (the direction relevant to
// "what would I pay to acquire this right now").
const TRADE_SIZES_USD = [10, 1_000, 10_000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function usdcAmount(usd: number): number {
  return Math.round(usd * 10 ** USDC_DECIMALS);
}

function effectivePrice(quote: QuoteResult, sizeUsd: number, outDecimals: number): number {
  const outHuman = Number(quote.outAmount) / 10 ** outDecimals;
  return sizeUsd / outHuman;
}

function formatRoutePlan(quote: QuoteResult): string {
  if (quote.routePlan.length === 0) return "    (no route plan returned)";
  return quote.routePlan
    .map(
      (hop, i) =>
        `    hop ${i + 1}: ${hop.label.padEnd(20)} amm=${hop.ammKey}  ${hop.percent}% of trade  ` +
        `(${hop.inputMint.slice(0, 4)}...→${hop.outputMint.slice(0, 4)}...)`
    )
    .join("\n");
}

interface TokenDiagnostic {
  symbol: string;
  markPrice: number;
  priceV3: number | null;
  decimals: number;
  quotes: { sizeUsd: number; price: number; priceImpactPct: number; hops: number }[];
  routePlanSample: string;
}

async function diagnoseToken(
  token: { symbol: string; mint: string; markPrice: number },
  priceV3: number | null,
  captureRoutePlan: boolean
): Promise<TokenDiagnostic> {
  const decimals = await getMintDecimals(token.mint);
  await sleep(250);

  const quotes: TokenDiagnostic["quotes"] = [];
  let routePlanSample = "";

  for (const sizeUsd of TRADE_SIZES_USD) {
    try {
      const quote = await getQuote(USDC_MINT, token.mint, usdcAmount(sizeUsd));
      const price = effectivePrice(quote, sizeUsd, decimals);
      quotes.push({ sizeUsd, price, priceImpactPct: quote.priceImpactPct, hops: quote.routePlan.length });

      if (captureRoutePlan && sizeUsd === TRADE_SIZES_USD[TRADE_SIZES_USD.length - 1]) {
        routePlanSample = formatRoutePlan(quote);
      }
    } catch (err) {
      console.warn(`  [warn] quote failed for ${token.symbol} at $${sizeUsd}: ${err instanceof Error ? err.message : err}`);
    }
    await sleep(300); // be gentle with the free/keyless rate limit
  }

  return { symbol: token.symbol, markPrice: token.markPrice, priceV3, decimals, quotes, routePlanSample };
}

async function main(): Promise<void> {
  console.log("=== Basis diagnostic: Jupiter quote sensitivity to trade size ===\n");
  console.log(`Trade sizes probed: ${TRADE_SIZES_USD.map((s) => `$${s.toLocaleString()}`).join(", ")}`);
  console.log(`Direction: buying the T-Token with USDC (inputMint=USDC, outputMint=T-Token mint)\n`);

  const tokens = await getTesseraTokens();
  const priceV3Map = await getDexPrices(tokens.map((t) => t.mint));

  const diagnostics: TokenDiagnostic[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const priceV3 = priceV3Map.get(token.mint)?.usdPrice ?? null;
    console.log(`--- ${token.symbol} (${token.mint}) ---`);
    console.log(`  Tessera markPrice: $${token.markPrice.toFixed(4)}   Price API V3 usdPrice: ${priceV3 !== null ? "$" + priceV3.toFixed(4) : "n/a"}`);

    const diag = await diagnoseToken(token, priceV3, i === 0);

    for (const q of diag.quotes) {
      console.log(
        `  size=$${q.sizeUsd.toString().padStart(6)}  effectivePrice=$${q.price.toFixed(4).padStart(10)}  ` +
          `priceImpactPct=${(q.priceImpactPct * 100).toFixed(4)}%  hops=${q.hops}`
      );
    }

    if (diag.routePlanSample) {
      console.log(`  Route plan at $${TRADE_SIZES_USD[TRADE_SIZES_USD.length - 1].toLocaleString()} (sample):`);
      console.log(diag.routePlanSample);
    }

    console.log("");
    diagnostics.push(diag);
  }

  console.log("=== Summary ===\n");
  for (const d of diagnostics) {
    if (d.quotes.length < 2) {
      console.log(`${d.symbol}: not enough successful quotes to assess — skipping.`);
      continue;
    }
    const small = d.quotes[0];
    const large = d.quotes[d.quotes.length - 1];
    const swingPct = ((large.price - small.price) / small.price) * 100;
    const currentDexPrice = d.priceV3;
    const deviationFromMark = currentDexPrice !== null ? ((currentDexPrice - d.markPrice) / d.markPrice) * 100 : null;

    console.log(`${d.symbol}:`);
    console.log(
      `  Price at $${small.sizeUsd} vs $${large.sizeUsd}: $${small.price.toFixed(4)} -> $${large.price.toFixed(4)} ` +
        `(swing ${swingPct >= 0 ? "+" : ""}${swingPct.toFixed(2)}%)`
    );
    console.log(`  Max priceImpactPct observed: ${Math.max(...d.quotes.map((q) => q.priceImpactPct * 100)).toFixed(4)}%`);
    if (deviationFromMark !== null) {
      console.log(`  Current getDexPrice() (Price V3) vs markPrice spread: ${deviationFromMark >= 0 ? "+" : ""}${deviationFromMark.toFixed(2)}%`);
    }

    let verdict: string;
    if (Math.abs(swingPct) < 1) {
      verdict = "Pool looks deep relative to these sizes — trade size is not the main driver of the spread. getDexPrice()'s current approach (Price V3, size-independent) looks fine as-is.";
    } else if (Math.abs(swingPct) < 5) {
      verdict = "Moderate size sensitivity — some of the observed spread could be depth-related. Worth cross-checking Price V3 against a small ($10-$100) reference quote before trusting it as a UI signal.";
    } else {
      verdict = "Large size sensitivity — this pool is thin. A big chunk of the 8-32% spread we saw is likely a liquidity/depth artifact, not a real fair-value signal. Consider using a small, fixed reference trade size (e.g. $10-$100 quote) instead of Price V3's last-trade price for getDexPrice(), and/or surfacing priceImpactPct alongside spreadPct in the UI so users know when the number is depth-skewed.";
    }
    console.log(`  Verdict: ${verdict}\n`);
  }
}

void main();
