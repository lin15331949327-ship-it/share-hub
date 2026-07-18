import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin API routes
  if (pathname.startsWith("/api/")) {
    // Auth endpoint is public
    if (pathname === "/api/auth" && request.method === "POST") return NextResponse.next();

    // GET requests are public
    if (request.method === "GET") return NextResponse.next();

    // Mutations require login
    const token = request.cookies.get("share-hub-session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Category routes require admin
    if (pathname.startsWith("/api/categories") && user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
