"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import type { DCFAssumptions, WACCInputs, TerminalValueInputs } from "@/lib/dcf/types";
import { formatPercent } from "@/lib/dcf/calculations";
import type { Scenario } from "@/store/modelStore";

interface AssumptionPanelProps {
  assumptions: DCFAssumptions;
  waccInputs: WACCInputs;
  terminalInputs: TerminalValueInputs;
  scenario: Scenario;
  onAssumptionsChange: (assumptions: DCFAssumptions) => void;
  onWACCChange: (inputs: WACCInputs) => void;
  onTerminalChange: (inputs: TerminalValueInputs) => void;
  aiReasoning?: {
    revenueGrowth: string;
    margins: string;
    wacc: string;
    terminalValue: string;
  } | null;
}

export function AssumptionPanel({
  assumptions,
  waccInputs,
  terminalInputs,
  scenario,
  onAssumptionsChange,
  onWACCChange,
  onTerminalChange,
  aiReasoning,
}: AssumptionPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    growth: true,
    margins: true,
    wacc: false,
    terminal: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateGrowthRate = (index: number, value: number) => {
    const newRates = [...assumptions.revenueGrowthRates];
    newRates[index] = value / 100;
    onAssumptionsChange({ ...assumptions, revenueGrowthRates: newRates });
  };

  const scenarioColors = {
    bull: "border-green-500 bg-green-50",
    base: "border-blue-500 bg-blue-50",
    bear: "border-red-500 bg-red-50",
  };

  return (
    <div className={`rounded-xl border-2 ${scenarioColors[scenario]} p-4 space-y-4`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground capitalize">{scenario} Case</h3>
        {aiReasoning && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            AI Generated
          </span>
        )}
      </div>

      {/* Revenue Growth Section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("growth")}
          className="w-full flex items-center justify-between p-3 bg-background hover:bg-accent"
        >
          <span className="font-medium text-sm">Revenue Growth</span>
          {expandedSections.growth ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.growth && (
          <div className="p-3 space-y-3 bg-card">
            {assumptions.revenueGrowthRates.map((rate, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Year {idx + 1}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-20"
                    max="50"
                    step="1"
                    value={rate * 100}
                    onChange={(e) => updateGrowthRate(idx, Number(e.target.value))}
                    className="w-24"
                  />
                  <input
                    type="number"
                    value={(rate * 100).toFixed(1)}
                    onChange={(e) => updateGrowthRate(idx, Number(e.target.value))}
                    className="w-16 px-2 py-1 text-sm border border-input rounded text-right"
                  />
                  <span className="text-sm">%</span>
                </div>
              </div>
            ))}
            {aiReasoning?.revenueGrowth && (
              <p className="text-xs text-muted-foreground mt-2 p-2 bg-background rounded">
                {aiReasoning.revenueGrowth}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Margins Section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("margins")}
          className="w-full flex items-center justify-between p-3 bg-background hover:bg-accent"
        >
          <span className="font-medium text-sm">Margins & Costs</span>
          {expandedSections.margins ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.margins && (
          <div className="p-3 space-y-3 bg-card">
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Gross Margin</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={(assumptions.grossMargin * 100).toFixed(1)}
                  onChange={(e) =>
                    onAssumptionsChange({
                      ...assumptions,
                      grossMargin: Number(e.target.value) / 100,
                    })
                  }
                  className="w-16 px-2 py-1 text-sm border border-input rounded text-right"
                />
                <span className="text-sm">%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Operating Margin</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={(assumptions.operatingMargin * 100).toFixed(1)}
                  onChange={(e) =>
                    onAssumptionsChange({
                      ...assumptions,
                      operatingMargin: Number(e.target.value) / 100,
                    })
                  }
                  className="w-16 px-2 py-1 text-sm border border-input rounded text-right"
                />
                <span className="text-sm">%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Tax Rate</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={(assumptions.taxRate * 100).toFixed(1)}
                  onChange={(e) =>
                    onAssumptionsChange({
                      ...assumptions,
                      taxRate: Number(e.target.value) / 100,
                    })
                  }
                  className="w-16 px-2 py-1 text-sm border border-input rounded text-right"
                />
                <span className="text-sm">%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">CapEx % of Revenue</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={(assumptions.capexAsPercentOfRevenue * 100).toFixed(1)}
                  onChange={(e) =>
                    onAssumptionsChange({
                      ...assumptions,
                      capexAsPercentOfRevenue: Number(e.target.value) / 100,
                    })
                  }
                  className="w-16 px-2 py-1 text-sm border border-input rounded text-right"
                />
                <span className="text-sm">%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* WACC Section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("wacc")}
          className="w-full flex items-center justify-between p-3 bg-background hover:bg-accent"
        >
          <span className="font-medium text-sm">WACC Components</span>
          {expandedSections.wacc ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.wacc && (
          <div className="p-3 space-y-3 bg-card">
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Risk-Free Rate</label>
              <span className="text-sm font-medium">
                {formatPercent(waccInputs.riskFreeRate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Beta</label>
              <input
                type="number"
                step="0.1"
                value={waccInputs.beta.toFixed(2)}
                onChange={(e) =>
                  onWACCChange({ ...waccInputs, beta: Number(e.target.value) })
                }
                className="w-16 px-2 py-1 text-sm border border-input rounded text-right"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Equity Risk Premium</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={(waccInputs.equityRiskPremium * 100).toFixed(1)}
                  onChange={(e) =>
                    onWACCChange({
                      ...waccInputs,
                      equityRiskPremium: Number(e.target.value) / 100,
                    })
                  }
                  className="w-16 px-2 py-1 text-sm border border-input rounded text-right"
                />
                <span className="text-sm">%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Cost of Debt</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={(waccInputs.costOfDebt * 100).toFixed(1)}
                  onChange={(e) =>
                    onWACCChange({
                      ...waccInputs,
                      costOfDebt: Number(e.target.value) / 100,
                    })
                  }
                  className="w-16 px-2 py-1 text-sm border border-input rounded text-right"
                />
                <span className="text-sm">%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Value Section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("terminal")}
          className="w-full flex items-center justify-between p-3 bg-background hover:bg-accent"
        >
          <span className="font-medium text-sm">Terminal Value</span>
          {expandedSections.terminal ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.terminal && (
          <div className="p-3 space-y-3 bg-card">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={terminalInputs.method === "perpetuity"}
                  onChange={() =>
                    onTerminalChange({ ...terminalInputs, method: "perpetuity" })
                  }
                />
                <span className="text-sm">Perpetuity Growth</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={terminalInputs.method === "exitMultiple"}
                  onChange={() =>
                    onTerminalChange({ ...terminalInputs, method: "exitMultiple" })
                  }
                />
                <span className="text-sm">Exit Multiple</span>
              </label>
            </div>
            {terminalInputs.method === "perpetuity" && (
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Growth Rate</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={((terminalInputs.perpetuityGrowthRate || 0) * 100).toFixed(1)}
                    onChange={(e) =>
                      onTerminalChange({
                        ...terminalInputs,
                        perpetuityGrowthRate: Number(e.target.value) / 100,
                      })
                    }
                    className="w-16 px-2 py-1 text-sm border border-input rounded text-right"
                  />
                  <span className="text-sm">%</span>
                </div>
              </div>
            )}
            {terminalInputs.method === "exitMultiple" && (
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">EV/EBITDA Multiple</label>
                <input
                  type="number"
                  value={terminalInputs.exitMultiple || 10}
                  onChange={(e) =>
                    onTerminalChange({
                      ...terminalInputs,
                      exitMultiple: Number(e.target.value),
                    })
                  }
                  className="w-16 px-2 py-1 text-sm border border-input rounded text-right"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
