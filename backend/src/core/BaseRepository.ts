import type { IEntity } from "../../../shared/src/types/index.js";
import type { IRepository } from "./IRepository.js";

/** In-memory repository base — Open/Closed principle */
export abstract class BaseRepository<T extends IEntity> implements IRepository<T> {
  protected items: T[] = [];

  constructor(initial: T[] = []) {
    this.items = [...initial];
  }

  findAll(): T[] {
    return [...this.items];
  }

  findById(id: string): T | undefined {
    return this.items.find((item) => item.id === id);
  }

  create(entity: T): T {
    this.items.push(entity);
    return entity;
  }

  update(id: string, partial: Partial<T>): T | undefined {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return undefined;
    this.items[index] = { ...this.items[index], ...partial };
    return this.items[index];
  }

  delete(id: string): boolean {
    const before = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    return this.items.length < before;
  }

  protected setAll(items: T[]): void {
    this.items = [...items];
  }
}
