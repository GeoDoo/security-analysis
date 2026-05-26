import type { FinancialData } from "../types";

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
}

export function validateFinancialData(data: FinancialData): ValidationResult {
  const warnings: string[] = [];

  if (data.freeCashFlow <= 0) {
    warnings.push(
      `${data.ticker} has negative or zero free cash flow ($${(data.freeCashFlow / 1e9).toFixed(1)}B). Reverse DCF requires positive FCF.`
    );
  }

  if (data.revenue <= 0) {
    warnings.push(
      `${data.ticker} has no reported revenue. Reverse DCF is not applicable.`
    );
  }

  if (data.sharesOutstanding <= 0) {
    warnings.push(
      `${data.ticker} has no shares outstanding data. Cannot compute per-share value.`
    );
  }

  if (data.price <= 0) {
    warnings.push(
      `${data.ticker} has an invalid price ($${data.price}). Cannot run reverse DCF.`
    );
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
