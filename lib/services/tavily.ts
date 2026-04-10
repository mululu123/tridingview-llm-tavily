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
 * 搜索个股新闻
 */
export async function searchStockNews(
  stockCode: string,
  stockName?: string
): Promise<TavilySearchResponse> {
  // 构建搜索关键词
  const keywords = [stockName, stockCode, "股票", "最新消息"].filter(Boolean).join(" ");

  return tavilySearch(keywords, {
    maxResults: 10,
    days: 7,
  });
}

/**
 * 搜索市场热点
 */
export async function searchMarketHot(): Promise<TavilySearchResponse> {
  const today = new Date().toLocaleDateString("zh-CN");
  const query = `${today} A股 涨停 热点板块 龙头股 市场行情`;

  return tavilySearch(query, {
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
