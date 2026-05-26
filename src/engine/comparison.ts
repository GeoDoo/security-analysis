import type { ComparisonEntry, ComparisonStats } from "../types";

export function computeStats(entries: ComparisonEntry[]): ComparisonStats {
  const rates = entries.map((e) => e.result.impliedGrowthRate).sort((a, b) => a - b);
  const count = rates.length;
  const sum = rates.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  const mid = Math.floor(count / 2);
  const median =
    count % 2 === 0 ? (rates[mid - 1]! + rates[mid]!) / 2 : rates[mid]!;

  return {
    mean,
    median,
    min: rates[0]!,
    max: rates[count - 1]!,
    count,
  };
}

export function parseTickers(input: string): string[] {
  return input
    .toUpperCase()
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && /^[A-Z.]+$/.test(t));
}
