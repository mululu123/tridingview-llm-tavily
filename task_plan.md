# Task Plan: A股短线助手 MVP 开发

## Goal
基于 PRD.md，用 Streamlit + TradingView MCP + Tavily API + Claude API 构建一个极简本地 A 股短线分析工具，包含"个股体检"和"市场热点"两个 Tab。

## Current Phase
Phase 4

## Phases

### Phase 1: Requirements & Discovery
- [x] PRD 已确认（见 PRD.md）
- [x] 技术栈确认：Streamlit + anthropic + tavily-python
- [x] TradingView MCP 技能已安装（tradingview-quantitative）
- [x] Tavily CLI 已安装并认证
- [x] 竞品调研完成
- **Status:** complete

### Phase 2: Project Scaffolding
- [ ] 创建项目目录结构
- [ ] 创建 .env.example + requirements.txt
- [ ] 创建 prompts/stock_analysis.md
- [ ] 创建 prompts/market_hot.md
- **Status:** complete

### Phase 3: Core Services Implementation
- [ ] services/tavily_search.py — Tavily 搜索封装
- [ ] services/tradingview.py — TradingView 数据获取
- [ ] services/claude_analyzer.py — Claude 分析引擎 + Prompt 加载
- **Status:** in_progress

### Phase 4: Streamlit UI (app.py)
- [ ] Tab 1: 个股短线体检页面
- [ ] Tab 2: 今日市场热点页面
- [ ] 整体布局与样式
- **Status:** pending

### Phase 5: Integration Testing & Delivery
- [ ] 端到端测试：个股体检流程
- [ ] 端到端测试：市场热点流程
- [ ] 修复问题
- [ ] 交付
- **Status:** pending

## Key Questions
1. TradingView MCP 在 Streamlit 中如何调用？→ 走 HTTP/REST 方式，通过 tavily-python 的 search 直接调 Tavily，TradingView 通过 MCP SDK 或 REST 调用
2. Claude API 用哪个模型？→ claude-sonnet-4-6（性价比最优）
3. A 股代码格式？→ TradingView 中 A 股代码格式为 SSE:000001 或 SZSE:000001

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Streamlit 代替 React/Vue | PRD 要求极简，一个 Python 脚本搞定 UI |
| 不用数据库 | MVP 阶段无需持久化，后续可加 SQLite |
| TradingView 数据通过 RapidAPI REST 获取 | 直接 HTTP 调用，无需 MCP 进程间通信 |
| Tavily 用于新闻/舆情搜索 | 用户明确要求，专为 LLM 设计的搜索 API |
| Claude API 做综合分析 | 核心大脑，解读技术面+消息面 |
| A 股代码自动补全交易所前缀 | 用户输入 000001 → 自动转为 SZSE:000001 |
| GLM-5 替代 Claude API | 用户要求不使用 Claude，改用智谱 GLM-5 |
| RapidAPI Key 代替 TradingView MCP | 直接 REST 调用，Streamlit 中无法调用 MCP |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| (empty) | | |

## Notes
- 每个 Phase 完成后更新 status
- 实现前先读 task_plan.md 保持目标清晰
- 遇到错误立刻记录，不重复失败操作
