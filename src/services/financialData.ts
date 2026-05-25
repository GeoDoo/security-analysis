import type { FinancialData } from "../types";

const FMP_BASE = "https://financialmodelingprep.com/api/v3";

export class FinancialDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinancialDataError";
  }
}

interface FMPProfile {
  price: number;
  mktCap: number;
  sharesOutstanding?: number;
}

interface FMPIncomeStatement {
  revenue: number;
}

interface FMPCashFlowStatement {
  freeCashFlow: number;
}

interface FMPBalanceSheet {
  totalDebt: number;
  cashAndCashEquivalents: number;
  cashAndShortTermInvestments: number;
}

async function fmpFetch<T>(path: string, apiKey: string): Promise<T> {
  const url = `${FMP_BASE}${path}${path.includes("?") ? "&" : "?"}apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new FinancialDataError(`API request failed: ${res.status}`);
  }
  const data: unknown = await res.json();
  return data as T;
}

export function computeNetDebt(sheet: FMPBalanceSheet): number {
  const cash =
    sheet.cashAndShortTermInvestments || sheet.cashAndCashEquivalents || 0;
  return (sheet.totalDebt || 0) - cash;
}

export function buildFinancialData(
  ticker: string,
  profile: FMPProfile,
  income: FMPIncomeStatement,
  cashFlow: FMPCashFlowStatement,
  balance: FMPBalanceSheet
): FinancialData {
  const revenue = income.revenue;
  const fcf = cashFlow.freeCashFlow;
  const shares =
    profile.sharesOutstanding ??
    (profile.price > 0 ? Math.round(profile.mktCap / profile.price) : 0);

  return {
    ticker,
    price: profile.price,
    sharesOutstanding: shares,
    revenue,
    freeCashFlow: fcf,
    netDebt: computeNetDebt(balance),
    fcfMargin: revenue !== 0 ? fcf / revenue : 0,
  };
}

export async function fetchFinancialData(
  ticker: string,
  apiKey: string
): Promise<FinancialData> {
  const [profiles, incomes, cashFlows, balances] = await Promise.all([
    fmpFetch<FMPProfile[]>(`/profile/${ticker}`, apiKey),
    fmpFetch<FMPIncomeStatement[]>(
      `/income-statement/${ticker}?limit=1`,
      apiKey
    ),
    fmpFetch<FMPCashFlowStatement[]>(
      `/cash-flow-statement/${ticker}?limit=1`,
      apiKey
    ),
    fmpFetch<FMPBalanceSheet[]>(
      `/balance-sheet-statement/${ticker}?limit=1`,
      apiKey
    ),
  ]);

  const profile = profiles[0];
  const income = incomes[0];
  const cashFlow = cashFlows[0];
  const balance = balances[0];

  if (!profile || !income || !cashFlow || !balance) {
    throw new FinancialDataError(
      `No financial data found for ticker "${ticker}"`
    );
  }

  return buildFinancialData(ticker, profile, income, cashFlow, balance);
}
