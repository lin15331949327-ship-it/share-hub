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
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
          📦 ShareHub
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {role ? (
            <>
              <Link href="/admin/resources" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                管理
              </Link>
              <button onClick={logout} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                退出
              </button>
            </>
          ) : (
            <Link href="/login" className="text-zinc-500 hover:text-zinc-900 transition-colors">
              登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
