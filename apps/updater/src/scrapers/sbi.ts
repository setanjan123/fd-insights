import type { BankScraper, ParsedSlab } from "../lib/types.js";
import { withBrowserPage } from "../lib/browser.js";
import { parseTenure } from "../lib/tenure.js";
import { parseRate } from "../lib/rates.js";

type WithBrowserPageFn = typeof withBrowserPage;

const EXPECTED_FIRST_TENURE = "7 days to 45 days";

export class SbiScraper implements BankScraper {
  constructor(private readonly withBrowserPageFn: WithBrowserPageFn = withBrowserPage) {}

  bankId = "sbi";
  url = "https://sbi.bank.in/web/interest-rates/deposit-rates/retail-domestic-term-deposits";

  async scrape(): Promise<ParsedSlab[]> {
    console.log(`[${this.bankId}] Fetching page with Playwright: ${this.url}`);

    const rawRows = await this.withBrowserPageFn(this.url, async (page) => {
      await page.waitForSelector("#menu_0 table", { timeout: 20_000 });

      return page.$$eval("#menu_0 table tr", (rows) => {
        return rows.flatMap((row) => {
          const cells = Array.from(row.querySelectorAll("td")).map((cell) =>
            (cell.textContent ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim(),
          );

          // [0] Tenors, [1] Existing Public, [2] Revised Public, [3] Existing Senior, [4] Revised Senior
          if (cells.length < 5) {
            return [];
          }

          if (!cells[0] || !cells[2] || !cells[4] || cells[0].toLowerCase().includes("tenor")) {
            return [];
          }

          return [{ tenure: cells[0], regular: cells[2], senior: cells[4] }];
        });
      });
    });

    if (rawRows.length === 0) {
      throw new Error(`[${this.bankId}] Found zero valid table rows.`);
    }

    if (rawRows[0]!.tenure.toLowerCase() !== EXPECTED_FIRST_TENURE.toLowerCase()) {
      throw new Error(`[${this.bankId}] Table validation failed: expected first tenure "${EXPECTED_FIRST_TENURE}".`);
    }

    console.log(`[${this.bankId}] Found ${rawRows.length} potential rows in table. Processing...`);

    const parsedSlabs: ParsedSlab[] = [];
    for (const row of rawRows) {
      try {
        parsedSlabs.push({
          ...parseTenure(row.tenure),
          regular: parseRate(row.regular),
          senior: parseRate(row.senior),
        });
      } catch (err: any) {
        throw new Error(`[${this.bankId}] Row parsing error for "${row.tenure}": ${err.message}`);
      }
    }

    if (parsedSlabs.length === 0) {
      throw new Error(`[${this.bankId}] Did not extract any valid rate slabs from table.`);
    }

    return parsedSlabs;
  }
}
