// 全球财经事件抓取服务
// 定时抓取金十数据、华尔街见闻等公开信息

export interface GlobalEvent {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string; // 行业分类
  importance: "high" | "medium" | "low";
  relatedSectors: string[]; // 相关板块
  crawledAt: string;
}

// 行业关键词映射
const SECTOR_KEYWORDS: Record<string, string[]> = {
  半导体: ["芯片", "半导体", "台积电", "英伟达", "ASML", "光刻机", "存储", "硅片"],
  新能源: ["光伏", "风电", "锂电", "新能源", "储能", "电池", "充电桩"],
  医药: ["医药", "创新药", "仿制药", "疫苗", "生物", "临床"],
  消费: ["消费", "零售", "白酒", "食品", "饮料", "家电"],
  金融: ["银行", "券商", "保险", "利率", "央行", "美联储"],
  地产: ["房地产", "楼市", "房企", "土地", "物业"],
  科技: ["AI", "人工智能", "互联网", "软件", "云计算", "大数据"],
  军工: ["军工", "国防", "航发", "导弹", "卫星"],
  能源: ["石油", "原油", "天然气", "煤炭", "电力"],
  金属: ["铜", "铝", "锂", "稀土", "黄金", "有色金属"],
};

// 重要事件关键词
const IMPORTANCE_KEYWORDS = {
  high: ["制裁", "禁令", "战争", "冲突", "暴跌", "暴涨", "熔断", "违约", "破产", "收购", "合并"],
  medium: ["加息", "降息", "政策", "法规", "业绩", "订单", "合作", "投资"],
  low: [],
};

/**
 * 抓取全球财经快讯
 */
export async function crawlGlobalEvents(): Promise<GlobalEvent[]> {
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
  const TAVILY_API_URL = "https://api.tavily.com/search";

  if (!TAVILY_API_KEY) {
    console.error("TAVILY_API_KEY not configured");
    return [];
  }

  // 并行搜索多个维度
  const searchQueries = [
    "全球财经快讯 最新 金十数据 华尔街见闻",
    "国际重大事件 经济影响 地缘政治",
    "美联储 利率决议 美股 市场影响",
    "大宗商品 原油 黄金 铜 价格波动",
  ];

  try {
    const results = await Promise.all(
      searchQueries.map(async (query) => {
        const response = await fetch(TAVILY_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query,
            search_depth: "advanced",
            max_results: 10,
            days: 1,
            include_answer: false,
          }),
        });

        if (!response.ok) return [];
        const data = await response.json();
        return data.results || [];
      })
    );

    // 合并去重
    const allEvents: GlobalEvent[] = [];
    const seenTitles = new Set<string>();

    for (const resultList of results) {
      for (const item of resultList) {
        if (seenTitles.has(item.title)) continue;
        seenTitles.add(item.title);

        const event = parseEvent(item);
        if (event) allEvents.push(event);
      }
    }

    return allEvents.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  } catch (error) {
    console.error("Crawl global events error:", error);
    return [];
  }
}

/**
 * 解析事件并分类
 */
function parseEvent(item: Record<string, unknown>): GlobalEvent | null {
  const title = (item.title as string) || "";
  const content = (item.content as string) || "";
  const text = `${title} ${content}`.toLowerCase();

  // 判断行业分类
  const relatedSectors: string[] = [];
  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      relatedSectors.push(sector);
    }
  }

  // 判断重要性
  let importance: "high" | "medium" | "low" = "low";
  for (const [level, keywords] of Object.entries(IMPORTANCE_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      importance = level as "high" | "medium";
      break;
    }
  }

  return {
    id: Buffer.from(title).toString("base64").slice(0, 16),
    title,
    summary: content.slice(0, 300),
    source: extractSource(item.url as string),
    url: (item.url as string) || "",
    publishedAt: (item.published_date as string) || new Date().toISOString(),
    category: relatedSectors[0] || "综合",
    importance,
    relatedSectors,
    crawledAt: new Date().toISOString(),
  };
}

/**
 * 提取来源
 */
function extractSource(url: string): string {
  if (!url) return "未知";
  if (url.includes("jin10")) return "金十数据";
  if (url.includes("wallstreetcn")) return "华尔街见闻";
  if (url.includes("reuters")) return "路透社";
  if (url.includes("bloomberg")) return "彭博";
  if (url.includes("cnbc")) return "CNBC";
  if (url.includes("sina")) return "新浪财经";
  if (url.includes("eastmoney")) return "东方财富";
  return "财经资讯";
}

/**
 * 根据股票行业匹配相关事件
 */
export function matchEventsForSector(
  events: GlobalEvent[],
  sector: string
): GlobalEvent[] {
  return events.filter((event) =>
    event.relatedSectors.includes(sector) || event.category === sector
  );
}

/**
 * 获取近期重要事件（用于首页展示）
 */
export function getImportantEvents(events: GlobalEvent[], limit = 10): GlobalEvent[] {
  return events
    .filter((e) => e.importance !== "low")
    .slice(0, limit);
}
