import { useMemo } from "react";
import type { ReverseDCFInput } from "../types";
import {
  buildSensitivityMatrix,
  DEFAULT_DISCOUNT_RATES,
  DEFAULT_TERMINAL_GROWTH_RATES,
} from "../engine/sensitivity";

interface SensitivityTableProps {
  baseInput: ReverseDCFInput;
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

function cellColor(rate: number | null): string | undefined {
  if (rate === null) return undefined;
  if (rate > 0.2) return "var(--danger)";
  if (rate > 0.1) return "var(--warning)";
  if (rate > 0) return "var(--success)";
  return "var(--text-secondary)";
}

function isBaseCase(dr: number, tgr: number, base: ReverseDCFInput): boolean {
  return (
    Math.abs(dr - base.discountRate) < 0.001 &&
    Math.abs(tgr - base.terminalGrowthRate) < 0.001
  );
}

export default function SensitivityTable({ baseInput }: SensitivityTableProps) {
  const matrix = useMemo(
    () =>
      buildSensitivityMatrix(
        baseInput,
        DEFAULT_DISCOUNT_RATES,
        DEFAULT_TERMINAL_GROWTH_RATES
      ),
    [baseInput]
  );

  return (
    <section className="sensitivity">
      <h3>Sensitivity Analysis</h3>
      <p className="sensitivity-subtitle">
        Implied growth rate by discount rate (rows) vs terminal growth (columns)
      </p>
      <div className="table-wrap">
        <table className="sensitivity-table">
          <thead>
            <tr>
              <th>WACC \ Tg</th>
              {DEFAULT_TERMINAL_GROWTH_RATES.map((tgr) => (
                <th key={tgr}>{pct(tgr)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, ri) => (
              <tr key={DEFAULT_DISCOUNT_RATES[ri]}>
                <td className="row-header">
                  {pct(DEFAULT_DISCOUNT_RATES[ri]!)}
                </td>
                {row.map((cell, ci) => {
                  const base = isBaseCase(
                    cell.discountRate,
                    cell.terminalGrowthRate,
                    baseInput
                  );
                  return (
                    <td
                      key={ci}
                      className={base ? "cell base-cell" : "cell"}
                      style={{ color: cellColor(cell.impliedGrowthRate) }}
                    >
                      {cell.impliedGrowthRate !== null
                        ? pct(cell.impliedGrowthRate)
                        : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
