"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Login page is public
    if (pathname === "/login") {
      setOk(true);
      return;
    }

    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        if (d.role) {
          setOk(true);
        } else {
          router.replace("/login");
        }
      })
      .catch(() => router.replace("/login"));
  }, [pathname, router]);

  if (pathname === "/login") return <>{children}</>;
  if (!ok) return null; // blank screen while checking
  return <>{children}</>;
}
