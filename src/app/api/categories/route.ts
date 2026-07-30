import { NextRequest, NextResponse } from "next/server";
import { getAllCategories, setCategories } from "@/lib/kv";
import { requireAuth } from "@/lib/api-guards";
import type { Category } from "@/lib/types";

// GET /api/categories
export async function GET() {
  const cats = await getAllCategories();
  cats.sort((a, b) => a.order - b.order);
  return NextResponse.json(cats);
}

// POST /api/categories
export async function POST(req: NextRequest) {
  const auth = await requireAuth("admin");
  if (auth instanceof NextResponse) return auth;

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
  const auth = await requireAuth("admin");
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { id, name, icon, order, isCatchAll, sortWeight } = body;
  const cats = await getAllCategories();
  const idx = cats.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (name !== undefined) cats[idx].name = name;
  if (icon !== undefined) cats[idx].icon = icon;
  if (order !== undefined) cats[idx].order = order;
  if (isCatchAll !== undefined) cats[idx].isCatchAll = isCatchAll;
  if (sortWeight !== undefined) cats[idx].sortWeight = sortWeight;
  cats.sort((a, b) => a.order - b.order);
  await setCategories(cats);
  return NextResponse.json(cats[idx]);
}

// DELETE /api/categories
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth("admin");
  if (auth instanceof NextResponse) return auth;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const cats = await getAllCategories();
  const filtered = cats.filter((c) => c.id !== id);
  await setCategories(filtered);
  return NextResponse.json({ ok: true });
}
