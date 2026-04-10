<<<<<<< HEAD
/**
 * AI 分析服务
 * 使用 GLM-5 或 OpenAI 兼容接口进行分析
 */

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || ""
const ZHIPU_BASE_URL = "https://api.z.ai/api/anthropic"

// Prompt 模板
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

## 输入数据

### 技术数据（来自TradingView）
{technical_data}

### 消息面（来自Tavily搜索）
{news_data}

## 输出格式（严格遵守）

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
**一句话理由：**{3句话以内的理由}`

const MARKET_HOT_PROMPT = `你是一个专业的A股市场分析助手。根据以下今日市场信息，提取当前最核心的热门题材板块。

## 分析规则
- 从搜索结果中识别重复出现的高频题材关键词
- 判断题材的驱动逻辑（政策利好/业绩催化/事件驱动/资金推动）
- 找到板块内最强势的龙头股
- 判断板块情绪阶段：升温（刚开始炒作）/ 高潮（一致看多）/ 分歧（多空分歧）/ 降温（资金撤退）

## 输入数据

### 市场信息（来自Tavily搜索）
{market_data}

## 输出格式（严格遵守）

按热度排序，输出 **Top 3** 热门板块：

---

### 第1热门：{板块名称}
- **驱动逻辑：** {1-2句话说明为什么这个题材在炒}
- **龙头股：** {代码 名称}、{代码 名称}
- **情绪判断：** {升温/高潮/分歧/降温}

### 第2热门：{板块名称}
- **驱动逻辑：** {...}
- **龙头股：** {...}
- **情绪判断：** {...}

### 第3热门：{板块名称}
- **驱动逻辑：** {...}
- **龙头股：** {...}
- **情绪判断：** {...}

---

### 今日市场情绪总览
- **赚钱效应：** {好/一般/差}
- **建议关注方向：** {1句话}
- **风险提示：** {1句话}`

interface MessageContent {
  type: string
  text?: string
}

interface Message {
  content: MessageContent[]
}

async function callZhipuAPI(prompt: string): Promise<string> {
  const response = await fetch(`${ZHIPU_BASE_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ZHIPU_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "glm-5",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`AI API error: ${response.status} - ${errorText}`)
  }

  const data = (await response.json()) as Message
  return data.content[0]?.text || "分析失败"
}

/**
 * 个股短线体检分析
 */
export async function analyzeStock(
  technicalData: string,
  newsData: string
): Promise<string> {
  const prompt = STOCK_ANALYSIS_PROMPT.replace(
    "{technical_data}",
    technicalData
  ).replace("{news_data}", newsData)

  return callZhipuAPI(prompt)
}

/**
 * 市场热点分析
 */
