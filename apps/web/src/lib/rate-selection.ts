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

export function selectBestRateSlab(
  slabs: RateSlab[],
  totalDays: number,
): RateSlab | null {
  return slabs.reduce<RateSlab | null>((best, current) => {
    if (totalDays < current.minDays || totalDays > current.maxDays) {
      return best;
    }

    if (!best) {
      return current;
    }

    const bestWidth = best.maxDays - best.minDays;
    const currentWidth = current.maxDays - current.minDays;

    return currentWidth < bestWidth ? current : best;
  }, null);
}
