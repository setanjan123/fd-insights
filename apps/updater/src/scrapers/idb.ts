import * as cheerio from "cheerio";
import { chromium } from "playwright";
import type { BankScraper, ParsedSlab } from "../lib/types.js";
import { parseTenure } from "../lib/tenure.js";
import { parseRate } from "../lib/rates.js";

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

function extractTopRetailTable($: cheerio.CheerioAPI) {
  const table = $(".mainContent table")
    .toArray()
    .find((node) => {
      const tableText = normalizeWhitespace($(node).text()).toLowerCase();
      return (
        tableText.includes("interest rates on domestic retail term deposits") &&
        tableText.includes("less than rs.3 crore") &&
        tableText.includes("revised rate")
      );
    });

  if (!table) {
    throw new Error("[idb] Could not find the top retail deposit table for less than Rs.3 crore.");
  }

  return table;
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

async function loadIdbHtml(url: string): Promise<string> {
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    locale: "en-US",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    viewport: {
      width: 1440,
      height: 1400,
    },
  });

  const page = await context.newPage();

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForFunction(
      () => {
        const text = document.body?.innerText?.toLowerCase() ?? "";

        return (
          text.includes("interest rates on domestic retail term deposits") ||
          text.includes("support id is:") ||
          text.includes("testing whether you are a human visitor")
        );
      },
      { timeout: 20000 }
    );

    const title = await page.title();
    const bodyText = normalizeWhitespace(await page.locator("body").innerText());

    if (isChallengePage(title, bodyText)) {
      throw new Error("[idb] Playwright reached the site, but the bank still served an anti-bot challenge page.");
    }

    return await page.content();
  } finally {
    await context.close();
    await browser.close();
  }
}

export class IdScraper implements BankScraper {
  bankId = "idb";
  url = "https://indianbank.bank.in/departments/deposit-rates/";

  async scrape(): Promise<ParsedSlab[]> {
    console.log(`[${this.bankId}] Fetching page with Playwright: ${this.url}`);

    const html = await loadIdbHtml(this.url);
    const $ = cheerio.load(html);
    const table = extractTopRetailTable($);
    const parsedSlabs: ParsedSlab[] = [];

    $(table)
      .find("tr")
      .each((_, rowNode) => {
        const columns = $(rowNode).find("td");

        if (columns.length < 3) {
          return;
        }

        const tenureText = normalizeWhitespace($(columns[0]).text());
        const revisedRateText = normalizeWhitespace($(columns[2]).text());

        if (!tenureText || !revisedRateText || tenureText.toLowerCase().includes("period / tenor")) {
          return;
        }

        const slab = parseIdbTenure(tenureText);
        const regular = parseRate(revisedRateText);

        parsedSlabs.push({
          ...slab,
          regular,
          senior: getSeniorRate(regular, slab),
        });
      });

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
