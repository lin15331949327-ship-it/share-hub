import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // ── Auth: API mutations require login ──
  if (pathname.startsWith("/api/")) {
    if (pathname === "/api/auth") return NextResponse.next();
    if (request.method === "GET") return NextResponse.next();

    const token = request.cookies.get("share-hub-session")?.value;
    const user = token ? await verifyToken(token) : null;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (pathname.startsWith("/api/categories") && user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    return NextResponse.next();
  }

  // ── Auto-detect mobile device on first visit ──
  if (pathname === "/" && request.method === "GET") {
    const alreadySet = request.cookies.get("sh-view-set")?.value;
    const hasViewParam = searchParams.has("view");

    if (!alreadySet && !hasViewParam) {
      const ua = request.headers.get("user-agent") || "";
      const isMobile = /Mobile|Android|iPhone|iPad|iPod|webOS|BlackBerry|Opera Mini/i.test(ua);

      if (isMobile) {
        const url = request.nextUrl.clone();
        url.searchParams.set("view", "mobile");
        const res = NextResponse.redirect(url);
        res.cookies.set("sh-view-set", "1", { maxAge: 60 * 60 * 24, path: "/", sameSite: "lax" });
        return res;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
