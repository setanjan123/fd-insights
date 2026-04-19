import { type Bank, getRateForTenure } from "./banks";

export type PayoutType = "cumulative" | "non-cumulative";

export type FdInput = {
  principal: number;
  totalMonths: number;
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
};

/**
 * Cumulative FD: compounded quarterly.
 *   A = P * (1 + r/4)^(4t)
 * Non-cumulative (MVP): simple interest approximation.
 *   A = P + P * r * t
 */
export function calculateFd(bank: Bank, input: FdInput): FdResult {
  const rate = getRateForTenure(bank, input.totalMonths, input.isSenior);
  const years = input.totalMonths / 12;

  if (!rate || input.principal <= 0 || input.totalMonths <= 0) {
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
  // Effective annual return (CAGR)
  const ear = years > 0 ? (Math.pow(maturity / input.principal, 1 / years) - 1) * 100 : 0;

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
