/**
 * Extract domain favicon URLs from a resource link.
 * Returns multiple sources — client tries them in order.
 */

export function getFaviconSources(link: string, size = 64): string[] {
  try {
    const url = new URL(link);
    const domain = url.hostname;
    return [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    ];
  } catch {
    return [];
  }
}

/** Convenience: single best-guess URL (Google) */
export function getFaviconUrl(link: string, size = 64): string | null {
  return getFaviconSources(link, size)[0] || null;
}
