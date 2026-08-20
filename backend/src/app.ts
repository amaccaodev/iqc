import express from "express";
import cors from "cors";
import type { Request, Response, NextFunction } from "express";
import { apiRouter } from "./routes/api.js";
import { parseCookies } from "./lib/cookies.js";

export function createApp() {
  const app = express();
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(express.json());
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
