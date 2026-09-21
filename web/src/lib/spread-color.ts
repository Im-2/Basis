/**
 * Illustrative green/red convention used by the landing page's marketing
 * copy (How It Works, Trade CTA, Spread Chart Preview): green for positive,
 * red for negative. These are static example numbers, not live trading
 * guidance, so they keep the simple sign-based convention established when
 * the landing page was built.
 */
export function spreadColorClass(value: number): string {
  return value >= 0 ? "text-green-400" : "text-red-500";
}

/**
 * Trading-logic-aware convention used across the real dashboard (stat
 * cards, Live Alerts, Market Activity, the Trade page): green when the DEX
 * price is BELOW Tessera's mark price (a discount -- the actual buy signal,
 * since you're paying less than fair value), our accent blue when it's above
 * (a premium -- not necessarily bad, but not a deal either, so not "good
 * news" green -- and not amber/orange either, which reads as a warning we
 * don't intend). text-premium resolves to --color-premium, the same
 * contrast-safe blue already used for the DEX price chart line. Deliberately
 * distinct from spreadColorClass above so the dashboard always colors a
 * spread by what it actually means for a buyer, everywhere it appears.
 */
export function dashboardSpreadColorClass(value: number): string {
  return value < 0 ? "text-green-400" : "text-premium";
}
