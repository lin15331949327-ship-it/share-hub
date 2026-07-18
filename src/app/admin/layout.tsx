import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="flex gap-6 mb-8 border-b border-zinc-200 pb-3">
        <Link
          href="/admin/resources"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          资源管理
        </Link>
        <Link
          href="/admin/categories"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          分类管理
        </Link>
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
          ← 回首页
        </Link>
      </div>
      {children}
    </div>
  );
}
