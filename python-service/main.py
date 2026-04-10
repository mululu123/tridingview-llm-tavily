"""
TradingView TA Python 服务
使用 tradingview_ta 库获取技术指标（免费、无限制）
"""

import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from tradingview_ta import TA_Handler, Interval
from pydantic import BaseModel

app = FastAPI(title="TradingView TA Service")

# 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_exchange(code: str) -> str:
    """根据代码判断交易所"""
    if code.startswith("6"):
        return "SHANDONG"  # 上交所
    elif code.startswith("0") or code.startswith("3"):
        return "SHENZHEN"  # 深交所
    elif code.startswith("8") or code.startswith("4"):
        return "BEIJING"  # 北交所
    return "SHANDONG"


def get_screener(code: str) -> str:
    """根据代码判断市场"""
    return "china"


@app.get("/")
def health_check():
    return {"status": "ok", "service": "tradingview-ta"}


@app.get("/api/ta/{code}")
def get_technical_data(code: str):
    """获取股票技术指标"""
    try:
        # 提取纯数字代码
        code = re.sub(r'\D', '', code)
        if len(code) < 6:
            raise HTTPException(status_code=400, detail="Invalid stock code")

        handler = TA_Handler(
            symbol=code,
            exchange=get_exchange(code),
            screener=get_screener(code),
            interval=Interval.INTERVAL_1_DAY,
        )

        analysis = handler.get_analysis()

        indicators = analysis.indicators
        oscillators = analysis.oscillators
        moving_averages = analysis.moving_averages

        # 构建 MACD 数据
        macd_value = indicators.get("MACD.macd", 0) or 0
        macd_signal = indicators.get("MACD.signal", 0) or 0

        # 构建 KDJ 数据
        stoch_k = indicators.get("Stoch.K", 50) or 50
        stoch_d = indicators.get("Stoch.D", 50) or 50

        # 构建均线数据
        ma_data = {
            "ma5": indicators.get("SMA5", 0) or 0,
            "ma10": indicators.get("SMA10", 0) or 0,
            "ma20": indicators.get("SMA20", 0) or 0,
            "ma60": indicators.get("SMA60", 0) or 0,
        }

        # 构建布林带数据
        bb_upper = indicators.get("BB.upper", 0) or 0
        bb_middle = indicators.get("BB.middle", 0) or 0
        bb_lower = indicators.get("BB.lower", 0) or 0

        # 综合建议
        recommendation = analysis.summary.get("RECOMMENDATION", "NEUTRAL")

        # 统计信号
        summary = {
            "buy": oscillators.get("BUY", 0) + moving_averages.get("BUY", 0),
            "sell": oscillators.get("SELL", 0) + moving_averages.get("SELL", 0),
            "neutral": oscillators.get("NEUTRAL", 0) + moving_averages.get("NEUTRAL", 0),
        }

        close_price = indicators.get("close", 0) or 0
        change_value = indicators.get("change", 0) or 0

        return {
            "success": True,
            "data": {
                "symbol": f"{get_exchange(code)}:{code}",
                "name": analysis.symbol,
                "close": round(close_price, 2),
                "change": round(change_value, 2),
                "changePercent": round(change_value / close_price * 100, 2) if close_price > 0 else 0,
                "volume": int(indicators.get("volume", 0) or 0),
                "rsi": round(indicators.get("RSI", 50) or 50, 2),
                "macd": {
                    "macd": round(macd_value, 4),
                    "signal": round(macd_signal, 4),
                    "histogram": round(macd_value - macd_signal, 4),
                },
                "ma": {k: round(v, 2) for k, v in ma_data.items()},
                "kdj": {
                    "k": round(stoch_k, 2),
                    "d": round(stoch_d, 2),
                    "j": round(stoch_k * 3 - stoch_d * 2, 2),
                },
                "bollinger": {
                    "upper": round(bb_upper, 2),
                    "middle": round(bb_middle, 2),
                    "lower": round(bb_lower, 2),
                },
                "recommendation": recommendation,
                "recommendationSummary": summary,
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
