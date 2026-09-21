"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import { ChevronRight } from "lucide-react";
import { dashboardSpreadColorClass } from "@/lib/spread-color";
import { OpenAIIcon, KalshiIcon, SpaceXIcon } from "@/components/token-icons";
import { useDashboardData } from "../use-dashboard-data";
import { CandlestickModal } from "../_components/candlestick-modal";

const tokenIcon: Record<string, ComponentType<{ className?: string }>> = {
  "T-OpenAI": OpenAIIcon,
  "T-Kalshi": KalshiIcon,
  "T-SpaceX": SpaceXIcon,
};

function formatCompactUsd(value: number): string {
  return `$${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value)}`;
}

export default function MarketsPage() {
  const { spreads, history, now, loading } = useDashboardData();
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const selectedToken = spreads.find((s) => s.symbol === selectedSymbol) ?? null;

  const totalMarketCap = spreads.reduce((sum, s) => sum + s.markValuation, 0);
  const totalHolders = spreads.reduce((sum, s) => sum + s.holders, 0);
  const avgSpread = spreads.length > 0 ? spreads.reduce((sum, s) => sum + s.spreadPct, 0) / spreads.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Markets</h1>
        <p className="mt-1 text-sm text-muted">Every Basis-tracked token, side by side. Click a row for the full chart.</p>
      </div>

      {loading && spreads.length === 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-panel h-[104px] animate-pulse rounded-xl" />
            ))}
          </div>
          <div className="glass-panel h-64 animate-pulse rounded-2xl" />
        </>
      ) : spreads.length === 0 ? (
        <div className="glass-panel rounded-2xl p-6 text-center text-sm text-muted">No live token data available yet.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="glass-panel rounded-xl p-4">
              <p className="text-sm text-muted">Total Market Cap Tracked</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCompactUsd(totalMarketCap)}</p>
              <p className="mt-1 text-xs text-muted">
                across {spreads.length} token{spreads.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="glass-panel rounded-xl p-4">
              <p className="text-sm text-muted">Total Holders</p>
              <p className="mt-2 text-2xl font-semibold text-white">{totalHolders.toLocaleString("en-US")}</p>
              <p className="mt-1 text-xs text-muted">
                across {spreads.length} token{spreads.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="glass-panel rounded-xl p-4">
              <p className="text-sm text-muted">Avg Spread</p>
              <p className={`mt-2 text-2xl font-semibold ${dashboardSpreadColorClass(avgSpread)}`}>
                {avgSpread >= 0 ? "+" : ""}
                {avgSpread.toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-muted">vs mark price</p>
            </div>
          </div>

          <div className="glass-panel overflow-hidden rounded-2xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-wide text-muted">
                  <th className="px-6 py-4 font-medium">Token</th>
                  <th className="px-6 py-4 font-medium">Mark Price</th>
                  <th className="px-6 py-4 font-medium">DEX Price</th>
                  <th className="px-6 py-4 font-medium">Spread</th>
                  <th className="px-6 py-4 font-medium">Holders</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {spreads.map((s) => {
                  const Icon = tokenIcon[s.symbol] ?? OpenAIIcon;
                  return (
                    <tr
                      key={s.symbol}
                      onClick={() => setSelectedSymbol(s.symbol)}
                      className="cursor-pointer transition hover:bg-white/5"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Icon className="h-8 w-8 flex-shrink-0 rounded-full text-white" />
                          <div>
                            <p className="font-medium text-white">{s.symbol}</p>
                            <p className="text-xs text-muted">{s.sector}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white">${s.markPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-white">${s.dexPrice.toFixed(2)}</td>
                      <td className={`px-6 py-4 font-medium ${dashboardSpreadColorClass(s.spreadPct)}`}>
                        {s.spreadPct >= 0 ? "+" : ""}
                        {s.spreadPct.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-white/80">{s.holders.toLocaleString("en-US")}</td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="ml-auto h-4 w-4 text-white/40" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedToken && (
        <CandlestickModal token={selectedToken} history={history} now={now} onClose={() => setSelectedSymbol(null)} />
      )}
    </div>
  );
}
