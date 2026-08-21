import type { EntityListQuery, PagedResult } from "../types/index.js";
import { normalizePageQuery } from "./listQuery.js";

export interface PaginateInMemoryOptions<T> {
  q?: string;
  page?: number;
  pageSize?: number;
  match?: (item: T, q: string) => boolean;
}

/** Lọc + phân trang in-memory (seed fallback, catalog memory store) */
export function paginateInMemory<T>(
  items: T[],
  opts: PaginateInMemoryOptions<T>,
): PagedResult<T> {
  const { page, pageSize } = normalizePageQuery(opts);
  const q = opts.q?.trim().toLowerCase() ?? "";
  const filtered = q && opts.match ? items.filter((item) => opts.match!(item, q)) : items;
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  return { items: filtered.slice(start, start + pageSize), total, page, pageSize };
}

/** Fallback khi API trả về mảng thay vì PagedResult (legacy / dev) */
export function slicePagedArray<T>(
  items: T[],
  query: EntityListQuery = {},
): PagedResult<T> {
  const { page, pageSize } = normalizePageQuery(query);
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize };
}
