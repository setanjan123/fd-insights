import test from "node:test";
import assert from "node:assert/strict";
import banksData from "./banks.json" with { type: "json" };
import { selectBestRateSlab } from "./rate-selection.ts";

type BankFixture = (typeof banksData.banks)[number];

function getBank(bankId: string): BankFixture {
  const bank = banksData.banks.find((candidate) => candidate.id === bankId);
  assert.ok(bank, `Expected bank fixture "${bankId}" to exist`);
  return bank;
}

test("returns the only matching slab when there is no overlap", () => {
  const sbi = getBank("sbi");
  const slab = selectBestRateSlab(sbi.slabs, 365);

  assert.deepEqual(slab, {
    minDays: 365,
    maxDays: 729,
    regular: 6.25,
    senior: 6.75,
  });
});

test("prefers the narrowest overlapping slab for Indian Bank 444 days", () => {
  const idb = getBank("idb");
  const slab = selectBestRateSlab(idb.slabs, 444);

  assert.deepEqual(slab, {
    minDays: 444,
    maxDays: 444,
    regular: 6.6,
    senior: 7.1,
  });
});

test("falls back to the broader Indian Bank slab when the exact slab does not match", () => {
  const idb = getBank("idb");
  const slab = selectBestRateSlab(idb.slabs, 500);

  assert.deepEqual(slab, {
    minDays: 366,
    maxDays: 729,
    regular: 6.2,
    senior: 6.7,
  });
});

test("prefers the exact-day HDFC slab over the broader overlapping slab", () => {
  const hdfc = getBank("hdfc");
  const slab = selectBestRateSlab(hdfc.slabs, 1050);

  assert.deepEqual(slab, {
    minDays: 1050,
    maxDays: 1050,
    regular: 6.45,
    senior: 6.95,
  });
});

test("returns null when no slab matches the selected tenure", () => {
  const icici = getBank("icici");
  const slab = selectBestRateSlab(icici.slabs, 1);

  assert.equal(slab, null);
});
