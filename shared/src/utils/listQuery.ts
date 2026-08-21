import type { EntityListQuery, ProcessStage, Role } from "../types/index.js";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants/pagination.js";

/** Chuẩn hóa page/pageSize trước khi query DB hoặc slice in-memory */
export function normalizePageQuery(
  query: Partial<EntityListQuery> = {},
): Required<Pick<EntityListQuery, "page" | "pageSize">> & EntityListQuery {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(query.pageSize) || DEFAULT_PAGE_SIZE));
  return { ...query, page, pageSize };
}

/** Build query string cho GET list endpoints */
export function buildListQueryString(query: EntityListQuery = {}): string {
  const n = normalizePageQuery(query);
  const params = new URLSearchParams();
  if (n.q) params.set("q", n.q);
  params.set("page", String(n.page));
  params.set("pageSize", String(n.pageSize));
  if (n.roles?.length) params.set("roles", n.roles.join(","));
  if (n.activeOnly === false) params.set("activeOnly", "false");
  if (n.stage && n.stage !== "all") params.set("stage", n.stage);
  if (n.status) params.set("status", n.status);
  if (n.orderId) params.set("orderId", n.orderId);
  if (n.bomId) params.set("bomId", n.bomId);
  if (n.unreadOnly) params.set("unreadOnly", "true");
  return params.toString();
}

/** Express/Fetch query → EntityListQuery */
export function parseListQueryFromRequest(
  q: Record<string, string | undefined>,
): EntityListQuery {
  return {
    q: q.q,
    page: q.page ? Number(q.page) : 1,
    pageSize: q.pageSize ? Number(q.pageSize) : DEFAULT_PAGE_SIZE,
    roles: q.roles ? (q.roles.split(",").filter(Boolean) as Role[]) : undefined,
    activeOnly: q.activeOnly !== "false",
    stage: q.stage as ProcessStage | "all" | undefined,
    status: q.status,
    orderId: q.orderId,
    bomId: q.bomId,
    unreadOnly: q.unreadOnly === "true",
  };
}

/** Client gọi list paged khi có bất kỳ tham số lọc/phân trang nào */
export function wantsPagedListQuery(
  q: Record<string, string | undefined>,
  extraKeys: string[] = [],
): boolean {
  return !!(q.page || q.pageSize || q.q || extraKeys.some((k) => q[k]));
}
