"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  Sparkles,
  Calculator,
  ArrowLeft,
  Download,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useModelStore, type Scenario } from "@/store/modelStore";
import { TickerSearch } from "@/components/TickerSearch";
import { ValuationSummary } from "@/components/ValuationSummary";
import { SensitivityTable } from "@/components/SensitivityTable";
import { AssumptionPanel } from "@/components/AssumptionPanel";
import type { CompanyData, DCFAssumptions, WACCInputs, TerminalValueInputs } from "@/lib/dcf/types";

export default function NewModelPage() {
  const searchParams = useSearchParams();
  const initialTicker = searchParams.get("ticker");

  const {
    company,
    riskFreeRate,
    isLoadingCompany,
    assumptions,
    waccInputs,
    terminalInputs,
    aiReasoning,
    risks,
    catalysts,
    results,
    sensitivityTable,
    activeScenario,
    isCalculating,
    isGeneratingAI,
    setCompany,
    setLoadingCompany,
    setAllAssumptions,
    setAssumptions,
    setWACCInputs,
    setTerminalInputs,
    setAIContext,
    setResult,
    setSensitivityTable,
    setActiveScenario,
    setCalculating,
    setGeneratingAI,
    reset,
  } = useModelStore();

  const [error, setError] = useState<string | null>(null);

  // Load company data on initial ticker
  useEffect(() => {
    if (initialTicker && !company) {
      loadCompany(initialTicker);
    }
  }, [initialTicker]);

  const loadCompany = async (ticker: string) => {
    setLoadingCompany(true);
    setError(null);
    reset();

    try {
      const response = await fetch(`/api/financials/${ticker}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch company data");
      }

      setCompany(data.data, data.data.riskFreeRate);

      // Auto-generate AI assumptions
      await generateAIAssumptions(data.data, data.data.riskFreeRate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load company data");
      setLoadingCompany(false);
    }
  };

  const generateAIAssumptions = async (companyData: CompanyData, rfRate: number) => {
    setGeneratingAI(true);
    try {
      const response = await fetch("/api/ai/assumptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: companyData.ticker,
          companyName: companyData.name,
          sector: companyData.sector,
          industry: companyData.industry,
          currentPrice: companyData.currentPrice,
          marketCap: companyData.marketCap,
          beta: companyData.beta,
          historicalFinancials: companyData.historicalFinancials,
          riskFreeRate: rfRate,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAllAssumptions(data.assumptions);
        setWACCInputs(data.waccInputs);
        setTerminalInputs(data.terminalInputs);
        setAIContext(data.reasoning, data.risks, data.catalysts);

        // Auto-calculate DCF for all scenarios
        await calculateAllScenarios(companyData, data.assumptions, data.waccInputs, data.terminalInputs);
      } else {
        // Fall back to manual defaults
        setDefaultAssumptions(companyData, rfRate);
      }
    } catch (err) {
      console.error("AI assumption generation failed:", err);
      setDefaultAssumptions(companyData, rfRate);
    } finally {
      setGeneratingAI(false);
    }
  };

  const setDefaultAssumptions = (companyData: CompanyData, rfRate: number) => {
    const recentYear = companyData.historicalFinancials[companyData.historicalFinancials.length - 1];

    const baseAssumptions: DCFAssumptions = {
      revenueGrowthRates: [0.10, 0.08, 0.06, 0.05, 0.04],
      grossMargin: recentYear.grossProfit / recentYear.revenue,
      operatingMargin: recentYear.operatingIncome / recentYear.revenue,
      taxRate: 0.21,
      depreciationAsPercentOfRevenue: recentYear.depreciation / recentYear.revenue,
      capexAsPercentOfRevenue: recentYear.capitalExpenditures / recentYear.revenue,
      nwcAsPercentOfRevenue: 0.10,
      projectionYears: 5,
    };

    const defaultWacc: WACCInputs = {
      riskFreeRate: rfRate,
      beta: companyData.beta,
      equityRiskPremium: 0.055,
      costOfDebt: 0.05,
      marketCapEquity: companyData.marketCap,
      totalDebt: recentYear.totalDebt,
      taxRate: 0.21,
    };

    const defaultTerminal: TerminalValueInputs = {
      method: "perpetuity",
      perpetuityGrowthRate: 0.025,
    };

    setAllAssumptions({
      bull: { ...baseAssumptions, revenueGrowthRates: baseAssumptions.revenueGrowthRates.map(r => r * 1.3) },
      base: baseAssumptions,
      bear: { ...baseAssumptions, revenueGrowthRates: baseAssumptions.revenueGrowthRates.map(r => r * 0.5) },
    });
    setWACCInputs(defaultWacc);
    setTerminalInputs(defaultTerminal);
  };

  const calculateAllScenarios = async (
    companyData: CompanyData,
    allAssumptions: Record<Scenario, DCFAssumptions>,
    wacc: WACCInputs,
    terminal: TerminalValueInputs
  ) => {
    setCalculating(true);
    const recentYear = companyData.historicalFinancials[companyData.historicalFinancials.length - 1];

    for (const scenario of ["bull", "base", "bear"] as Scenario[]) {
      try {
        const response = await fetch("/api/dcf/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company: {
              ticker: companyData.ticker,
              currentPrice: companyData.currentPrice,
              sharesOutstanding: companyData.sharesOutstanding,
              totalDebt: recentYear.totalDebt,
              cash: 0, // Would need to fetch from balance sheet
              historicalFinancials: companyData.historicalFinancials,
            },
            assumptions: allAssumptions[scenario],
            waccInputs: wacc,
            terminalInputs: terminal,
            includeSensitivity: scenario === "base",
          }),
        });

        const data = await response.json();

        if (data.success) {
          setResult(scenario, data.result);
          if (scenario === "base" && data.sensitivityTable) {
            setSensitivityTable(data.sensitivityTable);
          }
        }
      } catch (err) {
        console.error(`Failed to calculate ${scenario} scenario:`, err);
      }
    }
    setCalculating(false);
  };

  const recalculate = async () => {
    if (!company || !assumptions.base || !waccInputs || !terminalInputs) return;
    await calculateAllScenarios(company, assumptions as Record<Scenario, DCFAssumptions>, waccInputs, terminalInputs);
  };

  const currentResult = results[activeScenario];
  const currentAssumptions = assumptions[activeScenario];

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-semibold">
              {company ? `${company.ticker} - ${company.name}` : "New DCF Model"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </button>
            <button className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Search (if no company loaded) */}
        {!company && !isLoadingCompany && (
          <div className="max-w-md mx-auto py-20 text-center">
            <h2 className="text-2xl font-bold mb-4">Enter a Stock Ticker</h2>
            <TickerSearch onSelect={loadCompany} />
            {error && <p className="text-destructive mt-4">{error}</p>}
          </div>
        )}

        {/* Loading State */}
        {isLoadingCompany && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading financial data...</p>
          </div>
        )}

        {/* AI Generating State */}
        {isGeneratingAI && (
          <div className="flex flex-col items-center justify-center py-20">
            <Sparkles className="h-8 w-8 animate-pulse text-primary mb-4" />
            <p className="text-muted-foreground">AI is generating assumptions...</p>
          </div>
        )}

        {/* Main Content */}
        {company && !isLoadingCompany && !isGeneratingAI && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Assumptions */}
            <div className="lg:col-span-1 space-y-4">
              {/* Scenario Tabs */}
              <div className="flex gap-2">
                {(["bull", "base", "bear"] as Scenario[]).map((scenario) => (
                  <button
                    key={scenario}
                    onClick={() => setActiveScenario(scenario)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium capitalize ${
                      activeScenario === scenario
                        ? scenario === "bull"
                          ? "bg-green-100 text-green-800 border-2 border-green-500"
                          : scenario === "base"
                          ? "bg-blue-100 text-blue-800 border-2 border-blue-500"
                          : "bg-red-100 text-red-800 border-2 border-red-500"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {scenario}
                  </button>
                ))}
              </div>

              {/* Assumption Panel */}
              {currentAssumptions && waccInputs && terminalInputs && (
                <AssumptionPanel
                  assumptions={currentAssumptions}
                  waccInputs={waccInputs}
                  terminalInputs={terminalInputs}
                  scenario={activeScenario}
                  onAssumptionsChange={(a) => setAssumptions(activeScenario, a)}
                  onWACCChange={setWACCInputs}
                  onTerminalChange={setTerminalInputs}
                  aiReasoning={aiReasoning}
                />
              )}

              {/* Recalculate Button */}
              <button
                onClick={recalculate}
                disabled={isCalculating}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCalculating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Calculator className="h-4 w-4" />
                )}
                {isCalculating ? "Calculating..." : "Recalculate DCF"}
              </button>

              {/* Risks & Catalysts */}
              {(risks.length > 0 || catalysts.length > 0) && (
                <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                  {risks.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-destructive">Key Risks</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {risks.map((risk, idx) => (
                          <li key={idx}>- {risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {catalysts.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-green-600">Catalysts</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {catalysts.map((catalyst, idx) => (
                          <li key={idx}>+ {catalyst}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Results */}
            <div className="lg:col-span-2 space-y-6">
              {/* Valuation Summary */}
              {currentResult && (
                <ValuationSummary
                  result={currentResult}
                  companyName={company.name}
                  ticker={company.ticker}
                />
              )}

              {/* Sensitivity Table */}
              {sensitivityTable && currentResult && terminalInputs && (
                <SensitivityTable
                  table={sensitivityTable}
                  currentPrice={company.currentPrice}
                  baseWacc={currentResult.wacc}
                  baseGrowth={terminalInputs.perpetuityGrowthRate || 0.025}
                />
              )}

              {/* Scenario Comparison */}
              {results.bull && results.base && results.bear && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-semibold mb-4">Scenario Comparison</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Bull Case</p>
                      <p className="text-2xl font-bold text-green-700">
                        ${results.bull.intrinsicValuePerShare.toFixed(2)}
                      </p>
                      <p className="text-sm text-green-600">
                        {((results.bull.impliedUpside) * 100).toFixed(0)}% upside
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Base Case</p>
                      <p className="text-2xl font-bold text-blue-700">
                        ${results.base.intrinsicValuePerShare.toFixed(2)}
                      </p>
                      <p className="text-sm text-blue-600">
                        {((results.base.impliedUpside) * 100).toFixed(0)}% upside
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Bear Case</p>
                      <p className="text-2xl font-bold text-red-700">
                        ${results.bear.intrinsicValuePerShare.toFixed(2)}
                      </p>
                      <p className="text-sm text-red-600">
                        {((results.bear.impliedUpside) * 100).toFixed(0)}% upside
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
