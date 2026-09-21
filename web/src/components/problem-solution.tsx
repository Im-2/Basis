"use client";

import { motion } from "framer-motion";
import { Logo } from "./logo";

const cardTransition = { duration: 0.5, ease: "easeOut" as const };
const viewport = { once: false, amount: 0.4 };
const CARD_HEIGHT = "md:min-h-[440px]";

export function ProblemSolution() {
  return (
    <section id="product" className="relative overflow-hidden pb-24 pt-12 sm:pb-32 sm:pt-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[15%] top-[20%] h-[320px] w-[320px] rounded-full bg-white/10 blur-[90px]" />
        <div className="absolute bottom-[10%] right-[15%] h-[320px] w-[320px] rounded-full bg-white/10 blur-[90px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewport}
            transition={cardTransition}
            className={`glass-panel relative z-10 flex ${CARD_HEIGHT} flex-col justify-center rounded-2xl p-8 md:w-[60%]`}
          >
            <span className="inline-block w-fit rounded-full bg-red-800/90 px-4 py-1.5 text-sm font-medium text-white">
              Problem
            </span>
            <p className="mt-6 leading-relaxed text-white/90">
              Tessera&apos;s pre-IPO tokens trade permissionlessly on open DEXs, 24/7. But DEX prices are driven
              purely by whoever&apos;s trading in that moment — thin liquidity and short-term swings can push prices
              well away from what the underlying asset is actually worth. Most users have no easy way to tell if
              they&apos;re overpaying or catching a real opportunity.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-white/60">
              <li className="flex gap-2">
                <span className="text-white/30">—</span>
                No visibility into fair value vs. live trading price
              </li>
              <li className="flex gap-2">
                <span className="text-white/30">—</span>
                Spreads can be wide and go unnoticed
              </li>
              <li className="flex gap-2">
                <span className="text-white/30">—</span>
                No fast way to act once a mispricing is spotted
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewport}
            transition={{ ...cardTransition, delay: 0.12 }}
            className={`glass-panel relative z-10 mt-8 flex ${CARD_HEIGHT} flex-col justify-center rounded-2xl p-8 md:-mt-32 md:ml-auto md:w-[60%] md:pt-14`}
          >
            <span className="inline-block w-fit rounded-full bg-emerald-800/90 px-4 py-1.5 text-sm font-medium text-white">
              Solution
            </span>
            <p className="mt-6 leading-relaxed text-white/90">
              Basis continuously compares Tessera&apos;s own reference mark price against the live DEX price for
              T-OpenAI, T-Kalshi, and T-SpaceX — surfacing the real-time spread as a clear, actionable signal.
            </p>
            <p className="mt-4 leading-relaxed text-white/90">
              See exactly when a token is trading above or below fair value, track how that gap moves over time, and
              trade directly the moment an opportunity shows up — all in one place.
            </p>
          </motion.div>

          <div className="glass-panel absolute left-1/2 top-1/2 z-20 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl text-foreground md:flex">
            <Logo className="h-6 w-6" />
          </div>
        </div>
      </div>
    </section>
  );
}
