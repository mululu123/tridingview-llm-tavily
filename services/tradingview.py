"""TradingView 数据获取服务 — 支持双数据源切换"""

import os
import json
import time
import requests
from dotenv import load_dotenv
from tradingview_ta import TA_Handler, Interval

load_dotenv()

RAPIDAPI_KEY = os.environ.get("RAPIDAPI_KEY", "")
BASE_URL = "https://tradingview-data1.p.rapidapi.com"
HEADERS = {
    "x-rapidapi-host": "tradingview-data1.p.rapidapi.com",
    "x-rapidapi-key": RAPIDAPI_KEY,
}


def format_stock_code(user_input: str) -> str:
    """将用户输入的股票代码转为 TradingView 格式"""
    code = user_input.strip().upper()
    if ":" in code:
        return code
    code = code.replace(".SZ", "").replace(".SH", "")
    if code.startswith("6"):
        return f"SSE:{code}"
    else:
        return f"SZSE:{code}"


def _parse_code_for_ta(symbol: str) -> tuple:
    """解析股票代码为 (symbol, exchange) 用于 tradingview_ta"""
    code = symbol.strip()
    if ":" in code:
        exchange, sym = code.split(":", 1)
        return sym, exchange
    code = code.replace(".SZ", "").replace(".SH", "").upper()
    if code.startswith("6"):
        return code, "SSE"
    return code, "SZSE"


# ==================== 数据源 A: tradingview_ta ====================

def get_stock_data_ta(symbol: str) -> dict:
    """通过 tradingview_ta 库获取技术数据（无需登录，无频率限制）"""
    sym, exchange = _parse_code_for_ta(symbol)

    handler = TA_Handler(
        symbol=sym,
        exchange=exchange,
        screener="china",
        interval=Interval.INTERVAL_1_DAY,
    )

    indicators = handler.get_indicators()
    analysis = handler.get_analysis()

    return {
        "quote": _extract_quote_ta(indicators),
        "ta": _extract_ta(indicators, analysis),
    }


def _extract_quote_ta(indicators: dict) -> dict:
    """从 tradingview_ta 指标中提取报价信息"""
    return {
        "close": indicators.get("close"),
        "open": indicators.get("open"),
        "high": indicators.get("high"),
        "low": indicators.get("low"),
        "volume": indicators.get("volume"),
        "change": indicators.get("change"),
        "change_pct": indicators.get("change_pct", indicators.get("Chg%")),
    }


def _extract_ta(indicators: dict, analysis) -> dict:
    """从 tradingview_ta 提取结构化技术指标"""
    return {
        "indicators": indicators,
        "summary": {
            "recommendation": analysis.summary["RECOMMENDATION"],
            "buy": analysis.summary["BUY"],
            "sell": analysis.summary["SELL"],
            "neutral": analysis.summary["NEUTRAL"],
        },
        "oscillators": {
            "recommendation": analysis.oscillators["RECOMMENDATION"],
            "detail": analysis.oscillators["COMPUTE"],
        },
        "moving_averages": {
            "recommendation": analysis.moving_averages["RECOMMENDATION"],
            "detail": analysis.moving_averages["COMPUTE"],
        },
    }


# ==================== 数据源 B: RapidAPI ====================

def _request_with_retry(url: str, params: dict = None, max_retries: int = 3) -> dict:
    for attempt in range(max_retries):
        resp = requests.get(url, headers=HEADERS, params=params, timeout=15)
        if resp.status_code == 429:
            wait = (attempt + 1) * 12
            time.sleep(wait)
            continue
        resp.raise_for_status()
        return resp.json()
    return {"success": False, "error": "rate_limited"}


def get_stock_data_rapidapi(symbol: str) -> dict:
    """通过 RapidAPI 获取技术数据"""
    tv_symbol = format_stock_code(symbol)
    result = {"quote": {}, "ta": {}}

    try:
        data = _request_with_retry(f"{BASE_URL}/api/quote/{tv_symbol}")
        if data.get("success") and "data" in data:
            d = data["data"]
            result["quote"] = d["data"] if isinstance(d, dict) and "data" in d else d
    except Exception as e:
        result["quote"] = {"error": str(e)}

    time.sleep(2)

    try:
        data = _request_with_retry(f"{BASE_URL}/api/ta/{tv_symbol}/indicators")
        if data.get("success") and "data" in data:
            result["ta"] = {"indicators": data["data"]}
    except Exception as e:
        result["ta"] = {"error": str(e)}

    return result


# ==================== 统一入口 ====================

def get_stock_data(symbol: str, source: str = "ta") -> dict:
    """获取个股技术数据

    Args:
        source: "ta" = tradingview_ta 库（默认），"rapidapi" = RapidAPI
    """
    if source == "rapidapi":
        return get_stock_data_rapidapi(symbol)
    return get_stock_data_ta(symbol)


def format_technical_data(data: dict, source: str = "ta") -> str:
    """将技术数据格式化为 Prompt 友好的文本"""
    if source == "rapidapi":
        return _format_rapidapi(data)
    return _format_ta(data)


