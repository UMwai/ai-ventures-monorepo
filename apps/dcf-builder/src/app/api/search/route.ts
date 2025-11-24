import { NextRequest, NextResponse } from "next/server";
import { searchTickers } from "@/lib/data/fmp";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 1) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchTickers(query);

    return NextResponse.json({
      results: results.map((r) => ({
        ticker: r.symbol,
        name: r.name,
        exchange: r.exchangeShortName,
      })),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
