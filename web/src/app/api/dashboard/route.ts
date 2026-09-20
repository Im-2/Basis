import { NextResponse } from "next/server";
import { computeSpreads } from "@backend/spread";
import { appendSnapshot, getAllHistory } from "@backend/store";
import type { SpreadRecord } from "@backend/types";

// This route hits live external APIs (Tessera + Jupiter) on every call, so it
// must never be statically cached/pre-rendered by Next.js.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const spreads = await computeSpreads();

    // Feed the same JSON-lines store the CLI poller writes to, so the
    // dashboard's own traffic also grows the history it reads back.
    if (spreads.length > 0) {
      appendSnapshot(spreads);
    }

    const history = getAllHistory();

    return NextResponse.json({
      spreads,
      history,
      stale: false,
      error: null,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    // Live fetch failed (e.g. Tessera or Jupiter unreachable) -- fall back to
    // the most recent cached snapshot per symbol rather than a blank page.
    const history = getAllHistory();
    const latestBySymbol = new Map<string, SpreadRecord>();
    for (const record of history) {
      latestBySymbol.set(record.symbol, record);
    }
    const cachedSpreads = [...latestBySymbol.values()];

    return NextResponse.json(
      {
        spreads: cachedSpreads,
        history,
        stale: true,
        error: err instanceof Error ? err.message : "Unknown error while fetching live data.",
        fetchedAt: new Date().toISOString(),
      },
      { status: cachedSpreads.length > 0 ? 200 : 503 },
    );
  }
}
