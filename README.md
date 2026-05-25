# Reverse DCF

A web app that runs **reverse discounted cash flow analysis** from a stock's current market price. Given a ticker, it fetches live financial data and solves backwards for the implied revenue growth rate the market is pricing in.

No API keys required — data is sourced from Yahoo Finance.

## Quick Start

```bash
npm install
npm run dev
```

Open the local URL, type a ticker (e.g. `AAPL`), and hit **Analyze**.

## How It Works

A traditional DCF starts with growth assumptions and produces a fair value. A **reverse DCF** does the opposite: it takes the current stock price as given and asks _"what growth rate would justify this price?"_

The engine:

1. Takes the current price, free cash flow, shares outstanding, and net debt
2. Uses a **bisection method** to find the annual FCF growth rate that makes the DCF-implied price equal the observed market price
3. Projects FCF forward over 10 years, discounts back at the WACC, and adds a terminal value using the Gordon Growth Model

The result is the **implied growth rate** — the market's embedded expectation. If you think the company can grow faster, the stock may be undervalued. If slower, it may be overvalued.

### Sensitivity Analysis

The app also generates a matrix varying the discount rate (WACC) against the terminal growth rate, showing how the implied growth changes under different assumptions. The base-case cell is highlighted.

## Tech Stack

- **Vite** + **React 18** + **TypeScript**
- **Vitest** for unit tests
- **ESLint** for linting
- Yahoo Finance data via Vite dev server proxy (no backend needed)

## Project Structure

```
src/
├── components/
│   ├── TickerInput.tsx        # Stock ticker input with loading/error states
│   ├── ResultsPanel.tsx       # Implied growth rate, financials, assumptions
│   └── SensitivityTable.tsx   # Discount rate × terminal growth matrix
├── engine/
│   ├── reverseDcf.ts          # Bisection solver and DCF math
│   ├── reverseDcf.test.ts     # 12 tests including round-trip consistency
│   ├── sensitivity.ts         # Sensitivity matrix builder
│   └── sensitivity.test.ts    # 4 tests
├── services/
│   ├── financialData.ts       # Yahoo Finance data fetching + parsing
│   └── financialData.test.ts  # 8 tests with mocked fetch
├── types/
│   └── index.ts               # Shared TypeScript interfaces
├── App.tsx                    # Root component wiring the full flow
├── index.css                  # Dark theme styles
└── main.tsx                   # Entry point
```

## Verification

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test        # Vitest (24 tests)
```

## Harness

This project uses a structured harness for AI-assisted development:

| File | Purpose |
|---|---|
| `AGENTS.md` | Agent operating manual — session protocol, verification commands, constraints |
| `feature_list.json` | Machine-readable feature tracker with status and evidence |
| `progress.md` | Session log — what was done, what's next |
| `init.sh` | Environment health check — install, lint, typecheck, test |

The harness enforces **WIP=1** (one feature at a time) and requires all three verification checks to pass before a feature is marked done.

## License

MIT
