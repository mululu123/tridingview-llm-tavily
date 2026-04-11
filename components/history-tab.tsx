"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getLocalAnalysis,
  deleteLocalAnalysis,
  LocalAnalysisRecord,
} from "@/lib/services/local-storage";
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
      // 先尝试从服务器获取
      const response = await fetch(`/api/history?type=${filter}`);
      const data = await response.json();

      if (response.ok && data.data?.length > 0) {
        setRecords(data.data);
      } else {
        // 服务器失败或无数据，使用本地存储
        const localRecords = getLocalAnalysis(
          filter === "all" ? undefined : filter
        );
        setRecords(
          localRecords.map((r) => ({
            id: r.id,
            type: r.type,
            stock_code: r.stock_code || null,
            stock_name: r.stock_name || null,
            analysis_result: r.analysis_result,
            created_at: r.created_at,
          }))
        );
      }
    } catch (err) {
      // 网络错误，使用本地存储
      console.log("Using local storage for history");
      const localRecords = getLocalAnalysis(
        filter === "all" ? undefined : filter
      );
      setRecords(
        localRecords.map((r) => ({
          id: r.id,
          type: r.type,
          stock_code: r.stock_code || null,
          stock_name: r.stock_name || null,
          analysis_result: r.analysis_result,
          created_at: r.created_at,
        }))
      );
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
      // 尝试从服务器删除
      const response = await fetch("/api/history", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
      } else {
        // 服务器失败，删除本地
        deleteLocalAnalysis(id);
        setRecords((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      // 网络错误，删除本地
      deleteLocalAnalysis(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } finally {
      if (expandedId === id) {
        setExpandedId(null);
      }
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
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
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
          </CardContent>
        </Card>
      )}

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
                      disabled={deletingId === record.id}
                    >
                      {deletingId === record.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
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
}
