"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaviconIcon, stripHtml } from "./HomeShared";
import type { Resource, Category } from "@/lib/types";

interface Props {
  display: Resource[];
  search: string;
  setSearch: (v: string) => void;
  activeCategory: string | null;
  cMap: Map<string, Category>;
  sidebarCats: Category[];
  resources: Resource[];
  selectCat: (id: string | null) => void;
}

/* ====== Dark tokens ====== */
const D = {
  bg:      "#0a0a0c",
  surface: "#111114",
  raised:  "#18181b",
  border:  "rgba(255,255,255,0.07)",
  accent:  "#3b82f6",
  aglow:   "rgba(59,130,246,0.13)",
  text:    "#e4e4e7",
  soft:    "#a1a1aa",
  muted:   "#52525b",
};

type Tab = "home" | "search";

export default function MobileLayout({ display, search, setSearch, activeCategory, cMap, sidebarCats, resources, selectCat }: Props) {
  const [tab, setTab] = useState<Tab>("home");

  /* Escape desktop container + override body background */
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = D.bg;
    return () => { document.body.style.background = prev; };
  }, []);

  return (
    <div
      style={{
        /* break out of <main> px-6 + pt-4 + pb-24 */
        margin: "-1rem -1.5rem -6rem",
        width: "calc(100% + 3rem)",
        background: D.bg,
        color: D.text,
        fontFamily: "var(--font-body)",
        minHeight: "100dvh",
        paddingBottom: "80px",
      }}
    >
      {/* ── Top bar ── */}
      <div
        className="sticky top-0 z-30"
        style={{
          background: "rgba(10,10,12,0.88)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          borderBottom: `1px solid ${D.border}`,
        }}
      >
        <div className="px-4 pt-3 pb-2.5">
          {tab === "search" ? (
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: D.muted }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索资源…" autoFocus
                className="w-full h-10 pl-10 pr-4 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: D.raised, border: `1px solid ${D.border}`,
                  color: D.text, fontFamily: "var(--font-body)",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = D.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${D.aglow}`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
          ) : (
            <h1 className="text-base font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              {activeCategory
                ? `${cMap.get(activeCategory)?.icon || ""} ${cMap.get(activeCategory)?.name || ""}`
                : "ShareHub"}
            </h1>
          )}
        </div>
      </div>

      {/* ── Category pills ── */}
      <div className="px-4 pt-3 pb-1.5 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2" style={{ minWidth: "max-content" }}>
          <Pill active={activeCategory === null} onClick={() => selectCat(null)}>
            全部
          </Pill>
          {sidebarCats.map((cat) => {
            const count = resources.filter((r) => r.category === cat.id).length;
            if (count === 0) return null;
            return (
              <Pill key={cat.id} active={activeCategory === cat.id} onClick={() => selectCat(cat.id)}>
                {cat.icon} {cat.name}
              </Pill>
            );
          })}
        </div>
      </div>

      {/* ── Card feed ── */}
      <div className="px-4 pt-2 space-y-3">
        {display.length > 0 ? (
          display.map((r, i) => (
            <MobileCard key={r.id} resource={r} category={cMap.get(r.category)} index={i} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-28" style={{ color: D.muted }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: D.surface, border: `1px solid ${D.border}` }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="font-medium" style={{ fontSize: "15px", color: D.soft }}>
              {search ? "没有匹配的资源" : "空空如也"}
            </p>
            <p className="mt-1 text-sm">{search ? "试试别的关键词" : "登录后就可以添加啦"}</p>
          </div>
        )}
      </div>

      {/* ── Bottom tab bar ── */}
      <div
        className="fixed bottom-0 inset-x-0 z-30"
        style={{
          background: "rgba(10,10,12,0.9)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderTop: `1px solid ${D.border}`,
        }}
      >
        <div className="flex items-center justify-around h-16 px-4 max-w-lg mx-auto">
          <TabBtn active={tab === "home"} onClick={() => { setTab("home"); selectCat(null); }}
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />}
            label="首页" />
          <TabBtn active={tab === "search"} onClick={() => setTab("search")}
            icon={<><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3" /></>}
            label="搜索" />
        </div>
      </div>
    </div>
  );
}

/* ── Pill ── */
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition-all select-none active:scale-95"
      style={{
        background: active ? D.accent : D.raised,
        color: active ? "#fff" : D.soft,
        border: active ? "none" : `1px solid ${D.border}`,
        transition: "all 200ms cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      {children}
    </button>
  );
}

/* ── Tab button ── */
function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 transition-all active:scale-95"
      style={{
        color: active ? D.accent : D.muted,
        background: "none", border: "none", cursor: "pointer",
        transition: "all 200ms cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        {icon}
      </svg>
      <span className="text-[11px] font-semibold">{label}</span>
    </button>
  );
}

/* ── Card ── */
function MobileCard({ resource, category, index }: { resource: Resource; category?: Category; index: number }) {
  const tags = Array.isArray(resource.tags) ? resource.tags : [];
  const desc = resource.description ? stripHtml(resource.description) : "";

  return (
    <Link href={`/resource/${resource.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        className="rounded-2xl transition-all active:scale-[0.985]"
        style={{
          background: D.surface,
          border: `1px solid ${D.border}`,
          transition: "all 200ms cubic-bezier(0.32, 0.72, 0, 1)",
          animation: `cardIn 400ms cubic-bezier(0.32, 0.72, 0, 1) ${index * 50}ms both`,
        }}
      >
        {/* Header row */}
        <div className="flex items-start gap-3 px-4 pt-4 pb-2">
          <div
            className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden"
            style={{ background: D.raised, border: `1px solid ${D.border}` }}
          >
            <FaviconPlaceholder link={resource.link} alt={resource.name} fallback={category?.icon || "📦"} />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold truncate" style={{ fontSize: "15px", color: D.text }}>
                {resource.name}
              </h3>
              {resource.featured && (
                <span className="shrink-0" style={{ color: D.accent, fontSize: "12px" }}>★</span>
              )}
            </div>
            {resource.subtitle && (
              <p className="text-[13px] mt-0.5 truncate" style={{ color: D.muted }}>{resource.subtitle}</p>
            )}
          </div>
        </div>

        {/* Description */}
        {desc && (
          <p className="px-4 pb-3 line-clamp-2 leading-relaxed" style={{ fontSize: "13px", color: D.soft }}>
            {desc}
          </p>
        )}

        {/* Footer tags */}
        <div className="flex flex-wrap gap-1.5 items-center px-4 pb-4">
          {category && (
            <span
              className="text-[12px] px-2 py-0.5 rounded-lg font-medium"
              style={{ background: D.aglow, color: D.accent }}
            >
              {category.name}
            </span>
          )}
          {tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="text-[12px] px-2 py-0.5 rounded-lg"
              style={{ background: D.raised, color: D.muted }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

/* Mini favicon with fallback (inline to avoid flicker) */
function FaviconPlaceholder({ link, alt, fallback }: { link: string; alt: string; fallback: string }) {
  const [ok, setOk] = useState(true);
  let hostname = "";
  try { hostname = new URL(link).hostname; } catch { return <span className="text-lg">{fallback}</span>; }
  const src = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  if (!ok) return <span className="text-lg">{fallback}</span>;
  return (
    <img src={src} alt={alt} className="w-6 h-6 object-contain" loading="lazy" onError={() => setOk(false)} />
  );
}

