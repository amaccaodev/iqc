import { Router } from "express";
import type { Response } from "express";
import { clearCookie, clientIp } from "../lib/cookies.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { REFRESH_COOKIE, supabaseAuthService } from "../services/SupabaseAuthService.js";
import { REFRESH_TTL_MS } from "../services/SessionStore.js";
import { bearer, setRefreshCookie, type CookieReq } from "./routeHelpers.js";

export const authRoutes = Router();

authRoutes.post("/auth/login", async (req: CookieReq, res: Response) => {
  try {
    const result = await supabaseAuthService.login(req.body, {
      ip: clientIp(req),
      userAgent: String(req.headers["user-agent"] ?? ""),
    });
    if (result.refreshToken) {
      setRefreshCookie(res, result.refreshToken, result.refreshMaxAgeMs ?? REFRESH_TTL_MS);
    }
    const { refreshToken: _, refreshMaxAgeMs: __, ...data } = result;
    res.json({ success: true, data });
  } catch (err) {
    res.status(401).json({ success: false, error: (err as Error).message });
  }
});

authRoutes.post("/auth/refresh", async (req: CookieReq, res: Response) => {
  try {
    const refresh = req.cookies?.[REFRESH_COOKIE] ?? "";
    if (!refresh) {
      res.status(401).json({ success: false, error: "Không có refresh token." });
      return;
    }
    const result = await supabaseAuthService.refresh(refresh, clientIp(req));
    setRefreshCookie(res, result.refreshToken, result.refreshMaxAgeMs);
    res.json({
      success: true,
      data: { user: result.user, token: result.token, status: "ok" as const },
    });
  } catch (err) {
    clearCookie(res, REFRESH_COOKIE);
    res.status(401).json({ success: false, error: (err as Error).message });
  }
});

authRoutes.post("/auth/logout", async (req: CookieReq, res: Response) => {
  try {
    supabaseAuthService.logout(req.cookies?.[REFRESH_COOKIE], bearer(req));
    clearCookie(res, REFRESH_COOKIE);
    res.json({ success: true });
  } catch (err) {
    clearCookie(res, REFRESH_COOKIE);
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

authRoutes.get("/auth/me", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { sessionStore } = await import("../services/SessionStore.js");
    const user = sessionStore.toPublicUser(req.auth!.userId);
    if (!user) {
      res.status(401).json({ success: false, error: "Không tìm thấy tài khoản." });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(401).json({ success: false, error: (err as Error).message });
  }
});

authRoutes.get("/auth/device-requests", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const data = supabaseAuthService.listPending(req.auth!.userId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

authRoutes.post("/auth/device-requests/:id/review", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const approved = Boolean(req.body?.approved);
    const data = await supabaseAuthService.reviewDevice(String(req.params.id), req.auth!.userId, approved);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

authRoutes.post("/auth/change-password", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const currentPassword = String(req.body?.currentPassword ?? "");
    const newPassword = String(req.body?.newPassword ?? "");
    await supabaseAuthService.changePassword(req.auth!.userId, currentPassword, newPassword);
    res.json({ success: true, data: { ok: true } });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});
