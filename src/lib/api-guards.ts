import { getSession } from "./auth";
import { NextResponse } from "next/server";
import type { SessionUser } from "./types";

/**
 * Require authentication for API routes.
 *
 * - Called with no role: any logged-in user passes
 * - Called with "admin": only admin passes, editors get 403
 *
 * Returns the session on success, or a NextResponse error on failure.
 * Route handlers should check the result with `instanceof NextResponse`.
 *
 * @example
 *   const auth = await requireAuth("admin");
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.role === "admin"
 */
export async function requireAuth(role?: "admin"): Promise<SessionUser | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  if (role === "admin" && session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  return session;
}
