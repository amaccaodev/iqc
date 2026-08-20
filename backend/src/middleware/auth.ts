import type { NextFunction, Request, Response } from "express";
import { sessionStore } from "../services/SessionStore.js";

export interface AuthedRequest extends Request {
  auth?: { userId: string; sessionId: string };
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    res.status(401).json({ success: false, error: "Chưa đăng nhập." });
    return;
  }
  const access = sessionStore.getAccess(token);
  if (!access) {
    res.status(401).json({ success: false, error: "Phiên hết hạn." });
    return;
  }
  access.session.lastSeenAt = new Date().toISOString();
  req.auth = { userId: access.userId, sessionId: access.sessionId };
  next();
}
