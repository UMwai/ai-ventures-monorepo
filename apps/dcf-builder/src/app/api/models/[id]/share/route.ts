import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { prisma } from "@ai-ventures/database";
import { generateShareCode, buildShareUrl } from "@/lib/share/links";

// POST /api/models/[id]/share - Generate share link
export async function POST(
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
      select: { userId: true, shareCode: true, isPublic: true },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Generate new share code if doesn't exist
    const shareCode = existing.shareCode || generateShareCode();

    // Update model to be public with share code
    await prisma.dCFModel.update({
      where: { id: modelId },
      data: {
        isPublic: true,
        shareCode,
      },
    });

    const shareUrl = buildShareUrl(shareCode);

    return NextResponse.json({
      success: true,
      shareCode,
      shareUrl,
    });
  } catch (error) {
    console.error("Share model error:", error);
    return NextResponse.json(
      { error: "Failed to share model" },
      { status: 500 }
    );
  }
}

// DELETE /api/models/[id]/share - Revoke share link
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

    // Make model private and regenerate share code (invalidates old links)
    await prisma.dCFModel.update({
      where: { id: modelId },
      data: {
        isPublic: false,
        shareCode: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unshare model error:", error);
    return NextResponse.json(
      { error: "Failed to unshare model" },
      { status: 500 }
    );
  }
}
