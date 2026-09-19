import type { TesseraToken } from "./types.js";

const TESSERA_TOKEN_DETAILS_URL = "https://rest-api.tessera.pe/v1/public/token-details";

/** Fetches Tessera's public token-details list (mark price, sector, mint, etc. per T-Token). */
export async function getTesseraTokens(): Promise<TesseraToken[]> {
  const res = await fetch(TESSERA_TOKEN_DETAILS_URL, {
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Tessera API responded with ${res.status} ${res.statusText}`);
  }

  const body: unknown = await res.json();

  if (!Array.isArray(body)) {
    throw new Error("Tessera API returned an unexpected (non-array) response shape");
  }

  return body.map((raw) => validateTesseraToken(raw));
}

function validateTesseraToken(raw: unknown): TesseraToken {
  const r = raw as Record<string, unknown>;
  const required: (keyof TesseraToken)[] = [
    "id",
    "name",
    "symbol",
    "code",
    "sector",
    "mint",
    "markPrice",
    "holders",
    "markValuation",
  ];

  for (const key of required) {
    if (r[key] === undefined || r[key] === null) {
      throw new Error(`Tessera token record missing field "${key}": ${JSON.stringify(raw)}`);
    }
  }

  return {
    id: String(r.id),
    name: String(r.name),
    symbol: String(r.symbol),
    code: String(r.code),
    sector: String(r.sector),
    mint: String(r.mint),
    markPrice: Number(r.markPrice),
    holders: Number(r.holders),
    markValuation: Number(r.markValuation),
  };
}
