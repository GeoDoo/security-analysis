import type { ReverseDCFInput, SensitivityCell } from "../types";
import { solveImpliedGrowthRate } from "./reverseDcf";

export function buildSensitivityMatrix(
  baseInput: ReverseDCFInput,
  discountRates: number[],
  terminalGrowthRates: number[]
): SensitivityCell[][] {
  return discountRates.map((dr) =>
    terminalGrowthRates.map((tgr) => {
      if (tgr >= dr) {
        return { discountRate: dr, terminalGrowthRate: tgr, impliedGrowthRate: null };
      }
      const input: ReverseDCFInput = {
        ...baseInput,
        discountRate: dr,
        terminalGrowthRate: tgr,
      };
      const { growthRate, converged } = solveImpliedGrowthRate(input);
      return {
        discountRate: dr,
        terminalGrowthRate: tgr,
        impliedGrowthRate: converged ? growthRate : null,
      };
    })
  );
}

export const DEFAULT_DISCOUNT_RATES = [0.08, 0.09, 0.1, 0.11, 0.12];
export const DEFAULT_TERMINAL_GROWTH_RATES = [0.02, 0.025, 0.03, 0.035, 0.04];
