import { NextResponse } from "next/server";
import { searchMarketHot } from "@/lib/services/tavily";
import { analyzeMarketHot } from "@/lib/services/analyzer";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Search for market hot topics
    const newsResults = await searchMarketHot();

    // Analyze with AI
    const analysis = await analyzeMarketHot(newsResults.results);

    // Save to history
    try {
      const supabase = await createClient();
      await supabase.from("analysis_history").insert({
        type: "market_hot",
        analysis_result: analysis,
        raw_data: {
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
        analysis,
        newsCount: newsResults.results.length,
        searchTime: newsResults.searchTime,
      },
    });
  } catch (error) {
    console.error("Market hot API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
