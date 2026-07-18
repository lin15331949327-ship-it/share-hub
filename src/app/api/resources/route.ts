import { NextRequest, NextResponse } from "next/server";
import { getAllResources, getResource, createResource, updateResource, deleteResource } from "@/lib/kv";
import { getSession } from "@/lib/auth";
import type { Resource } from "@/lib/types";

// GET /api/resources
export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const all = await getAllResources();
  const filtered = category ? all.filter((r) => r.category === category) : all;
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
    description: body.description || "",
    link: body.link,
    category: body.category,
    tags: body.tags || [],
    createdBy: session.role,
    createdAt: Date.now(),
  };

  await createResource(resource);
  return NextResponse.json(resource, { status: 201 });
}
