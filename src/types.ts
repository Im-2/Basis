export interface TesseraToken {
  id: string;
  name: string;
  symbol: string;
  code: string;
  sector: string;
  mint: string;
  markPrice: number;
  holders: number;
  markValuation: number;
}

export interface DexPrice {
  usdPrice: number;
  liquidity: number | null;
  blockId: number | null;
  priceChange24h: number | null;
}

export interface SpreadRecord {
  symbol: string;
  name: string;
  sector: string;
  mint: string;
  markPrice: number;
  dexPrice: number;
  spreadPct: number;
  holders: number;
  markValuation: number;
  fetchedAt: string;
}
