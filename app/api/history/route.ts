import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // 'stock' | 'market_hot' | null (all)
    const limit = parseInt(searchParams.get("limit") || "20")

    const supabase = await createClient()

    let query = supabase
      .from("analysis_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (type) {
      query = query.eq("type", type)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("History fetch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取历史记录失败" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "缺少记录ID" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from("analysis_history")
      .delete()
      .eq("id", id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("History delete error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除失败" },
      { status: 500 }
    )
  }
}
