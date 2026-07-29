"use client";

import { useRouter } from "next/navigation";

interface Props {
  /** Fallback URL when there's no history (e.g. direct link / bookmark). */
  fallbackHref: string;
  label: string;
}

/**
 * Back button that uses the browser's native history stack.
 * Preserves category filter, scroll position, and any other
 * page state — unlike a hardcoded <Link> which resets the view.
 *
 * Falls back to `fallbackHref` when the referrer is external
 * (direct link, bookmark, etc.) so the user never ends up
 * on an unrelated site.
 */
export function BackButton({ fallbackHref, label }: Props) {
  const router = useRouter();

  function goBack() {
    // Only go back if the previous page was also on this site
    try {
      const referrer = document.referrer;
      if (referrer) {
        const refHost = new URL(referrer).host;
        if (refHost === window.location.host) {
          router.back();
          return;
        }
      }
    } catch {
      // parse error — ignore and fall through
    }
    // External referrer or no history → use the fallback link
    router.push(fallbackHref);
  }

  return (
    <button
      onClick={goBack}
      className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors mb-6 inline-block"
      style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
    >
      ← {label}
    </button>
  );
}
