import type { BankScraper, ParsedSlab } from "../lib/types.js";

export class SbiScraper implements BankScraper {
  bankId = "sbi";

  async scrape(): Promise<ParsedSlab[]> {
    console.warn(`[${this.bankId}] Scraper not yet implemented`);
    return [];
  }
}
