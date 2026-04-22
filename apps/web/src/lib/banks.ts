import banksData from "./banks.json";
import { selectBestRateSlab, type RateSlab } from "./rate-selection";

export type Bank = {
  id: string;
  name: string;
  shortName: string;
  /** Tailwind-friendly accent color (oklch token reference) */
  accent: string;
  slabs: RateSlab[];
};

export const BANKS: Bank[] = banksData.banks as Bank[];
export const LAST_UPDATED: string = banksData.lastUpdated;

export function getRateForTenure(
  bank: Bank,
  totalDays: number,
  isSenior: boolean,
): number | null {
  const slab = selectBestRateSlab(bank.slabs, totalDays);
  if (!slab) return null;
  return isSenior ? slab.senior : slab.regular;
}
