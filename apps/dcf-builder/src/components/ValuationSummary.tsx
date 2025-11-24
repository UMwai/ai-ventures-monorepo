"use client";

import { ArrowUp, ArrowDown, TrendingUp, DollarSign, Percent } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/dcf/calculations";
import type { DCFResult } from "@/lib/dcf/types";

interface ValuationSummaryProps {
  result: DCFResult;
  companyName: string;
  ticker: string;
}

export function ValuationSummary({ result, companyName, ticker }: ValuationSummaryProps) {
  const isUndervalued = result.impliedUpside > 0;

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{ticker}</h2>
          <p className="text-muted-foreground">{companyName}</p>
        </div>
        <div
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            isUndervalued
              ? "bg-profit-light text-profit"
              : "bg-loss-light text-loss"
          }`}
        >
          {isUndervalued ? "Undervalued" : "Overvalued"}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Intrinsic Value */}
        <div className="bg-background rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Intrinsic Value</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            ${result.intrinsicValuePerShare.toFixed(2)}
          </p>
        </div>

        {/* Current Price */}
        <div className="bg-background rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Current Price</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            ${result.currentPrice.toFixed(2)}
          </p>
        </div>

        {/* Implied Upside */}
        <div className="bg-background rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            {isUndervalued ? (
              <ArrowUp className="h-4 w-4 text-profit" />
            ) : (
              <ArrowDown className="h-4 w-4 text-loss" />
            )}
            <span className="text-sm">Implied Upside</span>
          </div>
          <p
            className={`text-2xl font-bold ${
              isUndervalued ? "text-profit" : "text-loss"
            }`}
          >
            {formatPercent(result.impliedUpside)}
          </p>
        </div>

        {/* WACC */}
        <div className="bg-background rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Percent className="h-4 w-4" />
            <span className="text-sm">WACC</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatPercent(result.wacc)}
          </p>
        </div>
      </div>

      {/* Value Bridge */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Value Bridge</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">PV of Cash Flows</span>
            <span className="font-medium">{formatCurrency(result.sumOfPVs)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">PV of Terminal Value</span>
            <span className="font-medium">{formatCurrency(result.terminalValuePV)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <span className="text-muted-foreground">Enterprise Value</span>
            <span className="font-semibold">{formatCurrency(result.enterpriseValue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Less: Net Debt</span>
            <span className="font-medium text-loss">
              ({formatCurrency(result.netDebt)})
            </span>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <span className="text-muted-foreground">Equity Value</span>
            <span className="font-semibold">{formatCurrency(result.equityValue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shares Outstanding</span>
            <span className="font-medium">
              {(result.sharesOutstanding / 1e9).toFixed(2)}B
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
