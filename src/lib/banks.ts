export type RateSlab = {
  /** Inclusive minimum tenure in days */
  minDays: number;
  /** Inclusive maximum tenure in days */
  maxDays: number;
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

import banksData from "./banks.json";

export const BANKS: Bank[] = banksData.banks as Bank[];
export const LAST_UPDATED: string = banksData.lastUpdated;

export function getRateForTenure(
  bank: Bank,
  totalDays: number,
  isSenior: boolean,
): number | null {
  const slab = bank.slabs.find(
    (s) => totalDays >= s.minDays && totalDays <= s.maxDays,
  );
  if (!slab) return null;
  return isSenior ? slab.senior : slab.regular;
}
