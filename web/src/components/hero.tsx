import { ArrowRight, PlayCircle } from "lucide-react";
import { DashboardPreview } from "./dashboard-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-accent/25 blur-[120px]" />
        <div className="absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-accent/15 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pb-16 pt-10 text-center lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Live On-Chain · Tessera Pre-IPO Tokens
        </span>

        <h1 className="mt-6 text-5xl font-semibold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
          Track. Trade. Arbitrage.
          <br />
          Pre-IPO Tokens, Priced Right.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-muted">
          Basis tracks the live spread between Tessera&apos;s fair value and real DEX prices for T-OpenAI, T-Kalshi,
          and T-SpaceX — so you always know when you&apos;re getting a deal.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <a
            href="#tokens"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:brightness-110"
          >
            View Live Spreads
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/5"
          >
            <PlayCircle className="h-4 w-4" />
            How It Works
          </a>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 lg:px-8">
        <DashboardPreview />
      </div>
    </section>
  );
}
