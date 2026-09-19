import { computeSpreads } from "./spread.js";
import { appendSnapshot } from "./store.js";
import type { SpreadRecord } from "./types.js";

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 30_000);
const RUN_ONCE = process.argv.includes("--once");

function formatRow(r: SpreadRecord): string {
  const sign = r.spreadPct >= 0 ? "+" : "";
  return (
    `  ${r.symbol.padEnd(12)} mark=$${r.markPrice.toFixed(2).padStart(9)}  ` +
    `dex=$${r.dexPrice.toFixed(2).padStart(9)}  ` +
    `spread=${sign}${r.spreadPct.toFixed(3)}%  holders=${r.holders}`
  );
}

async function runCycle(): Promise<void> {
  const startedAt = new Date().toISOString();
  try {
    const records = await computeSpreads();

    if (records.length === 0) {
      console.warn(`[poller ${startedAt}] no spread records produced this cycle, skipping store write`);
      return;
    }

    appendSnapshot(records);

    console.log(`\n[poller ${startedAt}] fetched ${records.length} T-Token spread(s):`);
    for (const r of records) {
      console.log(formatRow(r));
    }
  } catch (err) {
    console.error(`[poller ${startedAt}] cycle failed, skipping: ${err instanceof Error ? err.message : err}`);
  }
}

async function main(): Promise<void> {
  if (RUN_ONCE) {
    console.log("[poller] running a single cycle (--once)...");
    await runCycle();
    return;
  }

  console.log(`[poller] starting, polling every ${POLL_INTERVAL_MS / 1000}s. Ctrl+C to stop.`);
  await runCycle();
  setInterval(() => {
    void runCycle();
  }, POLL_INTERVAL_MS);
}

void main();
