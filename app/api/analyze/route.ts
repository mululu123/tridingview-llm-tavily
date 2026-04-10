import { NextRequest, NextResponse } from "next/server";
import { fetchTechnicalData } from "@/lib/services/tradingview";
import { searchStockNews } from "@/lib/services/tavily";
import { analyzeWithEvents } from "@/lib/services/analyzer";
import { getStockSector } from "@/lib/services/stock-sector";
import { crawlGlobalEvents, matchEventsForSector, GlobalEvent } from "@/lib/services/event-crawler";
import { createClient } from "@/lib/supabase/server";

// 事件缓存
let cachedEvents: GlobalEvent[] = [];
let lastCrawlTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1小时

async function getEvents(): Promise<GlobalEvent[]> {
  const now = Date.now();
  if (cachedEvents.length > 0 && now - lastCrawlTime < CACHE_DURATION) {
    return cachedEvents;
  }
  cachedEvents = await crawlGlobalEvents();
  lastCrawlTime = now;
  return cachedEvents;
}

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();

    if (!input?.trim()) {
      return NextResponse.json({ error: "请输入股票代码或名称" }, { status: 400 });
    }

    const trimmedInput = input.trim();
    const codeMatch = trimmedInput.match(/\d{6}/);
    const stockCode = codeMatch ? codeMatch[0] : "";
    const stockName = stockCode
      ? trimmedInput.replace(/\d{6}/, "").trim() || undefined
      : trimmedInput;

    // 1. 获取技术指标
    const technicalData = await fetchTechnicalData(stockCode || "000000", stockName);
    if (!technicalData) {
      return NextResponse.json({ error: "获取数据失败" }, { status: 500 });
    }

    // 2. 获取股票行业
    const sector = getStockSector(stockCode || technicalData.symbol);

    // 3. 获取相关行业事件
    const allEvents = await getEvents();
    const relatedEvents = matchEventsForSector(allEvents, sector);

    // 4. 搜索个股新闻
    const newsResults = await searchStockNews(stockCode || technicalData.symbol, technicalData.name);

    // 5. AI 综合分析（事件 + 新闻 + 技术）
    const analysis = await analyzeWithEvents(
      technicalData,
      relatedEvents,
      newsResults.results,
      sector,
      stockName || technicalData.name
    );

    // 6. 保存历史
    try {
      const supabase = await createClient();
      await supabase.from("analysis_history").insert({
        type: "stock",
        stock_code: stockCode || technicalData.symbol,
        stock_name: technicalData.name,
        analysis_result: analysis,
        raw_data: {
          technical: technicalData,
          sector,
          eventsCount: relatedEvents.length,
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
        sector,
        analysis,
        technical: technicalData,
        relatedEvents: relatedEvents.slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json({ error: "分析失败" }, { status: 500 });
  }
}
