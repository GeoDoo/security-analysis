import type { ComparisonEntry, ComparisonStats } from "../types";

export interface Insight {
  type: "info" | "bullish" | "bearish" | "warning";
  title: string;
  body: string;
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1e12) return "$" + (n / 1e12).toFixed(1) + "T";
  if (Math.abs(n) >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
  return "$" + (n / 1e6).toFixed(0) + "M";
}

function ticker(e: ComparisonEntry): string {
  return e.data.ticker;
}

function growth(e: ComparisonEntry): number {
  return e.result.impliedGrowthRate;
}

export function generateInsights(
  entries: ComparisonEntry[],
  stats: ComparisonStats
): Insight[] {
  if (entries.length === 0) return [];

  const sorted = [...entries].sort((a, b) => growth(a) - growth(b));
  const lowest = sorted[0]!;
  const highest = sorted[sorted.length - 1]!;
  const insights: Insight[] = [];

  // 1. Group-level summary
  if (entries.length >= 2) {
    insights.push({
      type: "info",
      title: "Group overview",
      body:
        `Across ${stats.count} stocks, the market is pricing in a median FCF growth of ${pct(stats.median)} per year for the next decade. ` +
        `The range spans from ${pct(stats.min)} (${ticker(lowest)}) to ${pct(stats.max)} (${ticker(highest)}).`,
    });
  }

  // 2. Most conservatively priced
  if (entries.length >= 2) {
    const gap = stats.median - growth(lowest);
    if (gap > 0.02) {
      insights.push({
        type: "bullish",
        title: `${ticker(lowest)} is priced most conservatively`,
        body:
          `At ${pct(growth(lowest))} implied growth, ${ticker(lowest)} sits ${pct(gap)} below the group median. ` +
          `If you believe it can match or exceed the group's typical growth, the market may be underpricing it.`,
      });
    }
  }

  // 3. Most aggressively priced
  if (entries.length >= 2) {
    const gap = growth(highest) - stats.median;
    if (gap > 0.05) {
      insights.push({
        type: "bearish",
        title: `${ticker(highest)} is priced most aggressively`,
        body:
          `At ${pct(growth(highest))} implied growth, ${ticker(highest)} needs to grow ${pct(gap)} faster than the group median to justify its price. ` +
          `That's a high bar — any slowdown hits this stock hardest.`,
      });
    }
  }

  // 4. Low FCF margin drivers
  for (const entry of entries) {
    if (entry.data.fcfMargin < 0.05 && growth(entry) > stats.median + 0.05) {
      insights.push({
        type: "warning",
        title: `${ticker(entry)}'s high implied growth is margin-driven`,
        body:
          `${ticker(entry)} has a FCF margin of just ${pct(entry.data.fcfMargin)} on ${fmt(entry.data.revenue)} revenue. ` +
          `The ${pct(growth(entry))} implied growth isn't just about revenue — it's a bet on significant margin expansion.`,
      });
    }
  }

  // 5. Outlier detection (>1.5x the median)
  for (const entry of entries) {
    if (
      growth(entry) > stats.median * 1.5 &&
      !insights.some(
        (i) =>
          i.title.includes(ticker(entry)) && i.title.includes("margin-driven")
      )
    ) {
      insights.push({
        type: "warning",
        title: `${ticker(entry)} is a statistical outlier`,
        body:
          `At ${pct(growth(entry))}, ${ticker(entry)}'s implied growth is more than 1.5× the group median (${pct(stats.median)}). ` +
          `This level of optimism carries elevated risk if growth disappoints.`,
      });
    }
  }

  // 6. Tight clustering (all within 5pp of each other)
  if (entries.length >= 3 && stats.max - stats.min < 0.05) {
    insights.push({
      type: "info",
      title: "Tight clustering — market sees similar growth",
      body:
        `All ${stats.count} stocks are within ${pct(stats.max - stats.min)} of each other. ` +
        `The market is pricing them as a cohort — differentiation will come from who beats or misses these expectations.`,
    });
  }

  // 7. Single-stock insight
  if (entries.length === 1) {
    const e = entries[0]!;
    const g = growth(e);
    const yearsToDouble = g > 0 ? Math.log(2) / Math.log(1 + g) : Infinity;

    let verdict: string;
    if (g > 0.3)
      verdict = "The market is extremely optimistic — this valuation requires exceptional execution.";
    else if (g > 0.2)
      verdict = "Aggressive pricing — the stock needs strong sustained growth to justify its price.";
    else if (g > 0.1)
      verdict = "Moderate expectations — achievable for a strong grower, but leaves limited margin for error.";
    else if (g > 0)
      verdict = "Conservative pricing — the market isn't expecting much. Potential upside if the company outperforms.";
    else
      verdict = "The market is pricing in decline. Either a deep value opportunity or a justified pessimism.";

    insights.push({
      type: g > 0.25 ? "warning" : g < 0.1 ? "bullish" : "info",
      title: `${ticker(e)} at ${pct(g)} implied growth`,
      body:
        `At this rate, ${ticker(e)}'s FCF would need to double every ${yearsToDouble.toFixed(1)} years. ` +
        verdict,
    });
  }

  return insights;
}
