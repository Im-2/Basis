"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { useSearchParams } from "next/navigation";
import { useConnection } from "@solana/wallet-adapter-react";
import { ArrowDown, ChevronDown } from "lucide-react";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { dashboardSpreadColorClass } from "@/lib/spread-color";
import { OpenAIIcon, KalshiIcon, SpaceXIcon, SolIcon, UsdcIcon, UsdtIcon } from "@/components/token-icons";
import { SpreadHistoryChart } from "@/components/dashboard-preview/spread-history-chart";
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
type Side = "buy" | "sell";

const tokenIcon: Record<string, ComponentType<{ className?: string }>> = {
  "T-OpenAI": OpenAIIcon,
  "T-Kalshi": KalshiIcon,
  "T-SpaceX": SpaceXIcon,
};

const inputTokenIcon: Record<InputToken["symbol"], ComponentType<{ className?: string }>> = {
  SOL: SolIcon,
  USDC: UsdcIcon,
  USDT: UsdtIcon,
};

function inputBalanceFor(wallet: WalletState, symbol: InputToken["symbol"]): number {
  if (symbol === "SOL") return wallet.solBalance;
  if (symbol === "USDC") return wallet.usdcBalance;
  return wallet.usdtBalance;
}

function formatAmountInput(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  return parseFloat(value.toFixed(6)).toString();
}

