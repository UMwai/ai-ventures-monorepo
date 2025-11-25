/**
 * Excel Export for DCF Models
 * Uses SheetJS (xlsx) library for Excel generation
 */

import * as XLSX from "xlsx";
import type { DCFResult, DCFAssumptions, WACCInputs, CompanyData, SensitivityTable } from "../dcf/types";
import { formatCurrency, formatPercent } from "../dcf/calculations";

export interface ExcelExportData {
  company: CompanyData;
  assumptions: DCFAssumptions;
  waccInputs: WACCInputs;
  result: DCFResult;
  sensitivityTable?: SensitivityTable;
  scenario: string;
}

/**
 * Generate Excel workbook for DCF model
 */
export function generateDCFExcel(data: ExcelExportData): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summarySheet = createSummarySheet(data);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Sheet 2: Projections
  const projectionsSheet = createProjectionsSheet(data);
  XLSX.utils.book_append_sheet(workbook, projectionsSheet, "Projections");

  // Sheet 3: Assumptions
  const assumptionsSheet = createAssumptionsSheet(data);
  XLSX.utils.book_append_sheet(workbook, assumptionsSheet, "Assumptions");

  // Sheet 4: Historical Financials
  const historicalSheet = createHistoricalSheet(data);
  XLSX.utils.book_append_sheet(workbook, historicalSheet, "Historical");

  // Sheet 5: Sensitivity Table
  if (data.sensitivityTable) {
    const sensitivitySheet = createSensitivitySheet(data);
    XLSX.utils.book_append_sheet(workbook, sensitivitySheet, "Sensitivity");
  }

  return workbook;
}

/**
 * Export workbook to file and trigger download
 */
export function downloadExcel(workbook: XLSX.WorkBook, filename: string): void {
  XLSX.writeFile(workbook, filename);
}

/**
 * Export workbook to buffer (for server-side generation)
 */
