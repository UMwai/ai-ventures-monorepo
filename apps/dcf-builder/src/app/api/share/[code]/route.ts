import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ai-ventures/database";
import { isValidShareCode } from "@/lib/share/links";

// GET /api/share/[code] - Get shared model by code
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const shareCode = params.code;

    // Validate code format
    if (!isValidShareCode(shareCode)) {
      return NextResponse.json(
        { error: "Invalid share code" },
        { status: 400 }
      );
    }

    const model = await prisma.dCFModel.findUnique({
      where: { shareCode },
      select: {
        id: true,
        ticker: true,
        companyName: true,
        sector: true,
        industry: true,
        currentPrice: true,
        marketCap: true,
        beta: true,
        sharesOutstanding: true,
        assumptions: true,
        waccInputs: true,
        terminalInputs: true,
        intrinsicValue: true,
        impliedUpside: true,
        wacc: true,
        enterpriseValue: true,
        equityValue: true,
        resultCache: true,
        sensitivityCache: true,
        aiReasoning: true,
        risks: true,
        catalysts: true,
        investmentThesis: true,
        scenario: true,
        isPublic: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!model || !model.isPublic) {
      return NextResponse.json(
        { error: "Model not found or not shared" },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.dCFModel.update({
      where: { shareCode },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      model: {
        ...model,
        authorName: model.user?.name || "Anonymous",
      },
    });
  } catch (error) {
    console.error("Get shared model error:", error);
    return NextResponse.json(
      { error: "Failed to get shared model" },
      { status: 500 }
    );
  }
}
