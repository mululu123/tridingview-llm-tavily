import { NextRequest, NextResponse } from "next/server";
import { fetchTechnicalData } from "@/lib/services/tradingview";
import { searchStockNews } from "@/lib/services/tavily";
import { analyzeStock } from "@/lib/services/analyzer";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();

    if (!input?.trim()) {
      return NextResponse.json({ error: "请输入股票代码或名称" }, { status: 400 });
    }

    const trimmedInput = input.trim();

    // 提取可能的股票代码（6位数字）
    const codeMatch = trimmedInput.match(/\d{6}/);
    const stockCode = codeMatch ? codeMatch[0] : "";

    // 如果没有数字，整个输入当作名称
    const stockName = stockCode
      ? trimmedInput.replace(/\d{6}/, "").trim() || undefined
      : trimmedInput;

    // 获取技术数据
    const technicalData = await fetchTechnicalData(stockCode || "000000", stockName);
    if (!technicalData) {
      return NextResponse.json({ error: "获取数据失败，请重试" }, { status: 500 });
    }

    // 搜索新闻
    const newsResults = await searchStockNews(
      stockCode || technicalData.symbol,
      technicalData.name
    );

    // AI 分析
    const analysis = await analyzeStock(technicalData, newsResults.results);

    // 保存历史
    try {
      const supabase = await createClient();
      await supabase.from("analysis_history").insert({
        type: "stock",
        stock_code: stockCode || technicalData.symbol,
        stock_name: technicalData.name,
        analysis_result: analysis,
        raw_data: {
          technical: technicalData,
          news: newsResults.results.slice(0, 5),
        },
      });
    } catch (e) {
      console.error("Save history error:", e);
    }

    return NextResponse.json({
      success: true,
      data: {
        stockCode: stockCode || technicalData.symbol,
        stockName: technicalData.name,
        analysis,
        technical: technicalData,
        newsCount: newsResults.results.length,
      },
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json({ error: "分析失败，请稍后重试" }, { status: 500 });
  }
}
