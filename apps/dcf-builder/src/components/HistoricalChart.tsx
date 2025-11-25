"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { FinancialStatement, ProjectedFinancials } from "@/lib/dcf/types";

interface HistoricalChartProps {
  historical: FinancialStatement[];
  projected: ProjectedFinancials[];
  metric: "revenue" | "operatingIncome" | "fcf";
  title: string;
}

export function HistoricalChart({
  historical,
  projected,
  metric,
  title,
}: HistoricalChartProps) {
  // Combine historical and projected data
  const currentYear = new Date().getFullYear();

  const historicalData = historical.map((h) => ({
    year: h.year,
    value: getMetricValue(h, metric),
    type: "historical",
  }));

  const projectedData = projected.map((p) => ({
    year: p.year,
    value: getProjectedMetricValue(p, metric),
    type: "projected",
  }));

  // Combine and sort by year
  const combinedData = [...historicalData, ...projectedData].sort(
    (a, b) => a.year - b.year
  );

  // Split into historical and projected for dual lines
  const chartData = combinedData.map((d) => ({
    year: d.year,
    historical: d.type === "historical" ? d.value : null,
    projected: d.type === "projected" ? d.value : null,
    // Bridge point: last historical year also has projected value
    ...(d.year === historicalData[historicalData.length - 1]?.year && {
      projected: d.value,
    }),
  }));

  const formatYAxis = (value: number) => {
    if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="font-semibold text-foreground mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="year"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            tickLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            tickLine={{ stroke: "hsl(var(--border))" }}
          />
          <Tooltip
            formatter={(value: number) => formatYAxis(value)}
            labelFormatter={(label) => `Year ${label}`}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <ReferenceLine
            x={currentYear}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="5 5"
            label={{ value: "Today", position: "top", fill: "hsl(var(--muted-foreground))" }}
          />
          <Line
            type="monotone"
            dataKey="historical"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
            name="Historical"
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="projected"
            stroke="hsl(142, 76%, 36%)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: "hsl(142, 76%, 36%)", strokeWidth: 2 }}
            name="Projected"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function getMetricValue(
  statement: FinancialStatement,
  metric: "revenue" | "operatingIncome" | "fcf"
): number {
  switch (metric) {
    case "revenue":
      return statement.revenue;
    case "operatingIncome":
      return statement.operatingIncome;
    case "fcf":
      // Approximate FCF from historical data
      return (
        statement.operatingIncome * 0.79 + // NOPAT (assuming 21% tax)
        statement.depreciation -
        statement.capitalExpenditures -
        statement.changeInWorkingCapital
      );
    default:
      return 0;
  }
}

function getProjectedMetricValue(
  projection: ProjectedFinancials,
  metric: "revenue" | "operatingIncome" | "fcf"
): number {
  switch (metric) {
    case "revenue":
      return projection.revenue;
    case "operatingIncome":
      return projection.operatingIncome;
    case "fcf":
      return projection.fcf;
    default:
      return 0;
  }
}

/**
 * Multi-metric chart showing all key financials
 */
interface MultiMetricChartProps {
  historical: FinancialStatement[];
  projected: ProjectedFinancials[];
}

export function MultiMetricChart({ historical, projected }: MultiMetricChartProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <HistoricalChart
        historical={historical}
        projected={projected}
        metric="revenue"
        title="Revenue"
      />
      <HistoricalChart
        historical={historical}
        projected={projected}
        metric="fcf"
        title="Free Cash Flow"
      />
    </div>
  );
}
