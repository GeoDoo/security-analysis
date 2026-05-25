import { useCallback, useState } from "react";
import TickerInput from "./components/TickerInput";
import ResultsPanel from "./components/ResultsPanel";
import SensitivityTable from "./components/SensitivityTable";
import { fetchFinancialData } from "./services/financialData";
import { reverseDCF } from "./engine/reverseDcf";
import type { FinancialData, ReverseDCFResult } from "./types";

const DEFAULT_DISCOUNT_RATE = 0.1;
const DEFAULT_TERMINAL_GROWTH = 0.03;
const DEFAULT_PROJECTION_YEARS = 10;

export default function App() {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("fmp_api_key") ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FinancialData | null>(null);
  const [result, setResult] = useState<ReverseDCFResult | null>(null);

  const handleApiKey = useCallback((key: string) => {
    setApiKey(key);
    localStorage.setItem("fmp_api_key", key);
  }, []);

  const handleSubmit = useCallback(
    async (ticker: string) => {
      if (!apiKey.trim()) {
        setError("Enter your Financial Modeling Prep API key above.");
        return;
      }

      setLoading(true);
      setError(null);
      setData(null);
      setResult(null);

      try {
        const financials = await fetchFinancialData(ticker, apiKey.trim());
        setData(financials);

        const dcfResult = reverseDCF({
          price: financials.price,
          sharesOutstanding: financials.sharesOutstanding,
          netDebt: financials.netDebt,
          freeCashFlow: financials.freeCashFlow,
          revenue: financials.revenue,
          discountRate: DEFAULT_DISCOUNT_RATE,
          terminalGrowthRate: DEFAULT_TERMINAL_GROWTH,
          projectionYears: DEFAULT_PROJECTION_YEARS,
        });
        setResult(dcfResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [apiKey]
  );

  return (
    <main>
      <header className="app-header">
        <h1>Reverse DCF</h1>
        <p className="subtitle">
          What growth rate is the market pricing into a stock?
        </p>
      </header>

      <div className="api-key-row">
        <label htmlFor="api-key">FMP API Key</label>
        <input
          id="api-key"
          type="password"
          className="api-key-input"
          value={apiKey}
          onChange={(e) => handleApiKey(e.target.value)}
          placeholder="your-api-key"
        />
        <a
          className="api-key-link"
          href="https://financialmodelingprep.com/developer/docs/"
          target="_blank"
          rel="noreferrer"
        >
          Get free key
        </a>
      </div>

      <TickerInput onSubmit={handleSubmit} loading={loading} error={error} />

      {data && result && (
        <>
          <ResultsPanel data={data} result={result} />
          <SensitivityTable baseInput={result.inputs} />
        </>
      )}
    </main>
  );
}