export async function analyzeMarket(marketData: string): Promise<string> {
  const prompt = MARKET_HOT_PROMPT.replace("{market_data}", marketData)
  return callZhipuAPI(prompt)
=======
// AI analyzer service using Zhipu AI (GLM-4)

import { TechnicalIndicators, formatTechnicalData } from "./tradingview";
import { SearchResult, formatSearchResults } from "./tavily";
import fs from "fs";
import path from "path";

function loadPrompt(filename: string): string {
  try {
    const promptPath = path.join(process.cwd(), "prompts", filename);
    return fs.readFileSync(promptPath, "utf-8");
  } catch (error) {
    console.error(`Error loading prompt ${filename}:`, error);
    return "";
  }
}

export async function analyzeStock(
  technicalData: TechnicalIndicators,
  newsResults: SearchResult[]
): Promise<string> {
  const zhipuApiKey = process.env.ZHIPU_API_KEY;
  
  if (!zhipuApiKey) {
    return generateMockAnalysis(technicalData, "stock");
  }

  const systemPrompt = loadPrompt("stock_analysis.md");
  const technicalText = formatTechnicalData(technicalData);
  const newsText = formatSearchResults(newsResults);

  const userPrompt = `
请分析以下股票：

${technicalText}

## 最新消息面
${newsText}

请给出详细的分析报告和操作建议。
  `.trim();

  try {
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${zhipuApiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [
          { role: "system", content: systemPrompt || "你是一个专业的A股短线交易分析师。" },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      console.error(`Zhipu API error: ${response.status}`);
      return generateMockAnalysis(technicalData, "stock");
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "分析失败，请稍后重试。";
  } catch (error) {
    console.error("Error analyzing stock:", error);
    return generateMockAnalysis(technicalData, "stock");
  }
}

export async function analyzeMarketHot(newsResults: SearchResult[]): Promise<string> {
  const zhipuApiKey = process.env.ZHIPU_API_KEY;
  
  if (!zhipuApiKey) {
    return generateMockAnalysis(null, "market");
  }

  const systemPrompt = loadPrompt("market_hot.md");
  const newsText = formatSearchResults(newsResults);

  const userPrompt = `
请分析今日A股市场热点：

${newsText}

请总结今日市场热点板块、龙头股和投资机会。
  `.trim();

  try {
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${zhipuApiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [
          { role: "system", content: systemPrompt || "你是一个专业的A股市场分析师。" },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      console.error(`Zhipu API error: ${response.status}`);
      return generateMockAnalysis(null, "market");
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "分析失败，请稍后重试。";
  } catch (error) {
    console.error("Error analyzing market:", error);
    return generateMockAnalysis(null, "market");
  }
}

function generateMockAnalysis(data: TechnicalIndicators | null, type: "stock" | "market"): string {
  if (type === "stock" && data) {
    return `
# ${data.name} (${data.symbol}) 分析报告

## 技术面分析

### 价格走势
当前股价 **${data.close}元**，${data.change > 0 ? "上涨" : "下跌"} ${Math.abs(data.changePercent)}%。

### 均线系统
- 短期均线(MA5/MA10): ${data.close > data.ma.ma5 ? "多头排列，短期趋势向上" : "空头排列，短期趋势向下"}
- 中期均线(MA20): ${data.close > data.ma.ma20 ? "站上中期均线，中期趋势偏强" : "跌破中期均线，中期趋势偏弱"}

### 技术指标
- **RSI(14)**: ${data.rsi} - ${data.rsi > 70 ? "超买区域，注意回调风险" : data.rsi < 30 ? "超卖区域，可能存在反弹机会" : "中性区域"}
- **MACD**: ${data.macd.histogram > 0 ? "红柱，多头动能" : "绿柱，空头动能"}
- **KDJ**: K=${data.kdj.k}, D=${data.kdj.d}, J=${data.kdj.j}

### TradingView综合评级
**${data.recommendation}** - 买入信号${data.recommendationSummary.buy}个，卖出信号${data.recommendationSummary.sell}个

## 操作建议

${data.recommendation === "STRONG_BUY" || data.recommendation === "BUY" 
  ? "当前技术面偏多，可以考虑逢低布局，注意设置止损位。" 
  : data.recommendation === "STRONG_SELL" || data.recommendation === "SELL"
  ? "当前技术面偏空，建议观望或轻仓参与，注意控制风险。"
  : "当前处于震荡格局，建议观望等待明确信号。"}

---
*本报告仅供参考，不构成投资建议。股市有风险，投资需谨慎。*
    `.trim();
  }

  return `
# 今日A股市场热点分析

## 市场概况
今日市场整体呈现结构性行情，热点板块轮动明显。

## 热点板块

### 1. 科技板块
- 人工智能概念持续活跃
- 半导体板块有所表现
- 算力基础设施相关个股受关注

### 2. 新能源板块
- 光伏产业链企业有所反弹
- 储能概念表现活跃

### 3. 消费板块
- 食品饮料板块稳健
- 医药生物板块分化

## 龙头股表现
今日涨停个股主要集中在科技和新能源领域，市场资金对确定性较强的方向保持关注。

## 投资建议
1. 关注政策支持的科技创新方向
2. 新能源长期趋势仍在，逢低关注龙头
3. 消费板块可作为防御性配置

---
*本报告仅供参考，不构成投资建议。股市有风险，投资需谨慎。*
  `.trim();
>>>>>>> origin/v0/zmpple-7535-fb84d16f
}
