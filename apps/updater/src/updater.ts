import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { scrapers } from "./scrapers/index.js";

const BANKS_JSON_PATH = path.resolve(
  process.cwd(),
  "../web/src/lib/banks.json"
);

async function main() {
  const { values } = parseArgs({
    options: {
      bank: {
        type: "string",
      },
    },
  });

  const targetBank = values.bank;

  const activeScrapers = targetBank
    ? scrapers.filter((s) => s.bankId === targetBank)
    : scrapers;

  if (activeScrapers.length === 0) {
    console.error(`No scrapers found matching criteria`);
    process.exit(1);
  }

  console.log(`Starting run for: ${activeScrapers.map((s) => s.bankId).join(", ")}`);

  // Run scrapers in parallel
  const results = await Promise.allSettled(
    activeScrapers.map((s) =>
      s.scrape().then((slabs) => ({ bankId: s.bankId, slabs }))
    )
  );

  // Load existing banks.json
  const banksDataRaw = await fs.readFile(BANKS_JSON_PATH, "utf-8");
  const banksData = JSON.parse(banksDataRaw);

  let hasUpdates = false;

  for (const result of results) {
    // We only update JSON with successful resolutions containing actual slabs
    if (result.status === "fulfilled" && result.value.slabs.length > 0) {
      const { bankId, slabs } = result.value;

      // Find the existing array for this bank
      const bankIndex = banksData.banks.findIndex((b: any) => b.id === bankId);
      if (bankIndex >= 0) {
        banksData.banks[bankIndex].slabs = slabs;
        console.log(`[OK] Successfully merged ${slabs.length} slabs for ${bankId}`);
        hasUpdates = true;
      } else {
        console.warn(`[WARN] Bank ID '${bankId}' not found in banks.json. Skipping.`);
      }
    } else if (result.status === "rejected") {
      console.error(`[ERROR] Scraper failed:\n`, result.reason);
    }
  }

  if (hasUpdates) {
    // Update global date stamp
    banksData.lastUpdated = new Date().toISOString().split("T")[0];

    await fs.writeFile(
      BANKS_JSON_PATH,
      JSON.stringify(banksData, null, 2),
      "utf-8"
    );
    console.log(`\nUpdated ${BANKS_JSON_PATH}`);
  } else {
    console.log(`\nNo updates made.`);
  }
}

main().catch(console.error);
