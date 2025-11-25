import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { generateDCFExcel, exportToBuffer } from "@/lib/export/excel";

// POST /api/export/excel - Generate Excel file
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { company, assumptions, waccInputs, result, sensitivityTable, scenario } = body;

    // Validate required fields
    if (!company || !assumptions || !waccInputs || !result) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate Excel workbook
    const workbook = generateDCFExcel({
      company,
      assumptions,
      waccInputs,
      result,
      sensitivityTable,
      scenario: scenario || "base",
    });

    // Export to buffer
    const buffer = exportToBuffer(workbook);

    // Create filename
    const filename = `${company.ticker}_DCF_${scenario || "base"}_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Excel export error:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel file" },
      { status: 500 }
    );
  }
}
