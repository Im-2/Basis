import { getAllHistory, getHistory } from "./store.js";

const symbolArg = process.argv[2];

const records = symbolArg ? getHistory(symbolArg) : getAllHistory();

if (records.length === 0) {
  console.log(symbolArg ? `No history found for ${symbolArg}.` : "No history stored yet. Run `npm run once` or `npm run poll` first.");
  process.exit(0);
}

console.log(`${records.length} record(s)${symbolArg ? ` for ${symbolArg}` : ""}:\n`);
for (const r of records) {
  const sign = r.spreadPct >= 0 ? "+" : "";
  console.log(
    `${r.fetchedAt}  ${r.symbol.padEnd(12)} mark=$${r.markPrice.toFixed(2)}  dex=$${r.dexPrice.toFixed(2)}  spread=${sign}${r.spreadPct.toFixed(3)}%`
  );
}
