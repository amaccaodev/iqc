import type { EntityListQuery, PagedResult, User, UserPublic } from "../../../shared/src/types/index.js";
import { canonicalTeamId, inferTeamIdFromDepartment } from "../../../shared/src/constants/teams.js";
import { paginateInMemory } from "../../../shared/src/utils/pagedList.js";
import { normalizePageQuery } from "../../../shared/src/utils/listQuery.js";
import { supabaseUserRepository } from "../repositories/SupabaseUserRepository.js";
import { SEED_USERS } from "../data/seed.js";

function toPublic(users: User[]): UserPublic[] {
  return users.map(({ password: _, ...u }) => u);
}

function enrichTeamId(u: User): User {
  const teamId =
    canonicalTeamId(u.teamId) || inferTeamIdFromDepartment(u.department) || u.teamId;
  return teamId === u.teamId ? u : { ...u, teamId };
}

/**
 * Supabase có thể thiếu CN / thiếu group_members → merge seed để demo & tổ trưởng
 * vẫn chọn được công nhân theo tổ.
 */
function mergeWithSeed(dbUsers: User[]): User[] {
  const byEmp = new Map<string, User>();
  for (const u of dbUsers.map(enrichTeamId)) byEmp.set(u.employeeId, u);
  for (const seed of SEED_USERS) {
    const existing = byEmp.get(seed.employeeId);
    if (!existing) {
      byEmp.set(seed.employeeId, enrichTeamId(seed));
      continue;
    }
    if (!existing.teamId && seed.teamId) {
      byEmp.set(seed.employeeId, enrichTeamId({ ...existing, teamId: seed.teamId }));
    }
  }
  return [...byEmp.values()];
}

function matchUser(u: User, q: string): boolean {
  return (
    u.employeeId.toLowerCase().includes(q) ||
    u.name.toLowerCase().includes(q) ||
    u.department.toLowerCase().includes(q) ||
    u.role.toLowerCase().includes(q)
  );
}

/**
 * UserQueryService — đọc danh sách NV (full list hoặc paged + search).
 * Supabase first → merge seed. Route chỉ delegate, không chứa business logic.
 */
export class UserQueryService {
  async listAllPublic(): Promise<UserPublic[]> {
    const users = await supabaseUserRepository.findAll();
    const list = users.length ? mergeWithSeed(users) : SEED_USERS.map(enrichTeamId);
    return toPublic(list);
  }

  async listPaged(query: EntityListQuery): Promise<PagedResult<UserPublic>> {
    const parsed = normalizePageQuery(query);

    try {
      const data = await supabaseUserRepository.searchPaged({
        q: parsed.q,
        page: parsed.page,
        pageSize: parsed.pageSize,
        roles: parsed.roles,
        activeOnly: parsed.activeOnly,
      });
      if (data.total > 0 || data.items.length > 0) {
        // Paged từ DB: vẫn enrich teamId; không merge full seed vào page (tránh lệch total)
        return { ...data, items: toPublic(data.items.map(enrichTeamId)) };
      }
    } catch {
      /* seed fallback */
    }

    let seed = mergeWithSeed([]).filter((u) => (parsed.activeOnly === false ? true : u.active));
    if (parsed.roles?.length) seed = seed.filter((u) => parsed.roles!.includes(u.role));

    const paged = paginateInMemory(seed, {
      q: parsed.q,
      page: parsed.page,
      pageSize: parsed.pageSize,
      match: matchUser,
    });
    return { ...paged, items: toPublic(paged.items) };
  }
}

export const userQueryService = new UserQueryService();
