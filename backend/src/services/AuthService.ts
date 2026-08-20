import type { LoginRequest, User, UserPublic } from "../../../shared/src/types/index.js";
import { BaseService } from "../core/BaseService.js";
import type { UserRepository } from "../repositories/UserRepository.js";

export class AuthService extends BaseService<User> {
  constructor(private readonly userRepo: UserRepository) {
    super(userRepo);
  }

  login(credentials: LoginRequest): { user: UserPublic; token: string } {
    const user = this.userRepo.findByEmployeeId(credentials.employeeId.trim());
    if (!user || user.password !== credentials.password || !user.active) {
      throw new Error("Mã nhân viên hoặc mật khẩu không đúng.");
    }
    const { password: _, ...publicUser } = user;
    return { user: publicUser, token: `token-${user.id}` };
  }

  toPublic(user: User): UserPublic {
    const { password: _, ...publicUser } = user;
    return publicUser;
  }
}
