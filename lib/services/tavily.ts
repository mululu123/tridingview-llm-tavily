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
}
