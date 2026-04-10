<<<<<<< HEAD
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { searchMarketHot } from "@/lib/services/tavily"
import { analyzeMarket } from "@/lib/services/analyzer"

export async function POST() {
  try {
    // Step 1: 搜索市场热点
    const marketData = await searchMarketHot()

    // Step 2: AI 分析
    const analysis = await analyzeMarket(marketData)

    // Step 3: 保存到数据库
    const supabase = await createClient()
    await supabase.from("analysis_history").insert({
      type: "market_hot",
      analysis_result: analysis,
      raw_data: { market: marketData },
    })

    return NextResponse.json({
      success: true,
      analysis,
      rawData: marketData,
    })
  } catch (error) {
    console.error("Market hot analysis error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "分析失败" },
      { status: 500 }
    )
=======
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
>>>>>>> origin/v0/zmpple-7535-fb84d16f
  }
}
