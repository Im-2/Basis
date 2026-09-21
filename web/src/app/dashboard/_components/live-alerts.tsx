import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowRight } from "lucide-react";
import { spreadColorClass } from "@/lib/spread-color";
import { OpenAIIcon, KalshiIcon, SpaceXIcon } from "@/components/token-icons";
import type { SpreadRecord } from "@/lib/dashboard-api-types";

const tokenIcon: Record<string, ComponentType<{ className?: string }>> = {
  "T-OpenAI": OpenAIIcon,
  "T-Kalshi": KalshiIcon,
  "T-SpaceX": SpaceXIcon,
};

type Severity = "High" | "Medium" | "Low";

const severityStyles: Record<Severity, string> = {
  High: "border-red-500/20 bg-red-500/15 text-red-400",
  Medium: "border-amber-500/20 bg-amber-500/15 text-amber-400",
  Low: "border-white/15 bg-white/10 text-white/70",
};

interface Alert {
  id: string;
  severity: Severity;
  titlePrefix: string;
  titlePct: number;
  titleSuffix: string;
  description: string;
  timestamp: string;
}

function relativeTime(iso: string, now: number): string {
  const diffMs = now - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function buildAlerts(spreads: SpreadRecord[], history: SpreadRecord[]): Alert[] {
  return spreads.map((s) => {
    const tokenHistory = history
      .filter((r) => r.symbol === s.symbol)
      .sort((a, b) => new Date(a.fetchedAt).getTime() - new Date(b.fetchedAt).getTime());
    const earliest = tokenHistory[0];
    const narrowed = earliest && earliest.spreadPct - s.spreadPct >= 1.5;

    if (narrowed) {
      return {
        id: s.symbol,
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
        severity: "Medium" as const,
        titlePrefix: `${s.symbol} spread at `,
        titlePct: s.spreadPct,
        titleSuffix: "",
        description: "Above the typical range — worth watching.",
        timestamp: s.fetchedAt,
      };
    }
    return {
      id: s.symbol,
      severity: "Low" as const,
      titlePrefix: `${s.symbol} spread stable at `,
      titlePct: s.spreadPct,
      titleSuffix: "",
      description: "Trading close to Tessera's mark price.",
      timestamp: s.fetchedAt,
    };
  });
}

export function LiveAlerts({
  spreads,
  history,
  now,
}: {
  spreads: SpreadRecord[];
  history: SpreadRecord[];
  now: number;
}) {
  const alerts = buildAlerts(spreads, history);

  return (
    <div className="glass-panel rounded-2xl p-6">
      <p className="text-sm font-medium text-white">Live Alerts</p>
      <p className="mt-1 text-xs text-muted">Basis is tracking spreads in real-time.</p>

      <div className="mt-5 space-y-3">
        {alerts.map((alert) => {
          const Icon = tokenIcon[alert.id] ?? OpenAIIcon;
          return (
            <div key={alert.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="flex items-start gap-2 text-sm font-semibold text-white">
                  <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full text-white" />
                  <span>
                    {alert.titlePrefix}
                    <span className={spreadColorClass(alert.titlePct)}>
                      {alert.titlePct >= 0 ? "+" : ""}
                      {alert.titlePct.toFixed(1)}%
                    </span>
                    {alert.titleSuffix}
                  </span>
                </p>
                <span
                  className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${severityStyles[alert.severity]}`}
                >
                  {alert.severity}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-muted">{alert.description}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted">{relativeTime(alert.timestamp, now)}</p>
                <Link
                  href={`/dashboard/trade?token=${encodeURIComponent(alert.id)}`}
                  className="inline-flex items-center gap-1 text-xs text-white/60 transition hover:text-white"
                >
                  Trade <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
        {alerts.length === 0 && <p className="text-sm text-muted">No live data yet.</p>}
      </div>
    </div>
  );
}
