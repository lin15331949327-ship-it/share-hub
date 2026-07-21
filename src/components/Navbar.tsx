"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const [role, setRole] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => { fetch("/api/auth").then((r) => r.json()).then((d) => setRole(d.role)); }, [pathname]);

  /* Restore saved position on mount */
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    try {
      const raw = localStorage.getItem("sh-nav-pos");
      if (raw) {
        const { left, top } = JSON.parse(raw);
        el.style.left = left + "px";
        el.style.top = top + "px";
        el.style.transform = "none";
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    setHidden(new URLSearchParams(window.location.search).get("view") === "mobile");
  }, [pathname]);

  /* ── ALL hooks above this line ── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = navRef.current;
    if (!el) return;
    dragging.current = true;
    const rect = el.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    el.style.cursor = "grabbing";
    el.style.transition = "none";
    el.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !navRef.current) return;
    const x = e.clientX - offset.current.x;
    const y = e.clientY - offset.current.y;
    const w = navRef.current.offsetWidth;
    const h = navRef.current.offsetHeight;
    const cx = Math.max(0, Math.min(x, window.innerWidth - w));
    const cy = Math.max(0, Math.min(y, window.innerHeight - h));
    navRef.current.style.left = cx + "px";
    navRef.current.style.top = cy + "px";
    navRef.current.style.transform = "none";
  }, []);

  const onPointerUp = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    dragging.current = false;
    el.style.cursor = "grab";
    el.style.transition = "all 300ms var(--ease-spring)";
    /* persist position */
    try {
      localStorage.setItem("sh-nav-pos", JSON.stringify({
        left: parseInt(el.style.left) || 0,
        top: parseInt(el.style.top) || 0,
      }));
    } catch { /* ignore */ }
  }, []);

  if (hidden) return null;
  /* ── early return above, no hooks below ── */

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/";
  }

  return (
    <div
      ref={navRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="fixed z-50 select-none"
      style={{
        top: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        cursor: "grab",
        touchAction: "none",
      }}
    >
      <nav
        className="flex items-center gap-6 px-6 h-12 rounded-full text-sm"
        style={{
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.06)",
          transition: "box-shadow 300ms var(--ease-spring)",
        }}
        onMouseEnter={(e) => {
          if (!dragging.current) {
            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.08)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)";
        }}
      >
        <span className="select-none mr-1" style={{ color: "var(--color-text-muted)", fontSize: "12px", letterSpacing: "2px", lineHeight: 1, cursor: "grab" }}>
          ⋮⋮
        </span>

        <Link href="/" className="font-semibold tracking-tight mr-2" style={{
          fontSize: "15px", color: "var(--color-text)", textDecoration: "none", fontFamily: "var(--font-display)",
        }} onPointerDown={(e) => e.stopPropagation()}>
          ShareHub
        </Link>

        <span className="w-px h-5" style={{ background: "var(--color-border)" }} />

        {role ? (
          <>
            <Link href="/admin/resources/new" className="transition-colors"
              style={{ color: "var(--color-text-soft)", fontSize: "13px", textDecoration: "none" }}
              onPointerDown={(e) => e.stopPropagation()}>
              提交
            </Link>
            <Link href="/admin/resources" className="transition-colors"
              style={{ color: "var(--color-text-soft)", fontSize: "13px", textDecoration: "none" }}
              onPointerDown={(e) => e.stopPropagation()}>
              管理
            </Link>
            <button onClick={logout} className="transition-colors"
              style={{ color: "var(--color-text-muted)", fontSize: "13px", background: "none", border: "none", cursor: "pointer" }}
              onPointerDown={(e) => e.stopPropagation()}>
              退出
            </button>
          </>
        ) : (
          <Link href="/login" className="transition-colors"
            style={{ color: "var(--color-text-soft)", fontSize: "13px", textDecoration: "none" }}
            onPointerDown={(e) => e.stopPropagation()}>
            登录
          </Link>
        )}
      </nav>
    </div>
  );
}
