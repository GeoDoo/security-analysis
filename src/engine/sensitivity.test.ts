import { describe, it, expect } from "vitest";
import {
  buildSensitivityMatrix,
  DEFAULT_DISCOUNT_RATES,
  DEFAULT_TERMINAL_GROWTH_RATES,
} from "./sensitivity";
import type { ReverseDCFInput } from "../types";

const BASE: ReverseDCFInput = {
  price: 195,
  sharesOutstanding: 15_400_000_000,
  netDebt: 49_000_000_000,
  freeCashFlow: 110_000_000_000,
  revenue: 383_000_000_000,
  discountRate: 0.1,
  terminalGrowthRate: 0.03,
  projectionYears: 10,
};

describe("buildSensitivityMatrix", () => {
  it("returns a matrix of correct dimensions", () => {
    const matrix = buildSensitivityMatrix(
      BASE,
      DEFAULT_DISCOUNT_RATES,
      DEFAULT_TERMINAL_GROWTH_RATES
    );
    expect(matrix).toHaveLength(DEFAULT_DISCOUNT_RATES.length);
    for (const row of matrix) {
      expect(row).toHaveLength(DEFAULT_TERMINAL_GROWTH_RATES.length);
    }
  });

  it("each cell has the correct discount and terminal growth rates", () => {
    const matrix = buildSensitivityMatrix(
      BASE,
      DEFAULT_DISCOUNT_RATES,
      DEFAULT_TERMINAL_GROWTH_RATES
    );
    for (let r = 0; r < DEFAULT_DISCOUNT_RATES.length; r++) {
      for (let c = 0; c < DEFAULT_TERMINAL_GROWTH_RATES.length; c++) {
        const cell = matrix[r]![c]!;
        expect(cell.discountRate).toBe(DEFAULT_DISCOUNT_RATES[r]);
        expect(cell.terminalGrowthRate).toBe(DEFAULT_TERMINAL_GROWTH_RATES[c]);
      }
    }
  });

  it("implied growth is higher when discount rate is higher (same terminal growth)", () => {
    const matrix = buildSensitivityMatrix(
      BASE,
      DEFAULT_DISCOUNT_RATES,
      DEFAULT_TERMINAL_GROWTH_RATES
    );
    const col = 2;
    const lowDr = matrix[0]![col]!.impliedGrowthRate;
    const highDr = matrix[4]![col]!.impliedGrowthRate;
    expect(lowDr).not.toBeNull();
    expect(highDr).not.toBeNull();
    expect(highDr!).toBeGreaterThan(lowDr!);
  });

  it("returns null for cells where terminal growth >= discount rate", () => {
    const matrix = buildSensitivityMatrix(BASE, [0.03], [0.03, 0.05]);
    expect(matrix[0]![0]!.impliedGrowthRate).toBeNull();
    expect(matrix[0]![1]!.impliedGrowthRate).toBeNull();
  });
});
