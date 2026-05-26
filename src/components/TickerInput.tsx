import { useState, type FormEvent } from "react";

interface TickerInputProps {
  onSubmit: (tickers: string[]) => void;
  loading: boolean;
  error: string | null;
}

export default function TickerInput({
  onSubmit,
  loading,
  error,
}: TickerInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const tickers = value
      .toUpperCase()
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && /^[A-Z.]+$/.test(t));
    if (tickers.length > 0) onSubmit(tickers);
  }

  return (
    <form className="ticker-form" onSubmit={handleSubmit}>
      <div className="ticker-input-row">
        <input
          type="text"
          className="ticker-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="AAPL, MSFT, GOOG"
          disabled={loading}
          autoFocus
        />
        <button
          type="submit"
          className="ticker-submit"
          disabled={loading || !value.trim()}
        >
          {loading ? "Loading…" : "Analyze"}
        </button>
      </div>
      {error && <p className="ticker-error">{error}</p>}
    </form>
  );
}
