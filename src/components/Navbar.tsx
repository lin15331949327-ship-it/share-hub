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
    <div className="sticky top-4 z-40 flex justify-center px-4">
      <nav
        className="flex items-center gap-6 px-6 h-12 rounded-full text-sm"
        style={{
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <Link
          href="/"
          className="font-semibold tracking-tight mr-2"
          style={{
            fontSize: "15px",
            color: "var(--color-text)",
            textDecoration: "none",
            fontFamily: "var(--font-display)",
          }}
        >
          ShareHub
        </Link>

        <span className="w-px h-5" style={{ background: "var(--color-border)" }} />

        {role ? (
          <>
            <Link
              href="/admin/resources/new"
              className="transition-colors"
              style={{ color: "var(--color-text-soft)", fontSize: "13px", textDecoration: "none" }}
            >
              提交
            </Link>
            <Link
              href="/admin/resources"
              className="transition-colors"
              style={{ color: "var(--color-text-soft)", fontSize: "13px", textDecoration: "none" }}
            >
              管理
            </Link>
            <button
              onClick={logout}
              className="transition-colors"
              style={{ color: "var(--color-text-muted)", fontSize: "13px", background: "none", border: "none", cursor: "pointer" }}
            >
              退出
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="transition-colors"
            style={{ color: "var(--color-text-soft)", fontSize: "13px", textDecoration: "none" }}
          >
            登录
          </Link>
        )}
      </nav>
    </div>
  );
}
