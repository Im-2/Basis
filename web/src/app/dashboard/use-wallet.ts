"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export interface WalletState {
  connected: boolean;
  address: string | null;
  shortAddress: string;
  solBalance: number;
  usdcBalance: number;
  connect: () => void;
  disconnect: () => void;
}

// Circle's official mainnet USDC mint.
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const BALANCE_REFRESH_MS = 30_000;

/**
 * Wraps @solana/wallet-adapter-react's useWallet() + useConnection() with the
 * real SOL/USDC balances for the connected account, and exposes the same
 * WalletState shape the sidebar/top bar already render -- connect() opens the
 * real wallet-selection modal instead of a mock toggle.
 */
export function useWallet(): WalletState {
  const { connection } = useConnection();
  const { publicKey, connected, disconnect: adapterDisconnect } = useSolanaWallet();
  const { setVisible } = useWalletModal();

  const [solBalance, setSolBalance] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(0);

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
  }, [connected, publicKey, connection]);

  const connect = useCallback(() => setVisible(true), [setVisible]);
  const disconnect = useCallback(() => void adapterDisconnect(), [adapterDisconnect]);

  const address = publicKey?.toBase58() ?? null;

  return useMemo(
    () => ({
      connected,
      address,
      shortAddress: address ? `${address.slice(0, 4)}…${address.slice(-4)}` : "",
      solBalance: connected ? solBalance : 0,
      usdcBalance: connected ? usdcBalance : 0,
      connect,
      disconnect,
    }),
    [connected, address, solBalance, usdcBalance, connect, disconnect],
  );
}
