import type { User } from "../../../shared/src/types/index.js";
import { BaseRepository } from "../core/BaseRepository.js";
import { SEED_USERS } from "../data/seed.js";

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(SEED_USERS);
  }

  findByEmployeeId(employeeId: string): User | undefined {
    return this.findAll().find((u) => u.employeeId === employeeId);
  }
}

export const userRepository = new UserRepository();
