/**
 * TradingView 数据获取服务
 * 使用 RapidAPI 获取 A股技术指标数据
 */

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || ""
const BASE_URL = "https://tradingview-data1.p.rapidapi.com"

interface StockData {
  quote: Record<string, unknown>
  ta: Record<string, unknown>
  info: {
    symbol: string
    exchange: string
    tv_symbol: string
    name?: string
    industry?: string
  }
}

/**
 * 将用户输入的股票代码转为 TradingView 格式
 */
export function formatStockCode(userInput: string): string {
  let code = userInput.trim().toUpperCase()
  if (code.includes(":")) return code
  code = code.replace(".SZ", "").replace(".SH", "")
  if (code.startsWith("6")) {
    return `SSE:${code}`
  }
  return `SZSE:${code}`
}

/**
 * 获取股票名称 (简单映射，实际应从 API 获取)
 */
export function getStockName(code: string): string {
  // 常见股票名称映射
  const stockNames: Record<string, string> = {
    "000001": "平安银行",
    "600519": "贵州茅台",
    "000858": "五粮液",
    "600036": "招商银行",
    "601318": "中国平安",
    "000333": "美的集团",
    "600276": "恒瑞医药",
    "000651": "格力电器",
    "601888": "中国中免",
    "600900": "长江电力",
  }
  const pureCode = code.replace("SSE:", "").replace("SZSE:", "")
  return stockNames[pureCode] || pureCode
}

async function requestWithRetry(
  url: string,
  maxRetries = 3
): Promise<Record<string, unknown>> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: {
          "x-rapidapi-host": "tradingview-data1.p.rapidapi.com",
          "x-rapidapi-key": RAPIDAPI_KEY,
        },
      })

      if (resp.status === 429) {
        const wait = (attempt + 1) * 12000
        await new Promise((r) => setTimeout(r, wait))
        continue
      }

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`)
      }

      return await resp.json()
    } catch (error) {
      if (attempt === maxRetries - 1) throw error
    }
  }
  return { success: false, error: "rate_limited" }
}

/**
 * 获取股票技术数据
 */
export async function getStockData(symbol: string): Promise<StockData> {
  const tvSymbol = formatStockCode(symbol)
  const [exchange, sym] = tvSymbol.split(":")

  const result: StockData = {
    quote: {},
    ta: {},
    info: { symbol: sym, exchange, tv_symbol: tvSymbol },
  }

  try {
    // 获取报价数据
    const quoteData = await requestWithRetry(`${BASE_URL}/api/quote/${tvSymbol}`)
    if (quoteData.success && quoteData.data) {
      const d = quoteData.data as Record<string, unknown>
      const quoteInfo = (d.data as Record<string, unknown>) || d
      result.quote = quoteInfo
      result.info.name =
        (quoteInfo.short_name as string) ||
        (quoteInfo.name as string) ||
        getStockName(tvSymbol)
      result.info.industry = quoteInfo.industry as string
    }
  } catch (error) {
    result.quote = { error: String(error) }
  }

  // 短暂延迟避免频率限制
  await new Promise((r) => setTimeout(r, 1000))

  try {
    // 获取技术指标
    const taData = await requestWithRetry(
      `${BASE_URL}/api/ta/${tvSymbol}/indicators`
    )
    if (taData.success && taData.data) {
      result.ta = { indicators: taData.data }
    }
  } catch (error) {
    result.ta = { error: String(error) }
  }

  return result
}

/**
 * 将技术数据格式化为 Prompt 友好的文本
 */
export function formatTechnicalData(data: StockData): string {
  const parts: string[] = []
  const { info, quote, ta } = data

  // 股票标识头部
  if (info.tv_symbol) {
    let header = `### 股票: ${info.tv_symbol}`
    if (info.name) header += `（${info.name}）`
    parts.push(header)
  }
  if (info.industry) {
    parts.push(`- 行业: ${info.industry}`)
  }
  parts.push("")

  // 报价信息
  if (quote && !("error" in quote)) {
    parts.push("### 实时报价")
    parts.push(`- 当前价: ${quote.lp || quote.close || "N/A"}`)
    parts.push(`- 开盘价: ${quote.open_price || quote.open || "N/A"}`)
    parts.push(`- 最高价: ${quote.high_price || quote.high || "N/A"}`)
    parts.push(`- 最低价: ${quote.low_price || quote.low || "N/A"}`)
    parts.push(`- 成交量: ${quote.volume || "N/A"}`)
  }

  // 技术指标
  const indicators = (ta as { indicators?: Record<string, number> }).indicators
  if (indicators) {
    parts.push("\n### 核心技术指标")

    const rsi = indicators.RSI || indicators.RSI14
    if (rsi !== undefined) {
      const signal = rsi > 70 ? "超买" : rsi < 30 ? "超卖" : "中性"
      parts.push(`- RSI(14): ${rsi.toFixed(2)} (${signal})`)
    }

    const macd = indicators["MACD.macd"]
    const macdSignal = indicators["MACD.signal"]
    if (macd !== undefined) {
      const hist = macdSignal ? (macd - macdSignal).toFixed(4) : "N/A"
      parts.push(
        `- MACD: DIF=${macd.toFixed(4)}, DEA=${macdSignal?.toFixed(4) || "N/A"}, 柱状=${hist}`
      )
    }

    const stochK = indicators["Stoch.K"]
    const stochD = indicators["Stoch.D"]
    if (stochK !== undefined) {
      const j = stochD ? (3 * stochK - 2 * stochD).toFixed(2) : "N/A"
      parts.push(`- KDJ: K=${stochK.toFixed(2)}, D=${stochD?.toFixed(2) || "N/A"}, J=${j}`)
    }

    const bbUpper = indicators["BB.upper"]
    const bbLower = indicators["BB.lower"]
    const bbMid = indicators["BB.middle"]
    if (bbUpper !== undefined) {
      parts.push(
        `- 布林带: 上轨=${bbUpper.toFixed(2)}, 中轨=${bbMid?.toFixed(2) || "N/A"}, 下轨=${bbLower?.toFixed(2) || "N/A"}`
      )
    }

    const adx = indicators.ADX
    if (adx !== undefined) {
      parts.push(`- ADX: ${adx.toFixed(2)} (${adx > 25 ? "强趋势" : "弱趋势"})`)
    }

    if (indicators.EMA10) parts.push(`- EMA10: ${indicators.EMA10.toFixed(2)}`)
    if (indicators.EMA20) parts.push(`- EMA20: ${indicators.EMA20.toFixed(2)}`)
    if (indicators.EMA50) parts.push(`- EMA50: ${indicators.EMA50.toFixed(2)}`)
  }

  return parts.length > 0 ? parts.join("\n") : "技术数据获取失败"
}
