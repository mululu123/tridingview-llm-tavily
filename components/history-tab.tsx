<<<<<<< HEAD
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  History,
  Trash2,
  TrendingUp,
  Flame,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface HistoryRecord {
  id: string
  type: "stock" | "market_hot"
  stock_code?: string
  stock_name?: string
  analysis_result: string
  created_at: string
}

export function HistoryTab() {
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<"all" | "stock" | "market_hot">(
    "all"
  )

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const typeParam = filterType === "all" ? "" : `?type=${filterType}`
      const response = await fetch(`/api/history${typeParam}`)
      const data = await response.json()
      if (data.success) {
        setRecords(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch history:", error)
    } finally {
      setLoading(false)
    }
  }, [filterType])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const response = await fetch(`/api/history?id=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete:", error)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
=======
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import {
  History,
  Activity,
  Flame,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  AlertCircle,
  FileText,
} from "lucide-react";

interface HistoryRecord {
  id: string;
  type: "stock" | "market_hot";
  stock_code: string | null;
  stock_name: string | null;
  analysis_result: string;
  created_at: string;
}

export function HistoryTab() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "stock" | "market_hot">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/history?type=${filter}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "获取失败");
      }

      setRecords(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    try {
      const response = await fetch("/api/history", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("删除失败");
      }

      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (expandedId === id) {
        setExpandedId(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
>>>>>>> origin/v0/zmpple-7535-fb84d16f
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
<<<<<<< HEAD
    })
  }

  const truncateText = (text: string, maxLength = 150) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  return (
    <div className="space-y-6">
      {/* 筛选和刷新 */}
      <Card className="border-0 shadow-md bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-primary" />
              分析历史
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchHistory}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
=======
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-primary" />
                分析历史
              </CardTitle>
              <CardDescription className="mt-1">
                查看和管理您的历史分析记录
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHistory}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              刷新
>>>>>>> origin/v0/zmpple-7535-fb84d16f
            </Button>
          </div>
        </CardHeader>
        <CardContent>
<<<<<<< HEAD
          <div className="flex gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
            >
              全部
            </Button>
            <Button
              variant={filterType === "stock" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("stock")}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              个股分析
            </Button>
            <Button
              variant={filterType === "market_hot" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("market_hot")}
            >
              <Flame className="h-4 w-4 mr-1" />
              市场热点
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 加载状态 */}
      {loading && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">加载历史记录...</p>
            </div>
=======
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as typeof filter)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="stock" className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                个股分析
              </TabsTrigger>
              <TabsTrigger value="market_hot" className="flex items-center gap-1">
                <Flame className="h-3 w-3" />
                市场热点
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">加载中...</p>
>>>>>>> origin/v0/zmpple-7535-fb84d16f
          </CardContent>
        </Card>
      )}

<<<<<<< HEAD
      {/* 空状态 */}
      {!loading && records.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <History className="h-12 w-12 opacity-50" />
              <p>暂无分析记录</p>
              <p className="text-sm">开始使用个股体检或市场热点功能来生成记录</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 历史记录列表 */}
      {!loading && records.length > 0 && (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3 pr-4">
            {records.map((record) => (
              <Card
                key={record.id}
                className="border-0 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {record.type === "stock" ? (
                          <>
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              个股分析
                            </Badge>
                            {record.stock_name && (
                              <span className="font-medium text-foreground">
                                {record.stock_name}
                              </span>
                            )}
                            {record.stock_code && (
                              <span className="text-muted-foreground text-sm">
                                ({record.stock_code})
                              </span>
                            )}
                          </>
                        ) : (
                          <Badge variant="secondary" className="bg-orange-500/10 text-orange-600">
                            <Flame className="h-3 w-3 mr-1" />
                            市场热点
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDate(record.created_at)}
                        </span>
                      </div>

                      <div
                        className={`text-sm text-muted-foreground ${
                          expandedId === record.id ? "" : "line-clamp-3"
                        }`}
                      >
                        {expandedId === record.id
                          ? record.analysis_result
                          : truncateText(record.analysis_result)}
                      </div>

                      {record.analysis_result.length > 150 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-7 text-xs"
                          onClick={() =>
                            setExpandedId(
                              expandedId === record.id ? null : record.id
                            )
                          }
                        >
                          {expandedId === record.id ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" />
                              收起
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              展开全部
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(record.id)}
=======
      {/* Records List */}
      {!loading && records.length > 0 && (
        <div className="space-y-4">
          {records.map((record) => (
            <Card
              key={record.id}
              className="border-0 shadow-md overflow-hidden"
            >
              <div
                className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                onClick={() => toggleExpand(record.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        record.type === "stock"
                          ? "bg-primary/10"
                          : "bg-orange-100"
                      }`}
                    >
                      {record.type === "stock" ? (
                        <Activity className="h-4 w-4 text-primary" />
                      ) : (
                        <Flame className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {record.type === "stock"
                          ? `${record.stock_name || ""} ${record.stock_code || ""}`
                          : "市场热点分析"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(record.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={
                        record.type === "stock"
                          ? "bg-primary/10 text-primary"
                          : "bg-orange-100 text-orange-600"
                      }
                    >
                      {record.type === "stock" ? "个股" : "热点"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(record.id);
                      }}
>>>>>>> origin/v0/zmpple-7535-fb84d16f
                      disabled={deletingId === record.id}
                    >
                      {deletingId === record.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
<<<<<<< HEAD
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
=======
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      )}
                    </Button>
                    {expandedId === record.id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
              {expandedId === record.id && (
                <div className="border-t bg-secondary/10">
                  <ScrollArea className="h-[400px] p-4">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{record.analysis_result}</ReactMarkdown>
                    </div>
                  </ScrollArea>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && records.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">暂无历史记录</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {filter === "all"
                ? "您还没有进行过任何分析，去个股体检或市场热点页面开始吧"
                : filter === "stock"
                ? "您还没有进行过个股分析"
                : "您还没有获取过市场热点"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
>>>>>>> origin/v0/zmpple-7535-fb84d16f
}
