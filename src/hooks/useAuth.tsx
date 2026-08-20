import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import type { LoginResponse, UserPublic } from "@shared/types";
import { roleHomePath } from "@shared/constants/labels";
import { authApi } from "../services/api/AuthApiService";

interface AuthContextValue {
  user: UserPublic | null;
  login: (employeeId: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  loading: boolean;
  bootstrapping: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(() => authApi.getStoredUser());
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!authApi.getStoredUser() || !localStorage.getItem("iqc_token")) {
          const refreshed = await authApi.refresh();
          if (!cancelled && refreshed.user) setUser(refreshed.user);
        } else {
          try {
            const refreshed = await authApi.refresh();
            if (!cancelled && refreshed.user) setUser(refreshed.user);
          } catch {
            /* keep current session until logout */
          }
        }
      } catch {
        /* no cookie session */
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (employeeId: string, password: string) => {
    setLoading(true);
    try {
      const result = await authApi.login({ employeeId, password });
      if (result.status === "pending_device") {
        return result;
      }
      setUser(result.user);
      navigate(roleHomePath(result.user.role));
      return result;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    navigate("/login");
  }, [navigate]);

  const value = useMemo(
    () => ({ user, login, logout, loading, bootstrapping }),
    [user, login, logout, loading, bootstrapping],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
