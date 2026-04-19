import type { BankScraper, ParsedSlab } from "../lib/types.js";
import { fetchHtml } from "../lib/fetch.js";
import { parseTenure } from "../lib/tenure.js";
import { parseRate } from "../lib/rates.js";

export class SbiScraper implements BankScraper {
  bankId = "sbi";
  url = "https://sbi.bank.in/web/interest-rates/deposit-rates/retail-domestic-term-deposits";

  async scrape(): Promise<ParsedSlab[]> {
    console.log(`[${this.bankId}] Fetching page: ${this.url}`);
    const $ = await fetchHtml(this.url);

    // Target the table specifically matching 'menu_0' representing the 'Below Rs. 3 crore' table
    const tableRows = $("#menu_0 table tr");

    if (tableRows.length === 0) {
      throw new Error(`[${this.bankId}] Found zero valid table rows.`);
    }

    console.log(`[${this.bankId}] Found ${tableRows.length} potential rows in table. Processing...`);

    const parsedSlabs: ParsedSlab[] = [];

    tableRows.each((_, rowNode) => {
      const columns = $(rowNode).find("td");

      // The SBI target table has 5 distinct cells for data rows:
      // [0] Tenors, [1] Existing Public, [2] Revised Public, [3] Existing Senior, [4] Revised Senior
      if (columns.length >= 5) {
        const tenureText = $(columns[0]).text().trim();
        const revisedRegularText = $(columns[2]).text().trim();
        const revisedSeniorText = $(columns[4]).text().trim();

        // Extra guard clause if it happens to be a structural/sub-header row that contains 5 columns
        if (
          tenureText &&
          revisedRegularText &&
          revisedSeniorText &&
          !tenureText.toLowerCase().includes("tenor")
        ) {
          try {
            parsedSlabs.push({
              ...parseTenure(tenureText),
              regular: parseRate(revisedRegularText),
              senior: parseRate(revisedSeniorText),
            });
          } catch (err: any) {
            throw new Error(`[${this.bankId}] Row parsing error for "${tenureText}": ${err.message}`);
          }
        }
      }
    });

    if (parsedSlabs.length === 0) {
       throw new Error(`[${this.bankId}] Did not extract any valid rate slabs from table.`);
    }

    return parsedSlabs;
  }
}
