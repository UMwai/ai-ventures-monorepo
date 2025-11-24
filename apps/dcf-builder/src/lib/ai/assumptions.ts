/**
 * AI-powered assumption generation for DCF models
 * Uses multi-model orchestration (GPT-5 + Claude 4.5 + Gemini 3)
 */

import {
  gpt5Completion,
  claudeOpusCompletion,
  geminiProCompletion,
  structuredOutput,
} from "@ai-ventures/ai-sdk";
import type { FinancialStatement, DCFAssumptions, WACCInputs, TerminalValueInputs } from "../dcf/types";

export interface AIAssumptionResponse {
  assumptions: {
    bull: DCFAssumptions;
    base: DCFAssumptions;
    bear: DCFAssumptions;
  };
  waccInputs: WACCInputs;
  terminalInputs: TerminalValueInputs;
  reasoning: {
    revenueGrowth: string;
    margins: string;
    wacc: string;
    terminalValue: string;
  };
  risks: string[];
  catalysts: string[];
}

/**
 * Generate DCF assumptions using AI
 */
export async function generateAssumptions(
  ticker: string,
  companyName: string,
  sector: string,
  industry: string,
  currentPrice: number,
  marketCap: number,
  beta: number,
  historicalFinancials: FinancialStatement[],
  riskFreeRate: number
): Promise<AIAssumptionResponse> {
  // Calculate historical metrics for context
  const recentYear = historicalFinancials[historicalFinancials.length - 1];
  const fiveYearsAgo = historicalFinancials[Math.max(0, historicalFinancials.length - 5)];

  const historicalRevenueCAGR =
    Math.pow(recentYear.revenue / fiveYearsAgo.revenue, 1 / Math.min(5, historicalFinancials.length - 1)) - 1;

  const avgGrossMargin =
    historicalFinancials.reduce((sum, f) => sum + f.grossProfit / f.revenue, 0) /
    historicalFinancials.length;

  const avgOperatingMargin =
    historicalFinancials.reduce((sum, f) => sum + f.operatingIncome / f.revenue, 0) /
    historicalFinancials.length;

  const avgTaxRate =
    historicalFinancials.reduce((sum, f) => sum + f.incomeTaxExpense / Math.max(1, f.incomeBeforeTax), 0) /
    historicalFinancials.length;

  const avgCapexPercent =
    historicalFinancials.reduce((sum, f) => sum + f.capitalExpenditures / f.revenue, 0) /
    historicalFinancials.length;

  const avgDepreciationPercent =
    historicalFinancials.reduce((sum, f) => sum + f.depreciation / f.revenue, 0) /
    historicalFinancials.length;

  const prompt = `You are a professional equity research analyst building a DCF model for ${companyName} (${ticker}).

COMPANY INFORMATION:
- Sector: ${sector}
- Industry: ${industry}
- Current Price: $${currentPrice.toFixed(2)}
- Market Cap: $${(marketCap / 1e9).toFixed(2)}B
- Beta: ${beta.toFixed(2)}
- Risk-Free Rate: ${(riskFreeRate * 100).toFixed(2)}%

HISTORICAL METRICS (Last ${historicalFinancials.length} years):
- Revenue CAGR: ${(historicalRevenueCAGR * 100).toFixed(1)}%
- Latest Revenue: $${(recentYear.revenue / 1e9).toFixed(2)}B
- Avg Gross Margin: ${(avgGrossMargin * 100).toFixed(1)}%
- Avg Operating Margin: ${(avgOperatingMargin * 100).toFixed(1)}%
- Avg Tax Rate: ${(avgTaxRate * 100).toFixed(1)}%
- Avg CapEx % of Revenue: ${(avgCapexPercent * 100).toFixed(1)}%
- Avg D&A % of Revenue: ${(avgDepreciationPercent * 100).toFixed(1)}%

Generate DCF assumptions for THREE scenarios (Bull, Base, Bear) over a 5-year projection period.

For each scenario, provide:
1. Revenue growth rates for each of the 5 years (as decimals, e.g., 0.15 for 15%)
2. Gross margin (as decimal)
3. Operating margin (as decimal)
4. Tax rate (as decimal)
5. D&A as % of revenue (as decimal)
6. CapEx as % of revenue (as decimal)
7. NWC as % of revenue (as decimal)

Also provide:
- WACC inputs: equity risk premium (typically 5-6%), cost of debt estimate
- Terminal value: perpetuity growth rate (typically 2-3%)
- Reasoning for each major assumption
- Key risks and catalysts

Respond in JSON format matching this schema:
{
  "assumptions": {
    "bull": {
      "revenueGrowthRates": [0.20, 0.18, 0.15, 0.12, 0.10],
      "grossMargin": 0.45,
      "operatingMargin": 0.25,
      "taxRate": 0.21,
      "depreciationAsPercentOfRevenue": 0.03,
      "capexAsPercentOfRevenue": 0.04,
      "nwcAsPercentOfRevenue": 0.08,
      "projectionYears": 5
    },
    "base": { ... },
    "bear": { ... }
  },
  "waccInputs": {
    "equityRiskPremium": 0.055,
    "costOfDebt": 0.05
  },
  "terminalInputs": {
    "method": "perpetuity",
    "perpetuityGrowthRate": 0.025
  },
  "reasoning": {
    "revenueGrowth": "Explanation of revenue assumptions...",
    "margins": "Explanation of margin assumptions...",
    "wacc": "Explanation of discount rate...",
    "terminalValue": "Explanation of terminal value..."
  },
  "risks": ["Risk 1", "Risk 2", "Risk 3"],
  "catalysts": ["Catalyst 1", "Catalyst 2", "Catalyst 3"]
}`;

  try {
    // Use GPT-5 for financial analysis (strong at structured reasoning)
    const response = await gpt5Completion(prompt, {
      systemPrompt:
        "You are a senior equity research analyst at a top investment bank. Provide realistic, well-reasoned DCF assumptions based on industry benchmarks and company-specific factors. Be conservative in your base case.",
      maxTokens: 2000,
      temperature: 0.3, // Lower temperature for more consistent financial analysis
    });

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Complete the WACC inputs with actual data
    const totalDebt = recentYear.totalDebt;
    const waccInputs: WACCInputs = {
      riskFreeRate,
      beta,
      equityRiskPremium: parsed.waccInputs.equityRiskPremium,
      costOfDebt: parsed.waccInputs.costOfDebt,
      marketCapEquity: marketCap,
      totalDebt,
      taxRate: parsed.assumptions.base.taxRate,
    };

    const terminalInputs: TerminalValueInputs = {
      method: parsed.terminalInputs.method,
      perpetuityGrowthRate: parsed.terminalInputs.perpetuityGrowthRate,
    };

    return {
      assumptions: parsed.assumptions,
      waccInputs,
      terminalInputs,
      reasoning: parsed.reasoning,
      risks: parsed.risks,
      catalysts: parsed.catalysts,
    };
  } catch (error) {
    console.error("AI assumption generation failed:", error);

    // Fallback to conservative defaults
    return generateDefaultAssumptions(
      historicalRevenueCAGR,
      avgGrossMargin,
      avgOperatingMargin,
      avgTaxRate,
      avgDepreciationPercent,
      avgCapexPercent,
      riskFreeRate,
      beta,
      marketCap,
      recentYear.totalDebt
    );
  }
}

