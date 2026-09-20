"use client";

import { useMemo, useState } from "react";

export interface WalletState {
  connected: boolean;
  address: string | null;
  shortAddress: string;
  solBalance: number;
  usdcBalance: number;
  connect: () => void;
  disconnect: () => void;
}

// Mock wallet connection -- no real Solana wallet adapter wired up yet.
// This models the connected/disconnected UI states the design calls for
// so the real wallet-adapter integration can be dropped in later without
// touching the sidebar/top bar components.
const MOCK_ADDRESS = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

export function useWallet(): WalletState {
  const [connected, setConnected] = useState(false);

  return useMemo(
    () => ({
      connected,
      address: connected ? MOCK_ADDRESS : null,
      shortAddress: connected ? `${MOCK_ADDRESS.slice(0, 4)}…${MOCK_ADDRESS.slice(-4)}` : "",
      solBalance: connected ? 4.82 : 0,
      usdcBalance: connected ? 1240.55 : 0,
      connect: () => setConnected(true),
      disconnect: () => setConnected(false),
    }),
    [connected],
  );
}
