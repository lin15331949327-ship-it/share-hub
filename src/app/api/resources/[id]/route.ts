import { NextRequest, NextResponse } from "next/server";
import { getResource, updateResource, deleteResource } from "@/lib/kv";
import { requireAuth } from "@/lib/api-guards";

// PUT /api/resources/:id — full edit (edit form)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

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

// PATCH /api/resources/:id — partial update (restore / featured / reorder)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await getResource(id);
  if (!existing) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  const body = await req.json();

  // Only mutate keys that are present in the body
  const updated = { ...existing };
  if (body.deletedAt !== undefined) updated.deletedAt = body.deletedAt;
  if (body.featured !== undefined) updated.featured = !!body.featured;
  if (body.displayOrder !== undefined) updated.displayOrder = body.displayOrder;

  await updateResource(updated);
  return NextResponse.json(updated);
}

// DELETE /api/resources/:id — soft delete by default, ?permanent=1 for hard delete
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await getResource(id);
  if (!existing) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  // ?permanent=1 → hard delete (only from trash view)
  if (req.nextUrl.searchParams.get("permanent") === "1") {
    await deleteResource(id);
    return NextResponse.json({ ok: true, permanent: true });
  }

  // Default: soft delete → resource moves to trash (deletedAt set),
  // still restorable, hidden from normal views.
  const softDeleted = { ...existing, deletedAt: Date.now() };
  await updateResource(softDeleted);
  return NextResponse.json({ ok: true, soft: true });
}
