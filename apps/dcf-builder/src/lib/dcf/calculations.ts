import type {
  FinancialStatement,
  DCFAssumptions,
  WACCInputs,
  TerminalValueInputs,
  ProjectedFinancials,
  DCFResult,
  SensitivityTable,
} from "./types";

/**
 * Calculate Weighted Average Cost of Capital (WACC)
 */
export function calculateWACC(inputs: WACCInputs): {
  wacc: number;
  costOfEquity: number;
  afterTaxCostOfDebt: number;
} {
  const { riskFreeRate, beta, equityRiskPremium, costOfDebt, marketCapEquity, totalDebt, taxRate } =
    inputs;

  // Cost of Equity using CAPM: Re = Rf + β × (Rm - Rf)
  const costOfEquity = riskFreeRate + beta * equityRiskPremium;

  // After-tax Cost of Debt: Rd × (1 - T)
  const afterTaxCostOfDebt = costOfDebt * (1 - taxRate);

  // Total capital
  const totalCapital = marketCapEquity + totalDebt;

  // Weights
  const weightEquity = marketCapEquity / totalCapital;
  const weightDebt = totalDebt / totalCapital;

  // WACC = (E/V × Re) + (D/V × Rd × (1-T))
  const wacc = weightEquity * costOfEquity + weightDebt * afterTaxCostOfDebt;

  return { wacc, costOfEquity, afterTaxCostOfDebt };
}

/**
 * Project future financials based on assumptions
 */
export function projectFinancials(
  baseYear: FinancialStatement,
  assumptions: DCFAssumptions,
  wacc: number
): ProjectedFinancials[] {
  const projections: ProjectedFinancials[] = [];
  let previousRevenue = baseYear.revenue;
  let previousNWC = baseYear.revenue * assumptions.nwcAsPercentOfRevenue;

  for (let i = 0; i < assumptions.projectionYears; i++) {
    const year = baseYear.year + i + 1;
    const growthRate = assumptions.revenueGrowthRates[i] ?? assumptions.revenueGrowthRates[assumptions.revenueGrowthRates.length - 1];

    // Revenue projection
    const revenue = previousRevenue * (1 + growthRate);

    // Profit projections
    const grossProfit = revenue * assumptions.grossMargin;
    const operatingIncome = revenue * assumptions.operatingMargin;

    // NOPAT = Operating Income × (1 - Tax Rate)
    const nopat = operatingIncome * (1 - assumptions.taxRate);

    // Non-cash items and investments
    const depreciation = revenue * assumptions.depreciationAsPercentOfRevenue;
    const capex = revenue * assumptions.capexAsPercentOfRevenue;
    const currentNWC = revenue * assumptions.nwcAsPercentOfRevenue;
    const changeInNWC = currentNWC - previousNWC;

    // Free Cash Flow = NOPAT + D&A - CapEx - ΔNWC
    const fcf = nopat + depreciation - capex - changeInNWC;

    // Discount factor: 1 / (1 + WACC)^n using mid-year convention
    const discountFactor = 1 / Math.pow(1 + wacc, i + 0.5);

    // Present value
    const presentValue = fcf * discountFactor;

    projections.push({
      year,
      revenue,
      grossProfit,
      operatingIncome,
      nopat,
      depreciation,
      capex,
      changeInNWC,
      fcf,
      discountFactor,
      presentValue,
    });

    previousRevenue = revenue;
    previousNWC = currentNWC;
  }

  return projections;
}

/**
 * Calculate Terminal Value
 */
