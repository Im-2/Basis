"use client";

import { ArrowLeftRight, Bell, LayoutGrid, LineChart, Settings, SquareStack, Wallet } from "lucide-react";
import { Logo } from "@/components/logo";
import type { WalletState } from "../use-wallet";

const generalNav = [
  { label: "Overview", icon: LayoutGrid, active: true },
  { label: "Markets", icon: SquareStack, active: false },
  { label: "Trade", icon: ArrowLeftRight, active: false },
];

const dataNav = [
  { label: "Spread History", icon: LineChart, active: false },
  { label: "Alerts", icon: Bell, active: false },
];

const accountNav = [
  { label: "Wallet", icon: Wallet, active: false },
  { label: "Settings", icon: Settings, active: false },
];

function NavGroup({ title, items }: { title: string; items: typeof generalNav }) {
  return (
    <div>
      <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-muted">{title}</p>
      <nav className="mt-2 space-y-1">
        {items.map(({ label, icon: Icon, active }) => (
          <div
            key={label}
            className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
              active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </div>
        ))}
      </nav>
    </div>
  );
}

export function Sidebar({ wallet }: { wallet: WalletState }) {
  return (
    <aside className="glass-panel hidden w-64 flex-shrink-0 flex-col rounded-none p-4 lg:flex">
      <div className="flex items-center gap-2 px-2">
        <Logo className="h-7 w-7" />
        <span className="text-lg font-semibold tracking-tight text-white">Basis</span>
      </div>

      <div className="mt-8 flex flex-col gap-6">
        <NavGroup title="General" items={generalNav} />
        <NavGroup title="Data" items={dataNav} />
        <NavGroup title="Account" items={accountNav} />
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
