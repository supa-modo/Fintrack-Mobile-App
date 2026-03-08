import api from "./api";
import type { Category } from "../types/api";

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get<{ categories: Category[] }>("/categories");
  return data.categories;
}
