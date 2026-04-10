// Tavily 搜索服务 - 用于获取股票新闻和市场热点

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
  score: number;
}

export interface TavilySearchResponse {
  results: SearchResult[];
  query: string;
  searchTime: number;
  answer?: string;
}

const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "";
const TAVILY_API_URL = "https://api.tavily.com/search";

/**
 * 获取当前时态信息
 */
export function getMarketTimeContext(): {
  date: string;
  time: string;
  marketStatus: "盘前" | "盘中" | "盘后" | "休市";
  tradingDay: boolean;
} {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const dayOfWeek = now.getDay();

  const date = now.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const time = now.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // 判断是否交易日（周一至周五）
  const tradingDay = dayOfWeek >= 1 && dayOfWeek <= 5;

  // 判断市场状态
  let marketStatus: "盘前" | "盘中" | "盘后" | "休市" = "休市";
  if (tradingDay) {
    const timeNum = hour * 100 + minute;
    if (timeNum < 925) {
      marketStatus = "盘前";
    } else if (timeNum >= 925 && timeNum < 1130) {
      marketStatus = "盘中"; // 早盘
    } else if (timeNum >= 1130 && timeNum < 1300) {
      marketStatus = "盘中"; // 午休
    } else if (timeNum >= 1300 && timeNum < 1500) {
      marketStatus = "盘中"; // 午盘
    } else {
      marketStatus = "盘后";
    }
  }

  return { date, time, marketStatus, tradingDay };
}

async function tavilySearch(
  query: string,
  options: {
    maxResults?: number;
    days?: number;
  } = {}
): Promise<TavilySearchResponse> {
  const { maxResults = 10, days = 7 } = options;

  if (!TAVILY_API_KEY) {
    console.error("TAVILY_API_KEY not configured");
    return { results: [], query, searchTime: 0 };
  }

  try {
    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: "advanced",
        max_results: maxResults,
        include_answer: true,
        days: days,
      }),
    });

    if (!response.ok) {
      console.error(`Tavily API error: ${response.status}`);
      return { results: [], query, searchTime: 0 };
    }

    const data = await response.json();

    return {
      results: (data.results || []).map((r: Record<string, unknown>) => ({
        title: r.title as string,
        url: r.url as string,
        content: r.content as string,
        publishedDate: r.published_date as string | undefined,
        score: r.score as number,
      })),
      query,
      searchTime: data.response_time || 0,
      answer: data.answer,
    };
  } catch (error) {
    console.error("Tavily search error:", error);
    return { results: [], query, searchTime: 0 };
  }
}

/**
 * 深度搜索个股关键信息（多维度并行搜索）
 */
export async function deepSearchStock(
  stockCode: string,
  stockName?: string
): Promise<{
  news: SearchResult[];
  funds: SearchResult[];
  events: SearchResult[];
}> {
  const name = stockName || stockCode;

  // 并行搜索三个维度
  const [newsRes, fundsRes, eventsRes] = await Promise.all([
    // 1. 新闻面：利好利空
    tavilySearch(`${name} 利好 利空 公告 业绩 预告`, { maxResults: 5, days: 7 }),
    // 2. 资金面：主力动向
    tavilySearch(`${name} 龙虎榜 资金流向 主力 机构 游资`, { maxResults: 5, days: 7 }),
    // 3. 事件面：关键事件
    tavilySearch(`${name} 重组 并购 股权 质押 减持`, { maxResults: 5, days: 14 }),
  ]);

  return {
    news: newsRes.results,
    funds: fundsRes.results,
    events: eventsRes.results,
  };
}

/**
 * 搜索个股新闻（兼容旧接口）
 */
export async function searchStockNews(
  stockCode: string,
  stockName?: string
): Promise<TavilySearchResponse> {
  const name = stockName || stockCode;

  return tavilySearch(`${name} 利好 利空 资金流向 龙虎榜 业绩预告`, {
    maxResults: 10,
    days: 7,
  });
}

/**
 * 搜索市场热点
 */
export async function searchMarketHot(): Promise<TavilySearchResponse> {
  const today = new Date();
  const dateStr = today.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });

  return tavilySearch(`${dateStr} A股 涨停板复盘 热点题材 龙头股 主力资金`, {
    maxResults: 15,
    days: 1,
  });
}

/**
 * 格式化搜索结果
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return "暂未找到相关新闻信息。";
  }

  return results
    .slice(0, 8)
    .map((r, i) => `### ${i + 1}. ${r.title}\n${r.content?.slice(0, 300) || ""}\n来源: ${r.url}`)
    .join("\n\n");
}
