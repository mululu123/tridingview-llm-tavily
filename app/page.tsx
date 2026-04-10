<<<<<<< HEAD
"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StockAnalysisTab } from "@/components/stock-analysis-tab"
import { MarketHotTab } from "@/components/market-hot-tab"
import { HistoryTab } from "@/components/history-tab"
import { TrendingUp, Flame, History } from "lucide-react"
=======
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockAnalysisTab } from "@/components/stock-analysis-tab";
import { MarketHotTab } from "@/components/market-hot-tab";
import { HistoryTab } from "@/components/history-tab";
import { Activity, Flame, History, TrendingUp } from "lucide-react";
>>>>>>> origin/v0/zmpple-7535-fb84d16f

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
<<<<<<< HEAD
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">A股短线助手</h1>
              <p className="text-xs text-muted-foreground">
                AI驱动的智能分析工具
=======
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">A股短线助手</h1>
              <p className="text-sm text-muted-foreground">
                智能个股分析与市场热点追踪
>>>>>>> origin/v0/zmpple-7535-fb84d16f
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
<<<<<<< HEAD
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <Tabs defaultValue="stock" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 mb-6">
=======
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="stock" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 h-12">
>>>>>>> origin/v0/zmpple-7535-fb84d16f
            <TabsTrigger
              value="stock"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
<<<<<<< HEAD
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">个股体检</span>
              <span className="sm:hidden">体检</span>
            </TabsTrigger>
            <TabsTrigger
              value="market"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
=======
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">个股体检</span>
              <span className="sm:hidden">个股</span>
            </TabsTrigger>
            <TabsTrigger
              value="market"
              className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
>>>>>>> origin/v0/zmpple-7535-fb84d16f
            >
              <Flame className="h-4 w-4" />
              <span className="hidden sm:inline">市场热点</span>
              <span className="sm:hidden">热点</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
<<<<<<< HEAD
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
=======
              className="flex items-center gap-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
>>>>>>> origin/v0/zmpple-7535-fb84d16f
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">历史记录</span>
              <span className="sm:hidden">历史</span>
            </TabsTrigger>
          </TabsList>

<<<<<<< HEAD
          <TabsContent value="stock" className="mt-0">
            <StockAnalysisTab />
          </TabsContent>

          <TabsContent value="market" className="mt-0">
            <MarketHotTab />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
=======
          <TabsContent value="stock" className="mt-6">
            <StockAnalysisTab />
          </TabsContent>

          <TabsContent value="market" className="mt-6">
            <MarketHotTab />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
>>>>>>> origin/v0/zmpple-7535-fb84d16f
            <HistoryTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
<<<<<<< HEAD
      <footer className="border-t mt-auto py-4">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>A股短线助手 - 基于 AI 的智能分析工具</p>
        </div>
      </footer>
    </div>
  )
=======
      <footer className="border-t bg-card/50 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-xs text-muted-foreground">
            免责声明：本工具提供的分析仅供参考，不构成投资建议。股市有风险，投资需谨慎。
          </p>
        </div>
      </footer>
    </div>
  );
>>>>>>> origin/v0/zmpple-7535-fb84d16f
}
