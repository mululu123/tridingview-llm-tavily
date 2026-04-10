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

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
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
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="请输入股票代码，如: 000001, 600519"
              value={stockCode}
              onChange={(e) => setStockCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              className="flex-1 h-11"
              disabled={loading}
            />
            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="h-11 px-6 bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4" />
                  开始分析
                </>
              )}
            </Button>
          </div>
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
}
