import type { ApiResponse, EntityListQuery, PagedResult } from "@shared/types";
import { buildListQueryString } from "@shared/utils/listQuery";
import { slicePagedArray } from "@shared/utils/pagedList";
import { API_BASE } from "../lib/apiBase";
import { isDemoMode } from "../lib/demoMode";
import { handleDemoApi } from "../mocks/demoApiRouter";

function apiIsCrossOrigin(): boolean {
  if (typeof window === "undefined") return false;
  if (!API_BASE.startsWith("http")) return false;
  try {
    return new URL(API_BASE).origin !== window.location.origin;
  } catch {
    return false;
  }
}

/** HTTP client base — DRY for all API services */
export abstract class BaseApiService {
  constructor(protected readonly baseUrl = API_BASE) {}

  private readonly crossOrigin = apiIsCrossOrigin();

  private refreshing: Promise<string | null> | null = null;

  protected async request<T>(
    path: string,
    options: RequestInit = {},
    retry = true,
  ): Promise<T> {
    if (isDemoMode()) {
      const method = (options.method ?? "GET").toUpperCase();
      const body =
        typeof options.body === "string"
          ? options.body
          : options.body != null
            ? String(options.body)
            : undefined;
      return handleDemoApi<T>(method, path, body);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    const token = localStorage.getItem("iqc_token");
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
      credentials: this.crossOrigin ? "omit" : "include",
    });

    if (res.status === 401 && retry && !path.startsWith("/auth/login") && !path.startsWith("/auth/refresh") && !path.startsWith("/auth/logout")) {
      const next = await this.tryRefresh();
      if (next) return this.request<T>(path, options, false);
    }

    let body: ApiResponse<T>;
    try {
      body = (await res.json()) as ApiResponse<T>;
    } catch {
      throw new Error(res.ok ? "Invalid response" : `HTTP ${res.status}`);
    }
    if (!res.ok || !body.success) {
      throw new Error(body.error ?? body.message ?? "Request failed");
    }
    return body.data as T;
  }

  private async tryRefresh(): Promise<string | null> {
    if (!this.refreshing) {
      this.refreshing = (async () => {
        try {
          const res = await fetch(`${this.baseUrl}/auth/refresh`, {
            method: "POST",
            credentials: this.crossOrigin ? "omit" : "include",
            headers: { "Content-Type": "application/json" },
          });
          const body = (await res.json()) as ApiResponse<{ token: string; user: unknown }>;
          if (!res.ok || !body.success || !body.data?.token) return null;
          localStorage.setItem("iqc_token", body.data.token);
          if (body.data.user) localStorage.setItem("iqc_user", JSON.stringify(body.data.user));
          return body.data.token;
        } catch {
          return null;
        } finally {
          this.refreshing = null;
        }
      })();
    }
    return this.refreshing;
  }

  protected get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  protected post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected put<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>(path, { method: "PUT", body: JSON.stringify(data) });
  }

  protected patch<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * GET list endpoint — hỗ trợ cả PagedResult và mảng legacy.
   * Mọi *ApiService nên dùng method này thay vì tự build query string.
   */
  protected async listPaged<T>(path: string, query: EntityListQuery = {}): Promise<PagedResult<T>> {
    const qs = buildListQueryString(query);
    const raw = await this.get<PagedResult<T> | T[]>(`${path}?${qs}`);
    if (Array.isArray(raw)) return slicePagedArray(raw, query);
    return raw;
  }

  /** Giống listPaged nhưng trả trang rỗng khi lỗi mạng / API (cho màn workflow). */
  protected async listPagedSafe<T>(path: string, query: EntityListQuery = {}): Promise<PagedResult<T>> {
    try {
      return await this.listPaged<T>(path, query);
    } catch {
      return { items: [], total: 0, page: query.page ?? 1, pageSize: query.pageSize ?? 20 };
    }
  }
}
