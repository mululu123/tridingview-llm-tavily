// AI 分析服务 - 使用智谱 GLM-5

import { TechnicalIndicators, formatTechnicalData } from "./tradingview";
import { SearchResult, getMarketTimeContext, deepSearchStock } from "./tavily";

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || "";
const ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

// 个股分析 Prompt - 事态感知版本
const STOCK_ANALYSIS_PROMPT = `你是一位有10年经验的A股短线交易员。你的任务是帮助用户做出**可执行的交易决策**。

## 核心原则
1. **少亏损比多赚钱更重要** - 宁可错过，不可做错
2. **风险优先** - 先看风险，再看机会
3. **事态感知** - 理解当前市场情绪和个股事件态势
4. **操作具体** - 给出明确的买卖点位和止损位

## 分析框架

### 一、事态感知（先理解大局）
- 当前日期和时间
- 市场状态：盘前/盘中/盘后
- 个股是否有重大事件（停牌、复牌、ST、退市风险等）

### 二、风险评估（风险优先）
从搜索结果中识别：
- 是否有利空公告？（减持、质押、诉讼、业绩下滑）
- 是否有监管风险？（问询函、警示函、立案调查）
- 技术面是否破位？（跌破关键支撑、放量下跌）

### 三、机会识别（其次看机会）
从搜索结果中识别：
- 是否有利好催化？（业绩大增、订单落地、政策利好）
- 资金面是否有主力进场？（龙虎榜、机构买入、北向增持）
- 技术面是否突破？（放量突破、金叉、突破压力位）

### 四、操作建议（必须具体）
- **方向**：买入/观望/卖出
- **时机**：现在/等回调/等突破
- **仓位**：轻仓试探/正常仓位/重仓
- **止损**：跌破XX元止损
- **止盈**：涨到XX元减仓

## 输出格式

---

## 📊 事态感知

**当前状态**: {日期} {时间} | {市场状态}
**个股事件**: {是否有重大事件，无则写"正常交易"}

---

## ⚠️ 风险提示

{从搜索结果中提取的风险点，格式：}
- [风险等级:高/中/低] {具体风险}
{无风险写"暂无明显风险"}

---

## 💡 机会信号

{从搜索结果中提取的机会点，格式：}
- [信号强度:强/中/弱] {具体机会}
{无机会写"暂无明显机会"}

---

## 🎯 操作建议

**方向**: {买入/观望/卖出}

**理由**: {一句话核心逻辑}

**操作计划**:
| 项目 | 建议 |
|------|------|
| 入场时机 | {具体价位或条件} |
| 建议仓位 | {轻仓10%/半仓30%/重仓50%} |
| 止损位 | {具体价位} |
| 止盈位 | {具体价位} |

---

**免责声明**: 仅供参考，不构成投资建议。投资有风险，入市需谨慎。`;

// 市场热点 Prompt - 事态感知版本
const MARKET_HOT_PROMPT = `你是一位A股市场观察员。分析今日市场热点，帮助用户把握资金流向。

## 分析框架

### 一、市场情绪感知
- 今日涨跌家数对比
- 成交量变化（放量/缩量）
- 北向资金流向

### 二、热点板块提取
从搜索结果中识别：
1. 今日涨停最多的板块（题材）
2. 板块驱动逻辑（政策/事件/业绩）
3. 板块内龙头股（最早涨停、封单最大）
4. 板块情绪阶段（启动/加速/高潮/分歧/退潮）

### 三、风险提示
- 是否有高位板块在退潮？
- 是否有亏钱效应扩散？

## 输出格式

---

## 📈 今日市场概览

**日期**: {日期}
**情绪**: {贪婪/中性/恐惧}
**成交量**: {放量/缩量} | {估算金额}

---

## 🔥 Top 3 热门板块

### 1️⃣ {板块名称}
| 项目 | 内容 |
|------|------|
| 驱动逻辑 | {政策/事件/业绩} {具体内容} |
| 龙头股 | {代码 名称} - {涨停时间} |
| 情绪阶段 | {启动/加速/高潮/分歧} |
| 可持续性 | {高/中/低} |

### 2️⃣ {板块名称}
...

### 3️⃣ {板块名称}
...

---

## 💰 资金动向

**北向资金**: {流入/流出} {金额}
**主力板块**: {资金流入最多的板块}

---

## ⚠️ 风险提示

{高位退潮板块或亏钱效应区域}

---

**明日关注**: {1-2个值得跟踪的方向}`;

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
        model: "glm-4-flash",
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