export function calculateTerminalValue(
  finalYearFCF: number,
  finalYearEBITDA: number,
  wacc: number,
  inputs: TerminalValueInputs,
  projectionYears: number
): { terminalValue: number; terminalValuePV: number } {
  let terminalValue: number;

  if (inputs.method === "perpetuity" && inputs.perpetuityGrowthRate !== undefined) {
    // Gordon Growth Model: TV = FCF × (1 + g) / (WACC - g)
    terminalValue = (finalYearFCF * (1 + inputs.perpetuityGrowthRate)) / (wacc - inputs.perpetuityGrowthRate);
  } else if (inputs.method === "exitMultiple" && inputs.exitMultiple !== undefined) {
    // Exit Multiple: TV = EBITDA × Multiple
    terminalValue = finalYearEBITDA * inputs.exitMultiple;
  } else {
    throw new Error("Invalid terminal value inputs");
  }

  // Discount terminal value to present (at end of projection period)
  const terminalDiscountFactor = 1 / Math.pow(1 + wacc, projectionYears);
  const terminalValuePV = terminalValue * terminalDiscountFactor;

  return { terminalValue, terminalValuePV };
}

/**
 * Run complete DCF analysis
 */
export function runDCFAnalysis(
  company: {
    ticker: string;
    currentPrice: number;
    sharesOutstanding: number;
    totalDebt: number;
    cash: number;
    historicalFinancials: FinancialStatement[];
  },
  assumptions: DCFAssumptions,
  waccInputs: WACCInputs,
  terminalInputs: TerminalValueInputs
): DCFResult {
  // Get base year (most recent)
  const baseYear = company.historicalFinancials[company.historicalFinancials.length - 1];

  // Calculate WACC
  const { wacc, costOfEquity, afterTaxCostOfDebt } = calculateWACC(waccInputs);

  // Project financials
  const projections = projectFinancials(baseYear, assumptions, wacc);

  // Sum of present values
  const sumOfPVs = projections.reduce((sum, p) => sum + p.presentValue, 0);

  // Final year metrics for terminal value
  const finalYear = projections[projections.length - 1];
  const finalYearEBITDA = finalYear.operatingIncome + finalYear.depreciation;

  // Calculate terminal value
  const { terminalValue, terminalValuePV } = calculateTerminalValue(
    finalYear.fcf,
    finalYearEBITDA,
    wacc,
    terminalInputs,
    assumptions.projectionYears
  );

  // Enterprise Value = Sum of PVs + Terminal Value PV
  const enterpriseValue = sumOfPVs + terminalValuePV;

  // Net Debt = Total Debt - Cash
  const netDebt = company.totalDebt - company.cash;

  // Equity Value = Enterprise Value - Net Debt
  const equityValue = enterpriseValue - netDebt;

  // Intrinsic Value Per Share
  const intrinsicValuePerShare = equityValue / company.sharesOutstanding;

  // Implied Upside
  const impliedUpside = (intrinsicValuePerShare - company.currentPrice) / company.currentPrice;

  return {
    projections,
    wacc,
    costOfEquity,
    costOfDebt: afterTaxCostOfDebt,
    terminalValue,
    terminalValuePV,
    terminalValueMethod: terminalInputs.method,
    sumOfPVs,
    enterpriseValue,
    netDebt,
    equityValue,
    sharesOutstanding: company.sharesOutstanding,
    intrinsicValuePerShare,
    currentPrice: company.currentPrice,
    impliedUpside,
    calculatedAt: new Date(),
  };
}

/**
 * Generate sensitivity table
 */
