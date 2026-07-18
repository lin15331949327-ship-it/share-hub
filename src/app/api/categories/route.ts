import { NextRequest, NextResponse } from "next/server";
import { getAllCategories, setCategories } from "@/lib/kv";
import { getSession } from "@/lib/auth";
import type { Category } from "@/lib/types";

function adminGuard(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  return null;
}

// GET /api/categories
export async function GET() {
  const cats = await getAllCategories();
  return NextResponse.json(cats);
}

// POST /api/categories
export async function POST(req: NextRequest) {
  const session = await getSession();
  const err = adminGuard(session);
  if (err) return err;

  const body = await req.json();
  const cats = await getAllCategories();
  const newCat: Category = {
    id: body.id || crypto.randomUUID().slice(0, 8),
    name: body.name,
    icon: body.icon || "📌",
    order: cats.length,
  };
  cats.push(newCat);
  await setCategories(cats);
  return NextResponse.json(newCat, { status: 201 });
}

// PUT /api/categories
export async function PUT(req: NextRequest) {
  const session = await getSession();
  const err = adminGuard(session);
  if (err) return err;

  const body = await req.json();
  const { id, name, icon, order } = body;
  const cats = await getAllCategories();
  const idx = cats.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (name !== undefined) cats[idx].name = name;
  if (icon !== undefined) cats[idx].icon = icon;
  if (order !== undefined) cats[idx].order = order;
  cats.sort((a, b) => a.order - b.order);
  await setCategories(cats);
  return NextResponse.json(cats[idx]);
}

// DELETE /api/categories
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  const err = adminGuard(session);
  if (err) return err;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const cats = await getAllCategories();
  const filtered = cats.filter((c) => c.id !== id);
  await setCategories(filtered);
  return NextResponse.json({ ok: true });
}
