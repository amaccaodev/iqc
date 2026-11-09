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
  // Log response data for all API requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      console.log(`[API Response] ${req.method} ${req.originalUrl}:`, body);
      return originalJson(body);
    };
    next();
  });
  app.use("/api", apiRouter);
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  return app;
}
