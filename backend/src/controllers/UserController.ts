import type { Request, Response } from "express";
import { BaseController } from "../core/BaseController.js";
import type { UserService } from "../services/UserService.js";

export class UserController extends BaseController {
  constructor(private readonly userService: UserService) {
    super();
  }

  list = (_req: Request, res: Response): void => {
    void this.handle(res, () => this.userService.listPublic());
  };

  create = (req: Request, res: Response): void => {
    void this.handle(res, () => this.userService.createUser(req.body), 201);
  };

  update = (req: Request, res: Response): void => {
    void this.handle(res, () => this.userService.updateUser(this.param(req.params.id), req.body));
  };

  toggle = (req: Request, res: Response): void => {
    void this.handle(res, () => this.userService.toggleActive(this.param(req.params.id)));
  };
}
