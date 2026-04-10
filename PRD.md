# A股短线助手 — 极简版 PRD (MVP)

> 定位：个人本地辅助小工具，一个 Python 脚本启动，零部署负担。

---

## 1. 产品目标

帮一个有经验但缺理论的 A 股短线交易者，在每个交易日快速回答两个问题：
- **这只票现在能不能买？**（个股短线体检）
- **今天市场在炒什么？**（热点题材速览）
- **之前分析过什么？**（历史记录回顾）

不做交易执行，不做回测，不做组合管理。就是**看盘前的快速决策参考**。

---

## 2. 用户故事

```
作为 一个 A 股短线交易者
我想要 输入一个股票代码，立刻看到它的名称、行业、短线评分和利空利好
以便 在开盘前快速决定是否关注这只票

作为 一个 A 股短线交易者
我想要 一键查看今天市场最热的 3 个题材板块
以便 快速锁定当天可能有机会的方向

作为 一个 A 股短线交易者
我想要 查看最近 10 条分析记录
以便 回顾之前看过的股票和市场热点
```

---

## 3. 核心工作流

### Tab 1：个股短线体检

```
用户输入股票代码（如 688759）+ 股票名称（可选）
         │
         ├──> TradingView 数据源（侧边栏可切换）
         │     ├── 方案 A: tradingview_ta（默认，无限制）
         │     │     → 实时报价 + 技术指标 + BUY/SELL 综合信号
         │     └── 方案 B: RapidAPI（备选，有限流）
         │           → 实时报价 + 英文名/行业/简介 + 技术指标
         │
         ├──> Tavily Search（并行）
         │     └── search("{股票名} 利好 利空 资金面 龙虎榜", time_range=week)
         │
         └──> GLM-5 综合分析
               ├── 股票标识：代码 + 名称 + 行业 + 简介
               ├── 技术面评分（0-100）
               ├── 消息面摘要（利好/利空/中性）
               └── 最终建议：买入 / 观望 / 卖出 + 理由（3句话内）
               → 自动保存到历史记录
```

### Tab 2：今日市场热点

```
用户点击"获取今日热点"
         │
         └──> Tavily Search
               ├── search("今日A股涨停复盘 热点题材 主力资金流向", time_range=day, topic=finance)
               └── search("A股 游资 龙虎榜 今日 动向", time_range=day)
                    │
                    └──> GLM-5 提取
                          ├── Top 3 热门板块 + 驱动逻辑（1-2句话）
                          ├── 板块内龙头股（1-3只）
                          ├── 情绪判断：升温/降温/分歧
                          └── 市场情绪总览 + 风险提示
                          → 自动保存到历史记录
```

### Tab 3：历史记录

```
自动展示最近 10 条分析记录
├── 个股记录：显示时间 + 代码 + 名称
├── 热点记录：显示时间 + 市场热点
└── 支持一键清空
数据存储：本地 data/history.json
```

---

## 4. 数据源与 API

### 数据源架构（双数据源，侧边栏切换）

| 数据源 | 调用方式 | 特点 | 适用场景 |
|--------|---------|------|---------|
| **TradingView TA**（默认） | `tradingview_ta` Python 库 | 无需登录，无频率限制，自带 BUY/SELL 信号 | 日常使用 |
| **RapidAPI**（备选） | REST API | 有请求限制，提供英文名/行业/简介 | 需要详细信息时 |

### API 清单

| API | 用途 | 调用方式 |
|-----|------|---------|
| **tradingview_ta** | 技术指标 + 综合信号 | Python 库直连 |
| **RapidAPI TradingView** | 报价 + 技术指标 + 股票简介 | REST API（429 自动重试） |
| **Tavily API** | 个股新闻、市场热点搜索 | `tavily-python` SDK |
| **GLM-5** (z.ai) | 综合分析、评分、摘要 | Anthropic SDK + 自定义 base_url |

