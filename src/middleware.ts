import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public endpoints
  if (pathname === "/api/auth" || pathname === "/api/webhook") return NextResponse.next();

  // GET requests are public (AuthGuard handles page protection)
  if (request.method === "GET") return NextResponse.next();

  // Mutations require login
  const token = request.cookies.get("share-hub-session")?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Category mutations require admin
  if (pathname.startsWith("/api/categories") && user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