export function generateSensitivityTable(
  company: {
    ticker: string;
    currentPrice: number;
    sharesOutstanding: number;
    totalDebt: number;
    cash: number;
    historicalFinancials: FinancialStatement[];
  },
  assumptions: DCFAssumptions,
  waccInputs: WACCInputs,
  terminalInputs: TerminalValueInputs,
  options: {
    waccRange: { min: number; max: number; step: number };
    growthRange: { min: number; max: number; step: number };
  }
): SensitivityTable {
  const waccValues: number[] = [];
  const growthValues: number[] = [];
  const matrix: number[][] = [];

  // Generate WACC values
  for (let w = options.waccRange.min; w <= options.waccRange.max; w += options.waccRange.step) {
    waccValues.push(Math.round(w * 1000) / 1000);
  }

  // Generate growth values
  for (let g = options.growthRange.min; g <= options.growthRange.max; g += options.growthRange.step) {
    growthValues.push(Math.round(g * 1000) / 1000);
  }

  // Calculate matrix
  for (const wacc of waccValues) {
    const row: number[] = [];
    for (const growth of growthValues) {
      // Create modified inputs
      const modifiedWaccInputs = { ...waccInputs };
      const modifiedTerminalInputs: TerminalValueInputs = {
        ...terminalInputs,
        perpetuityGrowthRate: terminalInputs.method === "perpetuity" ? growth : terminalInputs.perpetuityGrowthRate,
      };

      // Override WACC by adjusting equity risk premium
      // This is a simplification - in reality you'd adjust the actual WACC
      const targetWacc = wacc;

      try {
        const baseYear = company.historicalFinancials[company.historicalFinancials.length - 1];
        const projections = projectFinancials(baseYear, assumptions, targetWacc);
        const sumOfPVs = projections.reduce((sum, p) => sum + p.presentValue, 0);
        const finalYear = projections[projections.length - 1];
        const finalYearEBITDA = finalYear.operatingIncome + finalYear.depreciation;

        const { terminalValuePV } = calculateTerminalValue(
          finalYear.fcf,
          finalYearEBITDA,
          targetWacc,
          modifiedTerminalInputs,
          assumptions.projectionYears
        );

        const enterpriseValue = sumOfPVs + terminalValuePV;
        const netDebt = company.totalDebt - company.cash;
        const equityValue = enterpriseValue - netDebt;
        const sharePrice = equityValue / company.sharesOutstanding;

        row.push(Math.round(sharePrice * 100) / 100);
      } catch {
        row.push(0);
      }
    }
    matrix.push(row);
  }

  return { waccValues, growthValues, matrix };
}

/**
 * Calculate implied growth rate (reverse DCF)
 */
export function calculateImpliedGrowth(
  targetPrice: number,
  company: {
    sharesOutstanding: number;
    totalDebt: number;
    cash: number;
    historicalFinancials: FinancialStatement[];
  },
  assumptions: DCFAssumptions,
  wacc: number,
  terminalMethod: "perpetuity" | "exitMultiple",
  exitMultiple?: number
): number {
  // Binary search for implied growth rate
  let low = -0.10; // -10%
  let high = 0.50; // 50%
  const tolerance = 0.0001;
  const maxIterations = 50;

  const targetEquityValue = targetPrice * company.sharesOutstanding;
  const targetEV = targetEquityValue + (company.totalDebt - company.cash);

  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;

    // Create assumptions with uniform growth rate
    const testAssumptions: DCFAssumptions = {
      ...assumptions,
      revenueGrowthRates: new Array(assumptions.projectionYears).fill(mid),
    };

    const baseYear = company.historicalFinancials[company.historicalFinancials.length - 1];
    const projections = projectFinancials(baseYear, testAssumptions, wacc);
    const sumOfPVs = projections.reduce((sum, p) => sum + p.presentValue, 0);
    const finalYear = projections[projections.length - 1];
    const finalYearEBITDA = finalYear.operatingIncome + finalYear.depreciation;

    const terminalInputs: TerminalValueInputs = terminalMethod === "perpetuity"
      ? { method: "perpetuity", perpetuityGrowthRate: 0.025 }
      : { method: "exitMultiple", exitMultiple };

    const { terminalValuePV } = calculateTerminalValue(
      finalYear.fcf,
      finalYearEBITDA,
      wacc,
      terminalInputs,
      assumptions.projectionYears
    );

    const calculatedEV = sumOfPVs + terminalValuePV;

    if (Math.abs(calculatedEV - targetEV) < tolerance * targetEV) {
      return mid;
    }

    if (calculatedEV < targetEV) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number, decimals = 2): string {
  if (Math.abs(value) >= 1e12) {
    return `$${(value / 1e12).toFixed(decimals)}T`;
  } else if (Math.abs(value) >= 1e9) {
    return `$${(value / 1e9).toFixed(decimals)}B`;
  } else if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(decimals)}M`;
  } else if (Math.abs(value) >= 1e3) {
    return `$${(value / 1e3).toFixed(decimals)}K`;
  }
  return `$${value.toFixed(decimals)}`;
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
