"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const checked = useRef(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Login page is public
    if (pathname === "/login") {
      setOk(true);
      return;
    }

    // Already verified — skip re-check on client-side navigation
    if (checked.current) return;

    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        if (d.role) {
          checked.current = true;
          setOk(true);
        } else {
          router.replace("/login");
        }
      })
      .catch(() => {
        // Network error — don't redirect; wait and retry on next navigation
        // Most likely a transient issue; the cookie is still valid
      });
  }, [pathname, router]);

  if (pathname === "/login") return <>{children}</>;
  if (!ok) return null; // blank screen while checking
  return <>{children}</>;
}
