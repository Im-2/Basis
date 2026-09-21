import { NextResponse } from "next/server";
import { computeSpreads } from "@backend/spread";
import { appendSnapshot, getAllHistory } from "@backend/store";
import type { SpreadRecord } from "@backend/types";

// This route hits live external APIs (Tessera + Jupiter) on every call, so it
// must never be statically cached/pre-rendered by Next.js.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Reads the local history store defensively: on a read-only filesystem (e.g. a
// serverless deployment without a writable BASIS_DATA_DIR) this must not throw,
// since a history-read failure should never blank out live spread data.
function safeGetAllHistory(): SpreadRecord[] {
  try {
    return getAllHistory();
  } catch {
    return [];
  }
}

export async function GET() {
  let spreads: SpreadRecord[];

  try {
    spreads = await computeSpreads();
  } catch (err) {
    // Live fetch failed (e.g. Tessera or Jupiter unreachable) -- fall back to
    // the most recent cached snapshot per symbol rather than a blank page.
    const history = safeGetAllHistory();
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

  // Feed the same JSON-lines store the CLI poller writes to, so the
  // dashboard's own traffic also grows the history it reads back. Best-effort:
  // a write failure (e.g. read-only filesystem) must not blank out the live
  // spreads we already have.
  try {
    if (spreads.length > 0) {
      appendSnapshot(spreads);
    }
  } catch {
    // ignore -- live spreads below are unaffected
  }

  const history = safeGetAllHistory();

  return NextResponse.json({
    spreads,
    history,
    stale: false,
    error: null,
    fetchedAt: new Date().toISOString(),
  });
}
