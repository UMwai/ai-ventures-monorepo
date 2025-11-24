import { NextRequest, NextResponse } from "next/server";
import { getCompanyFinancials, getRiskFreeRate } from "@/lib/data/fmp";

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const ticker = params.ticker.toUpperCase();

    // Fetch company financials and risk-free rate in parallel
    const [companyData, riskFreeRate] = await Promise.all([
      getCompanyFinancials(ticker),
      getRiskFreeRate(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...companyData,
        riskFreeRate,
      },
    });
  } catch (error) {
    console.error("Financials fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch financials",
      },
      { status: 500 }
    );
  }
}
