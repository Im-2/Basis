import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowRight } from "lucide-react";
import { dashboardSpreadColorClass } from "@/lib/spread-color";
import { OpenAIIcon, KalshiIcon, SpaceXIcon } from "@/components/token-icons";
import { buildAlerts, relativeTime, severityStyles } from "@/lib/alerts";
import type { SpreadRecord } from "@/lib/dashboard-api-types";

const tokenIcon: Record<string, ComponentType<{ className?: string }>> = {
  "T-OpenAI": OpenAIIcon,
  "T-Kalshi": KalshiIcon,
  "T-SpaceX": SpaceXIcon,
};

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
                    <span className={dashboardSpreadColorClass(alert.titlePct)}>
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
