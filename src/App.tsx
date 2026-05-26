import { useCallback, useState } from "react";
import TickerInput from "./components/TickerInput";
import ResultsPanel from "./components/ResultsPanel";
import SensitivityTable from "./components/SensitivityTable";
import ComparisonTable from "./components/ComparisonTable";
import InsightsPanel from "./components/InsightsPanel";
import { fetchFinancialData } from "./services/financialData";
import { reverseDCF } from "./engine/reverseDcf";
import { validateFinancialData } from "./engine/validation";
import type { ComparisonEntry, SkippedEntry } from "./types";

const DEFAULT_DISCOUNT_RATE = 0.1;
const DEFAULT_TERMINAL_GROWTH = 0.03;
const DEFAULT_PROJECTION_YEARS = 10;

interface AnalysisResult {
  entry?: ComparisonEntry;
  skipped?: SkippedEntry;
  fetchError?: string;
}

async function analyzeOne(ticker: string): Promise<AnalysisResult> {
  const data = await fetchFinancialData(ticker);
  const validation = validateFinancialData(data);

  if (!validation.valid) {
    return { skipped: { ticker, reasons: validation.warnings } };
  }

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
  return { entry: { data, result } };
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<ComparisonEntry[]>([]);
  const [skipped, setSkipped] = useState<SkippedEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSubmit = useCallback(async (tickers: string[]) => {
    setLoading(true);
    setError(null);
    setEntries([]);
    setSkipped([]);
    setSelected(null);

    try {
      const results = await Promise.allSettled(tickers.map(analyzeOne));
      const successes: ComparisonEntry[] = [];
      const skippedList: SkippedEntry[] = [];
      const failures: string[] = [];

      results.forEach((r, i) => {
        if (r.status === "fulfilled") {
          const { entry, skipped: skip } = r.value;
          if (entry) successes.push(entry);
          if (skip) skippedList.push(skip);
        } else {
          failures.push(tickers[i]!);
        }
      });

      setEntries(successes);
      setSkipped(skippedList);

      if (successes.length === 0 && skippedList.length === 0) {
        setError(`Failed to fetch data for: ${failures.join(", ")}`);
      } else if (failures.length > 0) {
        setError(`Could not load: ${failures.join(", ")}`);
      }

      if (successes.length === 1) {
        setSelected(successes[0]!.data.ticker);
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

      {skipped.length > 0 && (
        <div className="skipped-panel">
          {skipped.map((s) => (
            <div key={s.ticker} className="skipped-item">
              <strong>{s.ticker}</strong> — skipped: {s.reasons.join(" ")}
            </div>
          ))}
        </div>
      )}

      {entries.length > 0 && <InsightsPanel entries={entries} />}

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
