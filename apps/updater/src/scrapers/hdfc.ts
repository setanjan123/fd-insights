import type { BankScraper, ParsedSlab } from "../lib/types.js";
import { withBrowserPage } from "../lib/browser.js";
import { parseTenure } from "../lib/tenure.js";
import { parseRate } from "../lib/rates.js";

const EXPECTED_FIRST_TENURE = "7 - 14 days";

function normalizeWhitespace(text: string): string {
  return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

export class HdfcScraper implements BankScraper {
  bankId = "hdfc";
  url = "https://www.hdfc.bank.in/fixed-deposit/fd-interest-rate";

  async scrape(): Promise<ParsedSlab[]> {
    console.log(`[${this.bankId}] Fetching page with Playwright: ${this.url}`);

    const rawRows = await withBrowserPage(this.url, async (page) => {
      await page.waitForFunction(
        () =>
          (document.body?.innerText ?? "")
            .toLowerCase()
            .includes("fixed deposit interest rate less than"),
        { timeout: 20_000 },
      );

      return page.evaluate(() => {
        const tables = Array.from(document.querySelectorAll("table"));

        const candidate = tables.find((table) => {
          const text = (table.textContent ?? "")
            .replace(/\u00a0/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
          return (
            text.includes("interest rate (per annum)") &&
            text.includes("senior citizen rates") &&
            text.includes("7 - 14 days")
          );
        });

        if (!candidate) {
          return [];
        }

        return Array.from(candidate.querySelectorAll("tr")).flatMap((row) => {
          const cells = Array.from(row.querySelectorAll("td")).map((cell) =>
            (cell.textContent ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim(),
          );

          if (cells.length < 3 || !cells[0] || !cells[1] || !cells[2]) {
            return [];
          }

          if (cells[0].toLowerCase().includes("tenor")) {
            return [];
          }

          return [{ tenure: cells[0], regular: cells[1], senior: cells[2] }];
        });
      });
    });

    const dedupedRows = rawRows.filter(
      (row, index, array) =>
        array.findIndex((candidate) => candidate.tenure === row.tenure) === index,
    );

    if (dedupedRows.length === 0) {
      throw new Error(`[${this.bankId}] Found zero valid table rows.`);
    }

    if (normalizeWhitespace(dedupedRows[0]!.tenure).toLowerCase() !== EXPECTED_FIRST_TENURE.toLowerCase()) {
      throw new Error(`[${this.bankId}] Table validation failed: expected first tenure "${EXPECTED_FIRST_TENURE}".`);
    }

    console.log(`[${this.bankId}] Found ${dedupedRows.length} potential rows. Processing...`);

    const parsedSlabs: ParsedSlab[] = dedupedRows.map((row) => {
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
