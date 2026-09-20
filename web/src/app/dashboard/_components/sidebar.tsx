"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Bell, LayoutGrid, LineChart, Settings, SquareStack, Wallet } from "lucide-react";
import { Logo } from "@/components/logo";
import type { WalletState } from "../use-wallet";

const generalNav = [
  { label: "Overview", href: "/dashboard", icon: LayoutGrid },
  { label: "Markets", href: "/dashboard/markets", icon: SquareStack },
  { label: "Trade", href: "/dashboard/trade", icon: ArrowLeftRight },
];

const dataNav = [
  { label: "Spread History", href: "/dashboard/spread-history", icon: LineChart },
  { label: "Alerts", href: "/dashboard/alerts", icon: Bell },
];

const accountNav = [
  { label: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

function NavGroup({ title, items, pathname }: { title: string; items: typeof generalNav; pathname: string }) {
  return (
    <div>
      <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-muted">{title}</p>
      <nav className="mt-2 space-y-1">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Sidebar({ wallet }: { wallet: WalletState }) {
  const pathname = usePathname();

  return (
    <aside className="glass-panel hidden w-64 flex-shrink-0 flex-col rounded-none p-4 lg:flex">
      <Link href="/dashboard" className="flex items-center gap-2 px-2">
        <Logo className="h-7 w-7" />
        <span className="text-lg font-semibold tracking-tight text-white">Basis</span>
      </Link>

      <div className="mt-8 flex flex-col gap-6">
        <NavGroup title="General" items={generalNav} pathname={pathname} />
        <NavGroup title="Data" items={dataNav} pathname={pathname} />
        <NavGroup title="Account" items={accountNav} pathname={pathname} />
      </div>

      <div className="mt-auto pt-6">
        <div className="glass-panel rounded-2xl p-4">
          {wallet.connected ? (
            <>
              <p className="text-sm font-semibold text-white">{wallet.shortAddress}</p>
              <p className="mt-1 text-xs text-muted">
                {wallet.solBalance.toFixed(2)} SOL · ${wallet.usdcBalance.toFixed(2)} USDC
              </p>
              <button
                type="button"
                onClick={wallet.disconnect}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:text-white"
              >
                Disconnect
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-white">Connect Your Wallet</p>
              <p className="mt-1 text-xs text-muted">Trade the spread directly from your dashboard.</p>
              <button
                type="button"
                onClick={wallet.connect}
                className="btn-primary mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition"
              >
                Connect →
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
