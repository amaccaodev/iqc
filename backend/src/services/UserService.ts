import type { User, UserPublic } from "../../../shared/src/types/index.js";
import { BaseService } from "../core/BaseService.js";
import type { UserRepository } from "../repositories/UserRepository.js";
import { AuthService } from "./AuthService.js";

export class UserService extends BaseService<User> {
  private authService: AuthService;

  constructor(private readonly userRepo: UserRepository) {
    super(userRepo);
    this.authService = new AuthService(userRepo);
  }

  listPublic(): UserPublic[] {
    return this.getAll().map((u) => this.authService.toPublic(u));
  }

  createUser(data: Omit<User, "id">): UserPublic {
    const existing = this.userRepo.findByEmployeeId(data.employeeId);
    if (existing) throw new Error("Mã nhân viên đã tồn tại");
    const user: User = { id: `u${Date.now()}`, ...data };
    this.create(user);
    return this.authService.toPublic(user);
  }

  updateUser(id: string, data: Partial<Omit<User, "id">>): UserPublic {
    const updated = this.update(id, data);
    if (!updated) throw new Error("Không tìm thấy người dùng");
    return this.authService.toPublic(updated);
  }

  toggleActive(id: string): UserPublic {
    const user = this.getById(id);
    if (!user) throw new Error("Không tìm thấy người dùng");
    const updated = this.update(id, { active: !user.active })!;
    return this.authService.toPublic(updated);
  }
}
