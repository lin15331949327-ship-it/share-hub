export interface Resource {
  id: string;
  name: string;
  /** One-line subtitle shown under the name on cards */
  subtitle?: string;
  description: string;
  link: string;
  category: string;
  tags: string[];
  createdBy: "admin" | "editor";
  createdAt: number;
  /** Admin drag-sort order (higher = appears earlier) */
  displayOrder?: number;
  /** Admin-pinned featured resource for Hero banner */
  featured?: boolean;
  /** Soft delete timestamp — hidden from normal views */
  deletedAt?: number;
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
