"""Tavily 搜索服务 — 封装 Tavily API 调用"""

import os
from tavily import TavilyClient


def get_client() -> TavilyClient:
    return TavilyClient(api_key=os.environ["TAVILY_API_KEY"])


def search_stock_news(stock_name: str, stock_code: str) -> str:
    """搜索个股近期利好/利空/资金面消息"""
    client = get_client()
    query = f"{stock_name} {stock_code} 利好 利空 资金面 龙虎榜 短线"
    result = client.search(
        query=query,
        topic="finance",
        time_range="week",
        max_results=5,
        include_answer=True,
    )
    return _format_results(result)


def search_market_hot() -> str:
    """搜索今日A股市场热点题材"""
    client = get_client()

    # 两个并行搜索方向
    results = []
    queries = [
        "今日A股涨停复盘 热点题材 主力资金流向",
        "A股 游资 龙虎榜 今日 动向 板块",
    ]
    for q in queries:
        r = client.search(
            query=q,
            topic="finance",
            time_range="day",
            max_results=5,
            include_answer=True,
        )
        results.append(_format_results(r))

    return "\n\n---\n\n".join(results)


def _format_results(result: dict) -> str:
    """格式化搜索结果为文本"""
    parts = []
    if result.get("answer"):
        parts.append(f"## AI 摘要\n{result['answer']}")
    for r in result.get("results", []):
        parts.append(f"### {r['title']}\n{r['content']}\n来源: {r['url']}")
    return "\n\n".join(parts)
