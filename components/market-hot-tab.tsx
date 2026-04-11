"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { saveLocalAnalysis } from "@/lib/services/local-storage";
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

      // 保存到本地存储
      saveLocalAnalysis({
        id: `market-${Date.now()}`,
        type: "market_hot",
        analysis_result: data.data.analysis,
        created_at: new Date().toISOString(),
      });
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
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleFetch}
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                正在获取市场热点...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
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
}
