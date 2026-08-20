import type { IEntity } from "../../../shared/src/types/index.js";
import type { IRepository } from "./IRepository.js";

/** Service base — Single Responsibility for business logic delegation */
export abstract class BaseService<T extends IEntity> {
  constructor(protected readonly repository: IRepository<T>) {}

  getAll(): T[] {
    return this.repository.findAll();
  }

  getById(id: string): T | undefined {
    return this.repository.findById(id);
  }

  create(entity: T): T {
    return this.repository.create(entity);
  }

  update(id: string, partial: Partial<T>): T | undefined {
    return this.repository.update(id, partial);
  }

  remove(id: string): boolean {
    return this.repository.delete(id);
  }
}
