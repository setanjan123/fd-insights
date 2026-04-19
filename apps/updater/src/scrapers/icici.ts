import type { BankScraper, ParsedSlab } from "../lib/types.js";
import { fetchJson } from "../lib/fetch.js";
import { parseTenure } from "../lib/tenure.js";

/** Shape of each entry in the ICICI FD interest rate JSON */
type IciciRateEntry = {
  tenure: string;
  c1: number; // General Citizen rate
  c2: number; // Senior Citizen rate
  c3: number;
  c4: number;
};

type IciciRateJson = {
  interestData: IciciRateEntry[][];
};

const JSON_URL =
  "https://www.icici.bank.in/content/dam/icicibank-revamp/deposits/fixed-deposits/json/fd-interest-rate.json";

/** The first tenure entry we expect in the "Less than ₹3 Cr." tier */
const EXPECTED_FIRST_TENURE = "7 to 45 Days";

/** Product-specific rows that don't represent standard tenure slabs */
const SKIP_TENURES = new Set(["5Y (Tax Saver FD)"]);

export class IciciScraper implements BankScraper {
  bankId = "icici";
  url = JSON_URL;

  async scrape(): Promise<ParsedSlab[]> {
    console.log(`[${this.bankId}] Fetching JSON: ${this.url}`);
    const json = await fetchJson<IciciRateJson>(this.url);

    const lessThan3Cr = json.interestData[0];

    if (!lessThan3Cr || lessThan3Cr.length === 0) {
      throw new Error(
        `[${this.bankId}] interestData[0] is empty or missing. ICICI may have changed their data structure.`
      );
    }

    // Guard: validate the first entry matches what we expect for the <3Cr tier.
    // If this fails it means ICICI shuffled the array — fail loud rather than silently
    // scraping the wrong tier's rates.
    if (lessThan3Cr[0]!.tenure !== EXPECTED_FIRST_TENURE) {
      throw new Error(
        `[${this.bankId}] Data structure validation failed. ` +
          `Expected first tenure to be "${EXPECTED_FIRST_TENURE}", ` +
          `got "${lessThan3Cr[0]!.tenure}". ICICI may have reordered their interestData array.`
      );
    }

    console.log(
      `[${this.bankId}] Found ${lessThan3Cr.length} entries. Processing...`
    );

    const parsedSlabs: ParsedSlab[] = [];

    for (const entry of lessThan3Cr) {
      if (SKIP_TENURES.has(entry.tenure)) {
        console.log(`[${this.bankId}] Skipping special product: "${entry.tenure}"`);
        continue;
      }

      try {
        parsedSlabs.push({
          ...parseTenure(entry.tenure),
          regular: entry.c1,
          senior: entry.c2,
        });
      } catch (err: any) {
        throw new Error(
          `[${this.bankId}] Tenure parse error for "${entry.tenure}": ${err.message}`
        );
      }
    }

    return parsedSlabs;
  }
}
