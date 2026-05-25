import type { ReverseDCFInput, ReverseDCFResult } from "../types";

/**
 * Project FCF forward at a constant growth rate, discount back,
 * add terminal value, and return the implied enterprise value.
 */
export function computeEnterpriseValue(
  fcf: number,
  growthRate: number,
  discountRate: number,
  terminalGrowthRate: number,
  years: number
): number {
  let pvFcf = 0;
  let projectedFcf = fcf;

  for (let y = 1; y <= years; y++) {
    projectedFcf *= 1 + growthRate;
    pvFcf += projectedFcf / Math.pow(1 + discountRate, y);
  }

  const terminalFcf = projectedFcf * (1 + terminalGrowthRate);
  const terminalValue = terminalFcf / (discountRate - terminalGrowthRate);
  const pvTerminal = terminalValue / Math.pow(1 + discountRate, years);

  return pvFcf + pvTerminal;
}

/**
 * Convert enterprise value to implied equity value per share.
 */
export function evToPrice(
  ev: number,
  netDebt: number,
  sharesOutstanding: number
): number {
  return (ev - netDebt) / sharesOutstanding;
}

const MAX_ITERATIONS = 200;
const TOLERANCE = 0.0001;

/**
 * Bisection solver: find the growth rate that makes the DCF-implied price
 * equal the observed market price.
 *
 * Returns the implied annual revenue/FCF growth rate, or null if it
 * doesn't converge (price outside any reasonable growth assumption).
 */
export function solveImpliedGrowthRate(
  input: ReverseDCFInput
): { growthRate: number; converged: boolean } {
  const {
    price,
    sharesOutstanding,
    netDebt,
    freeCashFlow,
    discountRate,
    terminalGrowthRate,
    projectionYears,
  } = input;

  const targetPrice = price;
  let lo = -0.5;
  let hi = 1.5;

  function priceAtGrowth(g: number): number {
    const ev = computeEnterpriseValue(
      freeCashFlow,
      g,
      discountRate,
      terminalGrowthRate,
      projectionYears
    );
    return evToPrice(ev, netDebt, sharesOutstanding);
  }

  let priceLo = priceAtGrowth(lo);
  const priceHi = priceAtGrowth(hi);

  if (
    (priceLo - targetPrice) * (priceHi - targetPrice) > 0 &&
    priceHi < targetPrice
  ) {
    return { growthRate: hi, converged: false };
  }
  if (
    (priceLo - targetPrice) * (priceHi - targetPrice) > 0 &&
    priceLo > targetPrice
  ) {
    return { growthRate: lo, converged: false };
  }

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const mid = (lo + hi) / 2;
    const priceMid = priceAtGrowth(mid);

    if (Math.abs(priceMid - targetPrice) / targetPrice < TOLERANCE) {
      return { growthRate: mid, converged: true };
    }

    if ((priceLo - targetPrice) * (priceMid - targetPrice) < 0) {
      hi = mid;
    } else {
      lo = mid;
      priceLo = priceMid;
    }
  }

  return { growthRate: (lo + hi) / 2, converged: true };
}

/**
 * Full reverse DCF: given market data and assumptions, return the
 * implied growth rate and supporting figures.
 */
export function reverseDCF(input: ReverseDCFInput): ReverseDCFResult {
  const { growthRate, converged } = solveImpliedGrowthRate(input);
  const marketCap = input.price * input.sharesOutstanding;

  return {
    impliedGrowthRate: growthRate,
    inputs: input,
    marketCap,
    enterpriseValue: marketCap + input.netDebt,
    converged,
  };
}
