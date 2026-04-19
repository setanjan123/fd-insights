import type { BankScraper } from "../lib/types.js";
import { HdfcScraper } from "./hdfc.js";
import { SbiScraper } from "./sbi.js";
import { IciciScraper } from "./icici.js";

export const scrapers: BankScraper[] = [
  new HdfcScraper(),
  new SbiScraper(),
  new IciciScraper(),
];
