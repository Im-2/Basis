"use client";

import type { ComponentType, ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { OpenAIIcon, KalshiIcon, SpaceXIcon } from "@/components/token-icons";
import { useTheme } from "@/lib/theme";
import { useWallet } from "../use-wallet";
import { usePreferences, PREFERENCE_TOKENS, PREFERENCE_TIMEFRAMES } from "../use-preferences";

const tokenIcon: Record<string, ComponentType<{ className?: string }>> = {
  "T-OpenAI": OpenAIIcon,
  "T-Kalshi": KalshiIcon,
  "T-SpaceX": SpaceXIcon,
};

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${checked ? "bg-accent" : "bg-white/15"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SettingsSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-1 text-xs text-muted">{description}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const wallet = useWallet();
  const { prefs, update } = usePreferences();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-muted">Preferences for how Basis looks and behaves for you.</p>
      </div>

      <SettingsSection title="Appearance" description="Choose how Basis looks across the whole app.">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2.5 text-sm text-white">
            {theme === "light" ? <Sun className="h-4 w-4 text-white/60" /> : <Moon className="h-4 w-4 text-white/60" />}
            {theme === "light" ? "Light mode" : "Dark mode"}
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
          >
            Switch to {theme === "light" ? "dark" : "light"}
          </button>
        </div>
      </SettingsSection>

      <SettingsSection title="Alert Notifications" description="Placeholder controls — no push notifications wired up yet, but your preference is saved.">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">Notify me on high-severity spreads</p>
            <p className="mt-0.5 text-xs text-muted">Alerts already show on Overview and the Alerts page regardless.</p>
          </div>
          <ToggleSwitch checked={prefs.alertsEnabled} onChange={(v) => update("alertsEnabled", v)} label="Toggle alert notifications" />
        </div>

        <div className={`flex items-center justify-between gap-4 ${prefs.alertsEnabled ? "" : "opacity-40"}`}>
          <label htmlFor="alert-threshold" className="text-sm text-white">
            Notify me when spread exceeds
          </label>
          <div className="flex items-center gap-2">
            <input
              id="alert-threshold"
              type="number"
              min={0}
              max={100}
              step={1}
              disabled={!prefs.alertsEnabled}
              value={prefs.alertThresholdPct}
              onChange={(e) => update("alertThresholdPct", Number(e.target.value))}
              className="w-20 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-right text-sm text-white focus:outline-none disabled:cursor-not-allowed"
            />
            <span className="text-sm text-muted">%</span>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Dashboard Defaults" description="Which token and timeframe Spread History opens to.">
        <div>
          <p className="text-xs text-muted">Default token</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PREFERENCE_TOKENS.map((symbol) => {
              const Icon = tokenIcon[symbol] ?? OpenAIIcon;
              return (
                <button
                  key={symbol}
                  type="button"
                  onClick={() => update("defaultToken", symbol)}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${
                    prefs.defaultToken === symbol
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0 rounded-full" />
                  {symbol}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted">Default timeframe</p>
          <div className="mt-2 flex gap-1 rounded-full border border-white/10 p-1" style={{ width: "fit-content" }}>
            {PREFERENCE_TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => update("defaultTimeframe", tf)}
                className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                  prefs.defaultTimeframe === tf ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Wallet" description="Manage your connected wallet.">
        {wallet.connected ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">{wallet.shortAddress}</span>
            <button
              type="button"
              onClick={wallet.disconnect}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">No wallet connected</span>
            <button type="button" onClick={wallet.connect} className="btn-primary rounded-full px-4 py-1.5 text-xs font-medium transition">
              Connect
            </button>
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
