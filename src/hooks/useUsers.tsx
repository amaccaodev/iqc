import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UserPublic } from "@shared/types";
import { userApi } from "../services/api/UserApiService";

interface UsersContextValue {
  users: UserPublic[];
  setUsers: (users: UserPublic[]) => void;
  refreshUsers: () => Promise<void>;
}

const UsersContext = createContext<UsersContextValue | null>(null);

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserPublic[]>([]);

  const refreshUsers = useCallback(async () => {
    try {
      const data = await userApi.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    void refreshUsers();
  }, [refreshUsers]);

  const value = useMemo(
    () => ({ users, setUsers, refreshUsers }),
    [users, setUsers, refreshUsers],
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers(): UsersContextValue {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsers must be used within UsersProvider");
  return ctx;
}

/** Adapter: legacy views expect User with password — map from public users + current user */
export function useLegacyUser(current: UserPublic): UserPublic & { password: string } {
  const { users } = useUsers();
  const full = users.find((u) => u.id === current.id);
  return { ...(full ?? current), password: "" };
}
