import { NextResponse } from "next/server";
import { crawlGlobalEvents, GlobalEvent } from "@/lib/services/event-crawler";
import { createClient } from "@/lib/supabase/server";

// 简单的内存缓存（生产环境应使用 Redis）
let cachedEvents: GlobalEvent[] = [];
let lastCrawlTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1小时

export async function GET() {
  try {
    const now = Date.now();

    // 检查缓存是否有效
    if (cachedEvents.length > 0 && now - lastCrawlTime < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cachedEvents,
        cached: true,
        crawledAt: new Date(lastCrawlTime).toISOString(),
      });
    }

    // 抓取新事件
    const events = await crawlGlobalEvents();

    if (events.length === 0) {
      // 如果抓取失败，返回缓存数据
      if (cachedEvents.length > 0) {
        return NextResponse.json({
          success: true,
          data: cachedEvents,
          cached: true,
          warning: "无法获取最新数据，显示缓存",
        });
      }
      return NextResponse.json({
        success: false,
        error: "获取事件失败",
      });
    }

    // 更新缓存
    cachedEvents = events;
    lastCrawlTime = now;

    // 保存到数据库
    try {
      const supabase = await createClient();
      for (const event of events.slice(0, 50)) {
        await supabase.from("global_events").upsert(
          {
            id: event.id,
            title: event.title,
            summary: event.summary,
            source: event.source,
            url: event.url,
            published_at: event.publishedAt,
            category: event.category,
            importance: event.importance,
            related_sectors: event.relatedSectors,
            crawled_at: event.crawledAt,
          },
          { onConflict: "id" }
        );
      }
    } catch (dbError) {
      console.error("Save to database error:", dbError);
      // 继续返回数据，即使数据库保存失败
    }

    return NextResponse.json({
      success: true,
      data: events,
      cached: false,
      crawledAt: new Date(now).toISOString(),
    });
  } catch (error) {
    console.error("Crawl events API error:", error);
    return NextResponse.json(
      { success: false, error: "抓取失败" },
      { status: 500 }
    );
  }
}
