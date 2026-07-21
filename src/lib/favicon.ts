/**
 * Extract domain favicon from a resource link.
 * Uses Google's favicon service for reliable, cached results.
 */

export function getFaviconUrl(link: string, size = 64): string | null {
  try {
    const url = new URL(link);
    const domain = url.hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
  } catch {
    return null;
  }
}
