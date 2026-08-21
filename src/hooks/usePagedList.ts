import { useCallback, useEffect, useRef, useState } from "react";
import type { EntityListQuery, PagedResult } from "@shared/types";
import { DEFAULT_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from "@shared/constants/pagination";
import { useDebouncedValue } from "./useDebouncedValue";

export interface UsePagedListOptions<T> {
  /** Gọi API — thường là `userApi.list` hoặc `catalogApi.searchProducts` */
  fetchPage: (query: EntityListQuery) => Promise<PagedResult<T>>;
  /** Filter cố định (roles, stage, activeOnly…) — không gồm q/page */
  filters?: Omit<EntityListQuery, "q" | "page">;
  pageSize?: number;
  debounceMs?: number;
  /** Tắt auto-fetch (tab ẩn) */
  enabled?: boolean;
}

export interface UsePagedListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  q: string;
  setQ: (q: string) => void;
  setPage: (page: number) => void;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook chuẩn cho mọi màn list có search + phân trang.
 * Page reset về 1 khi đổi search/filter.
 */
export function usePagedList<T>(options: UsePagedListOptions<T>): UsePagedListResult<T> {
  const {
    fetchPage,
    filters,
    pageSize = DEFAULT_PAGE_SIZE,
    debounceMs = SEARCH_DEBOUNCE_MS,
    enabled = true,
  } = options;

  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, debounceMs);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const filtersKey = JSON.stringify(filters ?? {});

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, filtersKey]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const query: EntityListQuery = {
      ...filters,
      q: debouncedQ || undefined,
      page,
      pageSize,
    };

    void fetchPage(query)
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setItems([]);
        setTotal(0);
        setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQ, page, pageSize, filtersKey, enabled, tick, fetchPage]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return {
    items,
    total,
    page,
    pageSize,
    q,
    setQ,
    setPage,
    loading,
    error,
    refresh,
  };
}

/** Giữ fetchPage ổn định khi truyền inline lambda vào usePagedList */
export function useStableFetch<T>(
  fn: (query: EntityListQuery) => Promise<PagedResult<T>>,
): (query: EntityListQuery) => Promise<PagedResult<T>> {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((query: EntityListQuery) => ref.current(query), []);
}
