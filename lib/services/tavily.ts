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
}
