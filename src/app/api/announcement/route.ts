import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAnnouncement, setAnnouncement } from "@/lib/kv";
import type { Announcement } from "@/lib/types";

// GET /api/announcement — public read
export async function GET() {
  const a = await getAnnouncement();
  return NextResponse.json(a);
}

// PUT /api/announcement — admin write
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json();
  const text = (body.text || "").trim();
  if (!text || text.length > 200) {
    return NextResponse.json({ error: "公告内容 1-200 字" }, { status: 400 });
  }

  const link = body.link?.trim() || undefined;
  if (link) {
    try { new URL(link); } catch {
      return NextResponse.json({ error: "链接格式不正确" }, { status: 400 });
    }
  }

  const validColors = ["blue", "yellow", "green"];
  const color = validColors.includes(body.color) ? body.color : "blue";

  const a: Announcement = { text, link, color, updatedAt: Date.now() };
  await setAnnouncement(a);
  return NextResponse.json(a);
}
