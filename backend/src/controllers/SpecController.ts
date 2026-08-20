import type { Request, Response } from "express";
import { BaseController } from "../core/BaseController.js";
import { specValidationService } from "../services/SpecValidationService.js";

export class SpecController extends BaseController {
  validate = (req: Request, res: Response): void => {
    void this.handle(res, () => specValidationService.validate(req.body));
  };
}

export const specController = new SpecController();
