import { describe, it, expect } from "vitest";
import { computeStats, parseTickers } from "./comparison";
import type { ComparisonEntry } from "../types";

function makeEntry(ticker: string, growth: number): ComparisonEntry {
  return {
    data: {
      ticker,
      price: 100,
      sharesOutstanding: 1e9,
      revenue: 1e10,
      freeCashFlow: 1e9,
      netDebt: 0,
      fcfMargin: 0.1,
    },
    result: {
      impliedGrowthRate: growth,
      inputs: {
        price: 100,
        sharesOutstanding: 1e9,
        netDebt: 0,
        freeCashFlow: 1e9,
        revenue: 1e10,
        discountRate: 0.1,
        terminalGrowthRate: 0.03,
        projectionYears: 10,
      },
      marketCap: 1e11,
      enterpriseValue: 1e11,
      converged: true,
    },
  };
}

describe("computeStats", () => {
  it("computes mean, median, min, max for odd count", () => {
    const entries = [
      makeEntry("A", 0.1),
      makeEntry("B", 0.2),
      makeEntry("C", 0.3),
    ];
    const stats = computeStats(entries);
    expect(stats.count).toBe(3);
    expect(stats.mean).toBeCloseTo(0.2, 4);
    expect(stats.median).toBeCloseTo(0.2, 4);
    expect(stats.min).toBe(0.1);
    expect(stats.max).toBe(0.3);
  });

  it("computes median for even count", () => {
    const entries = [
      makeEntry("A", 0.1),
      makeEntry("B", 0.2),
      makeEntry("C", 0.3),
      makeEntry("D", 0.4),
    ];
    const stats = computeStats(entries);
    expect(stats.median).toBeCloseTo(0.25, 4);
  });

  it("handles single entry", () => {
    const stats = computeStats([makeEntry("A", 0.15)]);
    expect(stats.mean).toBe(0.15);
    expect(stats.median).toBe(0.15);
    expect(stats.min).toBe(0.15);
    expect(stats.max).toBe(0.15);
  });
});

describe("parseTickers", () => {
  it("splits comma-separated tickers", () => {
    expect(parseTickers("AAPL, MSFT, GOOG")).toEqual(["AAPL", "MSFT", "GOOG"]);
  });

  it("splits space-separated tickers", () => {
    expect(parseTickers("AAPL MSFT GOOG")).toEqual(["AAPL", "MSFT", "GOOG"]);
  });

  it("handles mixed separators and extra whitespace", () => {
    expect(parseTickers("  aapl,  msft , goog  ")).toEqual([
      "AAPL",
      "MSFT",
      "GOOG",
    ]);
  });

  it("filters out invalid tickers", () => {
    expect(parseTickers("AAPL, 123, MSFT")).toEqual(["AAPL", "MSFT"]);
  });

  it("handles dots in tickers", () => {
    expect(parseTickers("BRK.B, MSFT")).toEqual(["BRK.B", "MSFT"]);
  });

  it("returns empty for empty input", () => {
    expect(parseTickers("")).toEqual([]);
    expect(parseTickers("   ")).toEqual([]);
  });
});
