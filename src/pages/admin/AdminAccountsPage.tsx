import { useEffect, useState } from "react";
import { AdminView, type User } from "../../_AppLegacy";
import { useUsers } from "../../hooks/useUsers";

export default function AdminAccountsPage() {
  const { users, setUsers, refreshUsers } = useUsers();
  const [legacyUsers, setLegacyUsers] = useState<User[]>([]);

  useEffect(() => {
    setLegacyUsers(users.map((u) => ({ ...u, password: "******" })));
  }, [users]);

  const handleSetUsers = (next: User[]) => {
    setLegacyUsers(next);
    setUsers(next.map(({ password: _, ...pub }) => pub));
  };

  useEffect(() => {
    void refreshUsers();
  }, [refreshUsers]);

  return <AdminView users={legacyUsers} setUsers={handleSetUsers} screen="accounts" />;
}
