"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SpreadHistoryPoint } from "@/lib/types";

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
            <span className="h-2 w-2 rounded-full bg-accent" />
            DEX Price
          </span>
        </div>
      </div>

      <div className={`mt-4 ${heightClass}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="time" hide />
            <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
            <Tooltip
              contentStyle={{
                background: "#151516",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#989898" }}
              formatter={(value, name) => [
                `$${Number(value).toFixed(2)}`,
                name === "markPrice" ? "Mark Price" : "DEX Price",
              ]}
            />
            <Line type="monotone" dataKey="markPrice" stroke="rgba(255,255,255,0.35)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="dexPrice" stroke="#3B82F6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
