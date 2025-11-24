// DCF Model Types

export interface FinancialStatement {
  year: number;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingIncome: number; // EBIT
  interestExpense: number;
  incomeBeforeTax: number;
  incomeTaxExpense: number;
  netIncome: number;
  depreciation: number;
  capitalExpenditures: number;
  changeInWorkingCapital: number;
  totalDebt: number;
  totalEquity: number;
  sharesOutstanding: number;
}

export interface DCFAssumptions {
  // Revenue growth assumptions (year by year)
  revenueGrowthRates: number[]; // e.g., [0.15, 0.12, 0.10, 0.08, 0.05]

  // Margin assumptions
  grossMargin: number; // e.g., 0.40 (40%)
  operatingMargin: number; // e.g., 0.20 (20%)

  // Other assumptions
  taxRate: number; // e.g., 0.21 (21%)
  depreciationAsPercentOfRevenue: number; // e.g., 0.03 (3%)
  capexAsPercentOfRevenue: number; // e.g., 0.05 (5%)
  nwcAsPercentOfRevenue: number; // e.g., 0.10 (10%)

  // Projection period
  projectionYears: number; // e.g., 5 or 10
}

export interface WACCInputs {
  // Cost of Equity (CAPM)
  riskFreeRate: number; // 10Y Treasury, e.g., 0.045 (4.5%)
  beta: number; // Stock beta, e.g., 1.2
  equityRiskPremium: number; // e.g., 0.055 (5.5%)

  // Cost of Debt
  costOfDebt: number; // Interest rate on debt, e.g., 0.06 (6%)

  // Capital Structure
  marketCapEquity: number;
  totalDebt: number;

  // Tax
  taxRate: number;
}

export interface TerminalValueInputs {
  method: "perpetuity" | "exitMultiple";
  perpetuityGrowthRate?: number; // e.g., 0.025 (2.5%)
  exitMultiple?: number; // EV/EBITDA multiple, e.g., 12
}

export interface ProjectedFinancials {
  year: number;
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  nopat: number; // Net Operating Profit After Tax
  depreciation: number;
  capex: number;
  changeInNWC: number;
  fcf: number; // Free Cash Flow
  discountFactor: number;
  presentValue: number;
}

export interface DCFResult {
  // Projected financials
  projections: ProjectedFinancials[];

  // WACC
  wacc: number;
  costOfEquity: number;
  costOfDebt: number;

  // Terminal Value
  terminalValue: number;
  terminalValuePV: number;
  terminalValueMethod: "perpetuity" | "exitMultiple";

  // Enterprise Value
  sumOfPVs: number;
  enterpriseValue: number;

  // Equity Value
  netDebt: number;
  equityValue: number;

  // Per Share
  sharesOutstanding: number;
  intrinsicValuePerShare: number;
  currentPrice: number;
  impliedUpside: number;

  // Metadata
  calculatedAt: Date;
}

export interface SensitivityTable {
  waccValues: number[];
  growthValues: number[];
  matrix: number[][]; // [wacc][growth] = share price
}

export interface CompanyData {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  currentPrice: number;
  marketCap: number;
  beta: number;
  sharesOutstanding: number;
  historicalFinancials: FinancialStatement[];
}
