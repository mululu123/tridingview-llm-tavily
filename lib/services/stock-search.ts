// 股票搜索服务 - 支持股票名称和代码模糊查询

// A股热门股票数据（代码 -> 名称）
export const STOCK_DATABASE: Record<string, string> = {
  // 沪市主板
  "600519": "贵州茅台",
  "600036": "招商银行",
  "601318": "中国平安",
  "600276": "恒瑞医药",
  "600900": "长江电力",
  "601888": "中国中免",
  "600030": "中信证券",
  "601166": "兴业银行",
  "600000": "浦发银行",
  "601398": "工商银行",
  "601288": "农业银行",
  "601939": "建设银行",
  "601988": "中国银行",
  "600016": "民生银行",
  "600009": "上海机场",
  "600104": "上汽集团",
  "600887": "伊利股份",
  "600309": "万华化学",
  "600585": "海螺水泥",
  "600048": "保利发展",
  "601818": "光大银行",
  "600028": "中国石化",
  "601857": "中国石油",
  "601628": "中国人寿",
  "601328": "交通银行",
  "600837": "海通证券",
  "601211": "国泰君安",
  "600690": "海尔智家",
  "600006": "东风汽车",

  // 深市主板
  "000001": "平安银行",
  "000002": "万科A",
  "000333": "美的集团",
  "000651": "格力电器",
  "000858": "五粮液",
  "000063": "中兴通讯",
  "000725": "京东方A",
  "000568": "泸州老窖",
  "000538": "云南白药",
  "000661": "长春高新",
  "000768": "中航西飞",
  "000069": "华侨城A",
  "000519": "中兵红箭",
  "000402": "金融街",
  "000708": "中信特钢",
  "000338": "潍柴动力",
  "000625": "长安汽车",
  "000735": "罗牛山",

  // 创业板
  "300750": "宁德时代",
  "300059": "东方财富",
  "300015": "爱尔眼科",
  "300033": "同花顺",
  "300014": "亿纬锂能",
  "300124": "汇川技术",
  "300274": "阳光电源",
  "300122": "智飞生物",
  "300012": "华测检测",
  "300142": "沃森生物",
  "300347": "泰格医药",
  "300760": "迈瑞医疗",
  "300454": "深信服",
  "300408": "三环集团",
  "300017": "网宿科技",
  "300146": "汤臣倍健",
  "300285": "国瓷材料",
  "308001": "华利集团",

  // 科创板
  "688981": "中芯国际",
  "688599": "天合光能",
  "688369": "致远互联",
  "688111": "金山办公",
  "688012": "中微公司",
  "688561": "奇安信",
  "688041": "海光信息",
  "688256": "寒武纪",
  "688180": "君实生物",
  "688396": "华润微",
  "688185": "康希诺",
  "688223": "晶科能源",
};

// 反向映射（名称 -> 代码）
const NAME_TO_CODE: Record<string, string> = {};
for (const [code, name] of Object.entries(STOCK_DATABASE)) {
  NAME_TO_CODE[name] = code;
}

export interface StockSearchResult {
  code: string;
  name: string;
  matchType: "code" | "name" | "pinyin";
}

/**
 * 模糊搜索股票
 * 支持股票代码、股票名称模糊匹配
 */
export function searchStock(query: string, limit: number = 10): StockSearchResult[] {
  const results: StockSearchResult[] = [];
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  // 1. 精确匹配代码
  if (STOCK_DATABASE[normalizedQuery]) {
    results.push({
      code: normalizedQuery,
      name: STOCK_DATABASE[normalizedQuery],
      matchType: "code",
    });
  }

  // 2. 代码前缀匹配
  for (const [code, name] of Object.entries(STOCK_DATABASE)) {
    if (results.length >= limit) break;
    if (code.startsWith(normalizedQuery) && !results.find(r => r.code === code)) {
      results.push({
        code,
        name,
        matchType: "code",
      });
    }
  }

  // 3. 名称模糊匹配
  for (const [code, name] of Object.entries(STOCK_DATABASE)) {
    if (results.length >= limit) break;
    if (name.includes(query) && !results.find(r => r.code === code)) {
      results.push({
        code,
        name,
        matchType: "name",
      });
    }
  }

  // 4. 名称首字母匹配（简单实现）
  const pinyinMap: Record<string, string> = {
    "贵州茅台": "gzmt", "招商银行": "zsyh", "中国平安": "zgpa",
    "平安银行": "payh", "五粮液": "wly", "格力电器": "gldq",
    "美的集团": "mdjt", "宁德时代": "ndsd", "东方财富": "dfcf",
    "比亚迪": "byd", "恒瑞医药": "hryy",
    "长江电力": "cjdl", "中国中免": "zgzm", "中信证券": "zxzq",
    "兴业银行": "xyyh", "浦发银行": "pfyh", "工商银行": "gsyh",
    "农业银行": "nyyh", "建设银行": "jsyh", "中国银行": "zgyh",
    "民生银行": "msyh", "上海机场": "shjc", "上汽集团": "sqjt",
    "伊利股份": "ylgf", "万华化学": "whhx", "海螺水泥": "hlsn",
    "保利发展": "blfz", "光大银行": "gdyh", "中国石化": "zgsh",
    "中国石油": "zgsy", "中国人寿": "zgrs", "交通银行": "jtyh",
    "海通证券": "htzq", "国泰君安": "gtja", "海尔智家": "hezj",
    "万科A": "wk", "中兴通讯": "zxtx", "京东方A": "jdf",
    "泸州老窖": "lzl", "云南白药": "ynby", "长春高新": "ccgx",
    "同花顺": "ths", "亿纬锂能": "ywln", "汇川技术": "hcjs",
    "阳光电源": "ygdy", "智飞生物": "zfsw", "华测检测": "hcjc",
    "沃森生物": "wssw", "泰格医药": "tgyy", "迈瑞医疗": "mryl",
    "深信服": "sxf", "三环集团": "shjt", "网宿科技": "wskj",
    "汤臣倍健": "tcbj", "国瓷材料": "gccl", "华利集团": "hljt",
    "中芯国际": "zxgj", "天合光能": "thgn", "金山办公": "jsbg",
    "中微公司": "zwgs", "奇安信": "qax", "海光信息": "hgxx",
    "寒武纪": "hwj", "君实生物": "jssw", "华润微": "hrw",
  };

  for (const [code, name] of Object.entries(STOCK_DATABASE)) {
    if (results.length >= limit) break;
    const pinyin = pinyinMap[name] || "";
    if (pinyin.startsWith(normalizedQuery) && !results.find(r => r.code === code)) {
      results.push({
        code,
        name,
        matchType: "pinyin",
      });
    }
  }

  return results;
}

/**
 * 根据输入获取股票代码
 * 如果输入是名称，转换为代码；如果是代码，直接返回
 */
export function resolveStockCode(input: string): string | null {
  const trimmed = input.trim();

  // 纯数字，当作代码处理
  if (/^\d{6}$/.test(trimmed)) {
    return trimmed;
  }

  // 包含非数字字符，尝试名称匹配
  const results = searchStock(trimmed, 1);
  return results.length > 0 ? results[0].code : null;
}

/**
 * 获取股票名称
 */
export function getStockNameByCode(code: string): string {
  return STOCK_DATABASE[code] || `股票${code}`;
}
