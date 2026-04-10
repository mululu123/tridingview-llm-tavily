"""A股短线助手 — Streamlit 主入口（现代化 UI 设计）"""

import streamlit as st
from dotenv import load_dotenv

from services.tradingview import get_stock_data, format_technical_data, format_stock_code
from services.tavily_search import search_stock_news, search_market_hot
from services.claude_analyzer import analyze_stock, analyze_market
from services.storage import load_history, add_stock_record, add_market_record, clear_history

load_dotenv()

# ========== 页面配置 ==========
st.set_page_config(
    page_title="A股短线助手",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# ========== 现代化 CSS 样式 ==========
st.markdown("""
<style>
    /* 导入 Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    /* 全局样式 */
    .stApp {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    /* 隐藏默认的 Streamlit 元素 */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    
    /* 主容器背景 */
    .main .block-container {
        padding: 2rem 3rem;
        max-width: 1200px;
    }
    
    /* 自定义标题样式 */
    .main-header {
        background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.25rem;
        letter-spacing: -0.02em;
    }
    
    .sub-header {
        color: #64748b;
        font-size: 1rem;
        font-weight: 400;
        margin-bottom: 2rem;
    }
    
    /* Tab 样式优化 */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        background-color: #f1f5f9;
        padding: 6px;
        border-radius: 12px;
        margin-bottom: 1.5rem;
    }
    
    .stTabs [data-baseweb="tab"] {
        height: 44px;
        border-radius: 8px;
        font-weight: 500;
        font-size: 0.95rem;
        color: #475569;
        background-color: transparent;
        border: none;
        padding: 0 20px;
    }
    
    .stTabs [aria-selected="true"] {
        background-color: white !important;
        color: #0ea5e9 !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    /* 卡片样式 */
    .card {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.05);
        border: 1px solid #e2e8f0;
        margin-bottom: 1rem;
    }
    
    .card-header {
        font-size: 1.1rem;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    /* 统计卡片 */
    .stat-card {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 12px;
        padding: 1.25rem;
        text-align: center;
        border: 1px solid #e2e8f0;
    }
    
    .stat-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: #0ea5e9;
    }
    
    .stat-label {
        font-size: 0.85rem;
        color: #64748b;
        margin-top: 4px;
    }
    
    /* 输入框样式 */
    .stTextInput > div > div > input {
        border-radius: 10px;
        border: 2px solid #e2e8f0;
        padding: 12px 16px;
        font-size: 1rem;
        transition: all 0.2s ease;
    }
    
    .stTextInput > div > div > input:focus {
        border-color: #0ea5e9;
        box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
    }
    
    /* 按钮样式 */
    .stButton > button {
        background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
        color: white;
        border: none;
        border-radius: 10px;
        padding: 12px 28px;
        font-weight: 600;
        font-size: 1rem;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
    }
    
    .stButton > button:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(14, 165, 233, 0.35);
    }
    
    .stButton > button:active {
        transform: translateY(0);
    }
    
    /* 次要按钮 */
    .secondary-btn > button {
        background: #f1f5f9 !important;
        color: #475569 !important;
        box-shadow: none !important;
    }
    
    .secondary-btn > button:hover {
        background: #e2e8f0 !important;
    }
    
    /* 进度条 */
    .stProgress > div > div > div > div {
        background: linear-gradient(90deg, #0ea5e9 0%, #06b6d4 100%);
        border-radius: 10px;
    }
    
    /* 展开器样式 */
    .streamlit-expanderHeader {
        background: #f8fafc;
        border-radius: 10px;
        font-weight: 500;
        color: #475569;
    }
    
    /* 警告/信息框 */
    .stAlert {
        border-radius: 10px;
        border: none;
    }
    
    /* 分割线 */
    hr {
        border: none;
        height: 1px;
        background: #e2e8f0;
        margin: 2rem 0;
    }
    
    /* 历史记录卡片 */
    .history-item {
        background: white;
        border-radius: 12px;
        padding: 1rem 1.25rem;
        margin-bottom: 0.75rem;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
    }
    
    .history-item:hover {
        border-color: #0ea5e9;
        box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
    }
    
    .history-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .badge-stock {
        background: #dbeafe;
        color: #1d4ed8;
    }
    
    .badge-market {
        background: #fef3c7;
        color: #d97706;
    }
    
    /* 侧边栏样式 */
    [data-testid="stSidebar"] {
        background: #f8fafc;
        border-right: 1px solid #e2e8f0;
    }
    
    [data-testid="stSidebar"] .stRadio > label {
        font-weight: 500;
        color: #1e293b;
    }
    
    /* 空状态 */
    .empty-state {
        text-align: center;
        padding: 3rem 2rem;
        color: #94a3b8;
    }
    
    .empty-state-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }
    
    /* Markdown 内容样式 */
    .result-content {
        background: #f8fafc;
        border-radius: 12px;
        padding: 1.5rem;
        border-left: 4px solid #0ea5e9;
    }
    
    /* 免责声明 */
    .disclaimer {
        background: #fef3c7;
        border-radius: 10px;
        padding: 1rem 1.25rem;
        font-size: 0.85rem;
        color: #92400e;
        margin-top: 2rem;
    }
</style>
""", unsafe_allow_html=True)

# ========== 侧边栏配置 ==========
with st.sidebar:
    st.markdown("### ⚙️ 设置")
    st.markdown("---")
    
    data_source = st.radio(
        "📡 数据源",
        options=["ta", "rapidapi"],
        format_func=lambda x: "TradingView TA" if x == "ta" else "RapidAPI",
        index=0,
        key="data_source",
        help="选择技术数据来源"
    )
    
    st.markdown("---")
    st.markdown("##### 数据源说明")
    
    if data_source == "ta":
        st.success("**TradingView TA（推荐）**")
        st.caption("直连 TradingView，无需登录，无频率限制")
    else:
        st.warning("**RapidAPI**")
        st.caption("第三方接口，有请求频率限制")
    
    st.markdown("---")
    st.caption("版本 1.0.0")

# ========== 主标题 ==========
st.markdown('<h1 class="main-header">A股短线助手</h1>', unsafe_allow_html=True)
st.markdown('<p class="sub-header">技术面 + 消息面 · AI 智能分析 · 快速决策参考</p>', unsafe_allow_html=True)

# ========== Tabs ==========
tab1, tab2, tab3 = st.tabs(["🔍 个股体检", "🔥 市场热点", "📋 历史记录"])


# ==================== Tab 1: 个股短线体检 ====================
with tab1:
    st.markdown("### 个股短线体检")
    st.markdown("输入股票代码，获取技术面和消息面的综合分析")
    
    st.markdown("")
    
    # 输入区域
    col1, col2, col3 = st.columns([2, 2, 1])
    
    with col1:
        stock_input = st.text_input(
            "股票代码",
            placeholder="例如：000001、600519、300750",
            key="stock_code",
            label_visibility="collapsed"
        )
    
    with col2:
        stock_name = st.text_input(
            "股票名称（可选）",
            placeholder="股票名称（可选，用于搜索新闻）",
            key="stock_name",
            label_visibility="collapsed"
        )
    
    with col3:
        analyze_clicked = st.button("开始分析", type="primary", key="analyze_btn", use_container_width=True)
    
    st.markdown("")
    
    if analyze_clicked:
        if not stock_input.strip():
            st.warning("⚠️ 请输入股票代码")
        else:
            symbol = format_stock_code(stock_input)
            source_label = "TradingView TA" if data_source == "ta" else "RapidAPI"
            
            # 状态卡片
            status_container = st.container()
            with status_container:
                st.info(f"🔄 正在分析 **{symbol}** · 数据源：{source_label}")
            
            progress = st.progress(0, text="")
            
            # 获取技术数据
            progress.progress(10, text="📊 获取技术数据...")
            try:
                stock_data = get_stock_data(stock_input, source=data_source)
                tech_text = format_technical_data(stock_data, source=data_source)
                info = stock_data.get("info", {})
                display_name = info.get("name") or stock_name.strip() or stock_input
                display_symbol = info.get("tv_symbol") or symbol
                progress.progress(40, text="✅ 技术数据获取成功")
            except Exception as e:
                st.error(f"❌ 获取 TradingView 数据失败: {e}")
                tech_text = "技术数据获取失败"
                display_name = stock_name.strip() or stock_input
                display_symbol = symbol

            # 搜索消息面
            progress.progress(50, text="📰 搜索消息面...")
            try:
                name = display_name
                news_text = search_stock_news(name, stock_input)
                progress.progress(70, text="✅ 消息面搜索完成")
            except Exception as e:
                st.warning(f"⚠️ Tavily 搜索失败: {e}")
                news_text = "消息面搜索失败"

            # AI 分析
            progress.progress(80, text="🤖 AI 综合分析中...")
            try:
                result = analyze_stock(tech_text, news_text)
                progress.progress(100, text="✅ 分析完成！")
                
                # 清除状态信息
                status_container.empty()
                progress.empty()
                
                # 显示结果
                st.markdown("---")
                st.markdown("#### 📊 分析结果")
                
                with st.container():
                    st.markdown(f'<div class="result-content">', unsafe_allow_html=True)
                    st.markdown(result)
                    st.markdown('</div>', unsafe_allow_html=True)
                
                add_stock_record(stock_input, f"{display_symbol} {display_name}", result)
                
            except Exception as e:
                st.error(f"❌ AI 分析失败: {e}")

            # 原始数据展开器
            st.markdown("")
            with st.expander("📄 查看原始数据", expanded=False):
                col_a, col_b = st.columns(2)
                with col_a:
                    st.markdown("##### 技术数据")
                    st.code(tech_text[:2500], language=None)
                with col_b:
                    st.markdown("##### 消息面数据")
                    st.code(news_text[:2500], language=None)


# ==================== Tab 2: 今日市场热点 ====================
with tab2:
    st.markdown("### 今日市场热点")
    st.markdown("一键获取今日 A 股市场热门板块和资金动向")
    
    st.markdown("")
    
    col_btn, col_space = st.columns([1, 4])
    with col_btn:
        hot_clicked = st.button("获取今日热点", type="primary", key="hot_btn", use_container_width=True)
    
    st.markdown("")

    if hot_clicked:
        status_container = st.container()
        with status_container:
            st.info("🔄 正在搜索今日市场信息...")
        
        progress = st.progress(0, text="")
        
        progress.progress(20, text="🔍 搜索涨停复盘...")
        try:
            market_text = search_market_hot()
            progress.progress(60, text="✅ 数据获取完成")
        except Exception as e:
            st.error(f"❌ Tavily 搜索失败: {e}")
            market_text = "搜索失败"

        progress.progress(70, text="🤖 AI 分析中...")
        try:
            result = analyze_market(market_text)
            progress.progress(100, text="✅ 分析完成！")
            
            # 清除状态信息
            status_container.empty()
            progress.empty()
            
            # 显示结果
            st.markdown("---")
            st.markdown("#### 🔥 热点分析")
            
            with st.container():
                st.markdown(f'<div class="result-content">', unsafe_allow_html=True)
                st.markdown(result)
                st.markdown('</div>', unsafe_allow_html=True)
            
            add_market_record(result)
            
        except Exception as e:
            st.error(f"❌ AI 分析失败: {e}")

        st.markdown("")
        with st.expander("📄 查看原始搜索数据", expanded=False):
            st.code(market_text[:4000], language=None)


# ==================== Tab 3: 历史记录 ====================
with tab3:
    st.markdown("### 历史分析记录")
    st.markdown("自动保存最近 10 条分析记录")
    
    st.markdown("")
    
    records = load_history()

    if not records:
        st.markdown("""
        <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <p>暂无历史记录</p>
            <p style="font-size: 0.9rem;">分析结果会自动保存在这里</p>
        </div>
        """, unsafe_allow_html=True)
    else:
        # 顶部操作栏
        col_info, col_clear = st.columns([4, 1])
        with col_info:
            st.caption(f"共 {len(records)} 条记录")
        with col_clear:
            with st.container():
                st.markdown('<div class="secondary-btn">', unsafe_allow_html=True)
                if st.button("🗑️ 清空", key="clear_btn", use_container_width=True):
                    clear_history()
                    st.success("✅ 已清空")
                    st.rerun()
                st.markdown('</div>', unsafe_allow_html=True)
        
        st.markdown("")
        
        # 记录列表
        for i, record in enumerate(records):
            rec_type = record.get("type", "unknown")
            time_str = record.get("time", "未知时间")

            if rec_type == "stock":
                code = record.get("code", "")
                name = record.get("name", "")
                badge_html = '<span class="history-badge badge-stock">个股分析</span>'
                label = f"{time_str} · {code} {name}"
                icon = "📊"
            else:
                badge_html = '<span class="history-badge badge-market">市场热点</span>'
                label = f"{time_str} · 市场热点分析"
                icon = "🔥"

            with st.expander(f"{icon} {label}", expanded=False):
                st.markdown(record.get("result", ""))


# ========== 底部免责声明 ==========
st.markdown("---")
st.markdown("""
<div class="disclaimer">
    ⚠️ <strong>免责声明</strong>：本工具仅供个人学习研究使用，不构成任何投资建议。投资有风险，决策需谨慎。
</div>
""", unsafe_allow_html=True)
