"""AI 分析服务 — 通过 Anthropic 兼容接口调用 GLM-5"""

import os
from pathlib import Path

from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def get_client() -> Anthropic:
    return Anthropic(
        api_key=os.environ["ZHIPU_API_KEY"],
        base_url="https://api.z.ai/api/anthropic",
    )


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
    message = client.messages.create(
        model="glm-5",
        max_tokens=4096,
        messages=[{"role": "user", "content": filled_prompt}],
    )
    return message.content[0].text


def analyze_market(market_data: str) -> str:
    """市场热点分析"""
    prompt_template = _load_prompt("market_hot.md")
    filled_prompt = prompt_template.replace("{market_data}", market_data)

    client = get_client()
    message = client.messages.create(
        model="glm-5",
        max_tokens=4096,
        messages=[{"role": "user", "content": filled_prompt}],
    )
    return message.content[0].text
