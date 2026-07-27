/**
 * Extract domain favicon URLs from a resource link.
 * Returns multiple sources — client tries them in order.
 * Direct favicon first (no proxy, works when site is reachable),
 * then Google/DuckDuckGo as fallbacks.
 */

export function getFaviconSources(link: string): string[] {
  try {
    const url = new URL(link);
    const domain = url.hostname;
    // Always use HTTPS to avoid mixed-content warnings on secure pages
    const secureOrigin = url.origin.replace(/^http:/, "https:");
    return [
      `/api/favicon?domain=${domain}`,                                       // server proxy — outside GFW
      `${secureOrigin}/favicon.ico`,                                         // direct fallback (forced HTTPS)
      `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,         // Google (client-side fallback)
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,                    // DDG (client-side fallback)
    ];
  } catch {
    return [];
  }
}

/** Convenience: single best-guess URL (direct favicon) */
export function getFaviconUrl(link: string): string | null {
  return getFaviconSources(link)[0] || null;
}
