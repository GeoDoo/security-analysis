export interface FinancialData {
  ticker: string;
  price: number;
  sharesOutstanding: number;
  revenue: number;
  freeCashFlow: number;
  netDebt: number;
  fcfMargin: number;
}

export interface ReverseDCFInput {
  price: number;
  sharesOutstanding: number;
  netDebt: number;
  freeCashFlow: number;
  revenue: number;
  discountRate: number;
  terminalGrowthRate: number;
  projectionYears: number;
}

export interface ReverseDCFResult {
  impliedGrowthRate: number;
  inputs: ReverseDCFInput;
  marketCap: number;
  enterpriseValue: number;
  converged: boolean;
}

export interface SensitivityCell {
  discountRate: number;
  terminalGrowthRate: number;
  impliedGrowthRate: number | null;
}
