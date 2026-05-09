import test from "node:test";
import assert from "node:assert/strict";
import { IciciScraper } from "./icici.ts";
import { HdfcScraper } from "./hdfc.ts";
import { SbiScraper } from "./sbi.ts";
import { IdScraper } from "./idb.ts";

type BrowserRows = Array<{ tenure: string; regular?: string; senior?: string; revisedRate?: string }>;

function makeFetchJsonMock(payload: unknown) {
  return async <T>(_url: string, _retries?: number): Promise<T> => payload as T;
}

function makeBrowserPageMock(rows: BrowserRows) {
  return async <T>(_url: string, _task: unknown): Promise<T> => rows as T;
}

test("IciciScraper parses standard rows and skips tax saver product", async () => {
  const scraper = new IciciScraper(makeFetchJsonMock({
    interestData: [[
      { tenure: "7 to 45 Days", c1: 3, c2: 3.5, c3: 0, c4: 0 },
      { tenure: "46 to 90 Days", c1: 4, c2: 4.5, c3: 0, c4: 0 },
      { tenure: "5Y (Tax Saver FD)", c1: 7, c2: 7.5, c3: 0, c4: 0 },
    ]],
  }));

  const slabs = await scraper.scrape();

  assert.deepEqual(slabs, [
    { minDays: 7, maxDays: 45, regular: 3, senior: 3.5 },
    { minDays: 46, maxDays: 90, regular: 4, senior: 4.5 },
  ]);
});

test("IciciScraper fails when first tenure guard changes", async () => {
  const scraper = new IciciScraper(makeFetchJsonMock({
    interestData: [[
      { tenure: "WRONG TENURE", c1: 3, c2: 3.5, c3: 0, c4: 0 },
    ]],
  }));

  await assert.rejects(() => scraper.scrape(), /Data structure validation failed/);
});

test("HdfcScraper deduplicates rows and parses rates", async () => {
  const scraper = new HdfcScraper(makeBrowserPageMock([
    { tenure: "7 - 14 days", regular: "3.50%", senior: "4.00%" },
    { tenure: "7 - 14 days", regular: "3.50%", senior: "4.00%" },
    { tenure: "15 - 29 days", regular: "3.70%", senior: "4.20%" },
  ]));

  const slabs = await scraper.scrape();

  assert.deepEqual(slabs, [
    { minDays: 7, maxDays: 14, regular: 3.5, senior: 4 },
    { minDays: 15, maxDays: 29, regular: 3.7, senior: 4.2 },
  ]);
});

test("SbiScraper fails when first tenure guard mismatches", async () => {
  const scraper = new SbiScraper(makeBrowserPageMock([
    { tenure: "8 days to 45 days", regular: "5.00%", senior: "5.50%" },
  ]));

  await assert.rejects(() => scraper.scrape(), /Table validation failed/);
});

test("IdScraper maps special tenures and computes senior premium", async () => {
  const scraper = new IdScraper(makeBrowserPageMock([
    { tenure: "7 days to 14 days", revisedRate: "3.00%" },
    { tenure: "1 year", revisedRate: "6.10%" },
    { tenure: "IND Secure (444 days)", revisedRate: "6.60%" },
    { tenure: "IND Green (555 days)", revisedRate: "6.70%" },
    {
      tenure: "Above 1 year to less than 2 years (except 444 & 555 days)",
      revisedRate: "6.20%",
    },
    { tenure: "Above 5 years", revisedRate: "6.00%" },
  ]));

  const slabs = await scraper.scrape();

  assert.deepEqual(slabs, [
    { minDays: 7, maxDays: 14, regular: 3, senior: 3.5 },
    { minDays: 365, maxDays: 365, regular: 6.1, senior: 6.6 },
    { minDays: 444, maxDays: 444, regular: 6.6, senior: 7.1 },
    { minDays: 555, maxDays: 555, regular: 6.7, senior: 7.2 },
    { minDays: 366, maxDays: 729, regular: 6.2, senior: 6.7 },
    { minDays: 1826, maxDays: 3650, regular: 6, senior: 6.5 },
  ]);
});
