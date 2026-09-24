import type { SpreadRecord } from "@/lib/dashboard-api-types";

export type Severity = "High" | "Medium" | "Low";

export const severityStyles: Record<Severity, string> = {
  High: "border-red-500/20 bg-red-500/15 text-red-400",
  Medium: "border-amber-500/20 bg-amber-500/15 text-amber-400",
  Low: "border-white/15 bg-white/10 text-white/70",
};

export interface Alert {
  id: string;
  symbol: string;
  severity: Severity;
  titlePrefix: string;
  titlePct: number;
  titleSuffix: string;
  description: string;
  timestamp: string;
}

export function relativeTime(iso: string, now: number): string {
  const diffMs = now - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/**
 * One real, current-status alert per tracked token, derived live from the
 * latest spread vs. its own session history -- not a stored/persistent
 * alert log (Basis doesn't have one), so this is genuinely everything we
 * have to show, not a truncated preview of something bigger.
 */
export function buildAlerts(spreads: SpreadRecord[], history: SpreadRecord[]): Alert[] {
  return spreads.map((s) => {
    const tokenHistory = history
      .filter((r) => r.symbol === s.symbol)
      .sort((a, b) => new Date(a.fetchedAt).getTime() - new Date(b.fetchedAt).getTime());
    const earliest = tokenHistory[0];
    const narrowed = earliest && earliest.spreadPct - s.spreadPct >= 1.5;

    if (narrowed) {
      return {
        id: s.symbol,
        symbol: s.symbol,
        severity: "Medium" as const,
        titlePrefix: `${s.symbol} spread narrowed to `,
        titlePct: s.spreadPct,
        titleSuffix: "",
        description: `Down from +${earliest.spreadPct.toFixed(1)}% earlier in this session.`,
        timestamp: s.fetchedAt,
      };
    }
    if (s.spreadPct > 25) {
      return {
        id: s.symbol,
        symbol: s.symbol,
        severity: "High" as const,
        titlePrefix: `${s.symbol} crossed `,
        titlePct: 25,
        titleSuffix: " premium",
        description: `Trading ${s.spreadPct.toFixed(1)}% above Tessera's mark price of $${s.markPrice.toFixed(2)}.`,
        timestamp: s.fetchedAt,
      };
    }
    if (s.spreadPct > 10) {
      return {
        id: s.symbol,
        symbol: s.symbol,
        severity: "Medium" as const,
        titlePrefix: `${s.symbol} spread at `,
        titlePct: s.spreadPct,
        titleSuffix: "",
        description: "Above the typical range. Worth watching.",
        timestamp: s.fetchedAt,
      };
    }
    return {
      id: s.symbol,
      symbol: s.symbol,
      severity: "Low" as const,
      titlePrefix: `${s.symbol} spread stable at `,
      titlePct: s.spreadPct,
      titleSuffix: "",
      description: "Trading close to Tessera's mark price.",
      timestamp: s.fetchedAt,
    };
  });
}
