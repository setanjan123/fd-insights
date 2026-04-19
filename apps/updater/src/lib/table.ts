import type { CheerioAPI } from "cheerio";
import type { RawRateSlab } from "./types.js";

/**
 * Extracts data rows from a standard HTML table layout.
 *
 * It will extract three cell columns representing tenure, regular rate, and senior rate.
 * Ignores table headers automatically based on element structure or index.
 *
 * @param $ - Cheerio context
 * @param tableSelector - CSS selector targeting a specific <table> element
 * @returns Array of extracted RawRateSlab objects
 */
export function extractTableRows(
  $: CheerioAPI,
  rowSelector: string,
): RawRateSlab[] {
  const extractedRows: RawRateSlab[] = [];

  const tableRows = $(rowSelector);

  tableRows.each((_, rowNode) => {
    // Only capture table data cells (td) within rows; skip column headers (th)
    const columns = $(rowNode).find("td");

    // The HDFC table (and most standard FD tables) specifies the tenure, regular rate, and senior rate
    // consecutively across 3 distinct cells if it is a valid data row.
    if (columns.length >= 3) {
      const tenureText = $(columns[0]).text().trim();
      const regularText = $(columns[1]).text().trim();
      const seniorText = $(columns[2]).text().trim();

      // Guard check against extracting rows with no rate details (like sub-headers or empty structural rows)
      if (
        tenureText &&
        regularText &&
        seniorText &&
        !tenureText.toLowerCase().includes("tenor")
      ) {
        extractedRows.push({
          tenure: tenureText,
          regular: regularText,
          senior: seniorText,
        });
      }
    }
  });

  return extractedRows;
}
