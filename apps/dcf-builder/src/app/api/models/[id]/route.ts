import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { prisma } from "@ai-ventures/database";
import { generateShareCode } from "@/lib/share/links";

// GET /api/models/[id] - Get single model
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    const modelId = params.id;

    const model = await prisma.dCFModel.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    // Check access - owner or public
    if (model.userId !== userId && !model.isPublic) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      model,
    });
  } catch (error) {
    console.error("Get model error:", error);
    return NextResponse.json(
      { error: "Failed to get model" },
      { status: 500 }
    );
  }
}

// PATCH /api/models/[id] - Update model
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const modelId = params.id;
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.dCFModel.findUnique({
      where: { id: modelId },
      select: { userId: true, shareCode: true },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Handle share code generation if making public
    let shareCode = existing.shareCode;
    if (body.isPublic && !shareCode) {
      shareCode = generateShareCode();
    }

    // Update model
    const model = await prisma.dCFModel.update({
      where: { id: modelId },
      data: {
        ...body,
        shareCode,
        // Recalculate key metrics if result changed
        ...(body.resultCache && {
          intrinsicValue: body.resultCache.intrinsicValuePerShare,
          impliedUpside: body.resultCache.impliedUpside,
          wacc: body.resultCache.wacc,
          enterpriseValue: body.resultCache.enterpriseValue,
          equityValue: body.resultCache.equityValue,
        }),
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
    console.error("Update model error:", error);
    return NextResponse.json(
      { error: "Failed to update model" },
      { status: 500 }
    );
  }
}

// DELETE /api/models/[id] - Delete model
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const modelId = params.id;

    // Verify ownership
    const existing = await prisma.dCFModel.findUnique({
      where: { id: modelId },
      select: { userId: true },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.dCFModel.delete({
      where: { id: modelId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete model error:", error);
    return NextResponse.json(
      { error: "Failed to delete model" },
      { status: 500 }
    );
  }
}
