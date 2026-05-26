import { describe, it, expect } from "vitest";
import { generateInsights } from "./insights";
import type { ComparisonEntry, ComparisonStats } from "../types";

function makeEntry(
  t: string,
  growth: number,
  fcfMargin = 0.2,
  revenue = 1e11
): ComparisonEntry {
  return {
    data: {
      ticker: t,
      price: 100,
      sharesOutstanding: 1e9,
      revenue,
      freeCashFlow: revenue * fcfMargin,
      netDebt: 0,
      fcfMargin,
    },
    result: {
      impliedGrowthRate: growth,
      inputs: {
        price: 100,
        sharesOutstanding: 1e9,
        netDebt: 0,
        freeCashFlow: revenue * fcfMargin,
        revenue,
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

function makeStats(entries: ComparisonEntry[]): ComparisonStats {
  const rates = entries
    .map((e) => e.result.impliedGrowthRate)
    .sort((a, b) => a - b);
  const count = rates.length;
  const mid = Math.floor(count / 2);
  return {
    mean: rates.reduce((a, b) => a + b, 0) / count,
    median: count % 2 === 0 ? (rates[mid - 1]! + rates[mid]!) / 2 : rates[mid]!,
    min: rates[0]!,
    max: rates[count - 1]!,
    count,
  };
}

describe("generateInsights", () => {
  it("returns empty for no entries", () => {
    expect(generateInsights([], { mean: 0, median: 0, min: 0, max: 0, count: 0 })).toEqual([]);
  });

  it("generates single-stock insight", () => {
    const entries = [makeEntry("AAPL", 0.18)];
    const insights = generateInsights(entries, makeStats(entries));
    expect(insights.length).toBeGreaterThanOrEqual(1);
    expect(insights.some((i) => i.title.includes("AAPL"))).toBe(true);
  });

  it("identifies most conservatively priced stock", () => {
    const entries = [
      makeEntry("AAPL", 0.15),
      makeEntry("MSFT", 0.25),
      makeEntry("GOOG", 0.30),
    ];
    const insights = generateInsights(entries, makeStats(entries));
    expect(insights.some((i) => i.type === "bullish" && i.title.includes("AAPL"))).toBe(true);
  });

  it("identifies most aggressively priced stock", () => {
    const entries = [
      makeEntry("AAPL", 0.15),
      makeEntry("MSFT", 0.20),
      makeEntry("AMZN", 0.45),
    ];
    const insights = generateInsights(entries, makeStats(entries));
    expect(insights.some((i) => i.type === "bearish" && i.title.includes("AMZN"))).toBe(true);
  });

  it("flags low FCF margin as driver", () => {
    const entries = [
      makeEntry("AAPL", 0.18, 0.22),
      makeEntry("AMZN", 0.45, 0.013, 7e11),
    ];
    const insights = generateInsights(entries, makeStats(entries));
    expect(
      insights.some((i) => i.type === "warning" && i.title.includes("margin-driven"))
    ).toBe(true);
  });

  it("detects tight clustering", () => {
    const entries = [
      makeEntry("A", 0.20),
      makeEntry("B", 0.21),
      makeEntry("C", 0.22),
    ];
    const insights = generateInsights(entries, makeStats(entries));
    expect(insights.some((i) => i.title.includes("Tight clustering"))).toBe(true);
  });
});
