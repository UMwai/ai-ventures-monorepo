import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import {
  runDCFAnalysis,
  generateSensitivityTable,
  calculateImpliedGrowth,
} from "@/lib/dcf/calculations";
import type { DCFAssumptions, WACCInputs, TerminalValueInputs, FinancialStatement } from "@/lib/dcf/types";

interface DCFCalculateRequest {
  company: {
    ticker: string;
    currentPrice: number;
    sharesOutstanding: number;
    totalDebt: number;
    cash: number;
    historicalFinancials: FinancialStatement[];
  };
  assumptions: DCFAssumptions;
  waccInputs: WACCInputs;
  terminalInputs: TerminalValueInputs;
  includeSensitivity?: boolean;
  includeImpliedGrowth?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Optional auth check (allow free tier usage)
    const { userId } = auth();

    const body: DCFCalculateRequest = await request.json();
    const {
      company,
      assumptions,
      waccInputs,
      terminalInputs,
      includeSensitivity = true,
      includeImpliedGrowth = true,
    } = body;

    // Validate inputs
    if (!company || !assumptions || !waccInputs || !terminalInputs) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Run DCF analysis
    const dcfResult = runDCFAnalysis(company, assumptions, waccInputs, terminalInputs);

    // Generate sensitivity table if requested
    let sensitivityTable = null;
    if (includeSensitivity) {
      sensitivityTable = generateSensitivityTable(
        company,
        assumptions,
        waccInputs,
        terminalInputs,
        {
          waccRange: { min: dcfResult.wacc - 0.02, max: dcfResult.wacc + 0.02, step: 0.005 },
          growthRange: { min: 0.01, max: 0.04, step: 0.005 },
        }
      );
    }

    // Calculate implied growth if requested
    let impliedGrowth = null;
    if (includeImpliedGrowth) {
      impliedGrowth = calculateImpliedGrowth(
        company.currentPrice,
        company,
        assumptions,
        dcfResult.wacc,
        terminalInputs.method,
        terminalInputs.exitMultiple
      );
    }

    return NextResponse.json({
      success: true,
      result: dcfResult,
      sensitivityTable,
      impliedGrowth,
      userId, // Track who ran the calculation
    });
  } catch (error) {
    console.error("DCF calculation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "DCF calculation failed",
      },
      { status: 500 }
    );
  }
}