### API Key 管理
- 所有 Key 存放在项目根目录 `.env` 文件：
  ```
  TAVILY_API_KEY=tvly-dev-xxx
  ZHIPU_API_KEY=xxx
  RAPIDAPI_KEY=xxx
  ```
- 程序启动时读取，无需登录系统

---

## 5. 技术栈

```
前端：Streamlit（pip install streamlit）
AI：  anthropic SDK + z.ai 兼容接口（GLM-5）
搜索：tavily-python（pip install tavily-python）
数据A：tradingview-ta（pip install tradingview-ta，无限制）
数据B：RapidAPI TradingView（requests，有限流）
存储：本地 JSON（data/history.json，最多 10 条）
运行：streamlit run app.py → 浏览器自动打开 localhost:8501
```

### 项目结构

```
tridingview/
├── .env                        # API Keys（不提交 Git）
├── .env.example                # API Keys 模板
├── app.py                      # Streamlit 主入口（3 个 Tab + 侧边栏）
├── services/
│   ├── tradingview.py          # TradingView 双数据源（TA + RapidAPI）
│   ├── tavily_search.py        # Tavily 搜索封装
│   ├── claude_analyzer.py      # GLM-5 分析引擎（Anthropic 兼容接口）
│   └── storage.py              # 历史记录存储（本地 JSON，最多 10 条）
├── prompts/
│   ├── stock_analysis.md       # 个股分析 Prompt（含评分规则）
│   └── market_hot.md           # 市场热点 Prompt
├── data/
│   └── history.json            # 分析历史（自动生成，不提交 Git）
└── requirements.txt
```

---

## 6. 分析 Prompt 设计思路

### 个股分析 Prompt 核心逻辑

```
你是一个A股短线交易分析助手。根据以下数据给出分析：

## 股票信息
- 股票: SSE:688759（BeBetter Med）
- 行业: Pharmaceuticals: Major
- 简介: ...

## 技术数据（来自TradingView）
- 当前价 / 涨跌幅
- RSI(14): {value}  → 判断超买(>70)/超卖(<30)/中性
- MACD: DIF={v}, DEA={v}, 柱状={v}  → 判断金叉/死叉/趋势
- KDJ: K={v}, D={v}, J={v}  → 判断超买/超卖
- 布林带: 上轨/中轨/下轨  → 判断压力/支撑位
- TradingView 综合信号: BUY/SELL/NEUTRAL（买入X, 卖出X, 中性X）

## 消息面（来自Tavily搜索）
{搜索结果摘要}

## 输出格式
1. 技术面评分：XX/100（列出扣分项）
2. 消息面判断：利好/利空/中性（附关键信息）
3. 综合建议：买入/观望/卖出
4. 一句话理由
```

### 市场热点 Prompt 核心逻辑

```
根据以下今日A股市场信息，提取核心热点：

## 市场信息（来自Tavily搜索）
{搜索结果}

## 输出格式
按热度排序，输出 Top 3 板块：
每个板块包含：
1. 板块名称
2. 驱动逻辑（1-2句话）
3. 龙头股（1-3只代码+名称）
4. 情绪判断：升温/降温/分歧

+ 今日市场情绪总览
+ 风险提示
```

---

## 7. MVP 范围边界

| 做 | 不做 |
|----|------|
| 个股短线评分（含名称/行业/简介） | 回测系统 |
| 市场热点提取 | 模拟交易 |
| 历史记录（最近 10 条） | 数据库持久化 |
| 双数据源切换（TA / RapidAPI） | 用户登录/多用户 |
| GLM-5 AI 综合分析 | 自动下单 |

---

## 8. 启动方式

```bash
# 安装依赖
pip install -r requirements.txt

# 配置 .env
cp .env.example .env
# 编辑 .env 填入 API Keys

# 启动
streamlit run app.py
```

---

*免责声明：本工具仅供个人学习研究使用，不构成任何投资建议。*
