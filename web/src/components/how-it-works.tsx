"use client";

import { motion } from "framer-motion";
import { spreadHistory, spreadHistorySymbol, spreadStats } from "@/lib/dashboard-data";
import { spreadColorClass } from "@/lib/spread-color";
import { useInvertedThemeClass } from "@/lib/theme";
import { SpreadHistoryChart } from "./dashboard-preview/spread-history-chart";

const viewport = { once: false, amount: 0.3 };
const cardTransition = (delay: number) => ({ duration: 0.5, ease: "easeOut" as const, delay });

const signalRows = [...spreadStats].sort((a, b) => b.spreadPct - a.spreadPct);
const tradeRows = spreadStats.map((s) => ({ ...s, action: "Buy" }));

export function HowItWorks() {
  const invertedTheme = useInvertedThemeClass();

  return (
    <section id="how-it-works" className="relative overflow-hidden bg-background pb-24 pt-12 sm:pb-32 sm:pt-16">
      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <span className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70 backdrop-blur">
            How It Works
          </span>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Every Signal. Every Second.
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={cardTransition(0)}
            className="glass-panel flex flex-col rounded-2xl p-6 md:min-h-[420px]"
          >
            <h3 className="text-lg font-semibold text-white">Track Live Prices</h3>
            <p className="mt-2 text-sm text-muted">
              We pull Tessera&apos;s mark price and the live DEX price every 30 seconds for T-OpenAI, T-Kalshi, and
              T-SpaceX.
            </p>
            <div className={`preview-invert-surface mt-6 flex-1 rounded-xl ${invertedTheme}`}>
              <SpreadHistoryChart data={spreadHistory} symbol={spreadHistorySymbol} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={cardTransition(0.1)}
            className="glass-panel flex flex-col rounded-2xl p-6 md:min-h-[420px]"
          >
            <h3 className="text-lg font-semibold text-white">Spot the Spread</h3>
            <p className="mt-2 text-sm text-muted">
              The gap between the two prices is calculated instantly and surfaced as a clear premium or discount
              signal.
            </p>
            <div className="mt-6 flex flex-1 flex-col justify-center">
              <div className={`preview-invert-surface rounded-xl p-5 ${invertedTheme}`}>
                <p className="text-sm font-medium text-white">Live Spread Signals</p>
                <div className="mt-4 space-y-4">
                  {signalRows.map((row) => (
                    <div key={row.symbol} className="flex items-center gap-3">
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/60" />
                      <p className="text-sm text-white/90">
                        {row.symbol} <span className={spreadColorClass(row.spreadPct)}>+{row.spreadPct}%</span> vs
                        mark
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={cardTransition(0.2)}
            className="glass-panel flex flex-col rounded-2xl p-6 md:min-h-[420px]"
          >
            <h3 className="text-lg font-semibold text-white">Trade the Gap</h3>
            <p className="mt-2 text-sm text-muted">
              See a mispricing you like? Swap directly from the dashboard the moment you spot it — no need to leave
              the page.
            </p>
            <div className="mt-6 flex flex-1 flex-col justify-center">
              <div className={`preview-invert-surface rounded-xl p-5 ${invertedTheme}`}>
                <div className="grid grid-cols-3 gap-2 text-xs uppercase tracking-wide text-muted">
                  <span>Token</span>
                  <span>Spread</span>
                  <span>Action</span>
                </div>
                <div className="mt-3 divide-y divide-white/5">
                  {tradeRows.map((row) => (
                    <div key={row.symbol} className="grid grid-cols-3 gap-2 py-2.5 text-sm">
                      <span className="text-white/90">{row.symbol}</span>
                      <span className={spreadColorClass(row.spreadPct)}>+{row.spreadPct}%</span>
                      <span className="text-white/60">{row.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
