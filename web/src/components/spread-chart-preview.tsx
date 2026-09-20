"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { spreadStats, tokenSpreadHistories } from "@/lib/dashboard-data";
import { spreadColorClass } from "@/lib/spread-color";
import { SpreadHistoryChart } from "./dashboard-preview/spread-history-chart";

const viewport = { once: false, amount: 0.3 };
const timeframes = ["6H", "24H", "7D"] as const;

export function SpreadChartPreview() {
  const [selected, setSelected] = useState(spreadStats[0].symbol);
  const [timeframe, setTimeframe] = useState<(typeof timeframes)[number]>("6H");

  const activeStat = spreadStats.find((s) => s.symbol === selected) ?? spreadStats[0];
  const history = tokenSpreadHistories[selected];

  return (
    <section className="relative overflow-hidden bg-background pb-24 pt-12 sm:pb-32 sm:pt-16">
      <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <span className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70 backdrop-blur">
            Live Data
          </span>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Watch The Gap Move.
          </h2>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            Spreads don&apos;t stay still. Track how {selected}&apos;s premium has moved over time — and catch it
            before it closes.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="glass-panel mt-12 rounded-2xl p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {spreadStats.map((s) => (
                <button
                  key={s.symbol}
                  type="button"
                  onClick={() => setSelected(s.symbol)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                    selected === s.symbol
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  {s.symbol}
                </button>
              ))}
            </div>

            <div className="flex gap-1 rounded-full border border-white/10 p-1">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    timeframe === tf ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_200px]">
            <SpreadHistoryChart data={history} symbol={selected} heightClass="h-80" />

            <div className="flex flex-row items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-5 lg:flex-col lg:items-start lg:justify-center">
              <p className="text-sm text-muted">Current Spread</p>
              <p className={`text-4xl font-semibold ${spreadColorClass(activeStat.spreadPct)}`}>
                {activeStat.spreadPct >= 0 ? "+" : ""}
                {activeStat.spreadPct}%
              </p>
              <p className="text-xs text-muted lg:mt-1">vs mark price</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
