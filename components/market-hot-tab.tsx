<<<<<<< HEAD
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Flame, AlertCircle, RefreshCw } from "lucide-react"

interface MarketHotResult {
  analysis: string
  rawData: string
}

export function MarketHotTab() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MarketHotResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showRawData, setShowRawData] = useState(false)

  const handleFetch = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/market-hot", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "获取失败")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const formatAnalysis = (text: string) => {
    return text.split("\n").map((line, index) => {
      // 热门板块标题
      if (line.includes("第1热门") || line.includes("第2热门") || line.includes("第3热门")) {
        return (
          <h3 key={index} className="text-lg font-bold mt-6 mb-3 text-primary flex items-center gap-2">
            <Flame className="h-5 w-5" />
            {line.replace("### ", "").replace(/🔥/g, "")}
          </h3>
        )
      }
      // 其他标题
      if (line.startsWith("### ")) {
        return (
          <h3 key={index} className="text-lg font-semibold mt-6 mb-3 text-foreground">
            {line.replace("### ", "").replace(/📈/g, "")}
          </h3>
        )
      }
      // 分隔线
      if (line.startsWith("---")) {
        return <hr key={index} className="my-6 border-border" />
      }
      // 加粗项
      if (line.includes("**驱动逻辑：**")) {
        return (
          <p key={index} className="ml-4 text-foreground leading-relaxed">
            <span className="font-semibold text-primary">驱动逻辑：</span>
            {line.replace("- **驱动逻辑：**", "").replace(/\*\*/g, "")}
          </p>
        )
      }
      if (line.includes("**龙头股：**")) {
        return (
          <p key={index} className="ml-4 text-foreground leading-relaxed">
            <span className="font-semibold text-emerald-600">龙头股：</span>
            {line.replace("- **龙头股：**", "").replace(/\*\*/g, "")}
          </p>
        )
      }
      if (line.includes("**情绪判断：**")) {
        const emotion = line.includes("升温")
          ? "text-emerald-600"
          : line.includes("高潮")
            ? "text-amber-600"
            : line.includes("分歧")
              ? "text-orange-500"
              : "text-red-500"
        return (
          <p key={index} className={`ml-4 font-semibold ${emotion} leading-relaxed`}>
            <span className="text-foreground">情绪判断：</span>
            {line.replace("- **情绪判断：**", "").replace(/\*\*/g, "")}
          </p>
        )
      }
      if (line.includes("**赚钱效应：**")) {
        const effect = line.includes("好")
          ? "text-emerald-600"
          : line.includes("差")
            ? "text-red-500"
            : "text-amber-600"
        return (
          <p key={index} className={`ml-4 ${effect} leading-relaxed`}>
            <span className="font-semibold text-foreground">赚钱效应：</span>
            {line.replace("- **赚钱效应：**", "").replace(/\*\*/g, "")}
          </p>
        )
      }
      // 列表项
      if (line.startsWith("- ")) {
        return (
          <p key={index} className="ml-4 text-muted-foreground leading-relaxed">
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
      {/* 操作区域 */}
      <Card className="border-0 shadow-md bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-orange-500" />
            今日市场热点
          </CardTitle>
=======
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import {
  Flame,
  RefreshCw,
  Loader2,
  AlertCircle,
  TrendingUp,
  Zap,
} from "lucide-react";

interface MarketHotResult {
  analysis: string;
  newsCount: number;
  searchTime: number;
}

export function MarketHotTab() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MarketHotResult | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/market-hot");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "获取失败");
      }

      setResult(data.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Flame className="h-5 w-5 text-orange-500" />
                今日市场热点
              </CardTitle>
              <CardDescription className="mt-1">
                一键获取今日A股市场热点板块和龙头股分析
              </CardDescription>
            </div>
            {lastUpdated && (
              <Badge variant="secondary" className="text-xs">
                更新于 {formatTime(lastUpdated)}
              </Badge>
            )}
          </div>
>>>>>>> origin/v0/zmpple-7535-fb84d16f
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleFetch}
            disabled={loading}
<<<<<<< HEAD
            className="w-full h-12 text-base"
=======
            className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
>>>>>>> origin/v0/zmpple-7535-fb84d16f
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                正在获取市场热点...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
<<<<<<< HEAD
                一键获取今日热点
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground mt-3 text-center">
            实时搜索A股市场热门题材、涨停复盘、游资动向
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
                <p className="font-medium text-foreground">正在获取市场热点...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  搜索涨停复盘、游资动向、AI分析整理
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
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                今日热点分析
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
                <div className="mt-8">
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                      原始搜索数据
                    </summary>
                    <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                      {result.rawData}
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
          免责声明：热点题材分析仅供参考，不构成任何投资建议。追高有风险，入场需谨慎。
        </p>
      </div>
    </div>
  )
=======
                {result ? "刷新热点" : "获取今日热点"}
              </>
            )}
          </Button>
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
        <div className="grid gap-6 md:grid-cols-4">
          {/* Stats Cards */}
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100">
                  <Zap className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{result.newsCount}</div>
                  <div className="text-sm text-muted-foreground">热点资讯</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {result.searchTime.toFixed(1)}s
                  </div>
                  <div className="text-sm text-muted-foreground">搜索耗时</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md md:col-span-2">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-2">数据来源</div>
              <div className="flex flex-wrap gap-2">
                {["东方财富", "同花顺", "新浪财经", "证券时报"].map((source) => (
                  <Badge key={source} variant="outline" className="text-xs">
                    {source}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Report */}
          <Card className="border-0 shadow-md md:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                热点分析报告
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
            <div className="mx-auto w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
              <Flame className="h-8 w-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">探索今日市场热点</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              点击上方按钮，获取今日A股市场热点板块、龙头股和投资机会分析
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
>>>>>>> origin/v0/zmpple-7535-fb84d16f
}
