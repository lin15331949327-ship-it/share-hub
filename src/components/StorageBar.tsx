"use client";

import { useState, useEffect } from "react";

interface Stats {
  objects: number;
  totalMB: string;
  quotaGB: number;
  percentUsed: string;
}

export default function StorageBar() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  if (!stats) return null;

  const pct = parseFloat(stats.percentUsed);
  const color =
    pct > 90 ? "from-red-400 to-red-500" :
    pct > 70 ? "from-amber-400 to-amber-500" :
    "from-emerald-400 to-emerald-500";

  return (
    <div className="mb-6 p-4 rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-zinc-700">
          🗄️ 存储空间
        </span>
        <span className="text-sm text-zinc-500">
          {stats.totalMB} MB / {stats.quotaGB} GB · {stats.objects} 个文件
        </span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      {pct > 80 && (
        <p className="text-xs text-amber-600 mt-2">⚠️ 存储接近上限，建议清理旧资源</p>
      )}
    </div>
  );
}
