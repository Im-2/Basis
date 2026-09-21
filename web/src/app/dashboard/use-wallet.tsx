"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useConnection, useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";

export interface WalletState {
  connected: boolean;
  address: string | null;
  shortAddress: string;
  solBalance: number;
  usdcBalance: number;
  connect: () => void;
  disconnect: () => void;
  /** Signs (does not send) a transaction with the connected wallet. Undefined if the wallet doesn't support it. */
  signTransaction: WalletContextState["signTransaction"];
  /** Re-fetches SOL/USDC balances immediately, e.g. right after a swap. */
  refreshBalances: () => void;
}

// Circle's official mainnet USDC mint.
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const BALANCE_REFRESH_MS = 30_000;

const WalletBalanceContext = createContext<WalletState | null>(null);

/**
 * Wraps @solana/wallet-adapter-react's useWallet() + useConnection() with the
 * real SOL/USDC balances for the connected account, polled on a single
 * shared interval regardless of how many components call useWallet() --
 * without this, the sidebar/top bar and the Trade page (which each call
 * useWallet() independently) would each run their own 30s polling loop,
 * doubling RPC traffic (and doubling any RPC error) whenever both are
 * mounted at once.
 */
export function WalletBalanceProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const { publicKey, connected, disconnect: adapterDisconnect, signTransaction } = useSolanaWallet();
  const { setVisible } = useWalletModal();

  const [solBalance, setSolBalance] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    if (!connected || !publicKey) return;

    let cancelled = false;

    async function loadBalances() {
      try {
        const lamports = await connection.getBalance(publicKey!);
        if (cancelled) return;
        setSolBalance(lamports / LAMPORTS_PER_SOL);
      } catch (err) {
        console.error("Failed to fetch SOL balance:", err);
      }

      try {
        const accounts = await connection.getParsedTokenAccountsByOwner(publicKey!, { mint: USDC_MINT });
        if (cancelled) return;
        const total = accounts.value.reduce(
          (sum, { account }) => sum + (account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0),
          0,
        );
        setUsdcBalance(total);
      } catch (err) {
        console.error("Failed to fetch USDC balance:", err);
      }
    }

    loadBalances();
    const interval = setInterval(loadBalances, BALANCE_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [connected, publicKey, connection, refreshNonce]);

  const connect = useCallback(() => setVisible(true), [setVisible]);
  const disconnect = useCallback(() => void adapterDisconnect(), [adapterDisconnect]);
  const refreshBalances = useCallback(() => setRefreshNonce((n) => n + 1), []);

  const address = publicKey?.toBase58() ?? null;

  const value = useMemo<WalletState>(
    () => ({
      connected,
      address,
      shortAddress: address ? `${address.slice(0, 4)}…${address.slice(-4)}` : "",
      solBalance: connected ? solBalance : 0,
      usdcBalance: connected ? usdcBalance : 0,
      connect,
      disconnect,
      signTransaction,
      refreshBalances,
    }),
    [connected, address, solBalance, usdcBalance, connect, disconnect, signTransaction, refreshBalances],
  );

  return <WalletBalanceContext.Provider value={value}>{children}</WalletBalanceContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletBalanceContext);
  if (!ctx) {
    throw new Error("useWallet() must be called within a WalletBalanceProvider");
  }
  return ctx;
}
