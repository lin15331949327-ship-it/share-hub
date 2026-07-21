import { NextRequest, NextResponse } from "next/server";
import { getAllResources, getResource, createResource, updateResource, deleteResource } from "@/lib/kv";
import { getSession } from "@/lib/auth";
import type { Resource } from "@/lib/types";

// GET /api/resources
export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const trash = req.nextUrl.searchParams.get("trash") === "1";
  const all = await getAllResources();

  // soft-delete: normal view excludes deletedAt, trash view only shows deletedAt
  const stage1 = trash
    ? all.filter((r) => r.deletedAt)
    : all.filter((r) => !r.deletedAt);

  const filtered = category ? stage1.filter((r) => r.category === category) : stage1;
  filtered.sort((a, b) => {
    const oA = a.displayOrder ?? a.createdAt;
    const oB = b.displayOrder ?? b.createdAt;
    if (oA !== oB) return oB - oA;
    return (a.category || "").localeCompare(b.category || "");
  });
  return NextResponse.json(filtered);
}

// POST /api/resources
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const body = await req.json();
  const resource: Resource = {
    id: crypto.randomUUID(),
    name: body.name,
    subtitle: body.subtitle || "",
    description: body.description || "",
    link: body.link,
    category: body.category,
    tags: body.tags || [],
    createdBy: session.role,
    createdAt: Date.now(),
    displayOrder: Date.now(),
  };

  await createResource(resource);
  return NextResponse.json(resource, { status: 201 });
}
