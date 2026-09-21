"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { spreadStats } from "@/lib/dashboard-data";
import { spreadColorClass } from "@/lib/spread-color";

const viewport = { once: false, amount: 0.4 };
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport,
  transition: { duration: 0.5, ease: "easeOut" as const, delay },
});

export function TradeCTA() {
  return (
    <section className="cta-glow relative overflow-hidden pb-24 pt-12 sm:pb-32 sm:pt-16">
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 text-center lg:px-8">
        <motion.span
          {...fadeUp(0)}
          className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70 backdrop-blur"
        >
          Ready When You Are
        </motion.span>

        <motion.h2
          {...fadeUp(0.08)}
          className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          Stop Guessing. Start Trading The Spread.
        </motion.h2>

        <motion.p {...fadeUp(0.16)} className="mt-6 max-w-2xl text-lg text-muted">
          Connect your wallet and trade T-OpenAI, T-Kalshi, and T-SpaceX the moment a real opportunity shows up — no
          separate app, no switching tabs.
        </motion.p>

        <motion.div {...fadeUp(0.24)} className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/dashboard"
            className="btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition"
          >
            Connect Wallet
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard/markets"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/5"
          >
            View Live Markets
          </Link>
        </motion.div>

        <motion.div {...fadeUp(0.32)} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {spreadStats.map((s) => (
            <span
              key={s.symbol}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/80"
            >
              {s.symbol}
              <span className={spreadColorClass(s.spreadPct)}>
                {s.spreadPct >= 0 ? "+" : ""}
                {s.spreadPct}%
              </span>
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
