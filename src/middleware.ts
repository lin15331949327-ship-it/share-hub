import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public endpoints
  if (pathname === "/api/auth" || pathname === "/api/webhook") return NextResponse.next();

  // GET requests are public (page-level AuthGuard + route-level requireAuth handle protection)
  if (request.method === "GET") return NextResponse.next();

  // All mutations require login (fine-grained role checks in route handlers)
  const token = request.cookies.get("share-hub-session")?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
