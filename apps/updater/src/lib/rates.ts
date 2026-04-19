/**
 * Shared rate parser.
 * Extracts a numeric interest rate from a string.
 * E.g., "6.50%", "6.50 %", "6.50", " 6.5 " -> 6.5
 *
 * @param text Initial rate string from table
 * @returns Numeric parsed rate
 */
export function parseRate(text: string): number {
  if (!text) {
    return 0;
  }

  // Remove any spaces or % signs and parse as float
  const cleaned = text.replace(/[% ]/g, "");
  const num = parseFloat(cleaned);

  if (isNaN(num)) {
    throw new Error(`Failed to parse rate from string: "${text}"`);
  }

  return num;
}
