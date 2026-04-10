# Findings & Decisions

## Requirements
- 个人本地辅助工具，零部署负担
- 两个核心功能：个股短线体检 + 今日市场热点
- A 股市场，短线交易风格（几天内）
- 数据源：TradingView MCP（技术数据）+ Tavily（新闻舆情）+ Claude（AI 分析）
- UI：Streamlit 本地网页
- API Keys 从 .env 读取
- 不做：交易执行、回测、组合管理、用户登录

## Research Findings

### TradingView MCP 工具集（来自 tradingview-quantitative 技能）
- `get_quote(symbol)` → 实时报价
- `get_price(symbol, timeframe, range)` → K 线数据（timeframe: 1/5/15/30/60/240/D/W/M）
- `get_ta(symbol, include_indicators=true)` → 技术指标（RSI/MACD/KDJ/布林带等）
- `search_market(query, filter)` → 搜索股票
- A 股代码格式：SZSE:000001（深市）、SSE:600000（沪市）

### Tavily API
- `tvly search "query" --depth advanced --topic finance --time-range week --json`
- Python SDK: `tavily-python` 包，`TavilyClient(api_key=...)`
- 支持 topic=finance, time_range=day/week/month
- 支持 include_answer=advanced 获取 AI 摘要

### Claude API (Anthropic SDK)
- `pip install anthropic`
- `client.messages.create(model="claude-sonnet-4-6", messages=[...])`
- 支持 system prompt + user message

### A 股短线关键指标
- RSI(14): >70 超买, <30 超卖
- MACD: DIF/DEA 金叉看多，死叉看空
- KDJ: K/D/J 超买超卖区域判断
- 布林带: 价格触及上轨压力，下轨支撑
- 成交量: 与 5 日均量对比判断放量/缩量

### 竞品参考
- 短线王：聚焦短线场景，智能选股+社区
- 开盘啦：盘口情绪+微观数据
- AI涨乐：AI 原生交易APP，全链路智能闭环
- 我们的差异：轻量本地 + Claude 大模型综合判断 + TradingView 免费数据

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Streamlit 框架 | PRD 明确要求，一个 py 文件出 UI |
| tavily-python SDK | 直接 Python 调用，比 CLI 更稳定 |
| anthropic SDK | Claude API 官方 Python SDK |
| .env 管理密钥 | 极简，无需 Vault 等方案 |
| 无数据库 | MVP 不需要历史记录 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| (empty) | |

## Resources
- PRD: /Users/apple/claude_code/tridingview/PRD.md
- TradingView 技能: ~/.agents/skills/tradingview-quantitative
- Tavily 文档: https://tavily.com
- Anthropic SDK: https://github.com/anthropics/anthropic-sdk-python

## Visual/Browser Findings
- Tavily 被 Nebius 以 $2.75 亿收购，专为 AI agent 设计搜索 API
- 2026 年 A 股工具趋势：AI 原生化，信息过载取代信息匮乏成为核心痛点
