import { describe, it, expect } from "vitest";
import { validateFinancialData } from "./validation";
import type { FinancialData } from "../types";

const VALID: FinancialData = {
  ticker: "AAPL",
  price: 195,
  sharesOutstanding: 15_400_000_000,
  revenue: 383_000_000_000,
  freeCashFlow: 110_000_000_000,
  netDebt: 49_000_000_000,
  fcfMargin: 0.287,
};

describe("validateFinancialData", () => {
  it("passes for valid data", () => {
    const result = validateFinancialData(VALID);
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("rejects negative FCF", () => {
    const result = validateFinancialData({ ...VALID, freeCashFlow: -100_000_000 });
    expect(result.valid).toBe(false);
    expect(result.warnings[0]).toContain("negative or zero free cash flow");
  });

  it("rejects zero FCF", () => {
    const result = validateFinancialData({ ...VALID, freeCashFlow: 0 });
    expect(result.valid).toBe(false);
  });

  it("rejects zero revenue", () => {
    const result = validateFinancialData({ ...VALID, revenue: 0 });
    expect(result.valid).toBe(false);
    expect(result.warnings[0]).toContain("no reported revenue");
  });

  it("rejects zero shares", () => {
    const result = validateFinancialData({ ...VALID, sharesOutstanding: 0 });
    expect(result.valid).toBe(false);
  });

  it("rejects zero price", () => {
    const result = validateFinancialData({ ...VALID, price: 0 });
    expect(result.valid).toBe(false);
  });

  it("collects multiple warnings", () => {
    const result = validateFinancialData({
      ...VALID,
      freeCashFlow: -1,
      revenue: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.warnings).toHaveLength(2);
  });
});
