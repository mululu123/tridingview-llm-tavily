import { NextRequest, NextResponse } from "next/server";
import { fetchTechnicalData } from "@/lib/services/tradingview";
import { searchStockNews } from "@/lib/services/tavily";
import { analyzeStock } from "@/lib/services/analyzer";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { stockCode } = await request.json();

    if (!stockCode) {
      return NextResponse.json(
        { error: "Stock code is required" },
        { status: 400 }
      );
    }

    // Fetch technical data
    const technicalData = await fetchTechnicalData(stockCode);
    if (!technicalData) {
      return NextResponse.json(
        { error: "Failed to fetch technical data" },
        { status: 500 }
      );
    }

    // Search for news
    const newsResults = await searchStockNews(stockCode, technicalData.name);

    // Analyze with AI
    const analysis = await analyzeStock(technicalData, newsResults.results);

    // Save to history
    try {
      const supabase = await createClient();
      await supabase.from("analysis_history").insert({
        type: "stock",
        stock_code: stockCode,
        stock_name: technicalData.name,
        analysis_result: analysis,
        raw_data: {
          technical: technicalData,
          news: newsResults.results.slice(0, 5),
        },
      });
    } catch (dbError) {
      console.error("Failed to save history:", dbError);
      // Continue even if save fails
    }

    return NextResponse.json({
      success: true,
      data: {
        stockCode,
        stockName: technicalData.name,
        analysis,
        technical: technicalData,
        newsCount: newsResults.results.length,
      },
    });
  } catch (error) {
    console.error("Analyze API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
