"""TradingView 数据获取服务 — 通过 RapidAPI REST 端点获取技术数据"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.environ.get("RAPIDAPI_KEY", "")
BASE_URL = "https://tradingview-data1.p.rapidapi.com"
HEADERS = {
    "x-rapidapi-host": "tradingview-data1.p.rapidapi.com",
    "x-rapidapi-key": RAPIDAPI_KEY,
}


def format_stock_code(user_input: str) -> str:
    """将用户输入的股票代码转为 TradingView 格式

    Examples:
        000001 → SZSE:000001
        600000 → SSE:600000
        300001 → SZSE:300001
        SZSE:000001 → SZSE:000001 (已格式化则原样返回)
    """
    code = user_input.strip().upper()
    if ":" in code:
        return code
    code = code.replace(".SZ", "").replace(".SH", "")
    if code.startswith("6"):
        return f"SSE:{code}"
    else:
        return f"SZSE:{code}"


def get_quote(symbol: str) -> dict:
    """获取实时报价"""
    tv_symbol = format_stock_code(symbol)
    resp = requests.get(
        f"{BASE_URL}/api/quote/{tv_symbol}", headers=HEADERS, timeout=15
    )
    resp.raise_for_status()
    return resp.json()


def get_price(symbol: str, timeframe: str = "D", range: int = 100) -> dict:
    """获取K线数据

    Args:
        timeframe: 1, 5, 15, 30, 60, 240, D, W, M
        range: 数据条数 (max 500)
    """
    tv_symbol = format_stock_code(symbol)
    resp = requests.get(
        f"{BASE_URL}/api/price/{tv_symbol}",
        headers=HEADERS,
        params={"timeframe": timeframe, "range": range},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def get_ta(symbol: str, include_indicators: bool = True) -> dict:
    """获取技术分析指标"""
    tv_symbol = format_stock_code(symbol)
    endpoint = f"{BASE_URL}/api/ta/{tv_symbol}/indicators" if include_indicators else f"{BASE_URL}/api/ta/{tv_symbol}"
    resp = requests.get(endpoint, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    return resp.json()


def get_stock_data(symbol: str) -> dict:
    """获取个股完整技术数据（报价 + K线 + 指标）"""
    return {
        "quote": get_quote(symbol),
        "price": get_price(symbol, timeframe="D", range=100),
        "ta": get_ta(symbol, include_indicators=True),
    }


def format_technical_data(data: dict) -> str:
    """将技术数据格式化为 Prompt 友好的文本"""
    parts = []

    # 报价信息
    quote = data.get("quote", {})
    if isinstance(quote, dict):
        parts.append("### 实时报价")
        for key in ["close", "change", "open", "high", "low", "volume"]:
            if key in quote:
                label_map = {
                    "close": "当前价", "change": "涨跌幅", "open": "开盘价",
                    "high": "最高价", "low": "最低价", "volume": "成交量",
                }
                parts.append(f"- {label_map.get(key, key)}: {quote[key]}")

    # 技术指标
    ta = data.get("ta", {})
    if isinstance(ta, dict):
        parts.append("\n### 技术指标")
        if "indicators" in ta:
            indicators = ta["indicators"]
            if isinstance(indicators, dict):
                for name, val in indicators.items():
                    parts.append(f"- {name}: {val}")
        elif "technical" in ta:
            for item in ta["technical"]:
                parts.append(f"- {item}")

    # K线摘要
    price = data.get("price", {})
    if isinstance(price, list) and len(price) > 0:
        parts.append(f"\n### 近期K线数据（共{len(price)}根）")
        # 最近5根K线
        for candle in price[-5:]:
            if isinstance(candle, dict):
                parts.append(
                    f"- 日期:{candle.get('time', 'N/A')} "
                    f"开:{candle.get('open', 'N/A')} "
                    f"高:{candle.get('high', 'N/A')} "
                    f"低:{candle.get('low', 'N/A')} "
                    f"收:{candle.get('close', 'N/A')} "
                    f"量:{candle.get('volume', 'N/A')}"
                )

    return "\n".join(parts) if parts else str(data)
