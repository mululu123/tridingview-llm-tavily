import { NextRequest, NextResponse } from "next/server";
import { fetchTechnicalData } from "@/lib/services/tradingview";
import { searchStockNews } from "@/lib/services/tavily";
import { analyzeStock } from "@/lib/services/analyzer";
import { searchStock, resolveStockCode, getStockNameByCode } from "@/lib/services/stock-search";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { stockCode, stockName } = await request.json();

    if (!stockCode && !stockName) {
      return NextResponse.json(
        { error: "请输入股票代码或名称" },
        { status: 400 }
      );
    }

    // 解析股票代码
    const input = stockName || stockCode;
    const resolvedCode = resolveStockCode(input);

    if (!resolvedCode) {
      // 尝试模糊搜索给出建议
      const suggestions = searchStock(input, 5);
      return NextResponse.json(
        {
          error: "未找到匹配的股票",
          suggestions: suggestions.map(s => `${s.code} ${s.name}`)
        },
        { status: 400 }
      );
    }

    // Fetch technical data
    const technicalData = await fetchTechnicalData(resolvedCode);
    if (!technicalData) {
      return NextResponse.json(
        { error: "获取技术数据失败" },
        { status: 500 }
      );
    }

    // Search for news
    const newsResults = await searchStockNews(resolvedCode, technicalData.name);

    // Analyze with AI
    const analysis = await analyzeStock(technicalData, newsResults.results);

    // Save to history
    try {
      const supabase = await createClient();
      await supabase.from("analysis_history").insert({
        type: "stock",
        stock_code: resolvedCode,
        stock_name: technicalData.name,
        analysis_result: analysis,
        raw_data: {
          technical: technicalData,
          news: newsResults.results.slice(0, 5),
        },
      });
    } catch (dbError) {
      console.error("Failed to save history:", dbError);
    }

    return NextResponse.json({
      success: true,
      data: {
        stockCode: resolvedCode,
        stockName: technicalData.name,
        analysis,
        technical: technicalData,
        newsCount: newsResults.results.length,
      },
    });
  } catch (error) {
    console.error("Analyze API error:", error);
    return NextResponse.json(
      { error: "分析失败，请稍后重试" },
      { status: 500 }
    );
  }
}

// 股票搜索 API
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const results = searchStock(query, 10);
  return NextResponse.json({ results });
}
