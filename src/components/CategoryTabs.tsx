import type { Category } from "@/lib/types";

interface Props {
  categories: Category[];
  active: string | null;
  onSelect: (id: string | null) => void;
}

export default function CategoryTabs({ categories, active, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          active === null
            ? "bg-zinc-900 text-white"
            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
        }`}
      >
        全部
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            active === cat.id
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          {cat.icon} {cat.name}
        </button>
      ))}
    </div>
  );
}
