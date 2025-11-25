import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { prisma } from "@ai-ventures/database";
import { generateShareCode } from "@/lib/share/links";

// GET /api/models - List user's models
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const models = await prisma.dCFModel.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        ticker: true,
        companyName: true,
        scenario: true,
        intrinsicValue: true,
        currentPrice: true,
        impliedUpside: true,
        isPublic: true,
        shareCode: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const total = await prisma.dCFModel.count({ where: { userId } });

    return NextResponse.json({
      success: true,
      models,
      pagination: { total, limit, offset },
    });
  } catch (error) {
    console.error("List models error:", error);
    return NextResponse.json(
      { error: "Failed to list models" },
      { status: 500 }
    );
  }
}

// POST /api/models - Create new model
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      ticker,
      companyName,
      sector,
      industry,
      currentPrice,
      marketCap,
      beta,
      sharesOutstanding,
      assumptions,
      waccInputs,
      terminalInputs,
      resultCache,
      sensitivityCache,
      aiReasoning,
      risks,
      catalysts,
      investmentThesis,
      scenario,
      isPublic,
    } = body;

    // Extract key metrics from result
    const intrinsicValue = resultCache?.intrinsicValuePerShare;
    const impliedUpside = resultCache?.impliedUpside;
    const wacc = resultCache?.wacc;
    const enterpriseValue = resultCache?.enterpriseValue;
    const equityValue = resultCache?.equityValue;

    // Generate share code if public
    const shareCode = isPublic ? generateShareCode() : null;

    const model = await prisma.dCFModel.create({
      data: {
        userId,
        ticker,
        companyName,
        sector,
        industry,
        currentPrice,
        marketCap,
        beta,
        sharesOutstanding,
        assumptions,
        waccInputs,
        terminalInputs,
        intrinsicValue,
        impliedUpside,
        wacc,
        enterpriseValue,
        equityValue,
        resultCache,
        sensitivityCache,
        aiReasoning,
        risks: risks || [],
        catalysts: catalysts || [],
        investmentThesis,
        scenario: scenario?.toUpperCase() || "BASE",
        isPublic: isPublic || false,
        shareCode,
      },
    });

    return NextResponse.json({
      success: true,
      model: {
        id: model.id,
        shareCode: model.shareCode,
      },
    });
  } catch (error) {
    console.error("Create model error:", error);
    return NextResponse.json(
      { error: "Failed to create model" },
      { status: 500 }
    );
  }
}
