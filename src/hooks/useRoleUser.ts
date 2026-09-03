import type { UserPublic } from "@shared/types";
import { useAuth } from "./useAuth";

/** User đang đăng nhập — chỉ gọi trong route đã qua RoleLayout. */
export function useRoleUser(): UserPublic {
  const { user } = useAuth();
  if (!user) throw new Error("Not authenticated");
  return user;
}
