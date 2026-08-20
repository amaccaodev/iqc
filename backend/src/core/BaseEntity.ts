import type { IEntity } from "../../../shared/src/types/index.js";

/** Base entity — OOP foundation for domain models */
export abstract class BaseEntity implements IEntity {
  constructor(public readonly id: string) {}

  equals(other: BaseEntity): boolean {
    return this.id === other.id;
  }
}
