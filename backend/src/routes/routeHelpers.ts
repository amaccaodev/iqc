import type { Request, Response } from "express";
import { setCookie } from "../lib/cookies.js";
import { REFRESH_COOKIE } from "../services/SupabaseAuthService.js";
import { REFRESH_TTL_MS } from "../services/SessionStore.js";

export type CookieReq = Request & { cookies?: Record<string, string> };

export function setRefreshCookie(res: Response, token: string, maxAgeMs = REFRESH_TTL_MS) {
  const crossSite = process.env.NODE_ENV === "production";
  setCookie(res, REFRESH_COOKIE, token, {
    maxAgeMs,
    httpOnly: true,
    path: "/",
    sameSite: crossSite ? "None" : "Lax",
    secure: crossSite,
  });
}

export function bearer(req: Request) {
  const h = req.headers.authorization ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}
