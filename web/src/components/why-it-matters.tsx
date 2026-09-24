"use client";

import { motion } from "framer-motion";
import { ArrowRightLeft, Radar, Split, type LucideIcon } from "lucide-react";
import { useInvertedThemeClass } from "@/lib/theme";

const viewport = { once: false, amount: 0.3 };
const textTransition = (delay: number) => ({ duration: 0.5, ease: "easeOut" as const, delay });

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
  link: string;
  align: "right" | "left";
}

const steps: Step[] = [
  {
    icon: Radar,
    title: "Detect",
    description: "We compare Tessera's mark price against live DEX prices, continuously, for every T-Token.",
    link: "See the data →",
    align: "right",
  },
  {
    icon: Split,
    title: "Surface",
    description: "The moment a real spread appears, it's shown clearly — no digging through charts or spreadsheets.",
    link: "How it works →",
    align: "left",
  },
  {
    icon: ArrowRightLeft,
    title: "Route",
    description: "One click routes that opportunity straight into a trade — turning insight into real demand for T-Tokens.",
    link: "Start trading →",
    align: "right",
  },
];

export function WhyItMatters() {
  const invertedTheme = useInvertedThemeClass();

  return (
    <section className="relative overflow-hidden pb-24 pt-12 sm:pb-32 sm:pt-16">
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2 lg:px-8">
        <div className="flex flex-col">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={textTransition(0)}
            className="inline-block w-fit rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70 backdrop-blur"
          >
            Built To Drive Volume
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={textTransition(0.08)}
            className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            From Mispricing → Signal →
            <br />
            Trade in One Click.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={textTransition(0.16)}
            className="mt-6 max-w-xl text-lg text-muted"
          >
            Basis doesn&apos;t just show you numbers. Every spread we surface is a nudge toward real trading activity
            on T-OpenAI, T-Kalshi, and T-SpaceX — turning insight straight into on-chain volume.
          </motion.p>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute right-0 top-0 h-64 w-80 rounded-[32px] bg-white/10 blur-[80px]" />
            <div className="absolute bottom-0 left-0 h-64 w-80 rounded-[32px] bg-white/10 blur-[80px]" />
          </div>

          <div className="flex flex-col lg:py-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={textTransition(i * 0.1)}
                  style={{ zIndex: 10 + i * 10 }}
                  className={`glass-panel relative w-full rounded-2xl p-6 lg:w-[82%] ${invertedTheme} ${
                    i > 0 ? "mt-4 lg:-mt-10" : ""
                  } ${step.align === "right" ? "lg:ml-auto" : "lg:mr-auto"}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{step.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80">
                    {step.link}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
