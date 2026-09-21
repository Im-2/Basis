"use client";

import type { ReactNode } from "react";
import { SolanaWalletProvider } from "@/components/solana/wallet-provider";
import { Sidebar } from "./_components/sidebar";
import { TopBar } from "./_components/top-bar";
import { useWallet, WalletBalanceProvider } from "./use-wallet";
import { useTheme, ThemeProvider } from "./use-theme";

function DashboardShell({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const { theme } = useTheme();

  return (
    <div className={`flex min-h-screen bg-background ${theme === "light" ? "dashboard-theme" : ""}`}>
      <Sidebar wallet={wallet} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar wallet={wallet} />
        <main className="flex-1 space-y-6 p-6">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SolanaWalletProvider>
        <WalletBalanceProvider>
          <DashboardShell>{children}</DashboardShell>
        </WalletBalanceProvider>
      </SolanaWalletProvider>
    </ThemeProvider>
  );
}
