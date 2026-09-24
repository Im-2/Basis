"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OpenAIIcon, KalshiIcon, SpaceXIcon } from "@/components/token-icons";
import { buildAlerts, relativeTime, severityStyles, type Severity } from "@/lib/alerts";
import { useDashboardData } from "../use-dashboard-data";

const tokenIcon: Record<string, ComponentType<{ className?: string }>> = {
  "T-OpenAI": OpenAIIcon,
  "T-Kalshi": KalshiIcon,
  "T-SpaceX": SpaceXIcon,
};

const severityTabs = ["All", "High", "Medium", "Low"] as const;

export default function AlertsPage() {
  const { spreads, history, now, loading } = useDashboardData();
  const [severityFilter, setSeverityFilter] = useState<(typeof severityTabs)[number]>("All");
  const [tokenFilter, setTokenFilter] = useState<string>("All");

  const alerts = useMemo(() => buildAlerts(spreads, history), [spreads, history]);
  const symbols = spreads.map((s) => s.symbol);

  const filtered = alerts.filter((a) => {
    if (severityFilter !== "All" && a.severity !== severityFilter) return false;
    if (tokenFilter !== "All" && a.symbol !== tokenFilter) return false;
    return true;
  });

  const counts: Record<Severity, number> = { High: 0, Medium: 0, Low: 0 };
  for (const a of alerts) counts[a.severity]++;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Alerts</h1>
        <p className="mt-1 text-sm text-muted">
          Basis evaluates every tracked token against spread thresholds in real time. Here&apos;s the current status
          for each.
        </p>
      </div>

      {loading && spreads.length === 0 ? (
        <div className="glass-panel h-64 animate-pulse rounded-2xl" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="glass-panel rounded-xl p-4">
              <p className="text-sm text-muted">High Severity</p>
              <p className="mt-2 text-2xl font-semibold text-red-400">{counts.High}</p>
            </div>
            <div className="glass-panel rounded-xl p-4">
              <p className="text-sm text-muted">Medium Severity</p>
              <p className="mt-2 text-2xl font-semibold text-amber-400">{counts.Medium}</p>
            </div>
            <div className="glass-panel rounded-xl p-4">
              <p className="text-sm text-muted">Low Severity</p>
              <p className="mt-2 text-2xl font-semibold text-white">{counts.Low}</p>
            </div>
          </div>

          <div className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
            <div className="flex flex-wrap gap-1 rounded-full border border-white/10 p-1">
              {severityTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSeverityFilter(tab)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    severityFilter === tab ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTokenFilter("All")}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  tokenFilter === "All" ? "border-white/20 bg-white/10 text-white" : "border-white/10 text-white/60 hover:text-white"
                }`}
              >
                All Tokens
              </button>
              {symbols.map((symbol) => {
                const Icon = tokenIcon[symbol] ?? OpenAIIcon;
                return (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => setTokenFilter(symbol)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
                      tokenFilter === symbol
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0 rounded-full" />
                    {symbol}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map((alert) => {
              const Icon = tokenIcon[alert.symbol] ?? OpenAIIcon;
              return (
                <div key={alert.id} className="glass-panel rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="flex items-start gap-2.5 text-sm font-semibold text-white">
                      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full text-white" />
                      <span>
                        {alert.titlePrefix}
                        <span
                          className={
                            alert.titlePct < 0
                              ? "text-green-400"
                              : alert.severity === "High"
                                ? "text-red-400"
                                : alert.severity === "Medium"
                                  ? "text-amber-400"
                                  : "text-white"
                          }
                        >
                          {alert.titlePct >= 0 ? "+" : ""}
                          {alert.titlePct.toFixed(1)}%
                        </span>
                        {alert.titleSuffix}
                      </span>
                    </p>
                    <span
                      className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${severityStyles[alert.severity]}`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted">{alert.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-muted">{relativeTime(alert.timestamp, now)}</p>
                    <Link
                      href={`/dashboard/trade?token=${encodeURIComponent(alert.symbol)}`}
                      className="inline-flex items-center gap-1 text-xs text-white/60 transition hover:text-white"
                    >
                      Trade <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="glass-panel rounded-2xl p-6 text-center text-sm text-muted">
                {alerts.length === 0 ? "No live data available yet." : "No alerts match this filter."}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
