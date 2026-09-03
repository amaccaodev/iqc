import { useEffect, useState } from "react";
import type { Role } from "@shared/types";
import { LIST_UI_PAGE_SIZE } from "@shared/constants/pagination";
import { AdminView, type User } from "../../_AppLegacy";
import { userApi } from "../../services/api/UserApiService";
import { usePagedList, useStableFetch } from "../../hooks/usePagedList";

export default function AdminAccountsPage() {
  const [filterRole, setFilterRole] = useState<string>("all");
  const fetchUsers = useStableFetch((query) => userApi.list(query));
  const {
    items,
    total,
    page,
    pageSize,
    setPage,
    setPageSize,
    q,
    setQ,
    refresh,
  } = usePagedList({
    fetchPage: fetchUsers,
    filters: {
      activeOnly: false,
      roles: filterRole === "all" ? undefined : [filterRole as Role],
    },
    pageSize: LIST_UI_PAGE_SIZE,
  });

  const [legacyUsers, setLegacyUsers] = useState<User[]>([]);

  useEffect(() => {
    setLegacyUsers(items.map((u) => ({ ...u, password: "******" })));
  }, [items]);

  const handleSetUsers = (next: User[]) => {
    setLegacyUsers(next);
    void refresh();
  };

  return (
    <AdminView
      users={legacyUsers}
      setUsers={handleSetUsers}
      screen="accounts"
      listQuery={{
        search: q,
        onSearch: setQ,
        filterRole,
        onFilterRole: setFilterRole,
        page,
        pageSize,
        total,
        onPage: setPage,
        onPageSize: setPageSize,
      }}
    />
  );
}
