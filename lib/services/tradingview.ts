// TradingView 数据获取服务

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

// 转换为 TradingView 格式
function toTVSymbol(code: string): string {
  const c = code.replace(/\D/g, "");
  if (c.startsWith("6")) return `SSE:${c}`;
  if (c.startsWith("0") || c.startsWith("3")) return `SZSE:${c}`;
  if (c.startsWith("8") || c.startsWith("4")) return `BSE:${c}`;
  return `SSE:${c}`;
}

// 从代码推断股票名称
function inferStockName(code: string): string {
  const knownStocks: Record<string, string> = {
    "600519": "贵州茅台", "000001": "平安银行", "000002": "万科A",
    "600036": "招商银行", "601318": "中国平安", "000858": "五粮液",
    "000333": "美的集团", "000651": "格力电器", "600900": "长江电力",
    "601888": "中国中免", "300750": "宁德时代", "300059": "东方财富",
  };
  return knownStocks[code] || `股票${code}`;
}

export async function fetchTechnicalData(
  stockCode: string,
  stockName?: string
): Promise<TechnicalIndicators | null> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const code = stockCode.replace(/\D/g, "");
  const symbol = toTVSymbol(code);

  // 没有 API Key 时返回模拟数据
  if (!rapidApiKey) {
    console.log("RAPIDAPI_KEY not configured, using mock data");
    return generateMockData(code, stockName);
  }

  try {
    // 获取报价
    const quoteResp = await fetch(
      `https://tradingview-data1.p.rapidapi.com/api/quote/${symbol}`,
      {
        headers: {
          "x-rapidapi-host": "tradingview-data1.p.rapidapi.com",
          "x-rapidapi-key": rapidApiKey,
        },
      }
    );

    if (!quoteResp.ok) {
      console.error(`Quote API error: ${quoteResp.status}`);
      return generateMockData(code, stockName);
    }

    const quoteData = await quoteResp.json();
    const quote = quoteData?.data?.data || {};

    // 获取技术指标
    const taResp = await fetch(
      `https://tradingview-data1.p.rapidapi.com/api/ta/${symbol}/indicators`,
      {
        headers: {
          "x-rapidapi-host": "tradingview-data1.p.rapidapi.com",
          "x-rapidapi-key": rapidApiKey,
        },
      }
    );

    const taData = taResp.ok ? await taResp.json() : {};
    const ind = taData?.data || {};

    const name = quote.short_name || quote.description || stockName || inferStockName(code);

    return {
      symbol,
      name,
      close: quote.lp || 0,
      change: quote.change || 0,
      changePercent: quote.change_pct || 0,
      volume: quote.volume || 0,
      rsi: ind.RSI || 50,
      macd: {
        macd: ind["MACD.macd"] || 0,
        signal: ind["MACD.signal"] || 0,
        histogram: ind["MACD.hist"] || 0,
      },
      ma: {
        ma5: ind.SMA5 || ind.EMA5 || 0,
        ma10: ind.SMA10 || ind.EMA10 || 0,
        ma20: ind.SMA20 || ind.EMA20 || 0,
        ma60: ind.SMA60 || ind.EMA60 || 0,
      },
      kdj: {
        k: ind["Stoch.K"] || 50,
        d: ind["Stoch.D"] || 50,
        j: (ind["Stoch.K"] || 50) * 3 - (ind["Stoch.D"] || 50) * 2,
      },
      bollinger: {
        upper: ind["BB.upper"] || 0,
        middle: ind["BB.middle"] || 0,
        lower: ind["BB.lower"] || 0,
      },
      recommendation: quote.recommendation || "NEUTRAL",
      recommendationSummary: quote.recommendationSummary || { buy: 0, sell: 0, neutral: 0 },
    };
  } catch (error) {
    console.error("TradingView fetch error:", error);
    return generateMockData(code, stockName);
  }
}

function generateMockData(code: string, name?: string): TechnicalIndicators {
  const basePrice = 10 + Math.random() * 90;
  const change = (Math.random() - 0.5) * 5;

  return {
    symbol: toTVSymbol(code),
    name: name || inferStockName(code),
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
      ma5: Number((basePrice * 0.99).toFixed(2)),
      ma10: Number((basePrice * 0.98).toFixed(2)),
      ma20: Number((basePrice * 0.96).toFixed(2)),
      ma60: Number((basePrice * 0.92).toFixed(2)),
    },
    kdj: {
      k: Number((40 + Math.random() * 20).toFixed(2)),
      d: Number((40 + Math.random() * 20).toFixed(2)),
      j: Number((30 + Math.random() * 40).toFixed(2)),
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
}
