import { NextRequest, NextResponse } from "next/server";
import { getResource, updateResource, deleteResource } from "@/lib/kv";
import { getSession } from "@/lib/auth";
import { deleteR2Files } from "@/lib/r2";

// GET /api/resources/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resource = await getResource(id);
  if (!resource) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(resource);
}

// PUT /api/resources/[id]
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
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Editors can only edit their own
  if (session.role === "editor" && existing.createdBy !== "editor") {
    return NextResponse.json({ error: "Can only edit your own" }, { status: 403 });
  }

  const body = await req.json();
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

// DELETE /api/resources/[id] — soft delete (or permanent with ?permanent=1)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const resource = await getResource(id);
  if (!resource) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const permanent = req.nextUrl.searchParams.get("permanent") === "1";

  if (permanent) {
    await deleteR2Files(resource.description);
    await deleteResource(id);
    return NextResponse.json({ ok: true });
  }

  // soft delete
  resource.deletedAt = Date.now();
  await updateResource(resource);
  return NextResponse.json({ ok: true });
}

// PATCH /api/resources/[id] — toggle featured (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const resource = await getResource(id);
  if (!resource) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  if (typeof body.featured === "boolean") {
    resource.featured = body.featured;
  }
  if (typeof body.displayOrder === "number") {
    resource.displayOrder = body.displayOrder;
  }
  // restore from trash
  if (body.deletedAt === null) {
    resource.deletedAt = undefined;
  }

  await updateResource(resource);
  return NextResponse.json(resource);
}
