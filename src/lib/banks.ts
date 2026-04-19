export type RateSlab = {
  /** Inclusive minimum tenure in months */
  minMonths: number;
  /** Inclusive maximum tenure in months */
  maxMonths: number;
  /** Annual interest rate in % for regular customers */
  regular: number;
  /** Annual interest rate in % for senior citizens */
  senior: number;
};

export type Bank = {
  id: string;
  name: string;
  shortName: string;
  /** Tailwind-friendly accent color (oklch token reference) */
  accent: string;
  slabs: RateSlab[];
};

/**
 * Hardcoded MVP data. Structure is intentionally flexible — slabs can be
 * extended per bank without touching calculation logic.
 * Rates are illustrative samples (not live data).
 */
export const BANKS: Bank[] = [
  {
    id: "sbi",
    name: "State Bank of India",
    shortName: "SBI",
    accent: "var(--chart-1)",
    slabs: [
      { minMonths: 1, maxMonths: 6, regular: 4.75, senior: 5.25 },
      { minMonths: 7, maxMonths: 11, regular: 5.75, senior: 6.25 },
      { minMonths: 12, maxMonths: 23, regular: 6.8, senior: 7.3 },
      { minMonths: 24, maxMonths: 35, regular: 7.0, senior: 7.5 },
      { minMonths: 36, maxMonths: 60, regular: 6.75, senior: 7.25 },
      { minMonths: 61, maxMonths: 120, regular: 6.5, senior: 7.5 },
    ],
  },
  {
    id: "hdfc",
    name: "HDFC Bank",
    shortName: "HDFC",
    accent: "var(--chart-2)",
    slabs: [
      { minMonths: 1, maxMonths: 6, regular: 4.5, senior: 5.0 },
      { minMonths: 7, maxMonths: 11, regular: 5.5, senior: 6.0 },
      { minMonths: 12, maxMonths: 23, regular: 6.6, senior: 7.1 },
      { minMonths: 24, maxMonths: 35, regular: 7.0, senior: 7.5 },
      { minMonths: 36, maxMonths: 60, regular: 7.0, senior: 7.5 },
      { minMonths: 61, maxMonths: 120, regular: 6.5, senior: 7.5 },
    ],
  },
  {
    id: "icici",
    name: "ICICI Bank",
    shortName: "ICICI",
    accent: "var(--chart-3)",
    slabs: [
      { minMonths: 1, maxMonths: 6, regular: 4.75, senior: 5.25 },
      { minMonths: 7, maxMonths: 11, regular: 5.75, senior: 6.25 },
      { minMonths: 12, maxMonths: 23, regular: 6.7, senior: 7.2 },
      { minMonths: 24, maxMonths: 35, regular: 7.1, senior: 7.6 },
      { minMonths: 36, maxMonths: 60, regular: 7.0, senior: 7.5 },
      { minMonths: 61, maxMonths: 120, regular: 6.6, senior: 7.5 },
    ],
  },
  {
    id: "axis",
    name: "Axis Bank",
    shortName: "Axis",
    accent: "var(--chart-4)",
    slabs: [
      { minMonths: 1, maxMonths: 6, regular: 4.5, senior: 5.0 },
      { minMonths: 7, maxMonths: 11, regular: 5.75, senior: 6.25 },
      { minMonths: 12, maxMonths: 23, regular: 6.7, senior: 7.2 },
      { minMonths: 24, maxMonths: 35, regular: 7.1, senior: 7.6 },
      { minMonths: 36, maxMonths: 60, regular: 7.0, senior: 7.5 },
      { minMonths: 61, maxMonths: 120, regular: 7.0, senior: 7.75 },
    ],
  },
];

export function getRateForTenure(
  bank: Bank,
  totalMonths: number,
  isSenior: boolean,
): number | null {
  const slab = bank.slabs.find(
    (s) => totalMonths >= s.minMonths && totalMonths <= s.maxMonths,
  );
  if (!slab) return null;
  return isSenior ? slab.senior : slab.regular;
}
