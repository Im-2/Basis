"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { SolanaWalletProvider } from "@/components/solana/wallet-provider";
import { Sidebar } from "./_components/sidebar";
import { TopBar } from "./_components/top-bar";
import { useWallet, WalletBalanceProvider } from "./use-wallet";

function DashboardShell({ children }: { children: ReactNode }) {
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

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SolanaWalletProvider>
      <WalletBalanceProvider>
        <DashboardShell>{children}</DashboardShell>
      </WalletBalanceProvider>
    </SolanaWalletProvider>
  );
}
