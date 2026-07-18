import { NextResponse } from "next/server";
import { getR2Stats } from "@/lib/r2";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  const stats = await getR2Stats();
  return NextResponse.json({ ...stats, role: session?.role });
}
