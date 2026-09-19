"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SpreadHistoryPoint } from "@/lib/types";

export function SpreadHistoryChart({ data, symbol }: { data: SpreadHistoryPoint[]; symbol: string }) {
  return (
    <div className="h-full rounded-xl border border-white/5 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Spread History</p>
          <p className="text-xs text-muted">{symbol} · last 6 hours</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/50" />
            Mark Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" />
            DEX Price
          </span>
        </div>
      </div>

      <div className="mt-4 h-48">
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
            />
            <Line type="monotone" dataKey="markPrice" stroke="rgba(255,255,255,0.5)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="dexPrice" stroke="#F84203" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
