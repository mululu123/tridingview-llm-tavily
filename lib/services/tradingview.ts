// TradingView 数据获取服务

export interface TechnicalIndicators {
  symbol: string;
  name: string;
  close: number;
  change: number;
  changePercent: number;
  volume: number;
  rsi: number;
  macd: { macd: number; signal: number; histogram: number };
  ma: { ma5: number; ma10: number; ma20: number; ma60: number };
  kdj: { k: number; d: number; j: number };
  bollinger: { upper: number; middle: number; lower: number };
  recommendation: string;
  recommendationSummary: { buy: number; sell: number; neutral: number };
}

// Python 服务地址（Docker 部署时使用）
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

/**
 * 从 Python 服务获取技术指标（优先）
 */
async function fetchFromPythonService(code: string, name?: string): Promise<TechnicalIndicators | null> {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/api/ta/${code}`, {
      signal: AbortSignal.timeout(10000), // 10秒超时
    });

    if (!response.ok) {
      console.log("[TradingView] Python service unavailable, fallback to RapidAPI");
      return null;
    }

    const data = await response.json();
    if (data.success && data.data) {
      return {
        ...data.data,
        name: name || data.data.name,
      };
    }
    return null;
  } catch (error) {
    console.log("[TradingView] Python service error:", error);
    return null;
  }
}

/**
 * 从 RapidAPI 获取技术指标（备选）
 */
async function fetchFromRapidAPI(code: string, name?: string): Promise<TechnicalIndicators | null> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) return null;

  const symbol = toTVSymbol(code);

  try {
    const quoteResp = await fetch(
      `https://tradingview-data1.p.rapidapi.com/api/quote/${symbol}`,
      {
        headers: {
          "x-rapidapi-host": "tradingview-data1.p.rapidapi.com",
          "x-rapidapi-key": rapidApiKey,
        },
      }
    );

    if (!quoteResp.ok) return null;

    const quoteData = await quoteResp.json();
    const q = quoteData?.data?.data || {};

    // 获取技术指标（可能因速率限制失败）
    let ind: Record<string, number> = {};
    try {
      const taResp = await fetch(
        `https://tradingview-data1.p.rapidapi.com/api/ta/${symbol}/indicators`,
        {
          headers: {
            "x-rapidapi-host": "tradingview-data1.p.rapidapi.com",
            "x-rapidapi-key": rapidApiKey,
          },
        }
      );
      if (taResp.ok) {
        const taData = await taResp.json();
        ind = taData?.data || {};
      }
    } catch {
      // TA API 限速，忽略
    }

    return {
      symbol: q.pro_name || symbol,
      name: q.local_description || name || code,
      close: q.lp || 0,
      change: q.ch || 0,
      changePercent: q.chp || 0,
      volume: q.volume || 0,
      rsi: Number((ind.RSI || 50).toFixed(2)),
      macd: {
        macd: Number((ind["MACD.macd"] || 0).toFixed(4)),
        signal: Number((ind["MACD.signal"] || 0).toFixed(4)),
        histogram: Number(((ind["MACD.macd"] || 0) - (ind["MACD.signal"] || 0)).toFixed(4)),
      },
      ma: {
        ma5: Number((ind.SMA10 || 0).toFixed(2)),
        ma10: Number((ind.SMA20 || 0).toFixed(2)),
        ma20: Number((ind.SMA50 || 0).toFixed(2)),
        ma60: Number((ind.SMA100 || 0).toFixed(2)),
      },
      kdj: {
        k: Number((ind["Stoch.K"] || 50).toFixed(2)),
        d: Number((ind["Stoch.D"] || 50).toFixed(2)),
        j: Number(((ind["Stoch.K"] || 50) * 3 - (ind["Stoch.D"] || 50) * 2).toFixed(2)),
      },
      bollinger: {
        upper: Number((ind["BB.upper"] || 0).toFixed(2)),
        middle: Number((ind["BB.middle"] || 0).toFixed(2)),
        lower: Number((ind["BB.lower"] || 0).toFixed(2)),
      },
      recommendation: mapRecommendation(ind["Recommend.All"] || 0),
      recommendationSummary: { buy: 0, sell: 0, neutral: 0 },
    };
  } catch (error) {
    console.error("[TradingView] RapidAPI error:", error);
    return null;
  }
}

export async function fetchTechnicalData(
  stockCode: string,
  stockName?: string
): Promise<TechnicalIndicators | null> {
  const code = stockCode.replace(/\D/g, "");

  // 1. 优先尝试 Python 服务（免费、无限制）
  const pythonData = await fetchFromPythonService(code, stockName);
  if (pythonData) return pythonData;

  // 2. 降级到 RapidAPI（有限流）
  const rapidData = await fetchFromRapidAPI(code, stockName);
  if (rapidData) return rapidData;

  // 3. 最后使用模拟数据
  return generateMockData(code, stockName);
}

function toTVSymbol(code: string): string {
  if (code.startsWith("6")) return `SSE:${code}`;
  if (code.startsWith("0") || code.startsWith("3")) return `SZSE:${code}`;
  if (code.startsWith("8") || code.startsWith("4")) return `BSE:${code}`;
  return `SSE:${code}`;
}

function mapRecommendation(mark: number): string {
  if (mark >= 1.5) return "STRONG_BUY";
  if (mark >= 0.5) return "BUY";
  if (mark >= -0.5) return "NEUTRAL";
  if (mark >= -1.5) return "SELL";
  return "STRONG_SELL";
}

function generateMockData(code: string, name?: string): TechnicalIndicators {
  const basePrice = 10 + Math.random() * 90;
  const change = (Math.random() - 0.5) * 5;

  return {
    symbol: toTVSymbol(code),
    name: name || `股票${code}`,
    close: Number(basePrice.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(((change / basePrice) * 100).toFixed(2)),
    volume: Math.floor(Math.random() * 10000000),
    rsi: Number((30 + Math.random() * 40).toFixed(2)),
    macd: { macd: 0, signal: 0, histogram: 0 },
    ma: { ma5: 0, ma10: 0, ma20: 0, ma60: 0 },
    kdj: { k: 50, d: 50, j: 50 },
    bollinger: { upper: 0, middle: 0, lower: 0 },
    recommendation: "NEUTRAL",
    recommendationSummary: { buy: 0, sell: 0, neutral: 0 },
  };
}

export function formatTechnicalData(data: TechnicalIndicators): string {
  return `
## 技术指标数据

**股票**: ${data.name} (${data.symbol})
**最新价**: ${data.close} | 涨跌: ${data.change} (${data.changePercent}%)
**成交量**: ${(data.volume / 10000).toFixed(2)}万

### 均线系统
- MA5: ${data.ma.ma5 || "暂无"}
- MA10: ${data.ma.ma10 || "暂无"}
- MA20: ${data.ma.ma20 || "暂无"}
- MA60: ${data.ma.ma60 || "暂无"}

### 技术指标
- RSI(14): ${data.rsi}
- MACD: DIF=${data.macd.macd}, DEA=${data.macd.signal}, MACD=${data.macd.histogram}
- KDJ: K=${data.kdj.k}, D=${data.kdj.d}, J=${data.kdj.j}
- 布林带: 上=${data.bollinger.upper}, 中=${data.bollinger.middle}, 下=${data.bollinger.lower}

### 综合评级: ${data.recommendation}
  `.trim();
}
