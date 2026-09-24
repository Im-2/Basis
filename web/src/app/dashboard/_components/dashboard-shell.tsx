"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { SolanaWalletProvider } from "@/components/solana/wallet-provider";
import { useWallet, WalletBalanceProvider } from "../use-wallet";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

function Shell({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar wallet={wallet} mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar wallet={wallet} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 space-y-6 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

/** The dashboard's client-side chrome: wallet providers, sidebar, and top bar. */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <SolanaWalletProvider>
      <WalletBalanceProvider>
        <Shell>{children}</Shell>
      </WalletBalanceProvider>
    </SolanaWalletProvider>
  );
}
