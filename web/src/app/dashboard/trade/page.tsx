"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDown } from "lucide-react";
import { VersionedTransaction } from "@solana/web3.js";
import { StatCard } from "@/components/dashboard-preview/stat-card";
import { spreadColorClass } from "@/lib/spread-color";
import {
  USDC_DECIMALS,
  USDC_MINT,
  decodeBase64,
  encodeBase64,
  executeOrder,
  getMintDecimals,
  getOrder,
  type OrderResponse,
} from "@/lib/jupiter-order";
import { useWallet, type WalletState } from "../use-wallet";
import { useDashboardData } from "../use-dashboard-data";
import type { SpreadRecord } from "@/lib/dashboard-api-types";

const GLASS_CARD = "glass-panel rounded-xl p-4";
const QUOTE_DEBOUNCE_MS = 500;

const symbolIcon: Record<string, "openai" | "kalshi" | "spacex"> = {
  "T-OpenAI": "openai",
  "T-Kalshi": "kalshi",
  "T-SpaceX": "spacex",
};

type TxState = "idle" | "awaiting-signature" | "submitting" | "confirmed" | "failed";

function TradePageInner() {
  const searchParams = useSearchParams();
  const wallet = useWallet();
  const { spreads, loading } = useDashboardData();

  const [selectedSymbolOverride, setSelectedSymbolOverride] = useState<string | null>(null);
  const requestedToken = searchParams.get("token");
  const defaultSymbol = spreads.find((s) => s.symbol === requestedToken)?.symbol ?? spreads[0]?.symbol ?? null;
  const selectedSymbol = selectedSymbolOverride ?? defaultSymbol;
  const selectedToken = spreads.find((s) => s.symbol === selectedSymbol) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Trade</h1>
        <p className="mt-1 text-sm text-muted">Swap USDC for tokenized pre-IPO stocks via Jupiter.</p>
      </div>

      <div className="glass-panel flex flex-wrap gap-2 rounded-2xl p-4">
        {(spreads.length > 0 ? spreads.map((s) => s.symbol) : ["T-OpenAI", "T-Kalshi", "T-SpaceX"]).map((symbol) => (
          <button
            key={symbol}
            type="button"
            onClick={() => setSelectedSymbolOverride(symbol)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              selectedSymbol === symbol
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 text-white/60 hover:text-white"
            }`}
          >
            {symbol}
          </button>
        ))}
      </div>

      {loading && !selectedToken ? (
        <div className="glass-panel h-[104px] animate-pulse rounded-xl" />
      ) : !selectedToken ? (
        <div className="glass-panel rounded-2xl p-6 text-center text-sm text-muted">No live token data available yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <StatCard
            label={`${selectedToken.symbol} Spread`}
            value={`${selectedToken.spreadPct >= 0 ? "+" : ""}${selectedToken.spreadPct.toFixed(1)}%`}
            trend={selectedToken.spreadPct >= 0 ? "up" : "down"}
            trendLabel="vs mark price"
            icon={symbolIcon[selectedToken.symbol] ?? "openai"}
            className={GLASS_CARD}
            valueClassName={spreadColorClass(selectedToken.spreadPct)}
            extra={
              <div className="mt-3 space-y-1 border-t border-white/5 pt-3 text-xs">
                <p>
                  <span className="text-muted">Mark: </span>
                  <span className="text-white">${selectedToken.markPrice.toFixed(2)}</span>
                </p>
                <p>
                  <span className="text-muted">DEX: </span>
                  <span className="text-white">${selectedToken.dexPrice.toFixed(2)}</span>
                </p>
              </div>
            }
          />

          {/* Keyed by symbol so switching tokens remounts the panel with fresh state, instead of an effect resetting it. */}
          <SwapPanel key={selectedToken.symbol} token={selectedToken} wallet={wallet} />
        </div>
      )}
    </div>
  );
}

function SwapPanel({ token, wallet }: { token: SpreadRecord; wallet: WalletState }) {
  const [amountUsdc, setAmountUsdc] = useState("");
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [outputDecimals, setOutputDecimals] = useState<number | null>(null);
  const [txState, setTxState] = useState<TxState>("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMintDecimals(token.mint)
      .then((d) => {
        if (!cancelled) setOutputDecimals(d);
      })
      .catch((err) => console.error("Failed to fetch output token decimals:", err));
    return () => {
      cancelled = true;
    };
  }, [token.mint]);

  const amountNum = Number(amountUsdc);
  const hasValidAmount = amountUsdc.trim() !== "" && Number.isFinite(amountNum) && amountNum > 0;
  const insufficientBalanceLocally = wallet.connected && hasValidAmount && amountNum > wallet.usdcBalance;

  useEffect(() => {
    if (!hasValidAmount) return;

    let cancelled = false;
    const handle = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const rawAmount = Math.round(amountNum * 10 ** USDC_DECIMALS).toString();
        const result = await getOrder({
          inputMint: USDC_MINT,
          outputMint: token.mint,
          amount: rawAmount,
          taker: wallet.connected && wallet.address ? wallet.address : undefined,
        });
        if (cancelled) return;
        setOrder(result);
        setQuoteError(null);
      } catch (err) {
        if (cancelled) return;
        setOrder(null);
        setQuoteError(err instanceof Error ? err.message : "Failed to fetch a quote from Jupiter.");
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
    // amountNum is derived from amountUsdc; depending on the string avoids redundant re-runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountUsdc, token.mint, wallet.connected, wallet.address, hasValidAmount]);

  // Ignore a stale quote once the input becomes invalid, without resetting state synchronously in an effect.
  const activeOrder = hasValidAmount ? order : null;
  const activeQuoteError = hasValidAmount ? quoteError : null;

  const outputAmount = activeOrder && outputDecimals !== null ? Number(activeOrder.outAmount) / 10 ** outputDecimals : null;
  const serverError = activeOrder?.transaction === "" && activeOrder.errorCode !== undefined;

  async function handleSwap() {
    if (!activeOrder || !activeOrder.transaction || !wallet.signTransaction) return;

    setTxState("awaiting-signature");
    setTxError(null);
    setTxSignature(null);

    try {
      const transaction = VersionedTransaction.deserialize(decodeBase64(activeOrder.transaction));
      const signed = await wallet.signTransaction(transaction);

      setTxState("submitting");
      const signedBase64 = encodeBase64(signed.serialize());
      const result = await executeOrder(signedBase64, activeOrder.requestId);

      if (result.status === "Success") {
        setTxState("confirmed");
        setTxSignature(result.signature ?? null);
        wallet.refreshBalances();
      } else {
        setTxState("failed");
        setTxSignature(result.signature ?? null);
        setTxError(result.error ?? `Jupiter execution failed (code ${result.code}).`);
      }
    } catch (err) {
      setTxState("failed");
      setTxError(err instanceof Error ? err.message : "The swap could not be completed.");
    }
  }

  const swapBusy = txState === "awaiting-signature" || txState === "submitting";
  const swapDisabledWhileConnected =
    !hasValidAmount || quoteLoading || !activeOrder?.transaction || insufficientBalanceLocally || swapBusy;

  let swapButtonLabel = "Swap";
  if (!wallet.connected) swapButtonLabel = "Connect Wallet to Swap";
  else if (txState === "awaiting-signature") swapButtonLabel = "Awaiting signature…";
  else if (txState === "submitting") swapButtonLabel = "Submitting…";
  else if (quoteLoading) swapButtonLabel = "Getting quote…";
  else if (!hasValidAmount) swapButtonLabel = "Enter an amount";
  else if (insufficientBalanceLocally) swapButtonLabel = "Insufficient USDC balance";
  else if (serverError) swapButtonLabel = "Unable to swap";

  return (
    <div className="glass-panel rounded-2xl p-6 lg:col-span-2">
      <p className="text-sm font-medium text-white">Swap</p>
      <p className="mt-1 text-xs text-muted">
        USDC → {token.symbol}
        {activeOrder && !serverError && <span className="ml-2 text-white/40">via {activeOrder.router}</span>}
      </p>

      <div className="mt-5 space-y-3">
        <div>
          <label className="text-xs text-muted">You pay</label>
          <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={amountUsdc}
              onChange={(e) => setAmountUsdc(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-lg text-white placeholder:text-white/30 focus:outline-none"
            />
            <span className="flex-shrink-0 text-sm text-muted">USDC</span>
          </div>
          {wallet.connected && <p className="mt-1.5 text-xs text-muted">Balance: ${wallet.usdcBalance.toFixed(2)} USDC</p>}
        </div>

        <div className="flex justify-center text-white/30">
          <ArrowDown className="h-4 w-4" />
        </div>

        <div>
          <label className="text-xs text-muted">You receive (estimated)</label>
          <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="w-full text-lg text-white">
              {quoteLoading
                ? "…"
                : outputAmount !== null
                  ? outputAmount.toLocaleString("en-US", { maximumFractionDigits: 6 })
                  : "0.00"}
            </span>
            <span className="flex-shrink-0 text-sm text-muted">{token.symbol}</span>
          </div>
        </div>

        {activeOrder && !serverError && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Price impact</span>
            <span className={Math.abs(activeOrder.priceImpact) > 1 ? "text-red-500" : "text-white"}>
              {activeOrder.priceImpact >= 0 ? "+" : ""}
              {activeOrder.priceImpact.toFixed(3)}%
            </span>
          </div>
        )}

        {activeQuoteError && <p className="text-xs text-red-500">{activeQuoteError}</p>}
        {serverError && <p className="text-xs text-red-500">{activeOrder?.errorMessage ?? "Jupiter could not build this swap."}</p>}
        {insufficientBalanceLocally && !serverError && (
          <p className="text-xs text-red-500">
            You have ${wallet.usdcBalance.toFixed(2)} USDC, which isn&apos;t enough to cover this swap.
          </p>
        )}
        {wallet.connected && !wallet.signTransaction && (
          <p className="text-xs text-red-500">This wallet doesn&apos;t support transaction signing.</p>
        )}

        <button
          type="button"
          onClick={wallet.connected ? handleSwap : wallet.connect}
          disabled={wallet.connected && (swapDisabledWhileConnected || !wallet.signTransaction)}
          className="btn-primary w-full rounded-full px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {swapButtonLabel}
        </button>

        {txState !== "idle" && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              txState === "confirmed"
                ? "border-green-500/20 bg-green-500/10 text-green-400"
                : txState === "failed"
                  ? "border-red-500/20 bg-red-500/10 text-red-400"
                  : "border-white/10 bg-white/5 text-white/70"
            }`}
          >
            {txState === "awaiting-signature" && "Waiting for your wallet to sign the transaction…"}
            {txState === "submitting" && "Submitting the swap to Jupiter…"}
            {txState === "confirmed" && (
              <>
                Swap confirmed.{" "}
                {txSignature && (
                  <a
                    href={`https://solscan.io/tx/${txSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    View on Solscan →
                  </a>
                )}
              </>
            )}
            {txState === "failed" && (
              <>
                Swap failed: {txError}
                {txSignature && (
                  <>
                    {" "}
                    <a
                      href={`https://solscan.io/tx/${txSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      View on Solscan →
                    </a>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TradePage() {
  return (
    <Suspense fallback={<div className="glass-panel rounded-2xl p-6 text-sm text-muted">Loading…</div>}>
      <TradePageInner />
    </Suspense>
  );
}
