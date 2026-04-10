<<<<<<< HEAD
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, TrendingUp, AlertCircle } from "lucide-react"

interface AnalysisResult {
  stockCode: string
  stockName: string
  analysis: string
  rawData?: {
    technical: string
    news: string
  }
}

export function StockAnalysisTab() {
  const [stockCode, setStockCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showRawData, setShowRawData] = useState(false)

  const handleAnalyze = async () => {
    if (!stockCode.trim()) {
      setError("请输入股票代码")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
=======
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface TechnicalData {
  symbol: string;
  name: string;
  close: number;
  change: number;
  changePercent: number;
  rsi: number;
  recommendation: string;
  recommendationSummary: {
    buy: number;
    sell: number;
    neutral: number;
  };
}

interface AnalysisResult {
  stockCode: string;
  stockName: string;
  analysis: string;
  technical: TechnicalData;
  newsCount: number;
}

export function StockAnalysisTab() {
  const [stockCode, setStockCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!stockCode.trim()) {
      setError("请输入股票代码");
      return;
    }

    setLoading(true);
    setError(null);
>>>>>>> origin/v0/zmpple-7535-fb84d16f

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
<<<<<<< HEAD
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockCode: stockCode.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "分析失败")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const formatAnalysis = (text: string) => {
    return text.split("\n").map((line, index) => {
      // 标题处理
      if (line.startsWith("### ")) {
        return (
          <h3 key={index} className="text-lg font-semibold mt-6 mb-3 text-foreground">
            {line.replace("### ", "")}
          </h3>
        )
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={index} className="text-xl font-bold mt-6 mb-3 text-foreground">
            {line.replace("## ", "")}
          </h2>
        )
      }
      // 表格行处理
      if (line.startsWith("|")) {
        return (
          <div key={index} className="font-mono text-sm bg-muted/50 px-2 py-1 border-b border-border">
            {line}
          </div>
        )
      }
      // 列表项
      if (line.startsWith("- ")) {
        return (
          <p key={index} className="ml-4 text-muted-foreground leading-relaxed">
            {line}
          </p>
        )
      }
      // 强调文本
      if (line.includes("**买入**")) {
        return (
          <p key={index} className="text-emerald-600 font-semibold leading-relaxed">
            {line.replace(/\*\*/g, "")}
          </p>
        )
      }
      if (line.includes("**卖出**")) {
        return (
          <p key={index} className="text-red-500 font-semibold leading-relaxed">
            {line.replace(/\*\*/g, "")}
          </p>
        )
      }
      if (line.includes("**观望**")) {
        return (
          <p key={index} className="text-amber-600 font-semibold leading-relaxed">
            {line.replace(/\*\*/g, "")}
          </p>
        )
      }
      // 普通段落
      if (line.trim()) {
        return (
          <p key={index} className="text-foreground leading-relaxed">
            {line.replace(/\*\*/g, "")}
          </p>
        )
      }
      return <div key={index} className="h-2" />
    })
  }

  return (
    <div className="space-y-6">
      {/* 输入区域 */}
      <Card className="border-0 shadow-md bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            个股体检
          </CardTitle>
=======
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stockCode: stockCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "分析失败");
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (rec: string) => {
    if (rec.includes("BUY")) return "text-emerald-600 bg-emerald-50";
    if (rec.includes("SELL")) return "text-red-600 bg-red-50";
    return "text-amber-600 bg-amber-50";
  };

  const getRecommendationText = (rec: string) => {
    const map: Record<string, string> = {
      STRONG_BUY: "强烈买入",
      BUY: "买入",
      NEUTRAL: "中性",
      SELL: "卖出",
      STRONG_SELL: "强烈卖出",
    };
    return map[rec] || rec;
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-card to-secondary/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-primary" />
            个股体检
          </CardTitle>
          <CardDescription>
            输入A股股票代码，获取技术面和消息面综合分析
          </CardDescription>
>>>>>>> origin/v0/zmpple-7535-fb84d16f
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
<<<<<<< HEAD
              placeholder="输入股票代码，如 000001 或 600519"
=======
              placeholder="请输入股票代码，如: 000001, 600519"
>>>>>>> origin/v0/zmpple-7535-fb84d16f
              value={stockCode}
              onChange={(e) => setStockCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              className="flex-1 h-11"
              disabled={loading}
            />
            <Button
              onClick={handleAnalyze}
              disabled={loading}
<<<<<<< HEAD
              className="h-11 px-6"
=======
              className="h-11 px-6 bg-primary hover:bg-primary/90"
>>>>>>> origin/v0/zmpple-7535-fb84d16f
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
<<<<<<< HEAD
                  <Search className="h-4 w-4" />
                  开始体检
=======
                  <Activity className="h-4 w-4" />
                  开始分析
>>>>>>> origin/v0/zmpple-7535-fb84d16f
                </>
              )}
            </Button>
          </div>
<<<<<<< HEAD
          <p className="text-sm text-muted-foreground mt-3">
            支持沪深A股代码，系统将自动获取技术指标和消息面进行综合分析
          </p>
        </CardContent>
      </Card>

      {/* 加载状态 */}
      {loading && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium text-foreground">正在分析中...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  获取技术数据、搜索消息面、AI综合分析
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 错误提示 */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 分析结果 */}
      {result && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {result.stockName}
                <Badge variant="secondary" className="ml-2">
                  {result.stockCode}
                </Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRawData(!showRawData)}
              >
                {showRawData ? "隐藏原始数据" : "查看原始数据"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ScrollArea className="h-[500px] pr-4">
              <div className="prose prose-sm max-w-none">
                {formatAnalysis(result.analysis)}
              </div>

              {showRawData && result.rawData && (
                <div className="mt-8 space-y-4">
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                      技术数据
                    </summary>
                    <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                      {result.rawData.technical}
                    </pre>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                      消息面数据
                    </summary>
                    <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                      {result.rawData.news}
                    </pre>
                  </details>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* 免责声明 */}
      <div className="text-center text-xs text-muted-foreground px-4">
        <p>
          免责声明：本工具仅供学习交流，不构成任何投资建议。股市有风险，投资需谨慎。
        </p>
      </div>
    </div>
  )
=======
          {error && (
            <div className="mt-3 p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Technical Summary Cards */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                股票信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{result.technical.name}</div>
                <div className="text-sm text-muted-foreground">
                  {result.technical.symbol}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xl font-semibold">
                    ¥{result.technical.close}
                  </span>
                  <span
                    className={`flex items-center text-sm font-medium ${
                      result.technical.change >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {result.technical.change >= 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {result.technical.changePercent}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                RSI 指标
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{result.technical.rsi}</div>
              <div className="mt-2">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      result.technical.rsi > 70
                        ? "bg-red-500"
                        : result.technical.rsi < 30
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${result.technical.rsi}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>超卖</span>
                  <span>中性</span>
                  <span>超买</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                综合评级
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                className={`text-base px-3 py-1 ${getRecommendationColor(
                  result.technical.recommendation
                )}`}
              >
                {getRecommendationText(result.technical.recommendation)}
              </Badge>
              <div className="mt-3 flex gap-4 text-xs">
                <span className="text-emerald-600">
                  买入: {result.technical.recommendationSummary.buy}
                </span>
                <span className="text-amber-600">
                  中性: {result.technical.recommendationSummary.neutral}
                </span>
                <span className="text-red-600">
                  卖出: {result.technical.recommendationSummary.sell}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Report */}
          <Card className="border-0 shadow-md md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>AI 分析报告</span>
                <Badge variant="secondary" className="font-normal">
                  参考新闻 {result.newsCount} 条
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{result.analysis}</ReactMarkdown>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">开始您的第一次分析</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              输入股票代码，我们将为您提供技术面分析、消息面解读和操作建议
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
>>>>>>> origin/v0/zmpple-7535-fb84d16f
}
