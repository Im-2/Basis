"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./_components/sidebar";
import { TopBar } from "./_components/top-bar";
import { useWallet } from "./use-wallet";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const wallet = useWallet();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar wallet={wallet} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar wallet={wallet} />
        <main className="flex-1 space-y-6 p-6">{children}</main>
      </div>
    </div>
  );
}
