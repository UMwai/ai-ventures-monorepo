"use client";

import { useState, useEffect } from "react";
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { formatPercent } from "@/lib/dcf/calculations";

interface ReverseDCFProps {
  currentPrice: number;
  impliedGrowth: number | null;
  historicalGrowth: number;
  industryAvgGrowth?: number;
}

export function ReverseDCF({
  currentPrice,
  impliedGrowth,
  historicalGrowth,
  industryAvgGrowth = 0.08,
}: ReverseDCFProps) {
  if (impliedGrowth === null) {
    return null;
  }

  // Determine if implied growth is realistic
  const isAggressive = impliedGrowth > historicalGrowth * 1.5;
  const isConservative = impliedGrowth < historicalGrowth * 0.5;
  const isRealistic = !isAggressive && !isConservative;

  const getGrowthAssessment = () => {
    if (impliedGrowth < 0) {
      return {
        label: "Decline Expected",
        description: "Market is pricing in revenue decline",
        color: "text-red-600",
        bgColor: "bg-red-50",
        icon: AlertTriangle,
      };
    }
    if (impliedGrowth < 0.03) {
      return {
        label: "Low Growth",
        description: "Market expects near-GDP growth",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        icon: AlertTriangle,
      };
    }
    if (impliedGrowth < 0.10) {
      return {
        label: "Moderate Growth",
        description: "Reasonable expectations",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        icon: CheckCircle,
      };
    }
    if (impliedGrowth < 0.20) {
      return {
        label: "High Growth",
        description: "Market expects strong performance",
        color: "text-green-600",
        bgColor: "bg-green-50",
        icon: TrendingUp,
      };
    }
    return {
      label: "Very High Growth",
      description: "Aggressive expectations - high bar to clear",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      icon: TrendingUp,
    };
  };

  const assessment = getGrowthAssessment();
  const Icon = assessment.icon;

  // Growth comparison bar
  const maxGrowth = Math.max(impliedGrowth, historicalGrowth, industryAvgGrowth, 0.30);
  const impliedWidth = Math.min((impliedGrowth / maxGrowth) * 100, 100);
  const historicalWidth = Math.min((historicalGrowth / maxGrowth) * 100, 100);
  const industryWidth = Math.min((industryAvgGrowth / maxGrowth) * 100, 100);

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Implied Expectations</h3>
        <span className="text-sm text-muted-foreground">
          At ${currentPrice.toFixed(2)}
        </span>
      </div>

      {/* Main metric */}
      <div className={`${assessment.bgColor} rounded-lg p-4`}>
        <div className="flex items-center gap-3">
          <Icon className={`h-6 w-6 ${assessment.color}`} />
          <div>
            <p className={`text-2xl font-bold ${assessment.color}`}>
              {formatPercent(impliedGrowth)} Growth
            </p>
            <p className="text-sm text-muted-foreground">{assessment.description}</p>
          </div>
        </div>
      </div>

      {/* Comparison bars */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Growth Comparison</p>

        {/* Implied */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Market Implied</span>
            <span className="font-medium">{formatPercent(impliedGrowth)}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${impliedWidth}%` }}
            />
          </div>
        </div>

        {/* Historical */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Historical (5yr CAGR)</span>
            <span className="font-medium">{formatPercent(historicalGrowth)}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${historicalWidth}%` }}
            />
          </div>
        </div>

        {/* Industry */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Industry Average</span>
            <span className="font-medium">{formatPercent(industryAvgGrowth)}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-400 rounded-full transition-all"
              style={{ width: `${industryWidth}%` }}
            />
          </div>
        </div>
      </div>

      {/* Insight */}
      <div className="pt-2 border-t border-border">
        <p className="text-sm text-muted-foreground">
          {impliedGrowth > historicalGrowth ? (
            <>
              The market is pricing in <span className="font-medium text-foreground">higher</span>{" "}
              growth than the company has historically achieved. You need to believe something
              has fundamentally improved to justify buying at this price.
            </>
          ) : impliedGrowth < historicalGrowth * 0.7 ? (
            <>
              The market is pricing in <span className="font-medium text-foreground">lower</span>{" "}
              growth than historical performance. If you believe the company can maintain
              its track record, the stock may be undervalued.
            </>
          ) : (
            <>
              The market expects growth <span className="font-medium text-foreground">in line</span>{" "}
              with historical performance. The stock is fairly valued if trends continue.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
