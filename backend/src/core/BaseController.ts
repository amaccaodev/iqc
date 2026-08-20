import type { Request, Response } from "express";
import type { ApiResponse } from "../../../shared/src/types/index.js";

/** Controller base — consistent API responses */
export abstract class BaseController {
  protected param(value: string | string[]): string {
    return Array.isArray(value) ? value[0] : value;
  }

  protected ok<T>(res: Response, data: T, message?: string): void {
    const body: ApiResponse<T> = { success: true, data, message };
    res.json(body);
  }

  protected created<T>(res: Response, data: T, message?: string): void {
    const body: ApiResponse<T> = { success: true, data, message };
    res.status(201).json(body);
  }

  protected fail(res: Response, status: number, error: string): void {
    const body: ApiResponse<never> = { success: false, error };
    res.status(status).json(body);
  }

  protected async handle(
    res: Response,
    action: () => unknown | Promise<unknown>,
    statusOnSuccess = 200,
  ): Promise<void> {
    try {
      const result = await action();
      if (statusOnSuccess === 201) {
        this.created(res, result);
      } else {
        this.ok(res, result);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error";
      this.fail(res, 400, message);
    }
  }
}
