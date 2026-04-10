"""A股短线助手 — Streamlit 主入口"""

import streamlit as st
from dotenv import load_dotenv

from services.tradingview import get_stock_data, format_technical_data, format_stock_code
from services.tavily_search import search_stock_news, search_market_hot
from services.claude_analyzer import analyze_stock, analyze_market

load_dotenv()

st.set_page_config(page_title="A股短线助手", page_icon="📈", layout="wide")

st.title("📈 A股短线助手")
st.caption("个人本地辅助工具 · 技术面 + 消息面 · AI 综合分析")

tab1, tab2 = st.tabs(["🔍 个股短线体检", "🔥 今日市场热点"])


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
            st.info(f"正在分析 {symbol} ...")

            # 获取数据（可能因 API 限流需要等待）
            progress = st.progress(0, text="获取技术数据（如遇限流会自动重试，请耐心等待）...")
            try:
                stock_data = get_stock_data(stock_input)
                tech_text = format_technical_data(stock_data)
                progress.progress(40, text="技术数据获取完成，搜索消息面...")
            except Exception as e:
                st.error(f"获取 TradingView 数据失败: {e}")
                tech_text = "技术数据获取失败"

            try:
                name = stock_name.strip() if stock_name.strip() else stock_input
                news_text = search_stock_news(name, stock_input)
                progress.progress(70, text="消息面搜索完成，AI 分析中...")
            except Exception as e:
                st.warning(f"Tavily 搜索失败: {e}")
                news_text = "消息面搜索失败"

            try:
                result = analyze_stock(tech_text, news_text)
                progress.progress(100, text="分析完成！")
                st.markdown(result)
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
        except Exception as e:
            st.error(f"AI 分析失败: {e}")

        st.divider()
        with st.expander("查看原始搜索数据"):
            st.text(market_text[:5000])


# 底部免责
st.divider()
st.caption("⚠️ 免责声明：本工具仅供个人学习研究使用，不构成任何投资建议。投资有风险，决策需谨慎。")
