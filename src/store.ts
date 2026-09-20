import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { SpreadRecord } from "./types.js";

// Resolved via BASIS_DATA_DIR when set (needed when this module is imported from a
// different process/bundler root, e.g. the Next.js app in web/), falling back to
// "<repo root>/data" for the CLI poller's own import.meta.url-relative default.
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.BASIS_DATA_DIR ?? join(__dirname, "..", "data");
const SNAPSHOTS_FILE = join(DATA_DIR, "snapshots.jsonl");

function ensureDataDir(): void {
  // turbopackIgnore: DATA_DIR is an absolute runtime path (env var or import.meta.url
  // derived), not something Turbopack's static file tracer needs to bundle.
  if (!existsSync(/* turbopackIgnore: true */ DATA_DIR)) {
    mkdirSync(/* turbopackIgnore: true */ DATA_DIR, { recursive: true });
  }
}

/** Appends one line per spread record to the local JSON-lines snapshot store. */
export function appendSnapshot(records: SpreadRecord[]): void {
  if (records.length === 0) return;
  ensureDataDir();
  const lines = records.map((r) => JSON.stringify(r)).join("\n") + "\n";
  appendFileSync(/* turbopackIgnore: true */ SNAPSHOTS_FILE, lines, "utf-8");
}

/** Reads back the stored history for a given symbol, oldest first. Optionally caps to the last `limit` entries. */
export function getHistory(symbol: string, limit?: number): SpreadRecord[] {
  if (!existsSync(/* turbopackIgnore: true */ SNAPSHOTS_FILE)) return [];

  const lines = readFileSync(/* turbopackIgnore: true */ SNAPSHOTS_FILE, "utf-8")
    .split("\n")
    .filter((l) => l.trim().length > 0);
  const records: SpreadRecord[] = [];

  for (const line of lines) {
    let parsed: SpreadRecord;
    try {
      parsed = JSON.parse(line) as SpreadRecord;
    } catch {
      continue;
    }
    if (parsed.symbol === symbol) records.push(parsed);
  }

  if (limit !== undefined && records.length > limit) {
    return records.slice(records.length - limit);
  }
  return records;
}

/** Reads back every stored snapshot record across all symbols, oldest first. */
export function getAllHistory(): SpreadRecord[] {
  if (!existsSync(/* turbopackIgnore: true */ SNAPSHOTS_FILE)) return [];
  const lines = readFileSync(/* turbopackIgnore: true */ SNAPSHOTS_FILE, "utf-8")
    .split("\n")
    .filter((l) => l.trim().length > 0);
  const records: SpreadRecord[] = [];
  for (const line of lines) {
    try {
      records.push(JSON.parse(line) as SpreadRecord);
    } catch {
      continue;
    }
  }
  return records;
}
