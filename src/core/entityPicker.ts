import type { EntityListQuery, PagedResult } from "@shared/types";
import { PICKER_PAGE_SIZE } from "@shared/constants/pagination";
import type { SearchPickerItem } from "../components/ui/SearchPicker";

/**
 * Factory tạo `onSearch` cho SearchPicker — một pattern cho mọi entity.
 *
 * @example
 * const searchUsers = createEntityPickerSearch(
 *   (q) => userApi.list({ ...q, page: 1, pageSize: PICKER_PAGE_SIZE, roles: PAYROLL_ROLES }),
 *   (u) => ({ id: u.id, label: `${u.employeeId} — ${u.name}` }),
 * );
 */
export function createEntityPickerSearch<T>(
  listFn: (query: EntityListQuery) => Promise<PagedResult<T>>,
  mapItem: (item: T) => SearchPickerItem,
  extraQuery?: Omit<EntityListQuery, "q" | "page" | "pageSize">,
): (q: string) => Promise<SearchPickerItem[]> {
  return async (q: string) => {
    const data = await listFn({
      ...extraQuery,
      q,
      page: 1,
      pageSize: PICKER_PAGE_SIZE,
    });
    return data.items.map(mapItem);
  };
}
