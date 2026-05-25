import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseYahooData,
  fetchFinancialData,
  FinancialDataError,
} from "./financialData";

const MOCK_YAHOO_RESPONSE = {
  quoteSummary: {
    result: [
      {
        price: {
          regularMarketPrice: { raw: 195 },
          marketCap: { raw: 3_000_000_000_000 },
        },
        defaultKeyStatistics: {
          sharesOutstanding: { raw: 15_400_000_000 },
        },
        financialData: {
          totalRevenue: { raw: 383_000_000_000 },
          freeCashflow: { raw: 110_000_000_000 },
          totalDebt: { raw: 111_000_000_000 },
          totalCash: { raw: 62_000_000_000 },
        },
      },
    ],
    error: null,
  },
};

describe("parseYahooData", () => {
  it("parses a valid Yahoo Finance response", () => {
    const result = parseYahooData("AAPL", MOCK_YAHOO_RESPONSE);
    expect(result.ticker).toBe("AAPL");
    expect(result.price).toBe(195);
    expect(result.sharesOutstanding).toBe(15_400_000_000);
    expect(result.revenue).toBe(383_000_000_000);
    expect(result.freeCashFlow).toBe(110_000_000_000);
    expect(result.netDebt).toBe(111_000_000_000 - 62_000_000_000);
    expect(result.fcfMargin).toBeCloseTo(110 / 383, 4);
  });

  it("derives shares from marketCap / price when sharesOutstanding missing", () => {
    const data = structuredClone(MOCK_YAHOO_RESPONSE);
    data.quoteSummary.result[0] = {
      price: data.quoteSummary.result[0]!.price,
      financialData: data.quoteSummary.result[0]!.financialData,
    } as (typeof data.quoteSummary.result)[0];
    const result = parseYahooData("TEST", data);
    expect(result.sharesOutstanding).toBe(
      Math.round(3_000_000_000_000 / 195)
    );
  });

  it("throws when result array is empty", () => {
    const empty = { quoteSummary: { result: [], error: null } };
    expect(() => parseYahooData("ZZZZ", empty)).toThrow(FinancialDataError);
  });

  it("throws on invalid price", () => {
    const data = structuredClone(MOCK_YAHOO_RESPONSE);
    data.quoteSummary.result[0]!.price!.regularMarketPrice!.raw = 0;
    expect(() => parseYahooData("BAD", data)).toThrow(FinancialDataError);
  });

  it("handles missing financialData fields gracefully", () => {
    const data = structuredClone(MOCK_YAHOO_RESPONSE);
    data.quoteSummary.result[0]!.financialData = {} as typeof data.quoteSummary.result[0]["financialData"];
    const result = parseYahooData("MIN", data);
    expect(result.revenue).toBe(0);
    expect(result.freeCashFlow).toBe(0);
    expect(result.netDebt).toBe(0);
  });
});

describe("fetchFinancialData", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and parses Yahoo Finance data", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_YAHOO_RESPONSE),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchFinancialData("AAPL");
    expect(result.ticker).toBe("AAPL");
    expect(result.price).toBe(195);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0]![0]).toContain("/api/yahoo/");
  });

  it("throws on HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 })
    );
    await expect(fetchFinancialData("ZZZZ")).rejects.toThrow(
      FinancialDataError
    );
  });

  it("throws when Yahoo returns an error object", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            quoteSummary: {
              result: null,
              error: { code: "Not Found", description: "No data" },
            },
          }),
      })
    );
    await expect(fetchFinancialData("FAKE")).rejects.toThrow(
      FinancialDataError
    );
  });
});
