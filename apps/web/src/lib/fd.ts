import { type Bank, getRateForTenure } from "./banks";

export type PayoutType = "cumulative" | "non-cumulative";

export type FdInput = {
  principal: number;
  /** Total tenure in days (canonical unit) */
  totalDays: number;
  payoutType: PayoutType;
  isSenior: boolean;
};

export type FdResult = {
  bankId: string;
  bankName: string;
  shortName: string;
  accent: string;
  rate: number | null;
  maturityAmount: number;
  totalInterest: number;
  effectiveAnnualReturn: number;
  payoutType: PayoutType;
  /** For non-cumulative: the interest paid out each quarter */
  quarterlyPayout: number;
  /** Number of full quarterly payouts over the tenure */
  numPayouts: number;
};

const DAYS_PER_YEAR = 365;
const DAYS_PER_MONTH = 30;
const DAYS_PER_QUARTER = 91; // ~365/4

/**
 * Cumulative FD: compounded quarterly.
 *   A = P * (1 + r/4)^(4t)   where t = years
 * Non-cumulative: interest paid every quarter (simple interest per quarter).
 *   Quarterly payout = P * r / 4
 *   Total interest ≈ P * r * t
 */
export function calculateFd(bank: Bank, input: FdInput): FdResult {
  const rate = getRateForTenure(bank, input.totalDays, input.isSenior);
  const years = input.totalDays / DAYS_PER_YEAR;

  if (!rate || input.principal <= 0 || input.totalDays <= 0) {
    return {
      bankId: bank.id,
      bankName: bank.name,
      shortName: bank.shortName,
      accent: bank.accent,
      rate,
      maturityAmount: input.principal,
      totalInterest: 0,
      effectiveAnnualReturn: 0,
      payoutType: input.payoutType,
      quarterlyPayout: 0,
      numPayouts: 0,
    };
  }

  const r = rate / 100;
  let maturity: number;
  if (input.payoutType === "cumulative") {
    maturity = input.principal * Math.pow(1 + r / 4, 4 * years);
  } else {
    maturity = input.principal + input.principal * r * years;
  }

  const interest = maturity - input.principal;
  const ear = years > 0 ? (Math.pow(maturity / input.principal, 1 / years) - 1) * 100 : 0;

  const quarterlyPayout = (input.principal * r) / 4;
  const numPayouts = Math.floor(input.totalDays / DAYS_PER_QUARTER);

  return {
    bankId: bank.id,
    bankName: bank.name,
    shortName: bank.shortName,
    accent: bank.accent,
    rate,
    maturityAmount: maturity,
    totalInterest: interest,
    effectiveAnnualReturn: ear,
    payoutType: input.payoutType,
    quarterlyPayout,
    numPayouts,
  };
}

export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatINRCompact(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatTenure(days: number): string {
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""}`;
  const years = Math.floor(days / DAYS_PER_YEAR);
  const remAfterYears = days - years * DAYS_PER_YEAR;
  const months = Math.floor(remAfterYears / DAYS_PER_MONTH);
  const remDays = remAfterYears - months * DAYS_PER_MONTH;
  const parts: string[] = [];
  if (years) parts.push(`${years}y`);
  if (months) parts.push(`${months}m`);
  if (remDays) parts.push(`${remDays}d`);
  return parts.join(" ") || `${days}d`;
}
