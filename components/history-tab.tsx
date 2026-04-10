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
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
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
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
          </CardContent>
        </Card>
      )}

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
                      disabled={deletingId === record.id}
                    >
                      {deletingId === record.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
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
}
