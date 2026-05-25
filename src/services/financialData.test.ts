import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildFinancialData,
  computeNetDebt,
  fetchFinancialData,
  FinancialDataError,
} from "./financialData";

const MOCK_PROFILE = {
  price: 195.0,
  mktCap: 3_000_000_000_000,
  sharesOutstanding: 15_384_615_385,
};

const MOCK_INCOME = { revenue: 383_000_000_000 };
const MOCK_CASH_FLOW = { freeCashFlow: 110_000_000_000 };
const MOCK_BALANCE = {
  totalDebt: 111_000_000_000,
  cashAndCashEquivalents: 30_000_000_000,
  cashAndShortTermInvestments: 62_000_000_000,
};

describe("computeNetDebt", () => {
  it("calculates totalDebt minus cashAndShortTermInvestments", () => {
    expect(computeNetDebt(MOCK_BALANCE)).toBe(
      111_000_000_000 - 62_000_000_000
    );
  });

  it("falls back to cashAndCashEquivalents when short-term is zero", () => {
    const sheet = { ...MOCK_BALANCE, cashAndShortTermInvestments: 0 };
    expect(computeNetDebt(sheet)).toBe(111_000_000_000 - 30_000_000_000);
  });

  it("handles missing fields gracefully", () => {
    expect(
      computeNetDebt({
        totalDebt: 0,
        cashAndCashEquivalents: 0,
        cashAndShortTermInvestments: 0,
      })
    ).toBe(0);
  });
});

describe("buildFinancialData", () => {
  it("assembles FinancialData from raw API responses", () => {
    const result = buildFinancialData(
      "AAPL",
      MOCK_PROFILE,
      MOCK_INCOME,
      MOCK_CASH_FLOW,
      MOCK_BALANCE
    );

    expect(result.ticker).toBe("AAPL");
    expect(result.price).toBe(195.0);
    expect(result.sharesOutstanding).toBe(15_384_615_385);
    expect(result.revenue).toBe(383_000_000_000);
    expect(result.freeCashFlow).toBe(110_000_000_000);
    expect(result.netDebt).toBe(49_000_000_000);
    expect(result.fcfMargin).toBeCloseTo(110 / 383, 4);
  });

  it("derives shares from mktCap/price when sharesOutstanding missing", () => {
    const profile = { price: 200, mktCap: 2_000_000_000_000 };
    const result = buildFinancialData(
      "TEST",
      profile,
      MOCK_INCOME,
      MOCK_CASH_FLOW,
      MOCK_BALANCE
    );
    expect(result.sharesOutstanding).toBe(10_000_000_000);
  });
});

describe("fetchFinancialData", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and assembles data from FMP endpoints", async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      let body: unknown;
      if (url.includes("/profile/")) body = [MOCK_PROFILE];
      else if (url.includes("/income-statement/")) body = [MOCK_INCOME];
      else if (url.includes("/cash-flow-statement/")) body = [MOCK_CASH_FLOW];
      else if (url.includes("/balance-sheet-statement/"))
        body = [MOCK_BALANCE];
      return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchFinancialData("AAPL", "test-key");
    expect(result.ticker).toBe("AAPL");
    expect(result.price).toBe(195.0);
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it("throws FinancialDataError when profile is empty", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(fetchFinancialData("ZZZZ", "test-key")).rejects.toThrow(
      FinancialDataError
    );
  });

  it("throws FinancialDataError on HTTP error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal("fetch", mockFetch);

    await expect(fetchFinancialData("AAPL", "test-key")).rejects.toThrow(
      FinancialDataError
    );
  });
});
