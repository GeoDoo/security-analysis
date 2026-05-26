import { useMemo } from "react";
import type { ComparisonEntry } from "../types";
import { computeStats } from "../engine/comparison";

interface ComparisonTableProps {
  entries: ComparisonEntry[];
  onSelect: (ticker: string) => void;
}

function pct(n: number): string {
  return (n * 100).toFixed(2) + "%";
}

function fmt(n: number, decimals = 1): string {
  if (Math.abs(n) >= 1e12) return "$" + (n / 1e12).toFixed(decimals) + "T";
  if (Math.abs(n) >= 1e9) return "$" + (n / 1e9).toFixed(decimals) + "B";
  if (Math.abs(n) >= 1e6) return "$" + (n / 1e6).toFixed(decimals) + "M";
  return "$" + n.toLocaleString();
}

function growthColor(rate: number): string {
  if (rate > 0.25) return "var(--danger)";
  if (rate > 0.15) return "var(--warning)";
  return "var(--success)";
}

export default function ComparisonTable({
  entries,
  onSelect,
}: ComparisonTableProps) {
  const sorted = useMemo(
    () =>
      [...entries].sort(
        (a, b) => a.result.impliedGrowthRate - b.result.impliedGrowthRate
      ),
    [entries]
  );

  const stats = useMemo(() => computeStats(entries), [entries]);

  return (
    <section className="comparison">
      <h2>Comparison</h2>
      <p className="comparison-subtitle">
        Ranked by implied growth (lowest = most conservatively priced).
        Click a row to see its full breakdown.
      </p>

      <div className="comparison-stats">
        <div className="stat">
          <span className="stat-label">Mean</span>
          <span className="stat-value">{pct(stats.mean)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Median</span>
          <span className="stat-value">{pct(stats.median)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Range</span>
          <span className="stat-value">
            {pct(stats.min)} – {pct(stats.max)}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Stocks</span>
          <span className="stat-value">{stats.count}</span>
        </div>
      </div>

      <div className="table-wrap">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ticker</th>
              <th>Price</th>
              <th>Market Cap</th>
              <th>Revenue</th>
              <th>FCF Margin</th>
              <th>Implied Growth</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, i) => (
              <tr
                key={entry.data.ticker}
                className="comparison-row"
                onClick={() => onSelect(entry.data.ticker)}
              >
                <td className="rank">{i + 1}</td>
                <td className="ticker-cell">{entry.data.ticker}</td>
                <td>${entry.data.price.toFixed(2)}</td>
                <td>{fmt(entry.result.marketCap)}</td>
                <td>{fmt(entry.data.revenue)}</td>
                <td>{pct(entry.data.fcfMargin)}</td>
                <td
                  className="growth-cell"
                  style={{
                    color: growthColor(entry.result.impliedGrowthRate),
                  }}
                >
                  {pct(entry.result.impliedGrowthRate)}
                  {!entry.result.converged && " *"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