function TradePageInner() {
  const searchParams = useSearchParams();
  const wallet = useWallet();
  const { spreads, history, now, loading } = useDashboardData();

  const [selectedSymbolOverride, setSelectedSymbolOverride] = useState<string | null>(null);
  const requestedToken = searchParams.get("token");
  const defaultSymbol = spreads.find((s) => s.symbol === requestedToken)?.symbol ?? spreads[0]?.symbol ?? null;
  const selectedSymbol = selectedSymbolOverride ?? defaultSymbol;
  const selectedToken = spreads.find((s) => s.symbol === selectedSymbol) ?? null;

  // Defaults to SOL, since that's what most wallets hold by default. Lifted up (rather than
  // local to SwapPanel) so it can be part of SwapPanel's remount key below.
  const [settlementSymbol, setSettlementSymbol] = useState<InputToken["symbol"]>("SOL");
  // Always defaults to "buy" regardless of spread direction -- we don't track the user's
  // T-token holdings anywhere else in the app, so there's no reliable signal to auto-switch
  // to Sell. A premium just gets a caution banner instead of buy-opportunity framing below;
  // the user can switch to Sell themselves if they're holding and want to act on it.
  const [side, setSide] = useState<Side>("buy");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Trade</h1>
        <p className="mt-1 text-sm text-muted">Act on a live Basis spread, backed by Tessera and Jupiter data.</p>
      </div>

      <div className="glass-panel flex flex-wrap gap-2 rounded-2xl p-4">
        {(spreads.length > 0 ? spreads.map((s) => s.symbol) : ["T-OpenAI", "T-Kalshi", "T-SpaceX"]).map((symbol) => {
          const Icon = tokenIcon[symbol] ?? OpenAIIcon;
          return (
            <button
              key={symbol}
              type="button"
              onClick={() => setSelectedSymbolOverride(symbol)}
              className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition ${
                selectedSymbol === symbol
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

      {loading && !selectedToken ? (
        <div className="glass-panel h-[280px] animate-pulse rounded-2xl" />
      ) : !selectedToken ? (
        <div className="glass-panel rounded-2xl p-6 text-center text-sm text-muted">No live token data available yet.</div>
      ) : (
        <>
          <SpreadInsight token={selectedToken} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <TokenPriceChart token={selectedToken} history={history} now={now} />
            </div>
            <div className="lg:col-span-2">
              {/* Keyed by output token + settlement token + side so switching any of them remounts the panel with fresh state, instead of an effect resetting it. */}
              <SwapPanel
                key={`${selectedToken.symbol}:${settlementSymbol}:${side}`}
                token={selectedToken}
                wallet={wallet}
                settlementSymbol={settlementSymbol}
                onSettlementSymbolChange={setSettlementSymbol}
                side={side}
                onSideChange={setSide}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * The Basis analysis: what the spread is doing right now, in large type,
 * above the chart/panel. A discount (negative spread) is the real buy
 * signal -- green, "good entry point". A premium (positive spread) just
 * means it's trading above fair value right now -- our accent blue,
 * informational, no "opportunity" language (and deliberately not amber,
 * which reads as a warning we don't intend).
 */
function SpreadInsight({ token }: { token: SpreadRecord }) {
  const discount = token.spreadPct < 0;
  const pct = Math.abs(token.spreadPct).toFixed(1);

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div
        className={`rounded-xl border px-4 py-3 text-sm font-medium ${
          discount ? "border-green-500/20 bg-green-500/10 text-green-300" : "border-premium/20 bg-premium/10 text-premium"
        }`}
      >
        {discount
          ? `${token.symbol} is trading ${pct}% below its Tessera mark price: a good entry point.`
          : `${token.symbol} is trading ${pct}% above its Tessera mark price.`}
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
          <p className={`mt-1 text-2xl font-semibold sm:text-3xl ${dashboardSpreadColorClass(token.spreadPct)}`}>
            {token.spreadPct >= 0 ? "+" : ""}
            {token.spreadPct.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}

const chartTimeframes = [
  { label: "1H", ms: 60 * 60 * 1000 },
  { label: "4H", ms: 4 * 60 * 60 * 1000 },
  { label: "24H", ms: 24 * 60 * 60 * 1000 },
] as const;

/** Standalone live price chart for the selected token -- left column of the trade layout. */
function TokenPriceChart({ token, history, now }: { token: SpreadRecord; history: SpreadRecord[]; now: number }) {
  const [timeframe, setTimeframe] = useState<(typeof chartTimeframes)[number]["label"]>("1H");
  const Icon = tokenIcon[token.symbol] ?? OpenAIIcon;

  const points = useMemo(() => {
    const rangeMs = chartTimeframes.find((t) => t.label === timeframe)?.ms ?? chartTimeframes[0].ms;
    const cutoff = now - rangeMs;

    return history
      .filter((r) => r.symbol === token.symbol)
      .filter((r) => new Date(r.fetchedAt).getTime() >= cutoff)
      .sort((a, b) => new Date(a.fetchedAt).getTime() - new Date(b.fetchedAt).getTime())
      .map((r) => ({
        time: new Date(r.fetchedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        markPrice: r.markPrice,
        dexPrice: r.dexPrice,
      }));
  }, [history, token.symbol, timeframe, now]);

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Icon className="h-7 w-7 flex-shrink-0 rounded-full text-white" />
          <p className="text-base font-semibold text-white">{token.symbol}</p>
        </div>
        <div className="flex gap-1 rounded-full border border-white/10 p-1">
          {chartTimeframes.map((tf) => (
            <button
              key={tf.label}
              type="button"
              onClick={() => setTimeframe(tf.label)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                timeframe === tf.label ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {points.length >= 2 ? (
          <SpreadHistoryChart data={points} symbol={token.symbol} heightClass="h-72" hideHeader />
        ) : (
          <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-center">
            <p className="text-sm text-white/70">Building history. Check back soon.</p>
            <p className="mt-1 text-xs text-muted">
              {points.length === 1 ? "Only one snapshot recorded so far for this window." : "No snapshots recorded yet for this window."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Custom-styled settlement-token pill + popover (SOL/USDC/USDT), replacing the native <select>. */
function SettlementTokenSelector({
  value,
  onChange,
}: {
  value: InputToken["symbol"];
  onChange: (symbol: InputToken["symbol"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const CurrentIcon = inputTokenIcon[value];

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-2.5 text-sm font-medium text-white transition hover:bg-white/10"
      >
        <CurrentIcon className="h-5 w-5 flex-shrink-0 rounded-full" />
        {value}
        <ChevronDown className={`h-3.5 w-3.5 text-white/60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="glass-panel absolute right-0 top-full z-30 mt-2 w-36 overflow-hidden rounded-xl border border-white/10 p-1">
          {INPUT_TOKENS.map((t) => {
            const OptionIcon = inputTokenIcon[t.symbol];
            return (
              <button
                key={t.symbol}
                type="button"
                onClick={() => {
                  onChange(t.symbol);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                  t.symbol === value ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <OptionIcon className="h-5 w-5 flex-shrink-0 rounded-full" />
                {t.symbol}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Non-interactive symbol+icon pill for whichever side of the trade is fixed (the T-token). */
function StaticTokenBadge({ symbol }: { symbol: string }) {
  const Icon = tokenIcon[symbol] ?? OpenAIIcon;
  return (
    <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3 text-sm font-medium text-white">
      <Icon className="h-5 w-5 flex-shrink-0 rounded-full text-white" />
      {symbol}
    </div>
  );
}

function SwapPanel({
  token,
  wallet,
  settlementSymbol,
  onSettlementSymbolChange,
  side,
  onSideChange,
}: {
  token: SpreadRecord;
  wallet: WalletState;
  settlementSymbol: InputToken["symbol"];
  onSettlementSymbolChange: (symbol: InputToken["symbol"]) => void;
  side: Side;
  onSideChange: (side: Side) => void;
}) {
  const { connection } = useConnection();
  const settlementToken = INPUT_TOKENS.find((t) => t.symbol === settlementSymbol) ?? INPUT_TOKENS[0];
  const settlementBalance = inputBalanceFor(wallet, settlementSymbol);

  const [amountIn, setAmountIn] = useState("");
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [tokenDecimals, setTokenDecimals] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [txState, setTxState] = useState<TxState>("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMintDecimals(token.mint)
      .then((d) => {
        if (!cancelled) setTokenDecimals(d);
      })
      .catch((err) => console.error(`Failed to fetch ${token.symbol} decimals:`, err));
    return () => {
      cancelled = true;
    };
  }, [token.mint, token.symbol]);

  // Only needed for the Sell side (paying with the T-token), fetched on demand rather than
  // via the shared WalletBalanceProvider since it's specific to whichever token is selected.
  useEffect(() => {
    if (side !== "sell" || !wallet.connected || !wallet.address) return;
    let cancelled = false;
    async function loadTokenBalance() {
      try {
        const owner = new PublicKey(wallet.address!);
        const mint = new PublicKey(token.mint);
        const accounts = await connection.getParsedTokenAccountsByOwner(owner, { mint });
        if (cancelled) return;
        const total = accounts.value.reduce(
          (sum, { account }) => sum + (account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0),
          0,
        );
        setTokenBalance(total);
      } catch (err) {
        console.error(`Failed to fetch ${token.symbol} balance:`, err);
      }
    }
    loadTokenBalance();
    return () => {
      cancelled = true;
    };
  }, [side, wallet.connected, wallet.address, token.mint, token.symbol, connection]);

  const paySymbol = side === "buy" ? settlementSymbol : token.symbol;
  const payDecimals = side === "buy" ? settlementToken.decimals : tokenDecimals;
  const receiveDecimals = side === "buy" ? tokenDecimals : settlementToken.decimals;
  const payMint = side === "buy" ? settlementToken.mint : token.mint;
  const receiveMint = side === "buy" ? token.mint : settlementToken.mint;
  const payBalance = side === "buy" ? settlementBalance : wallet.connected ? tokenBalance : 0;

  const amountNum = Number(amountIn);
  const hasValidAmount = amountIn.trim() !== "" && Number.isFinite(amountNum) && amountNum > 0 && payDecimals !== null;
  const insufficientBalanceLocally = wallet.connected && hasValidAmount && amountNum > payBalance;

  useEffect(() => {
    if (!hasValidAmount || payDecimals === null) return;

    let cancelled = false;
    const handle = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const rawAmount = Math.round(amountNum * 10 ** payDecimals).toString();
        const result = await getOrder({
          inputMint: payMint,
          outputMint: receiveMint,
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
  }, [amountIn, payMint, receiveMint, payDecimals, wallet.connected, wallet.address, hasValidAmount]);

  // Ignore a stale quote once the input becomes invalid, without resetting state synchronously in an effect.
  const activeOrder = hasValidAmount ? order : null;
  const activeQuoteError = hasValidAmount ? quoteError : null;

  const receiveAmount =
    activeOrder && receiveDecimals !== null ? Number(activeOrder.outAmount) / 10 ** receiveDecimals : null;

  // Price impact = this quote's effective price vs the live DEX price, in %
  // (positive = worse than the DEX price). Built from the settlement-token
  // side, which Jupiter values reliably; its own priceImpact field compares
  // USD valuations that don't track T-Token pool prices.
  let priceImpactPct: number | null = null;
  if (activeOrder && payDecimals !== null && receiveDecimals !== null && token.dexPrice > 0) {
    if (side === "buy") {
      const tokensOut = Number(activeOrder.outAmount) / 10 ** receiveDecimals;
      if (tokensOut > 0 && activeOrder.inUsdValue) {
        priceImpactPct = (activeOrder.inUsdValue / tokensOut / token.dexPrice - 1) * 100;
      }
    } else {
      const tokensIn = Number(activeOrder.inAmount) / 10 ** payDecimals;
      if (tokensIn > 0 && activeOrder.outUsdValue) {
        priceImpactPct = (1 - activeOrder.outUsdValue / tokensIn / token.dexPrice) * 100;
      }
    }
  }
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
  else if (insufficientBalanceLocally) actionLabel = `Insufficient ${paySymbol} balance`;
  else if (serverError) actionLabel = "Unable to trade";

  const premium = token.spreadPct >= 0;
  const pctLabel = Math.abs(token.spreadPct).toFixed(1);
  const balanceDecimalsFor = (symbol: string) => (symbol === token.symbol || symbol === "SOL" ? 4 : 2);

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white">
          {side === "buy" ? "Buy" : "Sell"} {token.symbol}
        </p>
        <div className="flex gap-1 rounded-full border border-white/10 p-1">
          <button
            type="button"
            onClick={() => onSideChange("buy")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              side === "buy" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => onSideChange("sell")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              side === "sell" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            Sell
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">
        {side === "buy"
          ? `Spend ${settlementSymbol} to act on the spread above.`
          : `Sell ${token.symbol} for ${settlementSymbol}.`}
      </p>

      <div className="mt-5 space-y-3">
        <div>
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs text-muted">You pay</label>
            <div className="flex gap-1.5">
              {[0.25, 0.5, 1].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  disabled={!wallet.connected || payBalance <= 0}
                  onClick={() => setAmountIn(formatAmountInput(payBalance * pct))}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {pct === 1 ? "100%" : `${pct * 100}%`}
                </button>
              ))}
            </div>
          </div>

          {/* The dropdown opens below this row -- nothing interactive sits underneath it, so it never covers the quick-buy buttons above. */}
          <div className="relative z-10 mt-1.5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-lg text-white placeholder:text-white/40 focus:outline-none"
            />
            {side === "buy" ? (
              <SettlementTokenSelector value={settlementSymbol} onChange={onSettlementSymbolChange} />
            ) : (
              <StaticTokenBadge symbol={token.symbol} />
            )}
          </div>

          {wallet.connected && (
            <p className="mt-1.5 text-xs text-muted">
              Balance: {payBalance.toFixed(balanceDecimalsFor(paySymbol))} {paySymbol}
            </p>
          )}
        </div>

        <div className="flex justify-center text-white/40">
          <ArrowDown className="h-4 w-4" />
        </div>

        <div>
          <label className="text-xs text-muted">You receive (estimated)</label>
          <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="w-full text-lg text-white">
              {quoteLoading
                ? "…"
                : receiveAmount !== null
                  ? receiveAmount.toLocaleString("en-US", { maximumFractionDigits: 6 })
                  : "0.00"}
            </span>
            {side === "buy" ? (
              <StaticTokenBadge symbol={token.symbol} />
            ) : (
              <SettlementTokenSelector value={settlementSymbol} onChange={onSettlementSymbolChange} />
            )}
          </div>
        </div>

        {activeOrder && !serverError && priceImpactPct !== null && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Price impact vs DEX</span>
            <span className={Math.abs(priceImpactPct) > 1 ? "text-red-500" : "text-white"}>
              {priceImpactPct.toFixed(2)}%
            </span>
          </div>
        )}

        {activeQuoteError && <p className="text-xs text-red-500">{activeQuoteError}</p>}
        {serverError && <p className="text-xs text-red-500">{activeOrder?.errorMessage ?? "This trade couldn't be built."}</p>}
        {insufficientBalanceLocally && !serverError && (
          <p className="text-xs text-red-500">
            You have {payBalance.toFixed(balanceDecimalsFor(paySymbol))} {paySymbol}, which isn&apos;t enough to cover this
            trade.
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
                You {side === "buy" ? "bought" : "sold"} {token.symbol} at a {pctLabel}% {premium ? "premium" : "discount"} to
                mark price.{" "}
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

        <p className="pt-1 text-center text-[11px] text-muted">Trade execution routed through Jupiter for best price.</p>
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
