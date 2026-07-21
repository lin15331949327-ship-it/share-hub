"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

const SNAP = 60; // px from edge to trigger snap

export default function Navbar() {
  const [role, setRole] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [snapEdge, setSnapEdge] = useState<"left" | "right" | "top">("top");
  const router = useRouter();
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => { fetch("/api/auth").then((r) => r.json()).then((d) => setRole(d.role)); }, [pathname]);

  /* Restore saved state on mount */
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    try {
      const raw = localStorage.getItem("sh-nav-pos");
      if (raw) {
        const data = JSON.parse(raw);
        if (data.collapsed) {
          setCollapsed(true);
          setSnapEdge(data.edge || "top");
        }
        if (data.left !== undefined) {
          el.style.left = data.left + "px";
          el.style.top = data.top + "px";
          el.style.transform = "none";
        }
      }
    } catch { /* ignore */ }
  }, []);

  /* Apply collapsed position */
  useEffect(() => {
    const el = navRef.current;
    if (!el || !collapsed) return;
    const top = parseInt(el.style.top || "16");
    el.style.transition = "all 400ms var(--ease-spring)";
    el.style.transform = "none";
    if (snapEdge === "left") {
      el.style.left = "4px";
      el.style.top = Math.max(4, Math.min(top, window.innerHeight - 48)) + "px";
    } else if (snapEdge === "right") {
      el.style.left = (window.innerWidth - 44) + "px";
      el.style.top = Math.max(4, Math.min(top, window.innerHeight - 48)) + "px";
    } else {
      el.style.left = Math.max(0, Math.min(parseInt(el.style.left || "0"), window.innerWidth - 44)) + "px";
      el.style.top = "4px";
    }
  }, [collapsed, snapEdge]);

  useEffect(() => {
    setHidden(new URLSearchParams(window.location.search).get("view") === "mobile");
  }, [pathname]);

  /* ── ALL hooks above this line ── */

  function persist(el: HTMLDivElement, col: boolean, edge: string) {
    try {
      localStorage.setItem("sh-nav-pos", JSON.stringify({
        left: parseInt(el.style.left) || 0,
        top: parseInt(el.style.top) || 0,
        collapsed: col,
        edge,
      }));
    } catch { /* ignore */ }
  }

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = navRef.current;
    if (!el) return;
    dragging.current = true;
    moved.current = false;
    const rect = el.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    el.style.cursor = "grabbing";
    el.style.transition = "none";
    el.style.transform = "none";
    el.style.left = rect.left + "px";
    el.style.top = rect.top + "px";
    el.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !navRef.current) return;
    const el = navRef.current;
    const x = e.clientX - offset.current.x;
    const y = e.clientY - offset.current.y;
    if (Math.abs(x - parseInt(el.style.left || "0")) > 2 ||
        Math.abs(y - parseInt(el.style.top || "0")) > 2) {
      moved.current = true;
    }
    const w = collapsed ? 44 : el.offsetWidth;
    const h = collapsed ? 44 : el.offsetHeight;
    el.style.left = Math.max(0, Math.min(x, window.innerWidth - w)) + "px";
    el.style.top = Math.max(0, Math.min(y, window.innerHeight - h)) + "px";
  }, [collapsed]);

  const onPointerUp = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    dragging.current = false;
    el.style.cursor = "grab";
    el.style.transition = "all 400ms var(--ease-spring)";

    if (moved.current) {
      const left = parseInt(el.style.left || "0");
      const top = parseInt(el.style.top || "0");

      if (left < SNAP) {
        setCollapsed(true); setSnapEdge("left");
        persist(el, true, "left");
      } else if (left > window.innerWidth - 200 - SNAP) {
        setCollapsed(true); setSnapEdge("right");
        persist(el, true, "right");
      } else if (top < SNAP) {
        setCollapsed(true); setSnapEdge("top");
        persist(el, true, "top");
      } else {
        setCollapsed(false);
        persist(el, false, "top");
      }
    }
  }, []);

  if (hidden) return null;

  function handleClick(e: React.MouseEvent) {
    if (moved.current) return;
    if (collapsed) {
      setCollapsed(false);
      const el = navRef.current;
      if (el) persist(el, false, "top");
    }
  }

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/";
  }

  /* ── Collapsed: small floating handle ── */
  if (collapsed) {
    return (
      <div
        ref={navRef}
        onClick={handleClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="fixed z-50 select-none flex items-center justify-center"
        style={{
          width: 40, height: 40,
          borderRadius: snapEdge === "top" ? "0 0 12px 12px"
            : snapEdge === "left" ? "0 12px 12px 0"
            : "12px 0 0 12px",
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.08)",
          cursor: "grab",
          touchAction: "none",
        }}
        title="点击展开 / 拖拽移动">
        <span style={{ color: "var(--color-text-muted)", fontSize: "14px", letterSpacing: "3px", lineHeight: 1 }}>
          ⋮⋮
        </span>
      </div>
    );
  }

  /* ── Expanded: full navbar ── */
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