export function exportToBuffer(workbook: XLSX.WorkBook): Buffer {
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

function createSummarySheet(data: ExcelExportData): XLSX.WorkSheet {
  const { company, result, scenario } = data;

  const rows = [
    ["ValuationOS - DCF Model Summary"],
    [],
    ["Company Information"],
    ["Ticker", company.ticker],
    ["Company Name", company.name],
    ["Sector", company.sector],
    ["Industry", company.industry],
    [],
    ["Valuation Results", `${scenario.toUpperCase()} Case`],
    ["Current Price", `$${result.currentPrice.toFixed(2)}`],
    ["Intrinsic Value", `$${result.intrinsicValuePerShare.toFixed(2)}`],
    ["Implied Upside", formatPercent(result.impliedUpside)],
    [],
    ["Value Bridge"],
    ["PV of Cash Flows", formatCurrency(result.sumOfPVs)],
    ["PV of Terminal Value", formatCurrency(result.terminalValuePV)],
    ["Enterprise Value", formatCurrency(result.enterpriseValue)],
    ["Less: Net Debt", formatCurrency(result.netDebt)],
    ["Equity Value", formatCurrency(result.equityValue)],
    ["Shares Outstanding", (result.sharesOutstanding / 1e9).toFixed(2) + "B"],
    [],
    ["Discount Rate"],
    ["WACC", formatPercent(result.wacc)],
    ["Cost of Equity", formatPercent(result.costOfEquity)],
    ["Cost of Debt (after-tax)", formatPercent(result.costOfDebt)],
    [],
    ["Terminal Value"],
    ["Method", result.terminalValueMethod === "perpetuity" ? "Perpetuity Growth" : "Exit Multiple"],
    ["Terminal Value", formatCurrency(result.terminalValue)],
    [],
    ["Generated", new Date().toISOString()],
    ["Source", "ValuationOS (valuationos.com)"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws["!cols"] = [{ wch: 25 }, { wch: 20 }];

  return ws;
}

function createProjectionsSheet(data: ExcelExportData): XLSX.WorkSheet {
  const { result } = data;

  const headers = [
    "Year",
    "Revenue",
    "Gross Profit",
    "Operating Income",
    "NOPAT",
    "D&A",
    "CapEx",
    "Change in NWC",
    "Free Cash Flow",
    "Discount Factor",
    "Present Value",
  ];

  const rows = [
    headers,
    ...result.projections.map((p) => [
      p.year,
      p.revenue,
      p.grossProfit,
      p.operatingIncome,
      p.nopat,
      p.depreciation,
      p.capex,
      p.changeInNWC,
      p.fcf,
      p.discountFactor.toFixed(4),
      p.presentValue,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Format numbers
  const numCols = ["B", "C", "D", "E", "F", "G", "H", "I", "K"];
  for (let i = 2; i <= result.projections.length + 1; i++) {
    numCols.forEach((col) => {
      const cell = ws[`${col}${i}`];
      if (cell) {
        cell.z = "#,##0";
      }
    });
  }

  ws["!cols"] = headers.map(() => ({ wch: 15 }));

  return ws;
}

function createAssumptionsSheet(data: ExcelExportData): XLSX.WorkSheet {
  const { assumptions, waccInputs } = data;

  const rows = [
    ["DCF Assumptions"],
    [],
    ["Revenue Growth Rates"],
    ...assumptions.revenueGrowthRates.map((rate, i) => [
      `Year ${i + 1}`,
      formatPercent(rate),
    ]),
    [],
    ["Margin Assumptions"],
    ["Gross Margin", formatPercent(assumptions.grossMargin)],
    ["Operating Margin", formatPercent(assumptions.operatingMargin)],
    ["Tax Rate", formatPercent(assumptions.taxRate)],
    [],
    ["Capital Assumptions"],
    ["D&A % of Revenue", formatPercent(assumptions.depreciationAsPercentOfRevenue)],
    ["CapEx % of Revenue", formatPercent(assumptions.capexAsPercentOfRevenue)],
    ["NWC % of Revenue", formatPercent(assumptions.nwcAsPercentOfRevenue)],
    [],
    ["WACC Components"],
    ["Risk-Free Rate", formatPercent(waccInputs.riskFreeRate)],
    ["Beta", waccInputs.beta.toFixed(2)],
    ["Equity Risk Premium", formatPercent(waccInputs.equityRiskPremium)],
    ["Cost of Debt", formatPercent(waccInputs.costOfDebt)],
    ["Market Cap", formatCurrency(waccInputs.marketCapEquity)],
    ["Total Debt", formatCurrency(waccInputs.totalDebt)],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 25 }, { wch: 15 }];

  return ws;
}

function createHistoricalSheet(data: ExcelExportData): XLSX.WorkSheet {
  const { company } = data;

  const headers = [
    "Year",
    "Revenue",
    "Gross Profit",
    "Operating Income",
    "Net Income",
    "D&A",
    "CapEx",
    "Total Debt",
    "Total Equity",
  ];

  const rows = [
    headers,
    ...company.historicalFinancials.map((f) => [
      f.year,
      f.revenue,
      f.grossProfit,
      f.operatingIncome,
      f.netIncome,
      f.depreciation,
      f.capitalExpenditures,
      f.totalDebt,
      f.totalEquity,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = headers.map(() => ({ wch: 15 }));

  return ws;
}

function createSensitivitySheet(data: ExcelExportData): XLSX.WorkSheet {
  const { sensitivityTable, result } = data;
  if (!sensitivityTable) return XLSX.utils.aoa_to_sheet([]);

  // Header row with growth rates
  const headerRow = [
    "WACC \\ Growth",
    ...sensitivityTable.growthValues.map((g) => formatPercent(g)),
  ];

  // Data rows
  const dataRows = sensitivityTable.waccValues.map((wacc, waccIdx) => [
    formatPercent(wacc),
    ...sensitivityTable.matrix[waccIdx].map((price) => `$${price.toFixed(0)}`),
  ]);

  const rows = [
    ["Sensitivity Analysis - Share Price"],
    [`Current Price: $${result.currentPrice.toFixed(2)}`],
    [],
    headerRow,
    ...dataRows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 12 }, ...sensitivityTable.growthValues.map(() => ({ wch: 10 }))];

  return ws;
}
