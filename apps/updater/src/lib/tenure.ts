/**
 * Shared tenure parser logic.
 * Parses descriptive strings identifying an FD slab and maps strings to inclusive [minDays, maxDays].
 */

const DAYS_IN_MONTH = 30; // 30 days is common standard for bank slabs calculations not explicitly anchored.
const DAYS_IN_YEAR = 365;

export function parseTenure(text: string): {
  minDays: number;
  maxDays: number;
} {
  // Normalize string for easier processing
  const lowerText = text.toLowerCase().trim().replace(/\s+/g, " ");

  let minDays = 0;
  let maxDays = 0;

  // Single-point with alias: e.g. "2 Years 11 Months (35 months)"
  let match = lowerText.match(/\((\d+)\s*months?\)/);
  if (match) {
    const months = parseInt(match[1]!, 10);
    const dayEquivalent = months * DAYS_IN_MONTH;
    return { minDays: dayEquivalent, maxDays: dayEquivalent };
  }

  // Regex patterns tailored to HDFC / general formats

  // 1a. Day Ranges with dash (e.g. "7 - 14 days", "30-45 days")
  match = lowerText.match(/^(\d+)\s*-\s*(\d+)\s*days?$/);
  if (match) {
    return {
      minDays: parseInt(match[1]!, 10),
      maxDays: parseInt(match[2]!, 10),
    };
  }

  // 1b. Day Ranges with "to" (e.g. "7 to 45 Days", "46 to 90 Days")
  match = lowerText.match(/^(\d+)\s*to\s*(\d+)\s*days?$/);
  if (match) {
    return {
      minDays: parseInt(match[1]!, 10),
      maxDays: parseInt(match[2]!, 10),
    };
  }

  // Helper function to extract total days from a complex part string
  // like "1 year", "6 months 1 day", "15 months"
  function extractDaysFromPart(partStr: string): number {
    let days = 0;
    const pStr = partStr.trim();
    if (!pStr) return 0;

    let dMatch = pStr.match(/(\d+)\s*years?/);
    if (dMatch) days += parseInt(dMatch[1]!, 10) * DAYS_IN_YEAR;

    dMatch = pStr.match(/(\d+)\s*months?/);
    if (dMatch) days += parseInt(dMatch[1]!, 10) * DAYS_IN_MONTH;

    dMatch = pStr.match(/(\d+)\s*days?/);
    // Ignore "days" if it was already matched in a pure days string without year/month.
    // Here we mainly want strings like "1 day", "5 days".
    if (dMatch && pStr.includes("day")) { // Avoid capturing "days <="
      days += parseInt(dMatch[1]!, 10);
    }
    // Also support "90 days <= 6 months" format for left-hand side.
    if(pStr.match(/^\d+\s*days?$/)) {
      dMatch = pStr.match(/^(\d+)\s*days?$/);
      if(dMatch) days = parseInt(dMatch[1]!, 10);
    }

    // Bare number fallback: if no unit keyword matched (e.g. "185" in "185 to < 1 Year"),
    // treat it as a day count.
    if (days === 0) {
      const bareMatch = pStr.match(/^(\d+)$/);
      if (bareMatch) days = parseInt(bareMatch[1]!, 10);
    }

    return days;
  }

  // Try parsing complex ranges
  // Examples:
  // "90 days <= 6 months" -> '90 days', '<=', '6 months'
  // "6 months 1 day <=9 months"
  // "9 months 1 day to < 1 Year"
  // "1 Year to < 15 months"
  // "21 months to 2 years" (Note: "to" means inclusive usually in these contexts, whereas "to <" is exclusive)

  const rangeRegex = /^(.*?)(\s*to\s*<?\s*|\s*<=\s*)(.*?)$/;
  match = lowerText.match(rangeRegex);

  if (match) {
    const leftPart = match[1]!;
    const opPart = match[2]!.replace(/\s/g, ""); // "to<", "<=", "to"
    const rightPart = match[3]!;

    minDays = extractDaysFromPart(leftPart);

    // Some strings might not have a left part if they are just upper bounds
    const rawMaxDays = extractDaysFromPart(rightPart);

    if (opPart === "to<" || opPart === "<") {
       // Exclusive upper bound
       maxDays = rawMaxDays - 1;
    } else {
       // Inclusive upper bound ("<=", "to")
       maxDays = rawMaxDays;
    }

    // Edge case for HDFC: "5 Years 1 day to 10 Years" -> we mapped to inclusive
    return { minDays, maxDays };
  }


  throw new Error(`Failed to map tenure text to days range: "${text}"`);
}
