import type { ReactNode } from "react";

/** Base page contract — Interface Segregation (SOLID) */
export interface IPageProps {
  children?: ReactNode;
}

/** Abstract page base — OOP inheritance for role pages */
export abstract class BasePage {
  abstract readonly title: string;
  abstract readonly path: string;

  getBreadcrumb(): string {
    return this.title;
  }
}
