import type { BankScraper, ParsedSlab } from "../lib/types.js";

export class IciciScraper implements BankScraper {
  bankId = "icici";

  async scrape(): Promise<ParsedSlab[]> {
    console.warn(`[${this.bankId}] Scraper not yet implemented`);
    return [];
  }
}
