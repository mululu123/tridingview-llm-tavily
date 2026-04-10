"""A股短线助手 — Streamlit 主入口"""

import streamlit as st
from dotenv import load_dotenv

from services.tradingview import get_stock_data, format_technical_data, format_stock_code
from services.tavily_search import search_stock_news, search_market_hot
from services.claude_analyzer import analyze_stock, analyze_market
from services.storage import load_history, add_stock_record, add_market_record, clear_history

load_dotenv()

st.set_page_config(page_title="A股短线助手", page_icon="📈", layout="wide")

# ========== 侧边栏配置 ==========
with st.sidebar:
    st.header("设置")
    data_source = st.radio(
        "TradingView 数据源",
        options=["ta", "rapidapi"],
        format_func=lambda x: "TradingView TA（推荐，无限制）" if x == "ta" else "RapidAPI（备选，有限流）",
        index=0,
        key="data_source",
    )
    st.divider()
    st.caption("数据源说明：")
    st.caption("- **TA**：直连 TradingView，无需登录，无频率限制")
    st.caption("- **RapidAPI**：通过第三方接口，有请求频率限制")

st.title("📈 A股短线助手")
st.caption("个人本地辅助工具 · 技术面 + 消息面 · AI 综合分析")

tab1, tab2, tab3 = st.tabs(["🔍 个股短线体检", "🔥 今日市场热点", "📋 历史记录"])


# ==================== Tab 1: 个股短线体检 ====================
with tab1:
    st.header("个股短线体检")
    col1, col2 = st.columns([3, 1])
    with col1:
        stock_input = st.text_input(
            "输入股票代码",
            placeholder="例如：000001、600519、300750",
            key="stock_code",
        )
    with col2:
        stock_name = st.text_input(
            "股票名称（可选，用于搜索新闻）",
            placeholder="例如：平安银行",
            key="stock_name",
        )

    if st.button("开始分析", type="primary", key="analyze_btn"):
        if not stock_input.strip():
            st.warning("请输入股票代码")
        else:
            symbol = format_stock_code(stock_input)
            source_label = "TradingView TA" if data_source == "ta" else "RapidAPI"
            st.info(f"正在分析 {symbol}（数据源：{source_label}）...")

            progress = st.progress(0, text="获取技术数据...")
            try:
                stock_data = get_stock_data(stock_input, source=data_source)
                tech_text = format_technical_data(stock_data, source=data_source)
                # 从数据中获取实际股票名称
                info = stock_data.get("info", {})
                display_name = info.get("name") or stock_name.strip() or stock_input
                display_symbol = info.get("tv_symbol") or symbol
                progress.progress(40, text=f"技术数据获取完成，搜索消息面...")
            except Exception as e:
                st.error(f"获取 TradingView 数据失败: {e}")
                tech_text = "技术数据获取失败"
                display_name = stock_name.strip() or stock_input
                display_symbol = symbol

            try:
                name = display_name
                news_text = search_stock_news(name, stock_input)
                progress.progress(70, text="消息面搜索完成，AI 分析中...")
            except Exception as e:
                st.warning(f"Tavily 搜索失败: {e}")
                news_text = "消息面搜索失败"

            try:
                result = analyze_stock(tech_text, news_text)
                progress.progress(100, text="分析完成！")
                st.markdown(result)
                add_stock_record(stock_input, f"{display_symbol} {display_name}", result)
            except Exception as e:
                st.error(f"AI 分析失败: {e}")

            st.divider()
            with st.expander("查看原始数据"):
                st.subheader("技术数据")
                st.text(tech_text[:3000])
                st.subheader("消息面数据")
                st.text(news_text[:3000])


# ==================== Tab 2: 今日市场热点 ====================
with tab2:
    st.header("今日市场热点")

    if st.button("获取今日热点", type="primary", key="hot_btn"):
        progress = st.progress(0, text="搜索今日市场信息...")

        try:
            market_text = search_market_hot()
            progress.progress(60, text="数据获取完成，AI 分析中...")
        except Exception as e:
            st.error(f"Tavily 搜索失败: {e}")
            market_text = "搜索失败"

        try:
            result = analyze_market(market_text)
            progress.progress(100, text="分析完成！")
            st.markdown(result)
            add_market_record(result)
        except Exception as e:
            st.error(f"AI 分析失败: {e}")

        st.divider()
        with st.expander("查看原始搜索数据"):
            st.text(market_text[:5000])


# ==================== Tab 3: 历史记录 ====================
with tab3:
    st.header("历史分析记录")

    records = load_history()

    if not records:
        st.info("暂无历史记录，分析结果会自动保存在这里。")
    else:
        col_clear1, col_clear2 = st.columns([5, 1])
        with col_clear2:
            if st.button("清空记录", key="clear_btn"):
                clear_history()
                st.success("已清空")
                st.rerun()

        st.caption(f"共 {len(records)} 条记录（最多保留 10 条）")

        for i, record in enumerate(records):
            rec_type = record.get("type", "unknown")
            time_str = record.get("time", "未知时间")

            if rec_type == "stock":
                code = record.get("code", "")
                name = record.get("name", "")
                label = f"📊 {time_str} — {code} {name}"
            else:
                label = f"🔥 {time_str} — 市场热点"

            with st.expander(label):
                st.markdown(record.get("result", ""))


# 底部免责
st.divider()
st.caption("⚠️ 免责声明：本工具仅供个人学习研究使用，不构成任何投资建议。投资有风险，决策需谨慎。")