/**
 * Generate default assumptions when AI fails
 */
function generateDefaultAssumptions(
  historicalCAGR: number,
  grossMargin: number,
  operatingMargin: number,
  taxRate: number,
  depreciationPercent: number,
  capexPercent: number,
  riskFreeRate: number,
  beta: number,
  marketCap: number,
  totalDebt: number
): AIAssumptionResponse {
  // Conservative base case: fade growth towards GDP growth
  const baseGrowth = Math.min(historicalCAGR, 0.15);
  const fadeRate = 0.02;

  const baseAssumptions: DCFAssumptions = {
    revenueGrowthRates: [
      baseGrowth,
      baseGrowth - fadeRate,
      baseGrowth - fadeRate * 2,
      baseGrowth - fadeRate * 3,
      Math.max(0.03, baseGrowth - fadeRate * 4),
    ],
    grossMargin: grossMargin * 0.98, // Slight margin compression
    operatingMargin: operatingMargin * 0.95,
    taxRate: Math.max(taxRate, 0.21),
    depreciationAsPercentOfRevenue: depreciationPercent,
    capexAsPercentOfRevenue: capexPercent,
    nwcAsPercentOfRevenue: 0.10,
    projectionYears: 5,
  };

  const bullAssumptions: DCFAssumptions = {
    ...baseAssumptions,
    revenueGrowthRates: baseAssumptions.revenueGrowthRates.map((g) => g * 1.3),
    grossMargin: grossMargin * 1.02,
    operatingMargin: operatingMargin * 1.1,
  };

  const bearAssumptions: DCFAssumptions = {
    ...baseAssumptions,
    revenueGrowthRates: baseAssumptions.revenueGrowthRates.map((g) => g * 0.5),
    grossMargin: grossMargin * 0.95,
    operatingMargin: operatingMargin * 0.8,
  };

  return {
    assumptions: {
      bull: bullAssumptions,
      base: baseAssumptions,
      bear: bearAssumptions,
    },
    waccInputs: {
      riskFreeRate,
      beta,
      equityRiskPremium: 0.055,
      costOfDebt: 0.05,
      marketCapEquity: marketCap,
      totalDebt,
      taxRate: baseAssumptions.taxRate,
    },
    terminalInputs: {
      method: "perpetuity",
      perpetuityGrowthRate: 0.025,
    },
    reasoning: {
      revenueGrowth: "Based on historical CAGR with gradual fade to long-term GDP growth.",
      margins: "Assumes slight margin compression from competitive pressures.",
      wacc: "Using CAPM with standard equity risk premium.",
      terminalValue: "Gordon Growth Model with 2.5% perpetuity growth (long-term GDP).",
    },
    risks: ["Competitive pressure", "Margin compression", "Economic slowdown"],
    catalysts: ["Market expansion", "New products", "Operating leverage"],
  };
}

