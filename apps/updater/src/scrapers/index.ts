import type { BankScraper } from "../lib/types.js";
import { HdfcScraper } from "./hdfc.js";
import { SbiScraper } from "./sbi.js";
import { IciciScraper } from "./icici.js";
import { IdScraper } from "./idb.js";

export const scrapers: BankScraper[] = [
  new HdfcScraper(),
  new SbiScraper(),
  new IciciScraper(),
  new IdScraper(),
];
