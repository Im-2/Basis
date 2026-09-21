"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDown } from "lucide-react";
import { VersionedTransaction } from "@solana/web3.js";
import { spreadColorClass } from "@/lib/spread-color";
import {
  INPUT_TOKENS,
  decodeBase64,
  encodeBase64,
  executeOrder,
  getMintDecimals,
  getOrder,
  type InputToken,
  type OrderResponse,
} from "@/lib/jupiter-order";
import { useWallet, type WalletState } from "../use-wallet";
import { useDashboardData } from "../use-dashboard-data";
import type { SpreadRecord } from "@/lib/dashboard-api-types";

const QUOTE_DEBOUNCE_MS = 500;

type TxState = "idle" | "awaiting-signature" | "submitting" | "confirmed" | "failed";

function inputBalanceFor(wallet: WalletState, symbol: InputToken["symbol"]): number {
  if (symbol === "SOL") return wallet.solBalance;
  if (symbol === "USDC") return wallet.usdcBalance;
  return wallet.usdtBalance;
}

function TradePageInner() {
  const searchParams = useSearchParams();
  const wallet = useWallet();
  const { spreads, loading } = useDashboardData();

  const [selectedSymbolOverride, setSelectedSymbolOverride] = useState<string | null>(null);
  const requestedToken = searchParams.get("token");
  const defaultSymbol = spreads.find((s) => s.symbol === requestedToken)?.symbol ?? spreads[0]?.symbol ?? null;
  const selectedSymbol = selectedSymbolOverride ?? defaultSymbol;
  const selectedToken = spreads.find((s) => s.symbol === selectedSymbol) ?? null;

  // Defaults to SOL, since that's what most wallets hold by default. Lifted up (rather than
  // local to SwapPanel) so it can be part of SwapPanel's remount key below.
  const [inputSymbol, setInputSymbol] = useState<InputToken["symbol"]>("SOL");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Trade</h1>
        <p className="mt-1 text-sm text-muted">Act on a live Basis spread, backed by Tessera and Jupiter data.</p>
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
        <div className="glass-panel h-[280px] animate-pulse rounded-2xl" />
      ) : !selectedToken ? (
        <div className="glass-panel rounded-2xl p-6 text-center text-sm text-muted">No live token data available yet.</div>
      ) : (
        <>
          <SpreadInsight token={selectedToken} />
          {/* Keyed by output token + input token so switching either remounts the panel with fresh state, instead of an effect resetting it. */}
          <SwapPanel
            key={`${selectedToken.symbol}:${inputSymbol}`}
            token={selectedToken}
            wallet={wallet}
            inputSymbol={inputSymbol}
            onInputSymbolChange={setInputSymbol}
          />
        </>
      )}
    </div>
  );
}

