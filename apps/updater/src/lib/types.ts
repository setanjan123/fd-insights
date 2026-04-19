/**
 * Raw row extracted from a bank's HTML table.
 * All values are strings as initially extracted.
 */
export type RawRateSlab = {
  tenure: string;    // e.g., "7 - 14 days"
  regular: string;   // e.g., "2.75%"
  senior: string;    // e.g., "3.25%"
};

/**
 * Parsed slab ready for banks.json.
 */
export type ParsedSlab = {
  minDays: number;
  maxDays: number;
  regular: number;
  senior: number;
};

/**
 * Contract every bank scraper must implement.
 */
export interface BankScraper {
  /** Bank ID matching the key in banks.json (e.g. "hdfc") */
  bankId: string;
  /** Scrape, parse, and return ready-to-use slabs */
  scrape(): Promise<ParsedSlab[]>;
}
