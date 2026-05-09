import type { BankScraper, ParsedSlab } from "../lib/types.js";
import { withBrowserPage } from "../lib/browser.js";
import { parseTenure } from "../lib/tenure.js";
import { parseRate } from "../lib/rates.js";

type WithBrowserPageFn = typeof withBrowserPage;

const EXPECTED_FIRST_TENURE = "7 days to 14 days";

function normalizeWhitespace(text: string): string {
  return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function parseIdbTenure(text: string): { minDays: number; maxDays: number } {
  const normalized = normalizeWhitespace(text);
  const lower = normalized.toLowerCase();

  if (lower === "1 year") {
    return { minDays: 365, maxDays: 365 };
  }

  if (lower === "ind secure (444 days)") {
    return { minDays: 444, maxDays: 444 };
  }

  if (lower === "ind green (555 days)") {
    return { minDays: 555, maxDays: 555 };
  }

  if (lower === "above 1 year to less than 2 years (except 444 & 555 days)") {
    return { minDays: 366, maxDays: 729 };
  }

  if (lower === "5 year") {
    return { minDays: 1825, maxDays: 1825 };
  }

  if (lower === "above 5 years") {
    return { minDays: 1826, maxDays: 3650 };
  }

  const cleaned = normalized
    .replace(/\s*\(except[^)]*\)/gi, "")
    .replace(/^above\s+/i, "")
    .trim();

  return parseTenure(cleaned);
}

function getSeniorRate(regularRate: number, slab: { minDays: number; maxDays: number }): number {
  void slab;
  return Number((regularRate + 0.5).toFixed(2));
}

function isChallengePage(title: string, bodyText: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerBody = bodyText.toLowerCase();

  return (
    lowerTitle.includes("request rejected") ||
    lowerBody.includes("support id is:") ||
    lowerBody.includes("testing whether you are a human visitor") ||
    lowerBody.includes("/tspd/")
  );
}

export class IdScraper implements BankScraper {
  constructor(private readonly withBrowserPageFn: WithBrowserPageFn = withBrowserPage) {}

  bankId = "idb";
  url = "https://indianbank.bank.in/departments/deposit-rates/";

  async scrape(): Promise<ParsedSlab[]> {
    console.log(`[${this.bankId}] Fetching page with Playwright: ${this.url}`);

    const rawRows = await this.withBrowserPageFn(this.url, async (page) => {
      await page.waitForFunction(
        () => {
          const text = document.body?.innerText?.toLowerCase() ?? "";
          return (
            text.includes("interest rates on domestic retail term deposits") ||
            text.includes("support id is:") ||
            text.includes("testing whether you are a human visitor")
          );
        },
        { timeout: 20_000 },
      );

      const title = await page.title();
      const bodyText = normalizeWhitespace(await page.locator("body").innerText());

      if (isChallengePage(title, bodyText)) {
        throw new Error("[idb] Playwright reached the site, but the bank still served an anti-bot challenge page.");
      }

      const rows = await page.evaluate(() => {
        const tables = Array.from(document.querySelectorAll(".mainContent table"));

        const candidate = tables.find((table) => {
          const text = (table.textContent ?? "")
            .replace(/\u00a0/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
          return (
            text.includes("interest rates on domestic retail term deposits") &&
            text.includes("less than rs.3 crore") &&
            text.includes("revised rate")
          );
        });

        if (!candidate) {
          return [];
        }

        return Array.from(candidate.querySelectorAll("tr")).flatMap((row) => {
          const cells = Array.from(row.querySelectorAll("td")).map((cell) =>
            (cell.textContent ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim(),
          );

          if (cells.length < 3 || !cells[0] || !cells[2]) {
            return [];
          }

          if (cells[0].toLowerCase().includes("period / tenor")) {
            return [];
          }

          return [{ tenure: cells[0], revisedRate: cells[2] }];
        });
      });

      if (rows.length === 0) {
        throw new Error("[idb] Could not find the top retail deposit table for less than Rs.3 crore.");
      }

      return rows;
    });

    const parsedSlabs: ParsedSlab[] = [];

    for (const row of rawRows) {
      const slab = parseIdbTenure(row.tenure);
      const regular = parseRate(row.revisedRate);

      parsedSlabs.push({
        ...slab,
        regular,
        senior: getSeniorRate(regular, slab),
      });
    }

    if (parsedSlabs.length === 0) {
      throw new Error("[idb] Did not extract any valid rate slabs from the top retail table.");
    }

    if (parsedSlabs[0]?.minDays !== 7 || parsedSlabs[0]?.maxDays !== 14) {
      throw new Error(`[idb] Table validation failed: expected first tenure "${EXPECTED_FIRST_TENURE}".`);
    }

    console.log(`[${this.bankId}] Found ${parsedSlabs.length} slabs in the top < Rs.3 crore table.`);

    return parsedSlabs;
  }
}
