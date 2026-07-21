"use client";

import { useState } from "react";
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

const darkTokens = {
  paper: "#0b0f19",
  paper2: "#131827",
  paper3: "#1a1f30",
  accent: "#06B6D4",
  accentGlow: "rgba(6,182,212,0.12)",
  text: "#e2e8f0",
  textSoft: "#94a3b8",
  textMuted: "#64748b",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(6,182,212,0.25)",
  surface: "rgba(255,255,255,0.03)",
  surfaceRaised: "rgba(255,255,255,0.05)",
} as const;

/** Color tint per category — slight chromatic variation */
const catColors = [
  "rgba(6,182,212,0.06)",   // cyan
  "rgba(59,130,246,0.06)",  // blue
  "rgba(168,85,247,0.06)",  // purple
  "rgba(34,197,94,0.06)",   // green
  "rgba(251,146,60,0.06)",  // orange
  "rgba(236,72,153,0.06)",  // pink
];
function catTint(idx: number) { return catColors[idx % catColors.length]; }

type Tab = "home" | "search";
export default function MobileLayout({ display, search, setSearch, activeCategory, cMap, sidebarCats, resources, selectCat }: Props) {
  const [tab, setTab] = useState<"home" | "search">("home");

  return (
    <div style={{
      background: darkTokens.paper,
      color: darkTokens.text,
      fontFamily: "var(--font-body)",
      minHeight: "100dvh",
      paddingBottom: "80px",
    }}>
      {/* Top bar */}
      <div className="sticky top-0 z-30 px-4 pt-3 pb-2"
        style={{
          background: "rgba(11,15,25,0.85)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: `1px solid ${darkTokens.border}`,
        }}>
        {tab === "search" ? (
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: darkTokens.textMuted }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索..."
              autoFocus
              className="w-full h-10 pl-10 pr-4 rounded-full text-sm outline-none transition-all"
              style={{
                background: darkTokens.surfaceRaised, border: `1px solid ${darkTokens.border}`,
                color: darkTokens.text,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = darkTokens.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${darkTokens.accentGlow}`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = darkTokens.border; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>
        ) : (
          <h1 className="text-base font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            {activeCategory ? `${cMap.get(activeCategory)?.icon || ""} ${cMap.get(activeCategory)?.name || ""}` : "ShareHub"}
          </h1>
        )}
      </div>

      {/* Category pills */}
      <div className="px-4 pt-3 pb-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2" style={{ minWidth: "max-content" }}>
          <button onClick={() => selectCat(null)}
            className="shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: activeCategory === null ? darkTokens.accent : darkTokens.surfaceRaised,
              color: activeCategory === null ? "#fff" : darkTokens.textSoft,
              border: activeCategory === null ? "none" : `1px solid ${darkTokens.border}`,
            }}>
            全部
          </button>
          {sidebarCats.map((cat) => {
            const count = resources.filter((r) => r.category === cat.id).length;
            if (count === 0) return null;
            const isActive = activeCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => selectCat(cat.id)}
                className="shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: isActive ? darkTokens.accent : darkTokens.surfaceRaised,
                  color: isActive ? "#fff" : darkTokens.textSoft,
                  border: isActive ? "none" : `1px solid ${darkTokens.border}`,
                }}>
                {cat.icon} {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Card feed */}
      <div className="px-4 pt-2 space-y-3">
        {display.length > 0 ? display.map((r, i) => (
          <MobileCard key={r.id} resource={r} category={cMap.get(r.category)} tint={catTint(i)} />
        )) : (
          <div className="flex flex-col items-center justify-center py-24" style={{ color: darkTokens.textMuted }}>
            <p style={{ fontSize: "var(--text-lg)" }}>{search ? "没有匹配的资源" : "空空如也"}</p>
            <p className="mt-1 text-sm">{search ? "试试别的关键词" : "登录后就可以添加啦"}</p>
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 inset-x-0 z-30"
        style={{
          background: "rgba(11,15,25,0.9)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderTop: `1px solid ${darkTokens.border}`,
        }}>
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

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 transition-all"
      style={{ color: active ? darkTokens.accent : darkTokens.textMuted, background: "none", border: "none", cursor: "pointer" }}>
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        {icon}
      </svg>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

function MobileCard({ resource, category, tint }: { resource: Resource; category?: Category; tint: string }) {
  const tags = Array.isArray(resource.tags) ? resource.tags : [];
  const desc = resource.description ? stripHtml(resource.description) : "";

  return (
    <Link href={`/resource/${resource.id}`} style={{ textDecoration: "none" }}>
      <div className="rounded-2xl p-4 transition-all active:scale-[0.985]"
        style={{
          background: darkTokens.surface,
          border: `1px solid ${darkTokens.border}`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.02)`,
        }}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <FaviconIcon link={resource.link} alt={resource.name} fallback={category?.icon || "📦"} />
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold truncate" style={{ fontSize: "15px", color: darkTokens.text }}>
                {resource.name}
                {resource.featured && <span style={{ color: darkTokens.accent, fontSize: "13px" }}>{' '}★</span>}
              </h3>
            </div>
            <p className="text-xs mt-0.5 truncate" style={{ color: darkTokens.textSoft }}>{resource.subtitle || ""}</p>
          </div>
        </div>

        {/* Description */}
        {desc && (
          <p className="line-clamp-2 mb-3 leading-relaxed" style={{ fontSize: "var(--text-sm)", color: darkTokens.textSoft }}>
            {desc}
          </p>
        )}

        {/* Footer */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {category && (
            <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: darkTokens.accentGlow, color: darkTokens.accent }}>
              {category.name}
            </span>
          )}
          {tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-md"
              style={{ background: darkTokens.surfaceRaised, color: darkTokens.textMuted }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
