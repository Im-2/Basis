import { ArrowRight, PlayCircle } from "lucide-react";
import { DashboardPreview } from "./dashboard-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-x-0 -top-24 h-[640px] bg-[radial-gradient(ellipse_60%_55%_at_50%_0%,rgba(248,66,3,0.35),transparent_70%)]" />
        <div className="absolute -left-32 -top-20 h-[440px] w-[440px] rounded-full bg-accent/30 blur-[110px]" />
        <div className="absolute -right-24 -top-10 h-[380px] w-[380px] rounded-full bg-accent-pink/20 blur-[110px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pb-8 pt-6 text-center lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Live On-Chain · Tessera Pre-IPO Tokens
        </span>

        <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
          Track. Trade. Arbitrage.
          <br />
          Pre-IPO Tokens, Priced Right.
        </h1>

        <p className="mt-5 max-w-2xl text-lg text-muted">
          Basis tracks the live spread between Tessera&apos;s fair value and real DEX prices for T-OpenAI, T-Kalshi,
          and T-SpaceX — so you always know when you&apos;re getting a deal.
        </p>

        <div className="mt-7 flex flex-col items-center gap-4 sm:flex-row">
          <a
            href="#tokens"
            className="btn-accent inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition"
          >
            Explore Markets
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
