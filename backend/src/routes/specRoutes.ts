import { Router } from "express";
import { specController } from "../controllers/SpecController.js";

export const specRoutes = Router();

specRoutes.post("/spec/validate", specController.validate);
