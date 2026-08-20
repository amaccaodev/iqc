import type { IEntity } from "../../../shared/src/types/index.js";

/** Repository contract — Dependency Inversion (SOLID) */
export interface IRepository<T extends IEntity> {
  findAll(): T[];
  findById(id: string): T | undefined;
  create(entity: T): T;
  update(id: string, partial: Partial<T>): T | undefined;
  delete(id: string): boolean;
}