def _format_ta(data: dict) -> str:
    """格式化 tradingview_ta 数据"""
    parts = []

    # === 报价 ===
    quote = data.get("quote", {})
    if quote:
        parts.append("### 实时报价")
        parts.append(f"- 当前价: {quote.get('close')}")
        parts.append(f"- 涨跌额: {quote.get('change')}")
        parts.append(f"- 涨跌幅: {quote.get('change_pct')}%")
        parts.append(f"- 开盘价: {quote.get('open')}")
        parts.append(f"- 最高价: {quote.get('high')}")
        parts.append(f"- 最低价: {quote.get('low')}")
        parts.append(f"- 成交量: {quote.get('volume')}")

    # === 技术指标 ===
    ta = data.get("ta", {})
    indicators = ta.get("indicators", {})

    if indicators:
        parts.append("\n### 核心技术指标")
        rsi = indicators.get("RSI")
        if rsi is not None:
            parts.append(f"- RSI(14): {round(rsi, 2)} ({'超买' if rsi > 70 else '超卖' if rsi < 30 else '中性'})")

        macd = indicators.get("MACD.macd")
        macd_signal = indicators.get("MACD.signal")
        macd_hist = indicators.get("MACD.hist")
        if macd is not None:
            parts.append(f"- MACD: DIF={round(macd, 4)}, DEA={round(macd_signal, 4) if macd_signal else 'N/A'}, 柱状={round(macd_hist, 4) if macd_hist else 'N/A'}")

        stoch_k = indicators.get("Stoch.K")
        stoch_d = indicators.get("Stoch.D")
        if stoch_k is not None:
            j = round(3 * stoch_k - 2 * stoch_d, 2) if stoch_d else "N/A"
            parts.append(f"- KDJ: K={round(stoch_k, 2)}, D={round(stoch_d, 2)}, J={j}")

        bb_upper = indicators.get("BB.upper")
        bb_lower = indicators.get("BB.lower")
        bb_mid = indicators.get("BB.middle")
        if bb_upper:
            parts.append(f"- 布林带: 上轨={round(bb_upper, 2)}, 中轨={round(bb_mid, 2) if bb_mid else 'N/A'}, 下轨={round(bb_lower, 2)}")

        adx = indicators.get("ADX")
        if adx:
            parts.append(f"- ADX: {round(adx, 2)} ({'强趋势' if adx > 25 else '弱趋势'})")

        parts.append(f"- EMA10: {round(indicators['EMA10'], 2) if indicators.get('EMA10') else 'N/A'}")
        parts.append(f"- EMA20: {round(indicators['EMA20'], 2) if indicators.get('EMA20') else 'N/A'}")
        parts.append(f"- EMA50: {round(indicators['EMA50'], 2) if indicators.get('EMA50') else 'N/A'}")
        parts.append(f"- EMA100: {round(indicators['EMA100'], 2) if indicators.get('EMA100') else 'N/A'}")

    # === 综合信号 ===
    summary = ta.get("summary", {})
    oscillators = ta.get("oscillators", {})
    moving_averages = ta.get("moving_averages", {})

    if summary:
        parts.append("\n### TradingView 综合信号")
        parts.append(f"- 总评: **{summary.get('recommendation')}** (买入{summary.get('buy')}, 卖出{summary.get('sell')}, 中性{summary.get('neutral')})")

    if oscillators and oscillators.get("detail"):
        parts.append(f"- 振荡器: {oscillators.get('recommendation')}")
        for name, signal in oscillators["detail"].items():
            parts.append(f"  {name}: {signal}")

    if moving_averages and moving_averages.get("detail"):
        parts.append(f"- 均线: {moving_averages.get('recommendation')}")
        for name, signal in moving_averages["detail"].items():
            parts.append(f"  {name}: {signal}")

    return "\n".join(parts) if parts else "技术数据获取失败"


def _format_rapidapi(data: dict) -> str:
    """格式化 RapidAPI 数据（兼容旧逻辑）"""
    parts = []

    quote = data.get("quote", {})
    if isinstance(quote, dict) and "error" not in quote:
        parts.append("### 实时报价")
        lp = quote.get("lp")
        parts.append(f"- 当前价: {lp}")
        parts.append(f"- 开盘价: {quote.get('open_price', 'N/A')}")
        parts.append(f"- 最高价: {quote.get('high_price', 'N/A')}")
        parts.append(f"- 最低价: {quote.get('low_price', 'N/A')}")
        parts.append(f"- 成交量: {quote.get('volume', 'N/A')}")
        parts.append(f"- 52周最高: {quote.get('price_52_week_high', 'N/A')}")
        parts.append(f"- 52周最低: {quote.get('price_52_week_low', 'N/A')}")
    elif isinstance(quote, dict) and "error" in quote:
        parts.append(f"### 实时报价（获取失败: {quote['error']}）")

    ta = data.get("ta", {})
    indicators = ta.get("indicators", {}) if isinstance(ta, dict) else {}
    if indicators:
        parts.append("\n### 技术指标")
        rsi = indicators.get("RSI") or indicators.get("RSI14")
        if rsi:
            parts.append(f"- RSI(14): {round(rsi, 2)}")
        macd_val = indicators.get("MACD.macd")
        macd_signal = indicators.get("MACD.signal")
        if macd_val is not None:
            hist = round(macd_val - macd_signal, 4) if macd_signal else "N/A"
            parts.append(f"- MACD: DIF={round(macd_val, 4)}, DEA={round(macd_signal, 4) if macd_signal else 'N/A'}, 柱状={hist}")
        stoch_k = indicators.get("Stoch.K")
        stoch_d = indicators.get("Stoch.D")
        if stoch_k is not None:
            parts.append(f"- Stoch K: {round(stoch_k, 2)}, D: {round(stoch_d, 2)}")
        ema20 = indicators.get("EMA20")
        if ema20:
            parts.append(f"- EMA20: {round(ema20, 2)}")
        parts.append(f"- EMA50: {round(indicators['EMA50'], 2) if indicators.get('EMA50') else 'N/A'}")
        parts.append(f"- EMA100: {round(indicators['EMA100'], 2) if indicators.get('EMA100') else 'N/A'}")

    return "\n".join(parts) if parts else "技术数据获取失败"
