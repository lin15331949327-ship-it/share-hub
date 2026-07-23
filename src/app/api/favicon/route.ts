import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side favicon proxy — Vercel is outside GFW, so it can reach
 * Google S2 / DuckDuckGo / direct favicon.ico without issues.
 *
 * GET /api/favicon?domain=obsproject.com
 * → tries Google S2 → DuckDuckGo → direct, returns first success.
 * Cached at the edge (24h) + browser (7d).
 */

const SOURCES = (domain: string) => [
  { url: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`, label: "google" },
  { url: `https://icons.duckduckgo.com/ip3/${domain}.ico`, label: "ddg" },
  { url: `https://${domain}/favicon.ico`, label: "direct" },
  // Fallback: proxy through Vercel (outside GFW) if running on Alibaba ECS
  { url: `https://share.linxiaoxiao111.dpdns.org/api/favicon?domain=${domain}`, label: "vercel" },
];

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain");
  if (!domain || domain.length > 200 || !/^[a-zA-Z0-9.-]+$/.test(domain)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  for (const src of SOURCES(domain)) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(src.url, { signal: ctrl.signal });
      clearTimeout(t);

      if (!res.ok) continue;

      const buf = await res.arrayBuffer();
      if (buf.byteLength < 100) continue; // too small = likely a placeholder

      const ct = res.headers.get("content-type") || "image/png";
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": ct,
          "Cache-Control": "public, max-age=604800, s-maxage=86400, stale-while-revalidate=86400",
          "CDN-Cache-Control": "public, max-age=86400",
          "Vercel-CDN-Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      continue;
    }
  }

  return new NextResponse(null, { status: 404 });
}
