export interface Resource {
  id: string;
  name: string;
  description: string;
  link: string;
  category: string;
  tags: string[];
  createdBy: "admin" | "editor";
  createdAt: number;
  /** Admin-pinned featured resource for Hero banner */
  featured?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
  /** Exclude from "全部" view — for catch-all / misc categories */
  isCatchAll?: boolean;
  /** Sort weight for display ordering (higher = later). Default 0. */
  sortWeight?: number;
}

export interface SessionUser {
  role: "admin" | "editor";
}
