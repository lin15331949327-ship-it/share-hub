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
    return [
      `${url.origin}/favicon.ico`,                                          // direct — fastest, no GFW
      `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,         // Google proxy
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,                    // DDG proxy
    ];
  } catch {
    return [];
  }
}

/** Convenience: single best-guess URL (direct favicon) */
export function getFaviconUrl(link: string): string | null {
  return getFaviconSources(link)[0] || null;
}
