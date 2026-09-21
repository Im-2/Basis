"use client";

import { Bell, HelpCircle, Moon, Search, Sun } from "lucide-react";
import type { WalletState } from "../use-wallet";
import { useTheme } from "../use-theme";

export function TopBar({ wallet }: { wallet: WalletState }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="glass-panel flex items-center justify-between rounded-none px-6 py-4">
      <div className="flex max-w-xs flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/50">
        <Search className="h-3.5 w-3.5" />
        <input
          type="text"
          placeholder="Search tokens..."
          className="w-full bg-transparent text-white placeholder:text-white/50 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:text-white"
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:text-white">
          <Bell className="h-4 w-4" />
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:text-white">
          <HelpCircle className="h-4 w-4" />
        </div>

        {wallet.connected ? (
          <button
            type="button"
            onClick={wallet.disconnect}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white transition hover:bg-white/10"
          >
            <span className="h-2 w-2 rounded-full bg-green-400" />
            {wallet.shortAddress}
          </button>
        ) : (
          <button
            type="button"
            onClick={wallet.connect}
            className="btn-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
}
