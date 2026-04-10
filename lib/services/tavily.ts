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
}

const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "";
const TAVILY_API_URL = "https://api.tavily.com/search";

// 中国财经网站域名
const CHINESE_FINANCE_DOMAINS = [
  "eastmoney.com",
  "sina.com.cn",
  "10jqka.com.cn",
  "cnstock.com",
  "stcn.com",
  "cs.com.cn",
  "hexun.com",
  "finance.qq.com",
  "finance.sina.com.cn",
];

async function tavilySearch(
  query: string,
  options: {
    timeRange?: string;
    maxResults?: number;
  } = {}
): Promise<TavilySearchResponse> {
  const { timeRange = "week", maxResults = 10 } = options;

  if (!TAVILY_API_KEY) {
    console.error("TAVILY_API_KEY not configured");
    return {
      results: [],
      query,
      searchTime: 0,
    };
  }

  try {
    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: "advanced",
        include_domains: CHINESE_FINANCE_DOMAINS,
        time_range: timeRange,
        max_results: maxResults,
        include_answer: true,
      }),
    });

    if (!response.ok) {
      console.error(`Tavily API error: ${response.status}`);
      return {
        results: [],
        query,
        searchTime: 0,
      };
    }

    const data = await response.json();

    return {
      results:
        data.results?.map((r: Record<string, unknown>) => ({
          title: r.title as string,
          url: r.url as string,
          content: r.content as string,
          publishedDate: r.published_date as string | undefined,
          score: r.score as number,
        })) || [],
      query,
      searchTime: data.response_time || 0,
    };
  } catch (error) {
    console.error("Error searching with Tavily:", error);
    return {
      results: [],
      query,
      searchTime: 0,
    };
  }
}

/**
 * 搜索个股近期利好/利空/资金面消息
 */
export async function searchStockNews(
  stockCode: string,
  stockName?: string
): Promise<TavilySearchResponse> {
  const query = stockName
    ? `${stockName} ${stockCode} 利好 利空 资金面 龙虎榜 短线`
    : `${stockCode} A股 利好 利空 资金面`;

  return tavilySearch(query, {
    timeRange: "week",
    maxResults: 10,
  });
}

/**
 * 搜索今日A股市场热点题材
 */
export async function searchMarketHot(): Promise<TavilySearchResponse> {
  const today = new Date().toISOString().split("T")[0];
  const query = `${today} A股 涨停复盘 热点题材 主力资金流向 龙虎榜`;

  return tavilySearch(query, {
    timeRange: "day",
    maxResults: 15,
  });
}

/**
 * 格式化搜索结果为文本
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return "未找到相关新闻信息。";
  }

  return results
    .slice(0, 5)
    .map((r, i) => `### ${i + 1}. ${r.title}\n${r.content}\n[来源](${r.url})`)
    .join("\n\n");
}
