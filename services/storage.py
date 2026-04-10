"""历史记录存储服务 — 本地 JSON 文件，最多保留 10 条"""

import json
from pathlib import Path
from datetime import datetime

HISTORY_FILE = Path(__file__).parent.parent / "data" / "history.json"
MAX_RECORDS = 10


def _ensure_file():
    HISTORY_FILE.parent.mkdir(exist_ok=True)
    if not HISTORY_FILE.exists():
        HISTORY_FILE.write_text("[]", encoding="utf-8")


def load_history() -> list:
    """加载历史记录"""
    _ensure_file()
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_history(records: list):
    """保存历史记录，自动截断到 MAX_RECORDS"""
    _ensure_file()
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(records[:MAX_RECORDS], f, ensure_ascii=False, indent=2)


def add_stock_record(stock_code: str, stock_name: str, result: str):
    """添加个股分析记录"""
    records = load_history()
    records.insert(0, {
        "type": "stock",
        "code": stock_code,
        "name": stock_name,
        "result": result,
        "time": datetime.now().strftime("%Y-%m-%d %H:%M"),
    })
    save_history(records)


def add_market_record(result: str):
    """添加市场热点记录"""
    records = load_history()
    records.insert(0, {
        "type": "market",
        "result": result,
        "time": datetime.now().strftime("%Y-%m-%d %H:%M"),
    })
    save_history(records)


def clear_history():
    """清空历史记录"""
    save_history([])
