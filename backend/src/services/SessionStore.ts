import { createHash, randomBytes } from "node:crypto";
import type { DeviceKind, DeviceLoginRequest, UserPublic } from "../../../shared/src/types/index.js";
import { SEED_USERS } from "../data/seed.js";

export const ACCESS_TTL_MS = 15 * 60 * 1000;
export const REFRESH_TTL_MS = 180 * 24 * 60 * 60 * 1000;

export interface AuthSession {
  id: string;
  userId: string;
  refreshHash: string;
  deviceId: string;
  deviceKind: DeviceKind;
  ip: string;
  userAgent: string;
  isPrimary: boolean;
  createdAt: string;
  lastSeenAt: string;
  revokedAt?: string;
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${randomBytes(6).toString("hex")}`;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

class SessionStore {
  sessions: AuthSession[] = [];
  deviceRequests: DeviceLoginRequest[] = [];
  accessTokens = new Map<string, { userId: string; sessionId: string; exp: number }>();

  hash(token: string) {
    return hashToken(token);
  }

  issueAccess(userId: string, sessionId: string): string {
    const token = `at-${randomBytes(24).toString("hex")}`;
    this.accessTokens.set(token, { userId, sessionId, exp: Date.now() + ACCESS_TTL_MS });
    return token;
  }

  issueRefresh(): { token: string; hash: string } {
    const token = `rt-${randomBytes(32).toString("hex")}`;
    return { token, hash: hashToken(token) };
  }

  getAccess(token: string) {
    const row = this.accessTokens.get(token);
    if (!row) return null;
    if (row.exp < Date.now()) {
      this.accessTokens.delete(token);
      return null;
    }
    const session = this.sessions.find((s) => s.id === row.sessionId && !s.revokedAt);
    if (!session) {
      this.accessTokens.delete(token);
      return null;
    }
    return { ...row, session };
  }

  findRefresh(token: string): AuthSession | null {
    const h = hashToken(token);
    const row = this.sessions.find((s) => s.refreshHash === h && !s.revokedAt);
    return row ?? null;
  }

  revokeSession(sessionId: string) {
    const row = this.sessions.find((s) => s.id === sessionId);
    if (row) row.revokedAt = new Date().toISOString();
    for (const [token, meta] of this.accessTokens) {
      if (meta.sessionId === sessionId) this.accessTokens.delete(token);
    }
  }

  createSession(input: {
    userId: string;
    deviceId: string;
    deviceKind: DeviceKind;
    ip: string;
    userAgent: string;
    isPrimary: boolean;
  }): { session: AuthSession; refreshToken: string; accessToken: string } {
    const refresh = this.issueRefresh();
    const session: AuthSession = {
      id: uid("sess"),
      userId: input.userId,
      refreshHash: refresh.hash,
      deviceId: input.deviceId,
      deviceKind: input.deviceKind,
      ip: input.ip,
      userAgent: input.userAgent,
      isPrimary: input.isPrimary,
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };
    this.sessions.unshift(session);
    const accessToken = this.issueAccess(input.userId, session.id);
    return { session, refreshToken: refresh.token, accessToken };
  }

  rotateRefresh(session: AuthSession): { refreshToken: string; accessToken: string } {
    const refresh = this.issueRefresh();
    session.refreshHash = refresh.hash;
    session.lastSeenAt = new Date().toISOString();
    const accessToken = this.issueAccess(session.userId, session.id);
    return { refreshToken: refresh.token, accessToken };
  }

  activeSessions(userId: string) {
    return this.sessions.filter((s) => s.userId === userId && !s.revokedAt);
  }

  primarySession(userId: string) {
    return this.activeSessions(userId).find((s) => s.isPrimary && s.deviceKind === "mobile")
      ?? this.activeSessions(userId).find((s) => s.isPrimary);
  }

  findPending(userId: string, deviceId: string) {
    return this.deviceRequests.find(
      (r) => r.userId === userId && r.deviceId === deviceId && r.status === "pending",
    );
  }

  createDeviceRequest(input: Omit<DeviceLoginRequest, "id" | "status" | "requestedAt">): DeviceLoginRequest {
    const existing = this.findPending(input.userId, input.deviceId);
    if (existing) {
      existing.ip = input.ip;
      existing.userAgent = input.userAgent;
      existing.requestedAt = new Date().toISOString();
      return existing;
    }
    const row: DeviceLoginRequest = {
      ...input,
      id: uid("dreq"),
      status: "pending",
      requestedAt: new Date().toISOString(),
    };
    this.deviceRequests.unshift(row);
    return row;
  }

  getRequest(id: string) {
    return this.deviceRequests.find((r) => r.id === id) ?? null;
  }

  pendingForReviewer(reviewerId: string): DeviceLoginRequest[] {
    const reviewer = SEED_USERS.find((u) => u.id === reviewerId);
    if (!reviewer) return [];
    return this.deviceRequests.filter((r) => {
      if (r.status !== "pending") return false;
      if (reviewer.role === "director" || reviewer.role === "supervisor" || reviewer.role === "admin") return true;
      const primary = this.primarySession(r.userId);
      return Boolean(primary && primary.userId === reviewerId);
    });
  }

  canReview(reviewerId: string, request: DeviceLoginRequest): boolean {
    const reviewer = SEED_USERS.find((u) => u.id === reviewerId);
    if (!reviewer) return false;
    if (reviewer.role === "director" || reviewer.role === "supervisor" || reviewer.role === "admin") return true;
    return request.userId === reviewerId;
  }

  toPublicUser(userId: string): UserPublic | null {
    const u = SEED_USERS.find((x) => x.id === userId);
    if (!u) return null;
    const { password: _, ...pub } = u;
    return pub;
  }
}

export const sessionStore = new SessionStore();
