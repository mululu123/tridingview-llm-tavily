"use client";

import { useState, useEffect, useRef } from "react";
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
  X,
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

interface StockSuggestion {
  code: string;
  name: string;
  matchType: string;
}

export function StockAnalysisTab() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 搜索建议
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (input.trim().length >= 1 && !result) {
        setSearching(true);
        try {
          const res = await fetch(`/api/analyze?q=${encodeURIComponent(input.trim())}`);
          const data = await res.json();
          setSuggestions(data.results || []);
          setShowSuggestions(true);
        } catch {
          setSuggestions([]);
        }
        setSearching(false);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [input, result]);

  // 点击外部关闭建议列表
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAnalyze = async (stockInput?: string) => {
    const query = stockInput || input.trim();
    if (!query) {
      setError("请输入股票代码或名称");
      return;
    }

    setLoading(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stockCode: query, stockName: query }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.suggestions) {
          setError(`未找到匹配的股票，您是想找：${data.suggestions.join("、")}？`);
        } else {
          throw new Error(data.error || "分析失败");
        }
        return;
      }

      setResult(data.data);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: StockSuggestion) => {
    setInput(`${suggestion.code} ${suggestion.name}`);
    setShowSuggestions(false);
    handleAnalyze(suggestion.code);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (suggestions.length > 0 && showSuggestions) {
        handleSelectSuggestion(suggestions[0]);
      } else {
        handleAnalyze();
      }
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
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

  const clearResult = () => {
    setResult(null);
    setInput("");
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
            输入股票代码或名称，获取技术面和消息面综合分析
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  placeholder="输入代码或名称，如: 600519、茅台、gzmt"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="h-11 pr-8"
                  disabled={loading}
                />
                {input && !loading && (
                  <button
                    onClick={() => {
                      setInput("");
                      setResult(null);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                onClick={() => handleAnalyze()}
                disabled={loading || !input.trim()}
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

            {/* 搜索建议下拉框 */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden"
              >
                <ScrollArea className="max-h-64">
                  {suggestions.map((s) => (
                    <button
                      key={s.code}
                      onClick={() => handleSelectSuggestion(s)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-muted-foreground w-16">
                          {s.code}
                        </span>
                        <span className="font-medium">{s.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {s.matchType === "code" ? "代码" : s.matchType === "name" ? "名称" : "拼音"}
                      </Badge>
                    </button>
                  ))}
                </ScrollArea>
              </div>
            )}

            {/* 搜索中状态 */}
            {searching && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  搜索中...
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-3 p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
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
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{result.technical.name}</div>
                  <Button variant="ghost" size="sm" onClick={clearResult}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
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
                    style={{ width: `${Math.min(result.technical.rsi, 100)}%` }}
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
              输入股票代码（如 600519）或名称（如 茅台），我们将为您提供技术面分析、消息面解读和操作建议
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {["600519", "000001", "茅台", "宁德时代"].map((example) => (
                <Button
                  key={example}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInput(example);
                    handleAnalyze(example);
                  }}
                >
                  {example}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
