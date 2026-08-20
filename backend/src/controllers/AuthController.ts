import type { Request, Response } from "express";
import { BaseController } from "../core/BaseController.js";
import type { AuthService } from "../services/AuthService.js";

export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

  login = (req: Request, res: Response): void => {
    void this.handle(res, () => this.authService.login(req.body));
  };
}
