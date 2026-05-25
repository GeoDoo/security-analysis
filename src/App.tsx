import { useState } from "react";
import TickerInput from "./components/TickerInput";

export default function App() {
  const [ticker, setTicker] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(t: string) {
    setLoading(true);
    setError(null);
    setTicker(t);
    // Data fetching wired in F03; for now just simulate
    setTimeout(() => setLoading(false), 600);
  }

  return (
    <main>
      <header className="app-header">
        <h1>Reverse DCF</h1>
        <p className="subtitle">
          What growth rate is the market pricing into a stock?
        </p>
      </header>

      <TickerInput onSubmit={handleSubmit} loading={loading} error={error} />

      {ticker && !loading && (
        <section className="results-placeholder">
          <p className="text-secondary">
            Reverse DCF for <strong>{ticker}</strong> — results will appear here
            once the engine is wired.
          </p>
        </section>
      )}
    </main>
  );
}
