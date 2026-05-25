import { useState, type FormEvent } from "react";

interface TickerInputProps {
  onSubmit: (ticker: string) => void;
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
    const ticker = value.trim().toUpperCase();
    if (ticker) onSubmit(ticker);
  }

  return (
    <form className="ticker-form" onSubmit={handleSubmit}>
      <div className="ticker-input-row">
        <input
          type="text"
          className="ticker-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="AAPL"
          maxLength={10}
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
