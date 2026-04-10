import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getStockData,
  formatTechnicalData,
  formatStockCode,
  getStockName,
} from "@/lib/services/tradingview"
import { searchStockNews } from "@/lib/services/tavily"
import { analyzeStock } from "@/lib/services/analyzer"

export async function POST(request: NextRequest) {
  try {
    const { stockCode } = await request.json()

    if (!stockCode) {
      return NextResponse.json({ error: "请输入股票代码" }, { status: 400 })
    }

    const tvSymbol = formatStockCode(stockCode)
    const stockName = getStockName(tvSymbol)

    // Step 1: 获取技术数据
    const stockData = await getStockData(stockCode)
    const technicalText = formatTechnicalData(stockData)

    // Step 2: 搜索新闻
    const newsText = await searchStockNews(stockName, stockCode)

    // Step 3: AI 分析
    const analysis = await analyzeStock(technicalText, newsText)

    // Step 4: 保存到数据库
    const supabase = await createClient()
    await supabase.from("analysis_history").insert({
      type: "stock",
      stock_code: stockCode,
      stock_name: stockName,
      analysis_result: analysis,
      raw_data: {
        technical: stockData,
        news: newsText,
      },
    })

    return NextResponse.json({
      success: true,
      stockCode,
      stockName,
      analysis,
      rawData: {
        technical: technicalText,
        news: newsText,
      },
    })
  } catch (error) {
    console.error("Stock analysis error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "分析失败" },
      { status: 500 }
    )
  }
}
