import type { DeviceKind, DeviceLoginRequest, LoginRequest, LoginResponse, User, UserPublic } from "../../../shared/src/types/index.js";
import { resolveUserTeamId } from "../../../shared/src/constants/teams.js";
import { SEED_USERS } from "../data/seed.js";
import { supabaseUserRepository as userRepo } from "../repositories/SupabaseUserRepository.js";
import { workflowService } from "./WorkflowService.js";
import { REFRESH_TTL_MS, sessionStore } from "./SessionStore.js";

export const REFRESH_COOKIE = "iqc_refresh";

function normalizeUserTeam(user: User): User {
  return { ...user, teamId: resolveUserTeamId(user) || user.teamId };
}

export class SupabaseAuthService {
  private findSeedUser(employeeId: string): User | undefined {
    return SEED_USERS.find((u) => u.employeeId === employeeId && u.active);
  }

  async resolveUser(employeeId: string): Promise<User | undefined> {
    let user = await userRepo.findByEmployeeId(employeeId);
    if (!user) user = this.findSeedUser(employeeId);
    return user ? normalizeUserTeam(user) : undefined;
  }

  async login(
    credentials: LoginRequest,
    ctx: { ip: string; userAgent: string },
  ): Promise<LoginResponse & { refreshToken?: string; refreshMaxAgeMs?: number }> {
    const employeeId = credentials.employeeId.trim();
    const user = await this.resolveUser(employeeId);
    if (!user || user.password !== credentials.password || !user.active) {
      throw new Error("Mã nhân viên hoặc mật khẩu không đúng.");
    }
    const deviceId = (credentials.deviceId ?? "").trim() || `anon-${user.id}`;
    const deviceKind: DeviceKind = credentials.deviceKind === "mobile" ? "mobile" : "desktop";
    const userAgent = credentials.userAgent || ctx.userAgent || "";

    if (deviceKind === "mobile") {
      const blocked = await this.maybeRequireDeviceApproval(user, deviceId, ctx.ip, userAgent);
      if (blocked) return blocked;
    }

    const existing = sessionStore.activeSessions(user.id).find((s) => s.deviceId === deviceId);
    if (existing) sessionStore.revokeSession(existing.id);

    const isPrimary =
      deviceKind === "mobile" &&
      !sessionStore.activeSessions(user.id).some((s) => s.isPrimary && s.deviceKind === "mobile");

    const issued = sessionStore.createSession({
      userId: user.id,
      deviceId,
      deviceKind,
      ip: ctx.ip,
      userAgent,
      isPrimary,
    });
    const { password: _, ...publicUser } = user;
    return {
      user: publicUser,
      token: issued.accessToken,
      status: "ok",
      refreshToken: issued.refreshToken,
      refreshMaxAgeMs: REFRESH_TTL_MS,
    };
  }

  private async maybeRequireDeviceApproval(
    user: User,
    deviceId: string,
    ip: string,
    userAgent: string,
  ): Promise<(LoginResponse & { refreshToken?: string }) | null> {
    const primary = sessionStore.primarySession(user.id);
    const known = sessionStore.activeSessions(user.id).some((s) => s.deviceId === deviceId);
    const approvedReq = sessionStore.deviceRequests.find(
      (r) => r.userId === user.id && r.deviceId === deviceId && r.status === "approved",
    );
    if (!primary || known || approvedReq) return null;

    const request = sessionStore.createDeviceRequest({
      userId: user.id,
      employeeId: user.employeeId,
      userName: user.name,
      deviceId,
      ip,
      userAgent,
    });
    await this.notifyApprovers(user, request);
    const { password: _, ...publicUser } = user;
    return {
      user: publicUser,
      token: "",
      status: "pending_device",
      requestId: request.id,
      message: "Thiết bị mới cần phê duyệt từ máy đã đăng nhập hoặc Quản đốc / Giám đốc.",
    };
  }

  private async notifyApprovers(user: User, request: DeviceLoginRequest) {
    const primary = sessionStore.primarySession(user.id);
    const targets = new Set<string>();
    if (primary) targets.add(primary.userId);
    for (const u of SEED_USERS) {
      if (u.role === "director" || u.role === "supervisor") targets.add(u.id);
    }
    const body = `${user.name} (${user.employeeId}) đăng nhập máy mới · IP ${request.ip || "không rõ"}`;
    for (const userId of targets) {
      await workflowService.createNotification({
        userId,
        type: "device",
        refId: request.id,
        refType: "device_login",
        title: "Phê duyệt thiết bị mới",
        body,
      });
    }
  }

  refresh(refreshToken: string, ip: string) {
    const session = sessionStore.findRefresh(refreshToken);
    if (!session) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    session.ip = ip || session.ip;
    const rotated = sessionStore.rotateRefresh(session);
    const user = sessionStore.toPublicUser(session.userId);
    if (!user) throw new Error("Không tìm thấy tài khoản.");
    return {
      user,
      token: rotated.accessToken,
      refreshToken: rotated.refreshToken,
      refreshMaxAgeMs: REFRESH_TTL_MS,
    };
  }

  logout(refreshToken?: string, accessToken?: string) {
    if (refreshToken) {
      const session = sessionStore.findRefresh(refreshToken);
      if (session) sessionStore.revokeSession(session.id);
    }
    if (accessToken) {
      const access = sessionStore.getAccess(accessToken);
      if (access) sessionStore.revokeSession(access.sessionId);
    }
  }

  listPending(reviewerId: string) {
    const pending = sessionStore.pendingForReviewer(reviewerId);
    const owned = sessionStore.deviceRequests.filter(
      (r) => r.userId === reviewerId && r.status === "pending",
    );
    const map = new Map(pending.map((r) => [r.id, r]));
    for (const r of owned) map.set(r.id, r);
    return [...map.values()];
  }

  async reviewDevice(requestId: string, reviewerId: string, approved: boolean) {
    const request = sessionStore.getRequest(requestId);
    if (!request) throw new Error("Không tìm thấy yêu cầu thiết bị.");
    if (request.status !== "pending") throw new Error("Yêu cầu đã được xử lý.");
    if (!sessionStore.canReview(reviewerId, request)) {
      throw new Error("Bạn không có quyền phê duyệt thiết bị này.");
    }
    request.status = approved ? "approved" : "rejected";
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date().toISOString();

    await workflowService.createNotification({
      userId: request.userId,
      type: "device",
      refId: request.id,
      refType: "device_login",
      title: approved ? "Thiết bị đã được phê duyệt" : "Thiết bị bị từ chối",
      body: approved
        ? "Bạn có thể đăng nhập lại trên máy mới."
        : "Yêu cầu đăng nhập máy mới đã bị từ chối.",
    });
    return request;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!currentPassword || !newPassword) {
      throw new Error("Thiếu mật khẩu hiện tại hoặc mật khẩu mới.");
    }
    if (newPassword.length < 4) {
      throw new Error("Mật khẩu mới tối thiểu 4 ký tự.");
    }

    let user = await userRepo.findById(userId);
    const seed = SEED_USERS.find((u) => u.id === userId);
    if (!user) user = seed;

    if (!user) throw new Error("Không tìm thấy tài khoản.");
    if (user.password !== currentPassword) {
      throw new Error("Mật khẩu hiện tại không đúng.");
    }

    if (seed) seed.password = newPassword;
    try {
      await userRepo.updatePassword(userId, newPassword);
    } catch {
      /* seed-only / offline demo */
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();
