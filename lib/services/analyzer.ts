// AI 分析服务 - 事态感知版本

import { TechnicalIndicators, formatTechnicalData } from "./tradingview";
import { SearchResult } from "./tavily";
import { GlobalEvent } from "./event-crawler";

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || "";
const ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

// 事态感知分析 Prompt
const ANALYSIS_PROMPT = `你是一位资深的A股投资分析师。用户关注一只股票，你需要帮他理解：

1. **这个行业的全球事态**：最近发生了什么大事？有什么影响？
2. **个股情况**：技术面、消息面如何？
3. **综合判断**：现在值得关注吗？

## 分析原则
- 客观：基于事实，不做主观臆断
- 简洁：信息密度高，不废话
- 实用：给出有价值的洞察

## 输出格式

---

## 📡 行业事态（{行业名称}）

**过去72小时重要事件**：
{列出2-3条最重要的事件，每条1句话}

**事态判断**：
{利好/利空/中性} - {一句话说明为什么}

---

## 📰 个股消息面

{关键消息1-2条，每条1句话}

**消息面判断**：{利好/利空/中性}

---

## 🔬 技术面快扫

| 指标 | 数值 | 解读 |
|------|------|------|
| RSI | {值} | {超买/超卖/中性} |
| MACD | {值} | {金叉/死叉/趋势} |
| 成交量 | {值} | {放量/缩量} |

**技术面判断**：{偏多/偏空/中性}

---

## 💡 综合判断

**当前状态**：{机会/观望/风险}

**关键逻辑**：
{2-3句话说明核心逻辑}

**操作建议**：
{针对用户持仓情况的具体建议，如：空仓可关注回调机会，持仓可继续持有}

---

*免责声明：仅供参考，不构成投资建议*`;

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
 * 格式化事件
 */
function formatEvents(events: GlobalEvent[]): string {
  if (events.length === 0) return "暂无相关行业事件";

  return events
    .slice(0, 5)
    .map((e, i) => `${i + 1}. **${e.title}**\n   ${e.summary.slice(0, 100)}...`)
    .join("\n\n");
}

/**
 * 格式化新闻
 */
function formatNews(results: SearchResult[]): string {
  if (results.length === 0) return "暂无相关新闻";

  return results
    .slice(0, 3)
    .map((r, i) => `${i + 1}. ${r.title}\n   ${r.content?.slice(0, 100) || ""}...`)
    .join("\n\n");
}

/**
 * 事态感知综合分析
 */
export async function analyzeWithEvents(
  technicalData: TechnicalIndicators,
  events: GlobalEvent[],
  news: SearchResult[],
  sector: string,
  stockName: string
): Promise<string> {
  const technicalText = formatTechnicalData(technicalData);
  const eventsText = formatEvents(events);
  const newsText = formatNews(news);

  const userPrompt = `## 股票信息
- 名称：${stockName}
- 所属行业：${sector}

## 行业事态（${sector}）
${eventsText}

## 个股新闻
${newsText}

## 技术数据
${technicalText}

---
请给出综合分析。`;

  return callGLM(ANALYSIS_PROMPT, userPrompt);
}

/**
 * 简单分析（无事件）
 */
export async function analyzeStock(
  technicalData: TechnicalIndicators,
  newsResults: SearchResult[]
): Promise<string> {
  const technicalText = formatTechnicalData(technicalData);
  const newsText = formatNews(newsResults);

  return callGLM(
    ANALYSIS_PROMPT,
    `## 技术数据\n${technicalText}\n\n## 新闻面\n${newsText}\n\n请给出分析。`
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

  const MARKET_PROMPT = `你是A股市场观察员。根据以下信息，总结今日市场热点。

输出格式：
1. **Top 3 热门板块**（板块名 + 驱动逻辑 + 龙头股）
2. **市场情绪**（贪婪/中性/恐惧）
3. **关注方向**（1-2个值得跟踪的方向）

## 市场信息
${newsText}`;

  return callGLM(MARKET_PROMPT, newsText);
}
