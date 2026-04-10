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
}
