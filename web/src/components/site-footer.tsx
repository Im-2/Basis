"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useDashboardData } from "@/app/dashboard/use-dashboard-data";
import { Logo } from "./logo";

const REPO_URL = "https://github.com/Im-2/Basis";
const X_URL = "https://x.com/nuelcrypt";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const linkColumns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/dashboard" },
      { label: "Markets", href: "/dashboard/markets" },
      { label: "Trade", href: "/dashboard/trade" },
      { label: "Spread History", href: "/dashboard/spread-history" },
      { label: "Alerts", href: "/dashboard/alerts" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Docs", href: REPO_URL, external: true },
      { label: "Tessera", href: "https://www.tessera.pe", external: true },
      { label: "Jupiter", href: "https://jup.ag", external: true },
    ],
  },
  {
    title: "Hackathon",
    links: [
      { label: "Stocklana", href: "https://hackathons.solana.com/hackathons/stocklana", external: true },
      { label: "GitHub repo", href: REPO_URL, external: true },
    ],
  },
];

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function FooterAnchor({ link }: { link: FooterLink }) {
  const className = "text-sm text-white/75 transition hover:text-white";
  return link.external ? (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
      {link.label}
    </a>
  ) : (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

/** Real current spreads from /api/dashboard, same source as the dashboard itself. */
function LiveStatus() {
  const { spreads, loading } = useDashboardData();

  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-medium text-white">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-300" />
        </span>
        Live status
      </p>
      <div className="mt-4 space-y-2.5">
        {loading && spreads.length === 0 ? (
          <p className="text-sm text-white/60">Loading…</p>
        ) : spreads.length === 0 ? (
          <p className="text-sm text-white/60">Live data unavailable right now.</p>
        ) : (
          spreads.map((s) => (
            <p key={s.symbol} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-white/75">{s.symbol}</span>
              {/* The dashboard's premium blue would vanish on this background, so premiums stay white. */}
              <span className={`font-medium ${s.spreadPct < 0 ? "text-green-300" : "text-white"}`}>
                {s.spreadPct >= 0 ? "+" : ""}
                {s.spreadPct.toFixed(1)}%
              </span>
            </p>
          ))
        )}
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden">
      {/* Closing CTA, on the normal page background. */}
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 pt-12 text-center sm:pt-16 lg:px-8">
        <span className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70 backdrop-blur">
          Start Trading Smarter
        </span>
        <h2 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
          Built for traders who read the gap.
        </h2>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Live Tessera fair-value signals and one-click execution on T-OpenAI, T-Kalshi, and T-SpaceX.
        </p>
        <Link
          href="/dashboard"
          className="btn-primary mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition"
        >
          Launch App
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Footer panel on the blue bloom. */}
      <div className="footer-glow relative mt-4 pt-44 sm:pt-56">
        <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-x-8 gap-y-10 px-6 md:grid-cols-12 lg:px-8">
          <div className="col-span-2 md:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#111] shadow-sm">
                <Logo className="h-6 w-6" />
              </span>
              <span className="text-2xl font-semibold tracking-tight text-white">Basis</span>
            </Link>
            <p className="mt-3 text-base text-white/80">Fair value for pre-IPO tokens.</p>
            <div className="mt-6 flex gap-3">
              <a
                href={X_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="@nuelcrypt on X"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition hover:bg-white/10"
              >
                <XIcon className="h-4 w-4" />
              </a>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Basis on GitHub"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition hover:bg-white/10"
              >
                <GitHubIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {linkColumns.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <p className="text-sm font-medium text-white">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <FooterAnchor link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 md:col-span-2">
            <LiveStatus />
          </div>
        </div>

        <div className="relative mx-auto mt-14 flex max-w-6xl flex-col gap-2 border-t border-white/20 px-6 pt-6 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© 2026 Basis. Not financial advice.</p>
          <p>Built on Solana · Powered by Tessera + Jupiter</p>
        </div>

        {/* Giant wordmark, cropped by the footer's bottom edge. */}
        <div
          aria-hidden
          className="pointer-events-none mt-10 flex translate-y-[16%] select-none items-end justify-center gap-[0.08em] px-4 text-[26vw] font-semibold leading-[0.8] tracking-[-0.05em] text-white"
        >
          <span className="flex h-[0.74em] w-[0.74em] flex-shrink-0 items-center justify-center rounded-[0.2em] border border-white/40 bg-white/20 p-[0.07em] shadow-[0_0.1em_0.3em_rgba(0,0,0,0.12)] backdrop-blur-sm">
            <span className="flex h-full w-full items-center justify-center rounded-[0.15em] bg-white text-[#111]">
              <Logo className="h-[62%] w-[62%]" />
            </span>
          </span>
          <span>Basis</span>
        </div>
      </div>
    </footer>
  );
}