/**
 * Generate investment thesis using AI
 */
export async function generateThesis(
  ticker: string,
  companyName: string,
  intrinsicValue: number,
  currentPrice: number,
  impliedUpside: number,
  assumptions: DCFAssumptions,
  risks: string[],
  catalysts: string[]
): Promise<string> {
  const prompt = `Write a concise investment thesis for ${companyName} (${ticker}).

VALUATION SUMMARY:
- Current Price: $${currentPrice.toFixed(2)}
- Intrinsic Value (DCF): $${intrinsicValue.toFixed(2)}
- Implied Upside: ${(impliedUpside * 100).toFixed(1)}%

KEY ASSUMPTIONS:
- Revenue Growth (Yr 1-5): ${assumptions.revenueGrowthRates.map((g) => (g * 100).toFixed(0) + "%").join(", ")}
- Operating Margin: ${(assumptions.operatingMargin * 100).toFixed(1)}%

RISKS: ${risks.join(", ")}
CATALYSTS: ${catalysts.join(", ")}

Write a 2-3 paragraph investment thesis explaining:
1. Why the stock is undervalued (or overvalued)
2. The key assumptions driving the valuation
3. What could go wrong (risks) and what could drive upside (catalysts)

Be balanced and professional. Do not use hyperbolic language.`;

  try {
    const thesis = await claudeOpusCompletion(prompt, {
      systemPrompt:
        "You are a seasoned portfolio manager writing a brief investment memo. Be concise, balanced, and professional.",
      maxTokens: 800,
      temperature: 0.5,
    });

    return thesis;
  } catch (error) {
    console.error("Thesis generation failed:", error);
    return `Based on our DCF analysis, ${companyName} appears to be ${
      impliedUpside > 0 ? "undervalued" : "overvalued"
    } by approximately ${Math.abs(impliedUpside * 100).toFixed(0)}%. Key risks include ${risks.slice(0, 2).join(" and ")}. Potential catalysts include ${catalysts.slice(0, 2).join(" and ")}.`;
  }
}
