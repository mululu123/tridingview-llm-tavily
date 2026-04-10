// AI 分析服务 - 使用智谱 GLM-5

import { TechnicalIndicators, formatTechnicalData } from "./tradingview";
import { SearchResult, formatSearchResults } from "./tavily";

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || "";
const ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

// 个股分析 Prompt
const STOCK_ANALYSIS_PROMPT = `你是一个专业的A股短线交易分析助手。根据以下技术数据和消息面信息，对该股票进行短线体检评分。

## 分析规则

### 技术面评分（满分100分）
- **RSI(14)**: 超卖区(<30)加15分，中性区(30-70)加10分，超买区(>70)加0分
- **MACD**: DIF上穿DEA(金叉)加20分，DIF下穿DEA(死叉)减10分，零轴上方加10分
- **KDJ**: K上穿D加15分，J值<20(超卖)加10分，J值>80(超买)减10分
- **布林带**: 价格在中轨下方靠近下轨(支撑)加15分，价格突破上轨减5分
- **成交量**: 放量(>5日均量1.5倍)且上涨加15分，缩量下跌减5分
- **K线形态**: 多头排列加10分，空头排列减10分

### 消息面判断
- 综合新闻搜索结果，判断利好/利空/中性
- 提取最关键的1-2条信息

## 输出格式

### 技术面评分：XX/100

**评分明细：**
| 指标 | 数值 | 信号 | 得分 |
|------|------|------|------|
| RSI(14) | {v} | {信号} | {s} |
| MACD | DIF={v}, DEA={v} | {信号} | {s} |
| KDJ | K={v}, D={v}, J={v} | {信号} | {s} |
| 布林带 | 上={v} 中={v} 下={v} | {信号} | {s} |
| 成交量 | {v} | {信号} | {s} |

### 消息面判断：利好/利空/中性
- 关键信息1：{...}
- 关键信息2：{...}

### 综合建议：**买入 / 观望 / 卖出**
**一句话理由：**{3句话以内的理由}`;

// 市场热点 Prompt
const MARKET_HOT_PROMPT = `你是一个专业的A股市场分析助手。根据以下今日市场信息，提取当前最核心的热门题材板块。

## 分析规则
- 从搜索结果中识别重复出现的高频题材关键词
- 判断题材的驱动逻辑（政策利好/业绩催化/事件驱动/资金推动）
- 找到板块内最强势的龙头股
- 判断板块情绪阶段：升温/高潮/分歧/降温

## 输出格式

按热度排序，输出 **Top 3** 热门板块：

### 第1热门：{板块名称}
- **驱动逻辑：** {1-2句话}
- **龙头股：** {代码 名称}
- **情绪判断：** {升温/高潮/分歧/降温}

### 今日市场情绪总览
- **赚钱效应：** {好/一般/差}
- **建议关注方向：** {1句话}`;

interface ZhipuResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
  error?: { message: string };
}

async function callGLM(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!ZHIPU_API_KEY) {
    return "⚠️ AI 服务未配置，请设置 ZHIPU_API_KEY";
  }

  try {
    const res = await fetch(ZHIPU_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ZHIPU_API_KEY}`,
      },
      body: JSON.stringify({
        model: "glm-5-turbo",
        max_tokens: 4096,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    const data = (await res.json()) as ZhipuResponse;

    if (data.error) {
      console.error("Zhipu API error:", data.error);
      return `⚠️ AI 分析失败: ${data.error.message}`;
    }

    return data.choices?.[0]?.message?.content || "分析结果为空";
  } catch (error) {
    console.error("GLM call error:", error);
    return "⚠️ AI 服务连接失败";
  }
}

export async function analyzeStock(
  technicalData: TechnicalIndicators,
  newsResults: SearchResult[]
): Promise<string> {
  const technicalText = formatTechnicalData(technicalData);
  const newsText = formatSearchResults(newsResults);

  return callGLM(
    STOCK_ANALYSIS_PROMPT,
    `## 技术数据\n${technicalText}\n\n## 消息面\n${newsText}\n\n请分析并给出操作建议。`
  );
}

export async function analyzeMarketHot(newsResults: SearchResult[]): Promise<string> {
  return callGLM(
    MARKET_HOT_PROMPT,
    `## 市场信息\n${formatSearchResults(newsResults)}\n\n请总结今日热点。`
  );
}
