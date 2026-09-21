"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { spreadColorClass } from "@/lib/spread-color";
import { OpenAIIcon, KalshiIcon, SpaceXIcon } from "@/components/token-icons";
import type { SpreadRecord } from "@/lib/dashboard-api-types";

const tokenIcon: Record<string, ComponentType<{ className?: string }>> = {
  "T-OpenAI": OpenAIIcon,
  "T-Kalshi": KalshiIcon,
  "T-SpaceX": SpaceXIcon,
};

const tabs = [
  { label: "Last 24h", ms: 24 * 60 * 60 * 1000 },
  { label: "Last 7 Days", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "All", ms: Infinity },
] as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MarketActivity({ history, now }: { history: SpreadRecord[]; now: number }) {
  const [tab, setTab] = useState<(typeof tabs)[number]["label"]>("Last 24h");

  const rows = useMemo(() => {
    const rangeMs = tabs.find((t) => t.label === tab)?.ms ?? Infinity;
    const cutoff = Number.isFinite(rangeMs) ? now - rangeMs : -Infinity;

    return [...history]
      .filter((r) => new Date(r.fetchedAt).getTime() >= cutoff)
      .sort((a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime())
      .slice(0, 25);
  }, [history, tab, now]);

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">Market Activity</p>
          <p className="mt-1 text-xs text-muted">Basis is tracking every spread change.</p>
        </div>
        <div className="flex gap-1 rounded-full border border-white/10 p-1">
          {tabs.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setTab(t.label)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                tab === t.label ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted">
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Token</th>
              <th className="pb-3 font-medium">Event</th>
              <th className="pb-3 font-medium">Spread</th>
              <th className="pb-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r, i) => {
              const Icon = tokenIcon[r.symbol] ?? OpenAIIcon;
              return (
                <tr key={`${r.symbol}-${r.fetchedAt}-${i}`}>
                  <td className="py-2.5 text-white/70">{formatDate(r.fetchedAt)}</td>
                  <td className="py-2.5 text-white/90">
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 flex-shrink-0 rounded-full text-white" />
                      {r.symbol}
                    </span>
                  </td>
                  <td className="py-2.5 text-white/60">Snapshot recorded</td>
                  <td className={`py-2.5 font-medium ${spreadColorClass(r.spreadPct)}`}>
                    {r.spreadPct >= 0 ? "+" : ""}
                    {r.spreadPct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 text-right">
                    <Link
                      href={`/dashboard/trade?token=${encodeURIComponent(r.symbol)}`}
                      className="inline-flex items-center gap-1 text-xs text-white/60 transition hover:text-white"
                    >
                      Trade <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="py-6 text-center text-sm text-muted">No snapshots recorded in this window yet.</p>}
      </div>
    </div>
  );
}
