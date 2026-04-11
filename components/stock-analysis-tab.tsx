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
  recommendationSummary: { buy: number; sell: number; neutral: number };
}

interface AnalysisResult {
  stockCode: string;
  stockName: string;
  analysis: string;
  technical: TechnicalData;
  newsCount: number;
}

export function StockAnalysisTab() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) {
      setError("请输入股票代码或名称");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
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
    if (rec.includes("BUY")) return "text-emerald-700 bg-emerald-100 border border-emerald-300";
    if (rec.includes("SELL")) return "text-red-700 bg-red-100 border border-red-300";
    return "text-amber-700 bg-amber-100 border border-amber-300";
  };

  const getRecommendationText = (rec: string) => {
    const map: Record<string, string> = {
      STRONG_BUY: "强烈买入", BUY: "买入", NEUTRAL: "中性", SELL: "卖出", STRONG_SELL: "强烈卖出",
    };
    return map[rec] || rec;
  };

  return (
    <div className="space-y-6">
      {/* 搜索区 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-primary" />
            个股体检
          </CardTitle>
          <CardDescription>
            输入股票代码（如 600519）或名称（如 贵州茅台）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="输入股票代码或名称"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              className="h-11"
              disabled={loading}
            />
            <Button onClick={handleAnalyze} disabled={loading || !input.trim()} className="h-11 px-6">
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

          {/* 快捷示例 */}
          <div className="mt-3 flex flex-wrap gap-2">
            {["600519 贵州茅台", "000001 平安银行", "300750 宁德时代"].map((example) => (
              <Button
                key={example}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(example);
                  setResult(null);
                }}
              >
                {example}
              </Button>
            ))}
          </div>

          {error && (
            <div className="mt-3 p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 结果展示 */}
      {result && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-primary/10 border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-primary font-medium mb-2">
                <Activity className="h-4 w-4" />
                股票信息
              </div>
              <div className="text-2xl font-bold text-foreground">{result.technical.name}</div>
              <div className="text-sm text-muted-foreground font-mono">{result.technical.symbol}</div>
              <div className="flex items-center gap-3 mt-4 p-3 rounded-lg bg-white/60">
                <span className="text-2xl font-bold text-foreground">¥{result.technical.close}</span>
                <span className={`flex items-center text-sm font-semibold px-2 py-1 rounded-md ${result.technical.change >= 0 ? "text-emerald-700 bg-emerald-100" : "text-red-700 bg-red-100"}`}>
                  {result.technical.change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {result.technical.changePercent}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-l-amber-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-amber-700 font-medium mb-2">
                <Activity className="h-4 w-4" />
                RSI 指标
              </div>
              <div className="text-4xl font-bold text-foreground">{result.technical.rsi}</div>
              <div className="mt-3 h-3 bg-white/80 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all ${result.technical.rsi > 70 ? "bg-gradient-to-r from-red-400 to-red-600" : result.technical.rsi < 30 ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-amber-400 to-amber-500"}`}
                  style={{ width: `${Math.min(result.technical.rsi, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-medium mt-2">
                <span className="text-emerald-600">超卖 &lt;30</span>
                <span className="text-amber-600">中性</span>
                <span className="text-red-600">超买 &gt;70</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 border-l-4 border-l-emerald-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium mb-2">
                <BarChart3 className="h-4 w-4" />
                综合评级
              </div>
              <Badge className={`text-lg px-4 py-2 font-bold ${getRecommendationColor(result.technical.recommendation)}`}>
                {getRecommendationText(result.technical.recommendation)}
              </Badge>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-emerald-100/80">
                  <div className="text-lg font-bold text-emerald-700">{result.technical.recommendationSummary.buy}</div>
                  <div className="text-xs text-emerald-600">买入</div>
                </div>
                <div className="p-2 rounded-lg bg-amber-100/80">
                  <div className="text-lg font-bold text-amber-700">{result.technical.recommendationSummary.neutral}</div>
                  <div className="text-xs text-amber-600">中性</div>
                </div>
                <div className="p-2 rounded-lg bg-red-100/80">
                  <div className="text-lg font-bold text-red-700">{result.technical.recommendationSummary.sell}</div>
                  <div className="text-xs text-red-600">卖出</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI 报告 */}
          <Card className="border-0 shadow-lg md:col-span-3 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xl font-bold">AI 分析报告</span>
                </div>
                <Badge className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30">
                  参考新闻 {result.newsCount} 条
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ScrollArea className="h-[550px] pr-4">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => (
                        <div className="flex items-center gap-3 mt-8 mb-4 pb-3 border-b-2 border-primary/30">
                          <div className="w-1.5 h-6 bg-primary rounded-full" />
                          <h2 className="text-lg font-bold text-foreground m-0">{children}</h2>
                        </div>
                      ),
                      h3: ({ children }) => (
                        <div className="flex items-center gap-2 mt-6 mb-3">
                          <div className="w-1 h-5 bg-primary/70 rounded-full" />
                          <h3 className="text-base font-semibold text-foreground m-0">{children}</h3>
                        </div>
                      ),
                      strong: ({ children }) => {
                        const text = String(children);
                        // 判断状态关键词并添加颜色
                        if (text.includes("买入") || text.includes("看多") || text.includes("利好")) {
                          return <span className="font-bold text-emerald-600">{children}</span>;
                        }
                        if (text.includes("卖出") || text.includes("看空") || text.includes("利空")) {
                          return <span className="font-bold text-red-600">{children}</span>;
                        }
                        if (text.includes("中性") || text.includes("观望") || text.includes("震荡")) {
                          return <span className="font-bold text-amber-600">{children}</span>;
                        }
                        return <strong className="font-semibold text-primary">{children}</strong>;
                      },
                      table: ({ children }) => (
                        <div className="my-4 rounded-xl overflow-hidden border border-border/50 shadow-sm">
                          <table className="w-full">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-primary/10">{children}</thead>
                      ),
                      th: ({ children }) => (
                        <th className="px-4 py-3 text-left font-semibold text-foreground text-sm border-b border-primary/20">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-4 py-3 text-sm border-b border-border/30">{children}</td>
                      ),
                      tr: ({ children }) => (
                        <tr className="hover:bg-muted/50 transition-colors">{children}</tr>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary/50 pl-4 py-3 my-4 bg-primary/5 rounded-r-lg text-foreground/80 italic">
                          {children}
                        </blockquote>
                      ),
                      ul: ({ children }) => (
                        <ul className="my-3 space-y-2 pl-4">{children}</ul>
                      ),
                      li: ({ children }) => (
                        <li className="flex items-start gap-2 text-foreground/85">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span>{children}</span>
                        </li>
                      ),
                      p: ({ children }) => (
                        <p className="mb-4 leading-relaxed text-foreground/85">{children}</p>
                      ),
                    }}
                  >
                    {result.analysis}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 空状态 */}
      {!result && !loading && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">开始分析</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              输入股票代码或名称，获取技术面和消息面综合分析
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
