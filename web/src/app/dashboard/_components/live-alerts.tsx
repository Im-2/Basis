import type { SpreadRecord } from "@/lib/dashboard-api-types";

type Severity = "High" | "Medium" | "Low";

const severityStyles: Record<Severity, string> = {
  High: "border-red-500/20 bg-red-500/15 text-red-400",
  Medium: "border-amber-500/20 bg-amber-500/15 text-amber-400",
  Low: "border-white/15 bg-white/10 text-white/70",
};

interface Alert {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  timestamp: string;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
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
        title: `${s.symbol} spread narrowed to +${s.spreadPct.toFixed(1)}%`,
        description: `Down from +${earliest.spreadPct.toFixed(1)}% earlier in this session.`,
        timestamp: s.fetchedAt,
      };
    }
    if (s.spreadPct > 25) {
      return {
        id: s.symbol,
        severity: "High" as const,
        title: `${s.symbol} crossed +25% premium`,
        description: `Trading ${s.spreadPct.toFixed(1)}% above Tessera's mark price of $${s.markPrice.toFixed(2)}.`,
        timestamp: s.fetchedAt,
      };
    }
    if (s.spreadPct > 10) {
      return {
        id: s.symbol,
        severity: "Medium" as const,
        title: `${s.symbol} spread at +${s.spreadPct.toFixed(1)}%`,
        description: "Above the typical range — worth watching.",
        timestamp: s.fetchedAt,
      };
    }
    return {
      id: s.symbol,
      severity: "Low" as const,
      title: `${s.symbol} spread stable at +${s.spreadPct.toFixed(1)}%`,
      description: "Trading close to Tessera's mark price.",
      timestamp: s.fetchedAt,
    };
  });
}

export function LiveAlerts({ spreads, history }: { spreads: SpreadRecord[]; history: SpreadRecord[] }) {
  const alerts = buildAlerts(spreads, history);

  return (
    <div className="glass-panel rounded-2xl p-6">
      <p className="text-sm font-medium text-white">Live Alerts</p>
      <p className="mt-1 text-xs text-muted">Basis is tracking spreads in real-time.</p>

      <div className="mt-5 space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-white">{alert.title}</p>
              <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${severityStyles[alert.severity]}`}>
                {alert.severity}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-muted">{alert.description}</p>
            <p className="mt-2 text-xs text-white/40">{relativeTime(alert.timestamp)}</p>
          </div>
        ))}
        {alerts.length === 0 && <p className="text-sm text-muted">No live data yet.</p>}
      </div>
    </div>
  );
}
