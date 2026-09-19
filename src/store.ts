import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { SpreadRecord } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const SNAPSHOTS_FILE = join(DATA_DIR, "snapshots.jsonl");

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

/** Appends one line per spread record to the local JSON-lines snapshot store. */
export function appendSnapshot(records: SpreadRecord[]): void {
  if (records.length === 0) return;
  ensureDataDir();
  const lines = records.map((r) => JSON.stringify(r)).join("\n") + "\n";
  appendFileSync(SNAPSHOTS_FILE, lines, "utf-8");
}

/** Reads back the stored history for a given symbol, oldest first. Optionally caps to the last `limit` entries. */
export function getHistory(symbol: string, limit?: number): SpreadRecord[] {
  if (!existsSync(SNAPSHOTS_FILE)) return [];

  const lines = readFileSync(SNAPSHOTS_FILE, "utf-8").split("\n").filter((l) => l.trim().length > 0);
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
  if (!existsSync(SNAPSHOTS_FILE)) return [];
  const lines = readFileSync(SNAPSHOTS_FILE, "utf-8").split("\n").filter((l) => l.trim().length > 0);
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
