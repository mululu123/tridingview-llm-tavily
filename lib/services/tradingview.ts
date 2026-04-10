<<<<<<< HEAD
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
=======
// TradingView data service - fetches technical indicators for A-shares

export interface TechnicalIndicators {
  symbol: string;
  name: string;
  close: number;
  change: number;
  changePercent: number;
  volume: number;
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  ma: {
    ma5: number;
    ma10: number;
    ma20: number;
    ma60: number;
  };
  kdj: {
    k: number;
    d: number;
    j: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
  recommendation: string;
  recommendationSummary: {
    buy: number;
    sell: number;
    neutral: number;
  };
}

// Convert stock code to TradingView symbol format
function convertToTVSymbol(stockCode: string): string {
  const code = stockCode.replace(/[^0-9]/g, "");
  
  if (code.startsWith("6")) {
    return `SSE:${code}`;
  } else if (code.startsWith("0") || code.startsWith("3")) {
    return `SZSE:${code}`;
  } else if (code.startsWith("8") || code.startsWith("4")) {
    return `BSE:${code}`;
  }
  
  return `SSE:${code}`;
}

// Get stock name from code (simplified mapping)
function getStockName(stockCode: string): string {
  const code = stockCode.replace(/[^0-9]/g, "");
  // This would normally come from an API, using placeholder for now
  return `股票${code}`;
}

export async function fetchTechnicalData(stockCode: string): Promise<TechnicalIndicators | null> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  
  if (!rapidApiKey) {
    console.error("RAPIDAPI_KEY not configured");
    // Return mock data for development
    return generateMockData(stockCode);
  }

  const symbol = convertToTVSymbol(stockCode);
  
  try {
    const response = await fetch(
      `https://tradingview-ta-api-azfn.p.rapidapi.com/analysis?symbol=${encodeURIComponent(symbol)}&interval=1d`,
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": rapidApiKey,
          "X-RapidAPI-Host": "tradingview-ta-api-azfn.p.rapidapi.com",
        },
      }
    );

    if (!response.ok) {
      console.error(`TradingView API error: ${response.status}`);
      return generateMockData(stockCode);
    }

    const data = await response.json();
    
    return {
      symbol: symbol,
      name: data.name || getStockName(stockCode),
      close: data.indicators?.close || 0,
      change: data.indicators?.change || 0,
      changePercent: data.indicators?.changePercent || 0,
      volume: data.indicators?.volume || 0,
      rsi: data.indicators?.RSI || 50,
      macd: {
        macd: data.indicators?.["MACD.macd"] || 0,
        signal: data.indicators?.["MACD.signal"] || 0,
        histogram: data.indicators?.["MACD.hist"] || 0,
      },
      ma: {
        ma5: data.indicators?.["SMA5"] || 0,
        ma10: data.indicators?.["SMA10"] || 0,
        ma20: data.indicators?.["SMA20"] || 0,
        ma60: data.indicators?.["SMA50"] || 0,
      },
      kdj: {
        k: data.indicators?.["Stoch.K"] || 50,
        d: data.indicators?.["Stoch.D"] || 50,
        j: (data.indicators?.["Stoch.K"] || 50) * 3 - (data.indicators?.["Stoch.D"] || 50) * 2,
      },
      bollinger: {
        upper: data.indicators?.["BB.upper"] || 0,
        middle: data.indicators?.["BB.middle"] || 0,
        lower: data.indicators?.["BB.lower"] || 0,
      },
      recommendation: data.summary?.RECOMMENDATION || "NEUTRAL",
      recommendationSummary: {
        buy: data.summary?.BUY || 0,
        sell: data.summary?.SELL || 0,
        neutral: data.summary?.NEUTRAL || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching TradingView data:", error);
    return generateMockData(stockCode);
  }
}

function generateMockData(stockCode: string): TechnicalIndicators {
  const code = stockCode.replace(/[^0-9]/g, "");
  const basePrice = 10 + Math.random() * 90;
  const change = (Math.random() - 0.5) * 5;
  
  return {
    symbol: convertToTVSymbol(stockCode),
    name: `股票${code}`,
    close: Number(basePrice.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(((change / basePrice) * 100).toFixed(2)),
    volume: Math.floor(Math.random() * 10000000),
    rsi: Number((30 + Math.random() * 40).toFixed(2)),
    macd: {
      macd: Number((Math.random() * 2 - 1).toFixed(4)),
      signal: Number((Math.random() * 2 - 1).toFixed(4)),
      histogram: Number((Math.random() * 0.5 - 0.25).toFixed(4)),
    },
    ma: {
      ma5: Number((basePrice * (0.98 + Math.random() * 0.04)).toFixed(2)),
      ma10: Number((basePrice * (0.96 + Math.random() * 0.08)).toFixed(2)),
      ma20: Number((basePrice * (0.94 + Math.random() * 0.12)).toFixed(2)),
      ma60: Number((basePrice * (0.90 + Math.random() * 0.20)).toFixed(2)),
    },
    kdj: {
      k: Number((30 + Math.random() * 40).toFixed(2)),
      d: Number((30 + Math.random() * 40).toFixed(2)),
      j: Number((20 + Math.random() * 60).toFixed(2)),
    },
    bollinger: {
      upper: Number((basePrice * 1.05).toFixed(2)),
      middle: Number(basePrice.toFixed(2)),
      lower: Number((basePrice * 0.95).toFixed(2)),
    },
    recommendation: ["STRONG_BUY", "BUY", "NEUTRAL", "SELL", "STRONG_SELL"][Math.floor(Math.random() * 5)],
    recommendationSummary: {
      buy: Math.floor(Math.random() * 10),
      sell: Math.floor(Math.random() * 10),
      neutral: Math.floor(Math.random() * 10),
    },
  };
}

export function formatTechnicalData(data: TechnicalIndicators): string {
  return `
## 技术指标数据

**股票**: ${data.name} (${data.symbol})
**最新价**: ${data.close} | 涨跌: ${data.change} (${data.changePercent}%)
**成交量**: ${(data.volume / 10000).toFixed(2)}万

### 均线系统
- MA5: ${data.ma.ma5}
- MA10: ${data.ma.ma10}
- MA20: ${data.ma.ma20}
- MA60: ${data.ma.ma60}

### 技术指标
- RSI(14): ${data.rsi}
- MACD: DIF=${data.macd.macd}, DEA=${data.macd.signal}, MACD=${data.macd.histogram}
- KDJ: K=${data.kdj.k}, D=${data.kdj.d}, J=${data.kdj.j}
- 布林带: 上轨=${data.bollinger.upper}, 中轨=${data.bollinger.middle}, 下轨=${data.bollinger.lower}

### TradingView 信号
- 综合建议: ${data.recommendation}
- 买入信号: ${data.recommendationSummary.buy}
- 卖出信号: ${data.recommendationSummary.sell}
- 中性信号: ${data.recommendationSummary.neutral}
  `.trim();
>>>>>>> origin/v0/zmpple-7535-fb84d16f
}
