"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Check, Copy, History } from "lucide-react";
import { OpenAIIcon, KalshiIcon, SpaceXIcon, SolIcon, UsdcIcon, UsdtIcon } from "@/components/token-icons";
import { useWallet } from "../use-wallet";
import { useDashboardData } from "../use-dashboard-data";

const tokenIcon: Record<string, ComponentType<{ className?: string }>> = {
  "T-OpenAI": OpenAIIcon,
  "T-Kalshi": KalshiIcon,
  "T-SpaceX": SpaceXIcon,
};

function BalanceRow({
  icon: Icon,
  label,
  amount,
  decimals = 4,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  amount: number;
  decimals?: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
      <span className="flex items-center gap-2.5 text-sm text-white">
        <Icon className="h-6 w-6 flex-shrink-0 rounded-full" />
        {label}
      </span>
      <span className="text-sm font-medium text-white">{amount.toFixed(decimals)}</span>
    </div>
  );
}

/** Fetches the connected wallet's balance for each Tessera T-token mint (0 for any it doesn't hold). */
function useTTokenBalances(mints: { symbol: string; mint: string }[]) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wallet.connected || !wallet.address || mints.length === 0) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      const owner = new PublicKey(wallet.address!);
      const results = await Promise.all(
        mints.map(async ({ symbol, mint }) => {
          try {
            const accounts = await connection.getParsedTokenAccountsByOwner(owner, { mint: new PublicKey(mint) });
            const total = accounts.value.reduce(
              (sum, { account }) => sum + (account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0),
              0,
            );
            return [symbol, total] as const;
          } catch (err) {
            console.error(`Failed to fetch ${symbol} balance:`, err);
            return [symbol, 0] as const;
          }
        }),
      );
      if (cancelled) return;
      setBalances(Object.fromEntries(results));
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // mints is derived fresh from live spreads each render; comparing by its serialized
    // mint addresses (not identity) avoids refetching on every 30s data-poll re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.connected, wallet.address, connection, mints.map((m) => m.mint).join(",")]);

  return {
    balances: wallet.connected ? balances : {},
    loading: wallet.connected && loading,
  };
}

export default function WalletPage() {
  const wallet = useWallet();
  const { spreads } = useDashboardData();
  const [copied, setCopied] = useState(false);

  const mints = spreads.map((s) => ({ symbol: s.symbol, mint: s.mint }));
  const { balances: tTokenBalances, loading: tTokenLoading } = useTTokenBalances(mints);

  async function handleCopy() {
    if (!wallet.address) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Wallet</h1>
        <p className="mt-1 text-sm text-muted">Your connected wallet&apos;s balances and Tessera token holdings.</p>
      </div>

      {!wallet.connected ? (
        <div className="glass-panel flex min-h-[320px] flex-col items-center justify-center rounded-2xl p-6 text-center">
          <p className="text-lg font-semibold text-white">No Wallet Connected</p>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Connect a Solana wallet to see your real SOL, USDC, USDT, and T-Token balances here.
          </p>
          <button type="button" onClick={wallet.connect} className="btn-primary mt-5 rounded-full px-6 py-2.5 text-sm font-medium transition">
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-green-400" />
                <p className="text-sm font-medium text-white">Connected</p>
              </div>
              <button
                type="button"
                onClick={wallet.disconnect}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:text-white"
              >
                Disconnect
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <span className="min-w-0 flex-1 truncate font-mono text-sm text-white">{wallet.address}</span>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy address"
                className="flex-shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:text-white"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="glass-panel rounded-2xl p-6">
              <p className="text-sm font-medium text-white">Wallet Balances</p>
              <div className="mt-4 space-y-2.5">
                <BalanceRow icon={SolIcon} label="SOL" amount={wallet.solBalance} decimals={4} />
                <BalanceRow icon={UsdcIcon} label="USDC" amount={wallet.usdcBalance} decimals={2} />
                <BalanceRow icon={UsdtIcon} label="USDT" amount={wallet.usdtBalance} decimals={2} />
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6">
              <p className="text-sm font-medium text-white">Tessera Token Holdings</p>
              <div className="mt-4 space-y-2.5">
                {mints.length === 0 ? (
                  <p className="text-sm text-muted">No live token data available yet.</p>
                ) : (
                  mints.map(({ symbol }) => (
                    <BalanceRow
                      key={symbol}
                      icon={tokenIcon[symbol] ?? OpenAIIcon}
                      label={symbol}
                      amount={tTokenLoading ? 0 : (tTokenBalances[symbol] ?? 0)}
                      decimals={4}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel flex min-h-[160px] flex-col items-center justify-center rounded-2xl p-6 text-center">
            <History className="h-6 w-6 text-white/40" />
            <p className="mt-3 text-sm font-medium text-white">Transaction History</p>
            <p className="mt-1 max-w-sm text-xs text-muted">
              Basis doesn&apos;t yet store a record of swaps you&apos;ve executed — this is coming soon. In the meantime, your
              trade confirmations link out to Solscan.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
