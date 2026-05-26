import { useCallback, useState } from "react";
import TickerInput from "./components/TickerInput";
import ResultsPanel from "./components/ResultsPanel";
import SensitivityTable from "./components/SensitivityTable";
import ComparisonTable from "./components/ComparisonTable";
import { fetchFinancialData } from "./services/financialData";
import { reverseDCF } from "./engine/reverseDcf";
import type { ComparisonEntry } from "./types";

const DEFAULT_DISCOUNT_RATE = 0.1;
const DEFAULT_TERMINAL_GROWTH = 0.03;
const DEFAULT_PROJECTION_YEARS = 10;

async function analyzeOne(ticker: string): Promise<ComparisonEntry> {
  const data = await fetchFinancialData(ticker);
  const result = reverseDCF({
    price: data.price,
    sharesOutstanding: data.sharesOutstanding,
    netDebt: data.netDebt,
    freeCashFlow: data.freeCashFlow,
    revenue: data.revenue,
    discountRate: DEFAULT_DISCOUNT_RATE,
    terminalGrowthRate: DEFAULT_TERMINAL_GROWTH,
    projectionYears: DEFAULT_PROJECTION_YEARS,
  });
  return { data, result };
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<ComparisonEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSubmit = useCallback(async (tickers: string[]) => {
    setLoading(true);
    setError(null);
    setEntries([]);
    setSelected(null);

    try {
      const results = await Promise.allSettled(tickers.map(analyzeOne));
      const successes: ComparisonEntry[] = [];
      const failures: string[] = [];

      results.forEach((r, i) => {
        if (r.status === "fulfilled") {
          successes.push(r.value);
        } else {
          failures.push(tickers[i]!);
        }
      });

      if (successes.length === 0) {
        setError(`Failed to fetch data for: ${failures.join(", ")}`);
      } else {
        setEntries(successes);
        if (failures.length > 0) {
          setError(`Could not load: ${failures.join(", ")}`);
        }
        if (successes.length === 1) {
          setSelected(successes[0]!.data.ticker);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const selectedEntry = entries.find((e) => e.data.ticker === selected);

  return (
    <main>
      <header className="app-header">
        <h1>Reverse DCF</h1>
        <p className="subtitle">
          What growth rate is the market pricing into a stock?
        </p>
      </header>

      <TickerInput onSubmit={handleSubmit} loading={loading} error={error} />

      {entries.length > 1 && (
        <ComparisonTable entries={entries} onSelect={setSelected} />
      )}

      {selectedEntry && (
        <>
          <ResultsPanel
            data={selectedEntry.data}
            result={selectedEntry.result}
          />
          <SensitivityTable baseInput={selectedEntry.result.inputs} />
        </>
      )}
    </main>
  );
}
