"use client";

import { Bell, HelpCircle, Menu, Moon, Search, Sun } from "lucide-react";
import type { WalletState } from "../use-wallet";
import { useTheme } from "@/lib/theme";

export function TopBar({ wallet, onMenuClick }: { wallet: WalletState; onMenuClick?: () => void }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="glass-panel flex items-center justify-between gap-3 rounded-none px-4 py-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:text-white lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="hidden min-w-0 max-w-xs flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/50 sm:flex">
          <Search className="h-3.5 w-3.5 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search tokens..."
            className="w-full min-w-0 bg-transparent text-white placeholder:text-white/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:text-white"
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
        <div className="hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:text-white sm:flex">
          <Bell className="h-4 w-4" />
        </div>
        <div className="hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:text-white sm:flex">
          <HelpCircle className="h-4 w-4" />
        </div>

        {wallet.connected ? (
          <button
            type="button"
            onClick={wallet.disconnect}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10 sm:px-3.5"
          >
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-green-400" />
            {wallet.shortAddress}
          </button>
        ) : (
          <button
            type="button"
            onClick={wallet.connect}
            className="btn-primary inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition sm:px-4"
          >
            <span className="hidden sm:inline">Connect Wallet</span>
            <span className="sm:hidden">Connect</span>
          </button>
        )}
      </div>
    </div>
  );
}