/** The Basis analysis: what the spread is doing right now, in large type, above the swap inputs. */
function SpreadInsight({ token }: { token: SpreadRecord }) {
  const positive = token.spreadPct >= 0;
  const pct = Math.abs(token.spreadPct).toFixed(1);

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div
        className={`rounded-xl border px-4 py-3 text-sm font-medium ${
          positive ? "border-green-500/20 bg-green-500/10 text-green-300" : "border-red-500/20 bg-red-500/10 text-red-300"
        }`}
      >
        {token.symbol} is trading {positive ? "+" : "-"}
        {pct}% {positive ? "above" : "below"} its Tessera mark price.
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 text-center sm:text-left">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Mark Price</p>
          <p className="mt-1 text-2xl font-semibold text-white sm:text-3xl">${token.markPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">DEX Price</p>
          <p className="mt-1 text-2xl font-semibold text-white sm:text-3xl">${token.dexPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Spread</p>
          <p className={`mt-1 text-2xl font-semibold sm:text-3xl ${spreadColorClass(token.spreadPct)}`}>
            {positive ? "+" : ""}
            {token.spreadPct.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}

function SwapPanel({
  token,
  wallet,
  inputSymbol,
  onInputSymbolChange,
}: {
  token: SpreadRecord;
  wallet: WalletState;
  inputSymbol: InputToken["symbol"];
  onInputSymbolChange: (symbol: InputToken["symbol"]) => void;
}) {
  const inputToken = INPUT_TOKENS.find((t) => t.symbol === inputSymbol) ?? INPUT_TOKENS[0];
  const inputBalance = inputBalanceFor(wallet, inputSymbol);

  const [amountIn, setAmountIn] = useState("");
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

  const amountNum = Number(amountIn);
  const hasValidAmount = amountIn.trim() !== "" && Number.isFinite(amountNum) && amountNum > 0;
  const insufficientBalanceLocally = wallet.connected && hasValidAmount && amountNum > inputBalance;

  useEffect(() => {
    if (!hasValidAmount) return;

    let cancelled = false;
    const handle = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const rawAmount = Math.round(amountNum * 10 ** inputToken.decimals).toString();
        const result = await getOrder({
          inputMint: inputToken.mint,
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
        setQuoteError(err instanceof Error ? err.message : "Failed to fetch a live quote.");
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
    // amountNum is derived from amountIn; depending on the string avoids redundant re-runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountIn, inputToken.mint, inputToken.decimals, token.mint, wallet.connected, wallet.address, hasValidAmount]);

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
        setTxError(result.error ?? `Execution failed (code ${result.code}).`);
      }
    } catch (err) {
      setTxState("failed");
      setTxError(err instanceof Error ? err.message : "The trade could not be completed.");
    }
  }

  const swapBusy = txState === "awaiting-signature" || txState === "submitting";
  const swapDisabledWhileConnected =
    !hasValidAmount || quoteLoading || !activeOrder?.transaction || insufficientBalanceLocally || swapBusy;

  let actionLabel = "Act on This Spread";
  if (!wallet.connected) actionLabel = "Connect Wallet to Trade";
  else if (txState === "awaiting-signature") actionLabel = "Awaiting signature…";
  else if (txState === "submitting") actionLabel = "Submitting…";
  else if (quoteLoading) actionLabel = "Pricing this trade…";
  else if (!hasValidAmount) actionLabel = "Enter an amount";
  else if (insufficientBalanceLocally) actionLabel = `Insufficient ${inputSymbol} balance`;
  else if (serverError) actionLabel = "Unable to trade";

  const positive = token.spreadPct >= 0;
  const pctLabel = Math.abs(token.spreadPct).toFixed(1);

  return (
    <div className="glass-panel rounded-2xl p-6">
      <p className="text-sm font-medium text-white">Buy {token.symbol}</p>
      <p className="mt-1 text-xs text-muted">Spend {inputSymbol} to act on the spread above.</p>

      <div className="mt-5 space-y-3">
        <div>
          <label className="text-xs text-muted">You pay</label>
          <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-lg text-white placeholder:text-white/30 focus:outline-none"
            />
            <select
              value={inputSymbol}
              onChange={(e) => onInputSymbolChange(e.target.value as InputToken["symbol"])}
              className="flex-shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white focus:outline-none"
            >
              {INPUT_TOKENS.map((t) => (
                <option key={t.symbol} value={t.symbol} className="bg-[#151516] text-white">
                  {t.symbol}
                </option>
              ))}
            </select>
          </div>
          {wallet.connected && (
            <p className="mt-1.5 text-xs text-muted">
              Balance: {inputBalance.toFixed(inputSymbol === "SOL" ? 4 : 2)} {inputSymbol}
            </p>
          )}
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
        {serverError && <p className="text-xs text-red-500">{activeOrder?.errorMessage ?? "This trade couldn't be built."}</p>}
        {insufficientBalanceLocally && !serverError && (
          <p className="text-xs text-red-500">
            You have {inputBalance.toFixed(inputSymbol === "SOL" ? 4 : 2)} {inputSymbol}, which isn&apos;t enough to cover
            this trade.
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
          {actionLabel}
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
            {txState === "submitting" && "Submitting your trade…"}
            {txState === "confirmed" && (
              <>
                You bought {token.symbol} at a {pctLabel}% {positive ? "premium" : "discount"} to mark price.{" "}
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
                Trade failed: {txError}
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

        <p className="pt-1 text-center text-[11px] text-white/30">Trade execution routed through Jupiter for best price.</p>
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
