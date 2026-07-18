export interface Resource {
  id: string;
  name: string;
  description: string;
  link: string;
  category: string;
  tags: string[];
  createdBy: "admin" | "editor";
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
}

export interface SessionUser {
  role: "admin" | "editor";
}
