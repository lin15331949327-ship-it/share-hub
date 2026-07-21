"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => setRole(d.role));
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    setRole(null);
    router.push("/");
  }

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-semibold tracking-tight"
          style={{
            fontSize: "var(--text-base)",
            color: "var(--color-text)",
            textDecoration: "none",
          }}
        >
          ShareHub
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {role ? (
            <>
              <Link
                href="/admin/resources/new"
                className="transition-colors"
                style={{ color: "var(--color-text-soft)" }}
              >
                提交资源
              </Link>
              <Link
                href="/admin/resources"
                className="transition-colors"
                style={{ color: "var(--color-text-soft)" }}
              >
                管理
              </Link>
              <button
                onClick={logout}
                className="transition-colors"
                style={{ color: "var(--color-text-muted)" }}
              >
                退出
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="transition-colors"
              style={{ color: "var(--color-text-soft)" }}
            >
              登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
