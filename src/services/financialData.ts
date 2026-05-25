import type { FinancialData } from "../types";

const YAHOO_BASE = "/api/yahoo";

export class FinancialDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinancialDataError";
  }
}

interface YahooQuoteSummary {
  quoteSummary: {
    result: Array<{
      price?: {
        regularMarketPrice?: { raw: number };
        marketCap?: { raw: number };
      };
      defaultKeyStatistics?: {
        sharesOutstanding?: { raw: number };
      };
      financialData?: {
        totalRevenue?: { raw: number };
        freeCashflow?: { raw: number };
        totalDebt?: { raw: number };
        totalCash?: { raw: number };
      };
    }>;
    error: unknown;
  };
}

export function parseYahooData(
  ticker: string,
  raw: YahooQuoteSummary
): FinancialData {
  const entry = raw.quoteSummary?.result?.[0];
  if (!entry) {
    throw new FinancialDataError(
      `No data found for ticker "${ticker}"`
    );
  }

  const price = entry.price?.regularMarketPrice?.raw;
  if (price === undefined || price <= 0) {
    throw new FinancialDataError(`Invalid price for "${ticker}"`);
  }

  const shares =
    entry.defaultKeyStatistics?.sharesOutstanding?.raw ??
    (entry.price?.marketCap?.raw
      ? Math.round(entry.price.marketCap.raw / price)
      : 0);

  const revenue = entry.financialData?.totalRevenue?.raw ?? 0;
  const fcf = entry.financialData?.freeCashflow?.raw ?? 0;
  const totalDebt = entry.financialData?.totalDebt?.raw ?? 0;
  const totalCash = entry.financialData?.totalCash?.raw ?? 0;
  const netDebt = totalDebt - totalCash;

  return {
    ticker,
    price,
    sharesOutstanding: shares,
    revenue,
    freeCashFlow: fcf,
    netDebt,
    fcfMargin: revenue !== 0 ? fcf / revenue : 0,
  };
}

export async function fetchFinancialData(
  ticker: string
): Promise<FinancialData> {
  const modules = [
    "price",
    "defaultKeyStatistics",
    "financialData",
  ].join(",");

  const url = `${YAHOO_BASE}/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new FinancialDataError(
      `Failed to fetch data for "${ticker}" (HTTP ${res.status})`
    );
  }

  const data: YahooQuoteSummary = await res.json();

  if (data.quoteSummary?.error) {
    throw new FinancialDataError(
      `Yahoo Finance error for "${ticker}": ${JSON.stringify(data.quoteSummary.error)}`
    );
  }

  return parseYahooData(ticker, data);
}
