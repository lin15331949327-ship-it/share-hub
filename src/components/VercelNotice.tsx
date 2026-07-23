"use client";

import { useState, useEffect } from "react";

export default function VercelNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show on the old Vercel deployment (not on Alibaba ECS)
    if (window.location.hostname === "share.linxiaoxiao111.dpdns.org") {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
      onClick={() => setShow(false)}
    >
      <div
        className="relative max-w-md w-full rounded-[28px] overflow-hidden"
        style={{
          background: "#fff",
          boxShadow: "0 32px 64px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div
          className="px-8 pt-10 pb-6 text-center"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          <span className="text-5xl">🚀</span>
          <h2 className="text-2xl font-extrabold text-white mt-4 tracking-tight">
            我们搬家啦
          </h2>
          <p className="text-white/80 text-sm mt-2 leading-relaxed">
            ShareHub 已迁移至阿里云服务器，更稳定、更快
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-4">
          <div className="rounded-2xl p-4" style={{ background: "#f8f9fb" }}>
            <p className="text-sm text-zinc-600 leading-relaxed">
              <span className="font-semibold text-zinc-800">当前地址</span>是旧版备份站，
              <strong>不支持上传和编辑</strong>。数据也不会同步。
            </p>
          </div>

          <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: "#dbeafe" }}>
              🔗
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">新地址</p>
              <a
                href="https://share.aseeker.bio"
                className="text-sm font-bold text-blue-700 hover:underline truncate block"
              >
                share.aseeker.bio
              </a>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <a
              href="https://share.aseeker.bio"
              className="flex-1 text-center px-5 py-3 rounded-full text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", boxShadow: "0 4px 16px rgba(102,126,234,0.35)" }}
            >
              前往新站
            </a>
            <button
              onClick={() => setShow(false)}
              className="px-5 py-3 rounded-full text-sm font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              知道了
            </button>
          </div>
        </div>

        {/* Footer accent */}
        <div className="h-1" style={{ background: "linear-gradient(90deg, #667eea, #764ba2, #f093fb)" }} />
      </div>
    </div>
  );
}
