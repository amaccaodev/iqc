import type { User, UserPublic } from "@shared/types";
import { BaseApiService } from "../../core/BaseApiService";
import type { IUserService } from "../../interfaces/services";

export class UserApiService extends BaseApiService implements IUserService {
  getAll(): Promise<UserPublic[]> {
    return this.get<UserPublic[]>("/users");
  }

  create(user: Omit<User, "id">): Promise<UserPublic> {
    return this.post<UserPublic>("/users", user);
  }

  update(id: string, user: Partial<User>): Promise<UserPublic> {
    return this.put<UserPublic>(`/users/${id}`, user);
  }

  toggle(id: string): Promise<UserPublic> {
    return this.patch<UserPublic>(`/users/${id}/toggle`);
  }
}

export const userApi = new UserApiService();
