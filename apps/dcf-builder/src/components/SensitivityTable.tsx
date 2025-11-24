"use client";

import { formatPercent } from "@/lib/dcf/calculations";
import type { SensitivityTable as SensitivityTableType } from "@/lib/dcf/types";

interface SensitivityTableProps {
  table: SensitivityTableType;
  currentPrice: number;
  baseWacc: number;
  baseGrowth: number;
}

export function SensitivityTable({
  table,
  currentPrice,
  baseWacc,
  baseGrowth,
}: SensitivityTableProps) {
  const getCellColor = (value: number) => {
    const percentDiff = (value - currentPrice) / currentPrice;
    if (percentDiff > 0.2) return "bg-green-100 text-green-800";
    if (percentDiff > 0.1) return "bg-green-50 text-green-700";
    if (percentDiff > 0) return "bg-green-50/50 text-green-600";
    if (percentDiff > -0.1) return "bg-red-50/50 text-red-600";
    if (percentDiff > -0.2) return "bg-red-50 text-red-700";
    return "bg-red-100 text-red-800";
  };

  const isBaseCell = (wacc: number, growth: number) => {
    return (
      Math.abs(wacc - baseWacc) < 0.001 && Math.abs(growth - baseGrowth) < 0.001
    );
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="font-semibold text-foreground mb-4">
        Sensitivity Analysis (Share Price)
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Current Price: <span className="font-medium">${currentPrice.toFixed(2)}</span>
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left text-muted-foreground">
                WACC \ Growth
              </th>
              {table.growthValues.map((growth) => (
                <th
                  key={growth}
                  className="p-2 text-center text-muted-foreground font-medium"
                >
                  {formatPercent(growth)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.waccValues.map((wacc, waccIdx) => (
              <tr key={wacc}>
                <td className="p-2 text-muted-foreground font-medium">
                  {formatPercent(wacc)}
                </td>
                {table.growthValues.map((growth, growthIdx) => {
                  const value = table.matrix[waccIdx][growthIdx];
                  const isBase = isBaseCell(wacc, growth);
                  return (
                    <td
                      key={growth}
                      className={`p-2 text-center font-medium ${getCellColor(value)} ${
                        isBase ? "ring-2 ring-primary ring-offset-1" : ""
                      }`}
                    >
                      ${value.toFixed(0)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 rounded" />
          <span>Upside &gt;20%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 rounded" />
          <span>Downside &gt;20%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 ring-2 ring-primary rounded" />
          <span>Base Case</span>
        </div>
      </div>
    </div>
  );
}
