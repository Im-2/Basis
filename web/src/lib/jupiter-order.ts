// Client-side Jupiter Swap API (v2 Meta-Aggregator) helpers, used only by the
// Trade page. This is deliberately separate from the backend's jupiter.ts
// (which only reads prices for the dashboard) -- getOrder/executeOrder need a
// live connected wallet's public key and a browser wallet signature, so they
// can only ever run client-side.
//
// Docs: https://developers.jup.ag/docs/swap/order-and-execute
// Called keyless (no x-api-key) at the public rate-limited tier, same as the
// backend's lite-api.jup.ag calls.
const JUPITER_SWAP_BASE = "https://api.jup.ag/swap/v2";
const JUPITER_TOKEN_SEARCH_BASE = "https://lite-api.jup.ag/tokens/v2/search";

export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDC_DECIMALS = 6;

export interface OrderResponse {
  mode: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  /** Price impact in percentage points, e.g. -0.1 means -0.1%. */
  priceImpact: number;
  otherAmountThreshold: string;
  router: "metis" | "jupiterz" | "dflow" | "okx";
  /** Base64-encoded unsigned transaction. Null if no taker was provided; "" if the router couldn't build one (see errorCode). */
  transaction: string | null;
  lastValidBlockHeight: string;
  requestId: string;
  taker: string | null;
  /** Present when taker is set and transaction is "". */
  errorCode?: number;
  errorMessage?: string;
}

export interface ExecuteResponse {
  status: "Success" | "Failed";
  signature?: string;
  code: number;
  error?: string;
  totalInputAmount?: string;
  totalOutputAmount?: string;
}

export interface GetOrderParams {
  inputMint: string;
  outputMint: string;
  /** Amount in the smallest unit of the input token. */
  amount: string;
  /** Connected wallet's public key. Omit for a quote-only price check (no transaction). */
  taker?: string;
}

export async function getOrder({ inputMint, outputMint, amount, taker }: GetOrderParams): Promise<OrderResponse> {
  const params = new URLSearchParams({ inputMint, outputMint, amount });
  if (taker) params.set("taker", taker);

  const res = await fetch(`${JUPITER_SWAP_BASE}/order?${params}`, {
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter /order responded with ${res.status}: ${text}`);
  }

  return (await res.json()) as OrderResponse;
}

export async function executeOrder(signedTransaction: string, requestId: string): Promise<ExecuteResponse> {
  const res = await fetch(`${JUPITER_SWAP_BASE}/execute`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ signedTransaction, requestId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter /execute responded with ${res.status}: ${text}`);
  }

  return (await res.json()) as ExecuteResponse;
}

/** Browser-native base64 <-> bytes, avoiding a Node Buffer polyfill for the swap transaction payload. */
export function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

const decimalsCache = new Map<string, number>();

/** Looks up an SPL mint's decimal places via Jupiter's token search API, so raw order amounts can be shown in human units. */
export async function getMintDecimals(mint: string): Promise<number> {
  const cached = decimalsCache.get(mint);
  if (cached !== undefined) return cached;

  const res = await fetch(`${JUPITER_TOKEN_SEARCH_BASE}?query=${mint}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Jupiter token search responded with ${res.status}`);
  }

  const body = (await res.json()) as Array<{ id: string; decimals: number }>;
  const match = body.find((t) => t.id === mint);
  if (!match) {
    throw new Error(`Could not find token metadata for mint ${mint}`);
  }

  decimalsCache.set(mint, match.decimals);
  return match.decimals;
}
