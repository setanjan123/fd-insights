import type { BankScraper, ParsedSlab } from "../lib/types.js";
import { fetchHtml } from "../lib/fetch.js";
import { parseTenure } from "../lib/tenure.js";
import { parseRate } from "../lib/rates.js";
import { extractTableRows } from "../lib/table.js";

export class HdfcScraper implements BankScraper {
  bankId = "hdfc";
  url = "https://www.hdfc.bank.in/fixed-deposit/fd-interest-rate";

  async scrape(): Promise<ParsedSlab[]> {
    console.log(`[${this.bankId}] Fetching page: ${this.url}`);
    const $ = await fetchHtml(this.url);

    // Use table:first to grab the absolute first table on the page
    const rawRows = extractTableRows($, "table:first tr");

    if (rawRows.length === 0) {
      throw new Error(`[${this.bankId}] Found zero valid table rows.`);
    }

    console.log(`[${this.bankId}] Found ${rawRows.length} potential rows. Processing...`);

    const parsedSlabs: ParsedSlab[] = rawRows.map((row) => {
      try {
        return {
          ...parseTenure(row.tenure),
          regular: parseRate(row.regular),
          senior: parseRate(row.senior),
        };
      } catch (err: any) {
        throw new Error(`[${this.bankId}] Row parsing error for "${row.tenure}": ${err.message}`);
      }
    });

    return parsedSlabs;
  }
}