/**
 * 格式化深度搜索结果
 */
function formatDeepSearchResults(results: {
  news: SearchResult[];
  funds: SearchResult[];
  events: SearchResult[];
}): string {
  const formatSection = (title: string, items: SearchResult[]) => {
    if (items.length === 0) return `### ${title}\n暂无相关信息`;
    return `### ${title}\n${items
      .slice(0, 3)
      .map((r, i) => `${i + 1}. **${r.title}**\n   ${r.content?.slice(0, 200) || ""}\n   来源: ${r.url}`)
      .join("\n\n")}`;
  };

  return [
    formatSection("📰 新闻面（利好/利空）", results.news),
    formatSection("💰 资金面（龙虎榜/主力）", results.funds),
    formatSection("📋 事件面（重组/股权）", results.events),
  ].join("\n\n---\n\n");
}

/**
 * 个股深度分析（带事态感知）
 */
export async function analyzeStockWithSituationalAwareness(
  technicalData: TechnicalIndicators,
  stockCode: string,
  stockName?: string
): Promise<string> {
  // 获取事态上下文
  const context = getMarketTimeContext();

  // 深度搜索三个维度
  const deepResults = await deepSearchStock(stockCode, stockName);

  // 格式化技术数据
  const technicalText = formatTechnicalData(technicalData);

  // 构建用户提示
  const userPrompt = `## 事态上下文
- 当前时间: ${context.date} ${context.time}
- 市场状态: ${context.marketStatus}
- 交易日: ${context.tradingDay ? "是" : "否"}

## 股票信息
- 代码: ${stockCode}
- 名称: ${stockName || "未知"}

## 技术数据
${technicalText}

## 深度搜索结果
${formatDeepSearchResults(deepResults)}

---
请基于以上信息，给出你的分析。记住：风险优先，操作具体。`;

  return callGLM(STOCK_ANALYSIS_PROMPT, userPrompt);
}

/**
 * 兼容旧接口
 */
export async function analyzeStock(
  technicalData: TechnicalIndicators,
  newsResults: SearchResult[]
): Promise<string> {
  const technicalText = formatTechnicalData(technicalData);
  const newsText = newsResults
    .slice(0, 8)
    .map((r, i) => `${i + 1}. ${r.title}\n${r.content?.slice(0, 200) || ""}`)
    .join("\n\n");

  const context = getMarketTimeContext();

  return callGLM(
    STOCK_ANALYSIS_PROMPT,
    `## 事态上下文
- 当前时间: ${context.date} ${context.time}
- 市场状态: ${context.marketStatus}

## 技术数据
${technicalText}

## 新闻面
${newsText}

---
请基于以上信息，给出你的分析。`
  );
}

/**
 * 市场热点分析（带事态感知）
 */
export async function analyzeMarketHot(newsResults: SearchResult[]): Promise<string> {
  const context = getMarketTimeContext();

  const newsText = newsResults
    .slice(0, 10)
    .map((r, i) => `${i + 1}. **${r.title}**\n${r.content?.slice(0, 200) || ""}`)
    .join("\n\n");

  return callGLM(
    MARKET_HOT_PROMPT,
    `## 市场信息
- 日期: ${context.date}
- 时间: ${context.time}
- 市场状态: ${context.marketStatus}

## 今日市场新闻
${newsText}

---
请分析今日市场热点和资金动向。`
  );
}
