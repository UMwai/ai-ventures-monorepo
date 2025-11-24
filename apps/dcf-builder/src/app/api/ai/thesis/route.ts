import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { generateThesis } from "@/lib/ai/assumptions";
import type { DCFAssumptions } from "@/lib/dcf/types";

interface ThesisRequest {
  ticker: string;
  companyName: string;
  intrinsicValue: number;
  currentPrice: number;
  impliedUpside: number;
  assumptions: DCFAssumptions;
  risks: string[];
  catalysts: string[];
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

    const body: ThesisRequest = await request.json();
    const {
      ticker,
      companyName,
      intrinsicValue,
      currentPrice,
      impliedUpside,
      assumptions,
      risks,
      catalysts,
    } = body;

    // Generate investment thesis
    const thesis = await generateThesis(
      ticker,
      companyName,
      intrinsicValue,
      currentPrice,
      impliedUpside,
      assumptions,
      risks,
      catalysts
    );

    return NextResponse.json({
      success: true,
      thesis,
    });
  } catch (error) {
    console.error("Thesis generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Thesis generation failed",
      },
      { status: 500 }
    );
  }
}
