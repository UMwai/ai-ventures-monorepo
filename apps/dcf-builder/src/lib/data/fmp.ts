/**
 * Financial Modeling Prep (FMP) API Client
 * https://site.financialmodelingprep.com/developer/docs
 */

import type { FinancialStatement, CompanyData } from "../dcf/types";

const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";

function getApiKey(): string {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    throw new Error("FMP_API_KEY environment variable is not set");
  }
  return apiKey;
}

export interface FMPIncomeStatement {
  date: string;
  symbol: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingIncome: number;
  interestExpense: number;
  incomeBeforeTax: number;
  incomeTaxExpense: number;
  netIncome: number;
  eps: number;
  epsdiluted: number;
  weightedAverageShsOut: number;
  weightedAverageShsOutDil: number;
}

export interface FMPBalanceSheet {
  date: string;
  symbol: string;
  totalAssets: number;
  totalLiabilities: number;
  totalStockholdersEquity: number;
  totalDebt: number;
  cashAndCashEquivalents: number;
  shortTermInvestments: number;
  netReceivables: number;
  inventory: number;
  accountPayables: number;
}

export interface FMPCashFlowStatement {
  date: string;
  symbol: string;
  netIncome: number;
  depreciationAndAmortization: number;
  stockBasedCompensation: number;
  changeInWorkingCapital: number;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
}

export interface FMPCompanyProfile {
  symbol: string;
  companyName: string;
  currency: string;
  exchange: string;
  industry: string;
  sector: string;
  country: string;
  mktCap: number;
  price: number;
  beta: number;
  volAvg: number;
  lastDiv: number;
  range: string;
  changes: number;
  ceo: string;
  fullTimeEmployees: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dcfDiff: number;
  dcf: number;
  description: string;
}

export interface FMPQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  volume: number;
  avgVolume: number;
  exchange: string;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  sharesOutstanding: number;
}

async function fetchFMP<T>(endpoint: string): Promise<T> {
  const apiKey = getApiKey();
  const url = `${FMP_BASE_URL}${endpoint}?apikey=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch company profile
 */
export async function getCompanyProfile(ticker: string): Promise<FMPCompanyProfile> {
  const data = await fetchFMP<FMPCompanyProfile[]>(`/profile/${ticker}`);
  if (!data || data.length === 0) {
    throw new Error(`Company not found: ${ticker}`);
  }
  return data[0];
}

/**
 * Fetch real-time quote
 */
export async function getQuote(ticker: string): Promise<FMPQuote> {
  const data = await fetchFMP<FMPQuote[]>(`/quote/${ticker}`);
  if (!data || data.length === 0) {
    throw new Error(`Quote not found: ${ticker}`);
  }
  return data[0];
}

/**
 * Fetch historical income statements
 */
export async function getIncomeStatements(
  ticker: string,
  period: "annual" | "quarter" = "annual",
  limit = 10
): Promise<FMPIncomeStatement[]> {
  return fetchFMP<FMPIncomeStatement[]>(`/income-statement/${ticker}?period=${period}&limit=${limit}`);
}

/**
 * Fetch historical balance sheets
 */
export async function getBalanceSheets(
  ticker: string,
  period: "annual" | "quarter" = "annual",
  limit = 10
): Promise<FMPBalanceSheet[]> {
  return fetchFMP<FMPBalanceSheet[]>(`/balance-sheet-statement/${ticker}?period=${period}&limit=${limit}`);
}

/**
 * Fetch historical cash flow statements
 */
export async function getCashFlowStatements(
  ticker: string,
  period: "annual" | "quarter" = "annual",
  limit = 10
): Promise<FMPCashFlowStatement[]> {
  return fetchFMP<FMPCashFlowStatement[]>(`/cash-flow-statement/${ticker}?period=${period}&limit=${limit}`);
}

/**
 * Search for tickers
 */
export async function searchTickers(query: string): Promise<{ symbol: string; name: string; exchangeShortName: string }[]> {
  const apiKey = getApiKey();
  const url = `${FMP_BASE_URL}/search?query=${encodeURIComponent(query)}&limit=10&apikey=${apiKey}`;
  const response = await fetch(url);
  return response.json();
}

/**
 * Fetch all financial data for a company and normalize it
 */
export async function getCompanyFinancials(ticker: string): Promise<CompanyData> {
  // Fetch all data in parallel
  const [profile, quote, incomeStatements, balanceSheets, cashFlowStatements] = await Promise.all([
    getCompanyProfile(ticker),
    getQuote(ticker),
    getIncomeStatements(ticker, "annual", 10),
    getBalanceSheets(ticker, "annual", 10),
    getCashFlowStatements(ticker, "annual", 10),
  ]);

  // Normalize and combine financial statements
  const historicalFinancials: FinancialStatement[] = incomeStatements
    .map((income, index) => {
      const balance = balanceSheets[index];
      const cashFlow = cashFlowStatements[index];

      if (!balance || !cashFlow) return null;

      const year = new Date(income.date).getFullYear();

      return {
        year,
        revenue: income.revenue,
        costOfRevenue: income.costOfRevenue,
        grossProfit: income.grossProfit,
        operatingExpenses: income.operatingExpenses,
        operatingIncome: income.operatingIncome,
        interestExpense: income.interestExpense,
        incomeBeforeTax: income.incomeBeforeTax,
        incomeTaxExpense: income.incomeTaxExpense,
        netIncome: income.netIncome,
        depreciation: cashFlow.depreciationAndAmortization,
        capitalExpenditures: Math.abs(cashFlow.capitalExpenditure),
        changeInWorkingCapital: cashFlow.changeInWorkingCapital,
        totalDebt: balance.totalDebt,
        totalEquity: balance.totalStockholdersEquity,
        sharesOutstanding: income.weightedAverageShsOutDil || income.weightedAverageShsOut,
      };
    })
    .filter((f): f is FinancialStatement => f !== null)
    .reverse(); // Oldest first

  return {
    ticker: profile.symbol,
    name: profile.companyName,
    sector: profile.sector,
    industry: profile.industry,
    currentPrice: quote.price,
    marketCap: quote.marketCap,
    beta: profile.beta,
    sharesOutstanding: quote.sharesOutstanding,
    historicalFinancials,
  };
}

/**
 * Get risk-free rate (10Y Treasury) - using FMP's treasury rates
 */
export async function getRiskFreeRate(): Promise<number> {
  try {
    const data = await fetchFMP<{ date: string; month1: number; year10: number }[]>("/treasury?limit=1");
    if (data && data.length > 0) {
      return data[0].year10 / 100; // Convert from percentage to decimal
    }
  } catch (error) {
    console.warn("Failed to fetch treasury rate, using default", error);
  }
  // Default to 4.5% if API fails
  return 0.045;
}
