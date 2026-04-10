"""AI 分析服务 — 调用智谱 GLM-5 API 进行综合分析"""

import os
from pathlib import Path

from zhipuai import ZhipuAI

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def get_client() -> ZhipuAI:
    return ZhipuAI(api_key=os.environ["ZHIPU_API_KEY"])


def _load_prompt(filename: str) -> str:
    """加载 Prompt 模板"""
    path = PROMPTS_DIR / filename
    return path.read_text(encoding="utf-8")


def analyze_stock(technical_data: str, news_data: str) -> str:
    """个股短线体检分析"""
    prompt_template = _load_prompt("stock_analysis.md")
    filled_prompt = prompt_template.replace("{technical_data}", technical_data).replace(
        "{news_data}", news_data
    )

    client = get_client()
    response = client.chat.completions.create(
        model="glm-5",
        messages=[{"role": "user", "content": filled_prompt}],
    )
    return response.choices[0].message.content


def analyze_market(market_data: str) -> str:
    """市场热点分析"""
    prompt_template = _load_prompt("market_hot.md")
    filled_prompt = prompt_template.replace("{market_data}", market_data)

    client = get_client()
    response = client.chat.completions.create(
        model="glm-5",
        messages=[{"role": "user", "content": filled_prompt}],
    )
    return response.choices[0].message.content
