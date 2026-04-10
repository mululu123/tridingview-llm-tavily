// AI 分析服务 - 使用智谱 GLM-5

import { TechnicalIndicators, formatTechnicalData } from "./tradingview";
import { SearchResult } from "./tavily";

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || "";
const ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

// 个股分析 Prompt - 买卖点判断
const STOCK_ANALYSIS_PROMPT = `你是一位A股短线交易员。用户不懂技术分析，需要你把技术指标翻译成**具体的买卖点位**。

## 技术指标解读规则

### RSI(14)
- < 30：超卖区，可能是买入机会
- 30-70：正常区间
- > 70：超买区，注意回调风险

### MACD
- DIF上穿DEA：金叉，买入信号
- DIF下穿DEA：死叉，卖出信号
- 柱状线由负转正：趋势转强
- 柱状线由正转负：趋势转弱

### KDJ
- K上穿D：金叉，买入信号
- K下穿D：死叉，卖出信号
- J < 20：超卖
- J > 100：超买

### 布林带
- 价格触及下轨：支撑位，可能反弹
- 价格触及上轨：压力位，可能回调
- 布林带收窄：变盘信号

### 成交量
- 放量上涨：买盘强劲
- 放量下跌：抛压大
- 缩量：观望情绪

## 输出格式

### 📊 技术面评分：XX/100

| 指标 | 数值 | 信号 | 得分 |
|------|------|------|------|
| RSI | {值} | {超买/超卖/中性} | {分数} |
| MACD | DIF={v}, DEA={v} | {金叉/死叉/中性} | {分数} |
| KDJ | K={v}, D={v}, J={v} | {金叉/死叉/超买/超卖} | {分数} |
| 布林带 | 价格位置 | {支撑位/压力位/中轨} | {分数} |
| 成交量 | {值} | {放量/缩量} | {分数} |

### 📰 消息面：利好/利空/中性

{关键信息1-2条}

---

## 🎯 操作建议

**方向**：{买入 / 观望 / 卖出}

**买入价**：{具体价格或区间，如"回调到XX元附近可买入"}

**卖出价**：{目标价位}

**止损价**：{跌破XX元止损}

**理由**：{一句话说明为什么这个买卖点}

---

*免责声明：仅供参考，不构成投资建议*`;

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
 * 格式化新闻结果
 */
function formatNewsResults(results: SearchResult[]): string {
  if (results.length === 0) return "暂无相关新闻";
  return results
    .slice(0, 5)
    .map((r, i) => `${i + 1}. ${r.title}\n${r.content?.slice(0, 150) || ""}`)
    .join("\n\n");
}

/**
 * 个股分析
 */
export async function analyzeStock(
  technicalData: TechnicalIndicators,
  newsResults: SearchResult[]
): Promise<string> {
  const technicalText = formatTechnicalData(technicalData);
  const newsText = formatNewsResults(newsResults);

  return callGLM(
    STOCK_ANALYSIS_PROMPT,
    `## 技术数据\n${technicalText}\n\n## 消息面\n${newsText}\n\n请给出买卖点建议。`
  );
}

/**
 * 市场热点分析
 */
export async function analyzeMarketHot(newsResults: SearchResult[]): Promise<string> {
  const newsText = newsResults
    .slice(0, 8)
    .map((r, i) => `${i + 1}. ${r.title}\n${r.content?.slice(0, 150) || ""}`)
    .join("\n\n");

  return callGLM(
    MARKET_HOT_PROMPT,
    `## 市场信息\n${newsText}\n\n请总结今日热点。`
  );
}
