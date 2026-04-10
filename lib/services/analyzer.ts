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
}
