"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useDraggablePosition } from "@/hooks/useDraggablePosition";

const SNAP = 60;
const NAV_W = 420; // approximate expanded width for edge calculation

export default function Navbar() {
  const [role, setRole] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [snapEdge, setSnapEdge] = useState<"left" | "right" | "top">("top");
  const router = useRouter();
  const pathname = usePathname();

  const {
    elementRef: navRef,
    pos,
    setPos,
    moved,
    persist,
    onPointerDown,
    onPointerMove,
    finishDrag,
  } = useDraggablePosition({ storageKey: "sh-nav-pos" });

  useEffect(() => { fetch("/api/auth").then((r) => r.json()).then((d) => setRole(d.role)); }, [pathname]);

  /* Restore collapsed + snapEdge from saved state on mount */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sh-nav-pos");
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.collapsed) {
        setCollapsed(true);
        setSnapEdge(data.edge || "top");
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    setHidden(new URLSearchParams(window.location.search).get("view") === "mobile");
  }, [pathname]);

  /* ── ALL hooks above this line ── */

  // Custom onPointerUp: add snap-to-edge + collapse logic
  const onPointerUp = useCallback(() => {
    const finalPos = finishDrag();
    if (!finalPos) return;

    let { left, top } = finalPos;

    if (left < SNAP) {
      setCollapsed(true);
      setSnapEdge("left");
      setPos({ left: 4, top });
      persist({ left: 4, top }, { collapsed: true, edge: "left" });
    } else if (left > window.innerWidth - 60 - SNAP) {
      setCollapsed(true);
      setSnapEdge("right");
      setPos({ left: window.innerWidth - 40, top });
      persist({ left: window.innerWidth - 40, top }, { collapsed: true, edge: "right" });
    } else if (top < SNAP) {
      setCollapsed(true);
      setSnapEdge("top");
      setPos({ left, top: 4 });
      persist({ left, top: 4 }, { collapsed: true, edge: "top" });
    } else {
      setCollapsed(false);
      setPos({ left, top });
      persist({ left, top }, { collapsed: false, edge: "top" });
    }
  }, [finishDrag, setPos, persist]);

  if (hidden) return null;

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/";
  }

  /* ── Collapsed pill ── */
  if (collapsed) {
    const p = pos || { left: window.innerWidth / 2 - 20, top: 16 };
    return (
      <div
        ref={navRef}
        onClick={() => {
          if (moved.current) return;
          // Expand in place
          let nl = p.left, nt = p.top;
          if (snapEdge === "right") nl = Math.max(0, p.left - NAV_W + 40);
          else if (snapEdge === "left") nl = 8;
          else nl = Math.max(8, Math.min(p.left, window.innerWidth - NAV_W));
          nt = Math.max(4, Math.min(nt, window.innerHeight - 48));
          setPos({ left: nl, top: nt });
          setCollapsed(false);
          persist({ left: nl, top: nt }, { collapsed: false, edge: "top" });
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="fixed z-50 select-none flex items-center justify-center"
        style={{
          left: p.left, top: p.top,
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
          transform: "none",
        }}
        title="点击展开 / 拖拽移动">
        <span style={{ color: "var(--color-text-muted)", fontSize: "14px", letterSpacing: "3px", lineHeight: 1, pointerEvents: "none" }}>
          ⋮⋮
        </span>
      </div>
    );
  }

  /* ── Expanded Navbar ── */
  const expandedStyle: React.CSSProperties = pos
    ? { left: pos.left, top: pos.top, transform: "none", cursor: "grab", touchAction: "none" }
    : { top: "16px", left: "50%", transform: "translateX(-50%)", cursor: "grab", touchAction: "none" };

  return (
    <div
      ref={navRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="fixed z-50 select-none"
      style={expandedStyle}
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
          e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.08)";
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
