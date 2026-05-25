import { describe, it, expect } from "vitest";
import {
  computeEnterpriseValue,
  evToPrice,
  solveImpliedGrowthRate,
  reverseDCF,
} from "./reverseDcf";
import type { ReverseDCFInput } from "../types";

describe("computeEnterpriseValue", () => {
  it("returns positive EV for positive FCF and growth", () => {
    const ev = computeEnterpriseValue(100, 0.1, 0.1, 0.03, 10);
    expect(ev).toBeGreaterThan(0);
  });

  it("higher growth produces higher EV", () => {
    const evLow = computeEnterpriseValue(100, 0.05, 0.1, 0.03, 10);
    const evHigh = computeEnterpriseValue(100, 0.15, 0.1, 0.03, 10);
    expect(evHigh).toBeGreaterThan(evLow);
  });

  it("higher discount rate produces lower EV", () => {
    const evLow = computeEnterpriseValue(100, 0.1, 0.15, 0.03, 10);
    const evHigh = computeEnterpriseValue(100, 0.1, 0.08, 0.03, 10);
    expect(evHigh).toBeGreaterThan(evLow);
  });

  it("handles zero growth", () => {
    const ev = computeEnterpriseValue(100, 0, 0.1, 0.02, 10);
    expect(ev).toBeGreaterThan(0);
    expect(Number.isFinite(ev)).toBe(true);
  });

  it("handles negative growth", () => {
    const ev = computeEnterpriseValue(100, -0.05, 0.1, 0.02, 10);
    expect(ev).toBeGreaterThan(0);
    expect(Number.isFinite(ev)).toBe(true);
  });
});

describe("evToPrice", () => {
  it("subtracts net debt and divides by shares", () => {
    expect(evToPrice(1_000_000, 200_000, 100_000)).toBeCloseTo(8, 2);
  });

  it("adds cash when net debt is negative", () => {
    expect(evToPrice(1_000_000, -200_000, 100_000)).toBeCloseTo(12, 2);
  });
});

describe("solveImpliedGrowthRate", () => {
  const baseInput: ReverseDCFInput = {
    price: 195,
    sharesOutstanding: 15_400_000_000,
    netDebt: 49_000_000_000,
    freeCashFlow: 110_000_000_000,
    revenue: 383_000_000_000,
    discountRate: 0.1,
    terminalGrowthRate: 0.03,
    projectionYears: 10,
  };

  it("converges to a growth rate", () => {
    const result = solveImpliedGrowthRate(baseInput);
    expect(result.converged).toBe(true);
    expect(result.growthRate).toBeGreaterThan(-0.5);
    expect(result.growthRate).toBeLessThan(1.5);
  });

  it("implied growth is consistent: plugging it back produces the target price", () => {
    const result = solveImpliedGrowthRate(baseInput);
    const ev = computeEnterpriseValue(
      baseInput.freeCashFlow,
      result.growthRate,
      baseInput.discountRate,
      baseInput.terminalGrowthRate,
      baseInput.projectionYears
    );
    const impliedPrice = evToPrice(
      ev,
      baseInput.netDebt,
      baseInput.sharesOutstanding
    );
    expect(impliedPrice).toBeCloseTo(baseInput.price, 0);
  });

  it("higher price implies higher growth", () => {
    const low = solveImpliedGrowthRate({ ...baseInput, price: 150 });
    const high = solveImpliedGrowthRate({ ...baseInput, price: 250 });
    expect(high.growthRate).toBeGreaterThan(low.growthRate);
  });
});

describe("reverseDCF", () => {
  const input: ReverseDCFInput = {
    price: 195,
    sharesOutstanding: 15_400_000_000,
    netDebt: 49_000_000_000,
    freeCashFlow: 110_000_000_000,
    revenue: 383_000_000_000,
    discountRate: 0.1,
    terminalGrowthRate: 0.03,
    projectionYears: 10,
  };

  it("returns a complete result object", () => {
    const result = reverseDCF(input);
    expect(result.converged).toBe(true);
    expect(result.marketCap).toBe(input.price * input.sharesOutstanding);
    expect(result.enterpriseValue).toBe(result.marketCap + input.netDebt);
    expect(result.inputs).toEqual(input);
    expect(typeof result.impliedGrowthRate).toBe("number");
  });

  it("implied growth is a reasonable percentage", () => {
    const result = reverseDCF(input);
    expect(result.impliedGrowthRate).toBeGreaterThan(-0.3);
    expect(result.impliedGrowthRate).toBeLessThan(0.5);
  });
});
