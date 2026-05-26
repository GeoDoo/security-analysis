import { useMemo } from "react";
import type { ComparisonEntry } from "../types";
import { computeStats } from "../engine/comparison";
import { generateInsights, type Insight } from "../engine/insights";

interface InsightsPanelProps {
  entries: ComparisonEntry[];
}

const TONE_MAP: Record<Insight["type"], { label: string; color: string }> = {
  info: { label: "INSIGHT", color: "var(--accent)" },
  bullish: { label: "OPPORTUNITY", color: "var(--success)" },
  bearish: { label: "CAUTION", color: "var(--danger)" },
  warning: { label: "WARNING", color: "var(--warning)" },
};

export default function InsightsPanel({ entries }: InsightsPanelProps) {
  const stats = useMemo(() => computeStats(entries), [entries]);
  const insights = useMemo(
    () => generateInsights(entries, stats),
    [entries, stats]
  );

  if (insights.length === 0) return null;

  return (
    <section className="insights">
      <h2>Insights</h2>
      <div className="insights-list">
        {insights.map((insight, i) => {
          const tone = TONE_MAP[insight.type];
          return (
            <div key={i} className="insight-card">
              <div className="insight-header">
                <span
                  className="insight-badge"
                  style={{ color: tone.color }}
                >
                  {tone.label}
                </span>
                <span className="insight-title">{insight.title}</span>
              </div>
              <p className="insight-body">{insight.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
