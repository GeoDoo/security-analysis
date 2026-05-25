import type { FinancialData, ReverseDCFResult } from "../types";

interface ResultsPanelProps {
  data: FinancialData;
  result: ReverseDCFResult;
}

function fmt(n: number, decimals = 1): string {
  if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(decimals) + "T";
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(decimals) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(decimals) + "M";
  return n.toLocaleString();
}

function pct(n: number): string {
  return (n * 100).toFixed(2) + "%";
}

function growthTone(rate: number): string {
  if (rate > 0.2) return "var(--danger)";
  if (rate > 0.1) return "var(--warning)";
  return "var(--success)";
}

export default function ResultsPanel({ data, result }: ResultsPanelProps) {
  const { impliedGrowthRate, converged, inputs } = result;

  return (
    <section className="results-panel">
      <div className="results-header">
        <h2>{data.ticker}</h2>
        <span className="price">${data.price.toFixed(2)}</span>
      </div>

      <div className="implied-growth">
        <span className="label">Implied Revenue Growth</span>
        <span className="value" style={{ color: growthTone(impliedGrowthRate) }}>
          {pct(impliedGrowthRate)}
        </span>
        {!converged && (
          <span className="warning-badge">did not converge</span>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat">
          <span className="stat-label">Market Cap</span>
          <span className="stat-value">${fmt(result.marketCap)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Enterprise Value</span>
          <span className="stat-value">${fmt(result.enterpriseValue)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Revenue (TTM)</span>
          <span className="stat-value">${fmt(data.revenue)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Free Cash Flow</span>
          <span className="stat-value">${fmt(data.freeCashFlow)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">FCF Margin</span>
          <span className="stat-value">{pct(data.fcfMargin)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Net Debt</span>
          <span className="stat-value">${fmt(data.netDebt)}</span>
        </div>
      </div>

      <details className="assumptions">
        <summary>Assumptions</summary>
        <ul>
          <li>Discount rate: {pct(inputs.discountRate)}</li>
          <li>Terminal growth rate: {pct(inputs.terminalGrowthRate)}</li>
          <li>Projection period: {inputs.projectionYears} years</li>
          <li>Shares outstanding: {fmt(inputs.sharesOutstanding, 0)}</li>
        </ul>
      </details>
    </section>
  );
}
