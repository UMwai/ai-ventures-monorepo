import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { generateAssumptions, generateThesis } from "@/lib/ai/assumptions";
import type { FinancialStatement } from "@/lib/dcf/types";

interface AIAssumptionsRequest {
  ticker: string;
  companyName: string;
  sector: string;
  industry: string;
  currentPrice: number;
  marketCap: number;
  beta: number;
  historicalFinancials: FinancialStatement[];
  riskFreeRate: number;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check for AI features (premium)
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required for AI features" },
        { status: 401 }
      );
    }

    const body: AIAssumptionsRequest = await request.json();
    const {
      ticker,
      companyName,
      sector,
      industry,
      currentPrice,
      marketCap,
      beta,
      historicalFinancials,
      riskFreeRate,
    } = body;

    // Validate inputs
    if (!ticker || !historicalFinancials || historicalFinancials.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate AI assumptions
    const aiResponse = await generateAssumptions(
      ticker,
      companyName,
      sector,
      industry,
      currentPrice,
      marketCap,
      beta,
      historicalFinancials,
      riskFreeRate
    );

    return NextResponse.json({
      success: true,
      ...aiResponse,
    });
  } catch (error) {
    console.error("AI assumptions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "AI assumption generation failed",
      },
      { status: 500 }
    );
  }
}
