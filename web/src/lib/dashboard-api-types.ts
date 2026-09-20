// Mirrors backend/src/types.ts's SpreadRecord shape. Duplicated (not imported)
// because this is a type-only shape consumed by client components -- importing
// it from the compiled backend would pull a runtime module boundary into
// client bundles for zero benefit over a plain type declaration.
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

export interface DashboardApiResponse {
  spreads: SpreadRecord[];
  history: SpreadRecord[];
  stale: boolean;
  error: string | null;
  fetchedAt: string;
}
