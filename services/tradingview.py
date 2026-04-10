"""TradingView 数据获取服务 — 通过 RapidAPI REST 端点获取技术数据"""

import os
import json
import time
import requests
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.environ.get("RAPIDAPI_KEY", "")
BASE_URL = "https://tradingview-data1.p.rapidapi.com"
HEADERS = {
    "x-rapidapi-host": "tradingview-data1.p.rapidapi.com",
    "x-rapidapi-key": RAPIDAPI_KEY,
}


def _request_with_retry(url: str, params: dict = None, max_retries: int = 3) -> dict:
    """带重试的 HTTP 请求，处理 429 频率限制"""
    for attempt in range(max_retries):
        resp = requests.get(url, headers=HEADERS, params=params, timeout=15)
        if resp.status_code == 429:
            wait = (attempt + 1) * 12  # 12s, 24s, 36s
            print(f"  429 限流，等待 {wait}s 后重试 ({attempt+1}/{max_retries})...")
            time.sleep(wait)
            continue
        resp.raise_for_status()
        return resp.json()
    return {"success": False, "error": "rate_limited"}


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


def get_quote(symbol: str) -> dict:
    """获取实时报价"""
    tv_symbol = format_stock_code(symbol)
    result = _request_with_retry(f"{BASE_URL}/api/quote/{tv_symbol}")
    if result.get("success") and "data" in result:
        d = result["data"]
        if isinstance(d, dict) and "data" in d:
            return d["data"]
        return d
    return result


def get_ta(symbol: str) -> dict:
    """获取技术分析指标"""
    tv_symbol = format_stock_code(symbol)
    result = _request_with_retry(f"{BASE_URL}/api/ta/{tv_symbol}/indicators")
    if result.get("success") and "data" in result:
        return result["data"]
    return result


def get_stock_data(symbol: str) -> dict:
    """获取个股技术数据（只调 quote + TA 两个接口，避免触发频率限制）"""
    result = {"quote": {}, "ta": {}}

    try:
        result["quote"] = get_quote(symbol)
    except Exception as e:
        result["quote"] = {"error": str(e)}

    # 两个接口之间加 2 秒间隔
    time.sleep(2)

    try:
        result["ta"] = get_ta(symbol)
    except Exception as e:
        result["ta"] = {"error": str(e)}

    return result


def format_technical_data(data: dict) -> str:
    """将技术数据格式化为 Prompt 友好的文本"""
    parts = []

    # === 报价信息 ===
    quote = data.get("quote", {})
    if isinstance(quote, dict) and "error" not in quote:
        parts.append("### 实时报价")
        lp = quote.get("lp")
        prev = quote.get("prev_close_price") or quote.get("previous_close")
        change = quote.get("change")
        change_pct = quote.get("change_pct")

        if lp and prev and not change:
            change = round(lp - prev, 3)
            change_pct = round(change / prev * 100, 2)

        parts.append(f"- 当前价: {lp}")
        parts.append(f"- 涨跌额: {change}")
        parts.append(f"- 涨跌幅: {change_pct}%")
        parts.append(f"- 开盘价: {quote.get('open_price', 'N/A')}")
        parts.append(f"- 最高价: {quote.get('high_price', 'N/A')}")
        parts.append(f"- 最低价: {quote.get('low_price', 'N/A')}")
        parts.append(f"- 成交量: {quote.get('volume', 'N/A')}")
        parts.append(f"- 52周最高: {quote.get('price_52_week_high', 'N/A')}")
        parts.append(f"- 52周最低: {quote.get('price_52_week_low', 'N/A')}")
    elif isinstance(quote, dict) and "error" in quote:
        parts.append(f"### 实时报价（获取失败: {quote['error']}）")

    # === 技术指标 ===
    ta = data.get("ta", {})
    if isinstance(ta, dict) and "error" not in ta:
        parts.append("\n### 技术指标")

        # RSI
        rsi = ta.get("RSI") or ta.get("RSI14")
        if rsi:
            parts.append(f"- RSI(14): {round(rsi, 2)} ({'超买' if rsi > 70 else '超卖' if rsi < 30 else '中性'})")

        # MACD
        macd_val = ta.get("MACD.macd")
        macd_signal = ta.get("MACD.signal")
        if macd_val is not None and macd_signal is not None:
            hist = round(macd_val - macd_signal, 4)
            signal = "金叉" if hist > 0 else "死叉"
            parts.append(f"- MACD: DIF={round(macd_val, 4)}, DEA={round(macd_signal, 4)}, 柱状={hist} ({signal})")

        # Stoch (KDJ 等价)
        stoch_k = ta.get("Stoch.K") or ta.get("Stoch%K")
        stoch_d = ta.get("Stoch.D") or ta.get("Stoch%D")
        if stoch_k is not None:
            j = round(3 * stoch_k - 2 * stoch_d, 2) if stoch_d else "N/A"
            parts.append(f"- KDJ: K={round(stoch_k, 2)}, D={round(stoch_d, 2)}, J={j}")

        # 布林带
        ema20 = ta.get("EMA20")
        bb_power = ta.get("BBPower")
        if ema20:
            parts.append(f"- 布林带中轨(EMA20): {round(ema20, 2)}")
        if bb_power is not None:
            parts.append(f"- 布林带能量: {round(bb_power, 2)} ({'价格在下方' if bb_power < 0 else '价格在上方'})")

        # 均线
        parts.append(f"- EMA10: {round(ta.get('EMA10'), 2) if ta.get('EMA10') else 'N/A'}")
        parts.append(f"- EMA50: {round(ta.get('EMA50'), 2) if ta.get('EMA50') else 'N/A'}")
        parts.append(f"- EMA100: {round(ta.get('EMA100'), 2) if ta.get('EMA100') else 'N/A'}")

        # ADX
        adx = ta.get("ADX")
        if adx:
            parts.append(f"- ADX(趋势强度): {round(adx, 2)} ({'强趋势' if adx > 25 else '弱趋势'})")
            parts.append(f"  +DI: {round(ta.get('ADX+DI', 0), 2)}, -DI: {round(ta.get('ADX-DI', 0), 2)}")

        # CCI
        cci = ta.get("CCI20")
        if cci is not None:
            parts.append(f"- CCI(20): {round(cci, 2)}")

        # 动量
        mom = ta.get("Mom")
        if mom is not None:
            parts.append(f"- 动量: {round(mom, 2)}")
    elif isinstance(ta, dict) and "error" in ta:
        parts.append(f"\n### 技术指标（获取失败: {ta['error']}）")

    return "\n".join(parts) if parts else "技术数据获取失败"
