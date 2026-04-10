import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "20");

    const supabase = await createClient();

    let query = supabase
      .from("analysis_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (type && type !== "all") {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "获取历史记录失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("History API error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "缺少记录ID" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("analysis_history")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "删除失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete API error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
