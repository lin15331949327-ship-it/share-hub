import { NextRequest, NextResponse } from "next/server";
import { getResource, updateResource, deleteResource } from "@/lib/kv";
import { getSession } from "@/lib/auth";

// PUT /api/resources/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getResource(id);
  if (!existing) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  const body = await req.json();

  // Preserve immutable fields, apply edits on top
  const updated = {
    ...existing,
    name: body.name ?? existing.name,
    subtitle: body.subtitle ?? existing.subtitle,
    description: body.description ?? existing.description,
    link: body.link ?? existing.link,
    category: body.category ?? existing.category,
    tags: body.tags ?? existing.tags,
  };

  await updateResource(updated);
  return NextResponse.json(updated);
}

// DELETE /api/resources/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getResource(id);
  if (!existing) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  await deleteResource(id);
  return NextResponse.json({ ok: true });
}
