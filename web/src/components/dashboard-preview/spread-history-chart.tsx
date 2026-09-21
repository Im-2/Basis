"use client";

import { useId } from "react";
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SpreadHistoryPoint } from "@/lib/types";

// Padding proportional to price level (not a flat dollar amount) -- a flat
// +/-10 padding flattens small real intra-window moves for higher-priced
// tokens (e.g. a genuine $2 fluctuation on a ~$960 price disappears into a
// forced $20+ window). 0.15% each side keeps the axis tight enough that
// real movement is still visible, with a small floor for near-zero ranges.
function domainPad(value: number): number {
  return Math.max(value * 0.0015, 0.05);
}

export function SpreadHistoryChart({
  data,
  symbol,
  heightClass = "h-48",
  hideHeader = false,
}: {
  data: SpreadHistoryPoint[];
  symbol: string;
  heightClass?: string;
  /** Skip the internal "Spread History" title/subtitle -- for callers that already show their own panel header. */
  hideHeader?: boolean;
}) {
  const gradientId = `dexPriceFill-${useId()}`;

  return (
    <div className="h-full rounded-xl border border-white/5 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        {hideHeader ? (
          <div />
        ) : (
          <div>
            <p className="text-sm font-medium text-white">Spread History</p>
            <p className="text-xs text-muted">{symbol} · last 6 hours</p>
          </div>
        )}
        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/35" />
            Mark Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: "var(--color-chart-dex-line)" }} />
            DEX Price
          </span>
        </div>
      </div>

      <div className={`mt-4 ${heightClass}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-dex-line)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-chart-dex-line)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis
              hide
              domain={[(min: number) => min - domainPad(min), (max: number) => max + domainPad(max)]}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-chart-tooltip-bg)",
                border: "1px solid var(--color-chart-tooltip-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--color-chart-label)" }}
              formatter={(value, name) => [
                `$${Number(value).toFixed(2)}`,
                name === "markPrice" ? "Mark Price" : "DEX Price",
              ]}
            />
            <Line
              type="monotone"
              dataKey="markPrice"
              stroke="var(--color-chart-mark)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="dexPrice"
              stroke="var(--color-chart-dex-line)"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
