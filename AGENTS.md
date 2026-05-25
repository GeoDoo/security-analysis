# AGENTS.md — Reverse DCF Web App

## Project

A web app that runs **reverse DCFs** from a stock's current market price.
Given a ticker, the app fetches financial data, then solves backwards for the
implied revenue growth rate the market is pricing in.

Stack: **Vite + React + TypeScript**

---

## Session Protocol

### START — every session begins here

1. Read this file (`AGENTS.md`).
2. Run `./init.sh` — installs deps, runs lint + typecheck + tests.
3. Read `progress.md` — what happened last session.
4. Read `feature_list.json` — what's done, what's next.
5. Check `git log --oneline -10`.

### SELECT — pick exactly ONE feature

6. Find the first feature in `feature_list.json` with `"status": "pending"`.
7. Set its status to `"in_progress"`.
8. **WIP = 1. Do not start a second feature until the current one passes verification.**

### EXECUTE

9. Implement the feature.
10. Run verification: `npm run lint && npm run typecheck && npm run test`.
11. If verification fails → fix and re-run.
12. If verification passes → record evidence (paste command output summary).

### WRAP UP

13. Update `feature_list.json` — set status to `"done"`, record evidence.
14. Update `progress.md` — what was done, what's next.
15. Commit with a message referencing the feature ID (e.g., `feat(F02): stock ticker input`).
16. Leave a clean restart path for the next session.

---

## Verification Commands

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test        # Vitest
```

All three must pass before a feature is marked done.

---

## Architecture

```
src/
├── components/     # React components
├── services/       # Data fetching, API wrappers
├── engine/         # Reverse DCF calculation logic
├── types/          # Shared TypeScript types
├── App.tsx         # Root component
└── main.tsx        # Entry point
```

---

## Constraints

- No backend server — all computation happens client-side.
- Financial data fetched via free public APIs (Yahoo Finance proxy / FMP).
- Keep bundle size small. No heavy charting libraries unless justified.
- Every function in `engine/` must have unit tests.
