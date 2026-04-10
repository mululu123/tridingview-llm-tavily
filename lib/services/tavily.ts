<<<<<<< HEAD
/**
 * Tavily 搜索服务
 * 用于获取股票新闻和市场热点
 */

const TAVILY_API_KEY = process.env.TAVILY_API_KEY || ""
const TAVILY_API_URL = "https://api.tavily.com/search"

interface TavilyResult {
  title: string
  content: string
  url: string
}

interface TavilyResponse {
  answer?: string
  results: TavilyResult[]
}

async function tavilySearch(
  query: string,
  options: {
    topic?: string
    timeRange?: string
    maxResults?: number
  } = {}
): Promise<TavilyResponse> {
  const { topic = "finance", timeRange = "week", maxResults = 5 } = options

  const response = await fetch(TAVILY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      topic,
      time_range: timeRange,
      max_results: maxResults,
      include_answer: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.status}`)
  }

  return response.json()
}

function formatResults(result: TavilyResponse): string {
  const parts: string[] = []

  if (result.answer) {
    parts.push(`## AI 摘要\n${result.answer}`)
  }

  for (const r of result.results || []) {
    parts.push(`### ${r.title}\n${r.content}\n来源: ${r.url}`)
  }

  return parts.join("\n\n")
}

/**
 * 搜索个股近期利好/利空/资金面消息
 */
export async function searchStockNews(
  stockName: string,
  stockCode: string
): Promise<string> {
  const query = `${stockName} ${stockCode} 利好 利空 资金面 龙虎榜 短线`
  const result = await tavilySearch(query, {
    topic: "finance",
    timeRange: "week",
    maxResults: 5,
  })
  return formatResults(result)
}

/**
 * 搜索今日A股市场热点题材
 */
export async function searchMarketHot(): Promise<string> {
  const queries = [
    "今日A股涨停复盘 热点题材 主力资金流向",
    "A股 游资 龙虎榜 今日 动向 板块",
  ]

  const results: string[] = []

  for (const q of queries) {
    const result = await tavilySearch(q, {
      topic: "finance",
      timeRange: "day",
      maxResults: 5,
    })
    results.push(formatResults(result))
  }

  return results.join("\n\n---\n\n")
=======
// Tavily search service for fetching stock news and market hot topics

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

export async function searchStockNews(stockCode: string, stockName?: string): Promise<TavilySearchResponse> {
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  
  if (!tavilyApiKey) {
    console.error("TAVILY_API_KEY not configured");
    return {
      results: [],
      query: stockCode,
      searchTime: 0,
    };
  }

  const query = stockName 
    ? `${stockName} ${stockCode} 股票 最新消息 公告`
    : `${stockCode} A股 股票 最新消息 公告`;

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: query,
        search_depth: "advanced",
        include_domains: [
          "eastmoney.com",
          "sina.com.cn",
          "10jqka.com.cn",
          "cnstock.com",
          "stcn.com",
          "cs.com.cn",
          "hexun.com",
        ],
        max_results: 10,
      }),
    });

    if (!response.ok) {
      console.error(`Tavily API error: ${response.status}`);
      return {
        results: [],
        query: query,
        searchTime: 0,
      };
    }

    const data = await response.json();
    
    return {
      results: data.results?.map((r: Record<string, unknown>) => ({
        title: r.title as string,
        url: r.url as string,
        content: r.content as string,
        publishedDate: r.published_date as string | undefined,
        score: r.score as number,
      })) || [],
      query: query,
      searchTime: data.response_time || 0,
    };
  } catch (error) {
    console.error("Error searching with Tavily:", error);
    return {
      results: [],
      query: query,
      searchTime: 0,
    };
  }
}

export async function searchMarketHot(): Promise<TavilySearchResponse> {
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  
  if (!tavilyApiKey) {
    console.error("TAVILY_API_KEY not configured");
    return {
      results: [],
      query: "市场热点",
      searchTime: 0,
    };
  }

  const today = new Date().toISOString().split("T")[0];
  const query = `${today} A股 市场热点 板块 龙头股 涨停`;

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: query,
        search_depth: "advanced",
        include_domains: [
          "eastmoney.com",
          "sina.com.cn",
          "10jqka.com.cn",
          "cnstock.com",
          "stcn.com",
          "cs.com.cn",
        ],
        max_results: 15,
      }),
    });

    if (!response.ok) {
      console.error(`Tavily API error: ${response.status}`);
      return {
        results: [],
        query: query,
        searchTime: 0,
      };
    }

    const data = await response.json();
    
    return {
      results: data.results?.map((r: Record<string, unknown>) => ({
        title: r.title as string,
        url: r.url as string,
        content: r.content as string,
        publishedDate: r.published_date as string | undefined,
        score: r.score as number,
      })) || [],
      query: query,
      searchTime: data.response_time || 0,
    };
  } catch (error) {
    console.error("Error searching market hot topics:", error);
    return {
      results: [],
      query: query,
      searchTime: 0,
    };
  }
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return "未找到相关新闻信息。";
  }

  return results
    .map((r, i) => `### ${i + 1}. ${r.title}\n${r.content}\n[来源](${r.url})`)
    .join("\n\n");
>>>>>>> origin/v0/zmpple-7535-fb84d16f
}
