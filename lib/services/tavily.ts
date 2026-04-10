// Tavily 搜索服务

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

async function tavilySearch(
  query: string,
  options: { maxResults?: number; days?: number } = {}
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
        search_depth: "basic",
        max_results: maxResults,
        days,
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
 * 搜索个股新闻
 */
export async function searchStockNews(
  stockCode: string,
  stockName?: string
): Promise<TavilySearchResponse> {
  const name = stockName || stockCode;
  return tavilySearch(`${name} 股票 利好 利空 最新消息`, {
    maxResults: 10,
    days: 7,
  });
}

/**
 * 搜索市场热点
 */
export async function searchMarketHot(): Promise<TavilySearchResponse> {
  const today = new Date();
  const dateStr = today.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });

  return tavilySearch(`${dateStr} A股 涨停 热点板块 龙头股`, {
    maxResults: 10,
    days: 1,
  });
}
