import express from "express";
import cors from "cors";
import type { Request, Response, NextFunction } from "express";
import { apiRouter } from "./routes/api.js";
import { parseCookies } from "./lib/cookies.js";
import { getCorsOptions } from "./lib/corsConfig.js";

export function createApp() {
  const app = express();
  const corsOptions = getCorsOptions();
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(express.json({ limit: "8mb" }));
  app.use(express.urlencoded({ extended: true, limit: "8mb" }));
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as Request & { cookies: Record<string, string> }).cookies = parseCookies(req);
    next();
  });
  app.use("/api", apiRouter);
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  return app;
}
