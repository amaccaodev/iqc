import { Router } from "express";
import type { Request, Response } from "express";
import { TEAMS } from "../../../shared/src/constants/teams.js";
import { specController } from "../controllers/SpecController.js";
import { REFRESH_COOKIE, supabaseAuthService } from "../services/SupabaseAuthService.js";
import { supabaseOrderService } from "../services/SupabaseOrderService.js";
import { supabaseUserRepository } from "../repositories/SupabaseUserRepository.js";
import { workflowService } from "../services/WorkflowService.js";
import { supabase } from "../lib/supabase.js";
import { clearCookie, clientIp, setCookie } from "../lib/cookies.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { REFRESH_TTL_MS } from "../services/SessionStore.js";

export const apiRouter = Router();

type CookieReq = Request & { cookies?: Record<string, string> };

function setRefreshCookie(res: Response, token: string, maxAgeMs = REFRESH_TTL_MS) {
  const crossSite = process.env.NODE_ENV === "production";
  setCookie(res, REFRESH_COOKIE, token, {
    maxAgeMs,
    httpOnly: true,
    path: "/",
    sameSite: crossSite ? "None" : "Lax",
    secure: crossSite,
  });
}

function bearer(req: Request) {
  const h = req.headers.authorization ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}

// ── Auth ──────────────────────────────────────────────────────────────────────
apiRouter.post("/auth/login", async (req: CookieReq, res: Response) => {
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

apiRouter.post("/auth/refresh", async (req: CookieReq, res: Response) => {
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

apiRouter.post("/auth/logout", async (req: CookieReq, res: Response) => {
  try {
    supabaseAuthService.logout(req.cookies?.[REFRESH_COOKIE], bearer(req));
    clearCookie(res, REFRESH_COOKIE);
    res.json({ success: true });
  } catch (err) {
    clearCookie(res, REFRESH_COOKIE);
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.get("/auth/me", requireAuth, async (req: AuthedRequest, res: Response) => {
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

apiRouter.get("/auth/device-requests", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const data = supabaseAuthService.listPending(req.auth!.userId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post("/auth/device-requests/:id/review", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const approved = Boolean(req.body?.approved);
    const data = await supabaseAuthService.reviewDevice(String(req.params.id), req.auth!.userId, approved);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

// ── Users (read from Supabase) ────────────────────────────────────────────────
apiRouter.get("/users", async (_req, res) => {
  try {
    const users = await supabaseUserRepository.findAll();
    const pub = users.map(({ password: _, ...u }) => u);
    res.json({ success: true, data: pub });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ── Teams ─────────────────────────────────────────────────────────────────────
apiRouter.get("/teams", (_req, res) => {
  res.json({ success: true, data: TEAMS });
});

// ── Orders ────────────────────────────────────────────────────────────────────
apiRouter.get("/orders", async (req, res) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    const paged = q.page || q.pageSize || q.from || q.to || q.q || q.status || q.dateField;
    if (paged) {
      const data = await supabaseOrderService.list({
        from: q.from,
        to: q.to,
        dateField: q.dateField === "deadline" ? "deadline" : "created_at",
        status: q.status,
        q: q.q,
        page: q.page ? Number(q.page) : 1,
        pageSize: q.pageSize ? Number(q.pageSize) : 20,
      });
      return res.json({ success: true, data });
    }
    const data = await supabaseOrderService.getAll();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.get("/orders/stats", async (_req, res) => {
  try {
    const data = await supabaseOrderService.getStats();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.get("/orders/:id", async (req, res) => {
  try {
    const order = await supabaseOrderService.getById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: "Không tìm thấy lệnh sản xuất" });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post("/orders", async (req, res) => {
  try {
    const data = await supabaseOrderService.createOrder(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post("/orders/:id/attachments", async (req, res) => {
  try {
    const data = await supabaseOrderService.addAttachment(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post("/orders/:id/boms", async (req, res) => {
  try {
    const data = await supabaseOrderService.addBOM(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post("/orders/:orderId/boms/:bomId/assign", async (req, res) => {
  try {
    const data = await supabaseOrderService.assignBOM(req.params.orderId, req.params.bomId, req.body.teamId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post("/orders/:orderId/boms/:bomId/assign-workers", async (req, res) => {
  try {
    const data = await supabaseOrderService.assignWorkers(
      req.params.orderId,
      req.params.bomId,
      req.body.workerNames ?? [],
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post("/orders/:id/approve", async (req, res) => {
  try {
    const data = await supabaseOrderService.approveOrder(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post("/orders/:id/reject", async (req, res) => {
  try {
    const data = await supabaseOrderService.rejectOrder(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post("/orders/:orderId/boms/:bomId/team-report", async (req, res) => {
  try {
    const data = await supabaseOrderService.submitTeamReport(req.params.orderId, req.params.bomId, req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post("/orders/:orderId/boms/:bomId/worker-row", async (req, res) => {
  try {
    const data = await supabaseOrderService.submitWorkerRow(req.params.orderId, req.params.bomId, req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post("/orders/:orderId/boms/:bomId/qc-report", async (req, res) => {
  try {
    const data = await supabaseOrderService.submitQCReport(
      req.params.orderId,
      req.params.bomId,
      req.body.report,
      req.body.passed,
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

// ── Roles (CRUD) ──────────────────────────────────────────────────────────────
apiRouter.get("/roles", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("roles").select("*").order("id");
    if (error) throw new Error(error.message);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post("/roles", async (req, res) => {
  try {
    const { id, label, description = "" } = req.body as { id: string; label: string; description?: string };
    const { data, error } = await supabase.from("roles").insert({ id, label, description }).select().single();
    if (error) throw new Error(error.message);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.patch("/roles/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from("roles").update(req.body).eq("id", req.params.id).select().single();
    if (error) throw new Error(error.message);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.delete("/roles/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("roles").delete().eq("id", req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

// ── Groups / Tổ (CRUD) ────────────────────────────────────────────────────────
apiRouter.get("/groups", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("groups").select("*, group_members(user_id, is_lead)").order("id");
    if (error) throw new Error(error.message);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post("/groups", async (req, res) => {
  try {
    const { id, name, lead = "", lead_short = "", description = "" } = req.body as {
      id: string; name: string; lead?: string; lead_short?: string; description?: string;
    };
    const { data, error } = await supabase.from("groups").insert({ id, name, lead, lead_short, description }).select().single();
    if (error) throw new Error(error.message);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.patch("/groups/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from("groups").update(req.body).eq("id", req.params.id).select().single();
    if (error) throw new Error(error.message);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.delete("/groups/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("groups").delete().eq("id", req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

// ── User CRUD ─────────────────────────────────────────────────────────────────
apiRouter.post("/users", async (req, res) => {
  try {
    const { employeeId, name, password, department = "", phone = "" } = req.body as {
      employeeId: string; name: string; password: string; department?: string; phone?: string;
    };
    const id = `u-${Date.now()}`;
    const { error } = await supabase.from("users").insert({ id, employee_id: employeeId, name, password, department, phone });
    if (error) throw new Error(error.message);
    res.status(201).json({ success: true, data: { id, employeeId, name, department, phone, active: true } });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.patch("/users/:id", async (req, res) => {
  try {
    const patch: Record<string, unknown> = {};
    if (req.body.name) patch.name = req.body.name;
    if (req.body.department) patch.department = req.body.department;
    if (req.body.phone) patch.phone = req.body.phone;
    if (req.body.password) patch.password = req.body.password;
    if (req.body.active !== undefined) patch.active = req.body.active;
    const { error } = await supabase.from("users").update(patch).eq("id", req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.patch("/users/:id/toggle", async (req, res) => {
  try {
    const { data: cur } = await supabase.from("users").select("active").eq("id", req.params.id).single();
    const { error } = await supabase.from("users").update({ active: !(cur as { active: boolean }).active }).eq("id", req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

// ── User ↔ Role management ────────────────────────────────────────────────────
apiRouter.post("/users/:userId/roles", async (req, res) => {
  try {
    await supabaseUserRepository.addRole(req.params.userId, req.body.roleId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.delete("/users/:userId/roles/:roleId", async (req, res) => {
  try {
    await supabaseUserRepository.removeRole(req.params.userId, req.params.roleId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

// ── User ↔ Group management ───────────────────────────────────────────────────
apiRouter.post("/users/:userId/groups", async (req, res) => {
  try {
    await supabaseUserRepository.addToGroup(req.params.userId, req.body.groupId, req.body.isLead ?? false);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.delete("/users/:userId/groups/:groupId", async (req, res) => {
  try {
    await supabaseUserRepository.removeFromGroup(req.params.userId, req.params.groupId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

// ── Machine Incidents (Sự cố máy) ────────────────────────────────────────────
apiRouter.get("/incidents", async (req, res) => {
  try {
    const data = await workflowService.getIncidents({
      orderId: req.query.orderId as string,
      bomId: req.query.bomId as string,
      status: req.query.status as string,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.get("/incidents/:id", async (req, res) => {
  try {
    const data = await workflowService.getIncidentById(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: "Không tìm thấy sự cố" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post("/incidents", async (req, res) => {
  try {
    const data = await workflowService.createIncident(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/** Cơ điện nhận sự cố */
apiRouter.post("/incidents/:id/assign", async (req, res) => {
  try {
    const { assignedTo, assignedName } = req.body as { assignedTo: string; assignedName: string };
    const data = await workflowService.assignIncident(req.params.id, assignedTo, assignedName);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/** Cơ điện hoàn thành xử lý */
apiRouter.post("/incidents/:id/resolve", async (req, res) => {
  try {
    const { resolvedBy, resolvedName, resolutionNote, downtimeMinutes } = req.body as {
      resolvedBy: string; resolvedName: string; resolutionNote: string; downtimeMinutes: number;
    };
    const data = await workflowService.resolveIncident(req.params.id, resolvedBy, resolvedName, resolutionNote, downtimeMinutes);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/** Quản đốc xác nhận đóng sự cố */
apiRouter.post("/incidents/:id/confirm", async (req, res) => {
  try {
    const data = await workflowService.confirmIncident(req.params.id, req.body.confirmedBy);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

// ── Overtime Requests (Đề xuất làm thêm) ─────────────────────────────────────
apiRouter.get("/overtime", async (req, res) => {
  try {
    const data = await workflowService.getOvertimeRequests({
      orderId: req.query.orderId as string,
      status: req.query.status as string,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post("/overtime", async (req, res) => {
  try {
    const data = await workflowService.createOvertimeRequest(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/** Quản đốc duyệt / từ chối OT */
apiRouter.post("/overtime/:id/review", async (req, res) => {
  try {
    const { approved, supervisorId, supervisorNote } = req.body as {
      approved: boolean; supervisorId: string; supervisorNote: string;
    };
    const data = await workflowService.reviewOvertimeBySupervisor(req.params.id, approved, supervisorId, supervisorNote);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/** Ghi giờ OT thực tế */
apiRouter.post("/overtime/:id/complete", async (req, res) => {
  try {
    const data = await workflowService.completeOvertime(req.params.id, req.body.actualHours);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

// ── QC Complaints (Khiếu nại chất lượng) ─────────────────────────────────────
apiRouter.get("/complaints", async (req, res) => {
  try {
    const data = await workflowService.getComplaints({
      orderId: req.query.orderId as string,
      bomId: req.query.bomId as string,
      status: req.query.status as string,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.get("/complaints/:id", async (req, res) => {
  try {
    const data = await workflowService.getComplaintById(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: "Không tìm thấy khiếu nại" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/** QC tạo khiếu nại */
apiRouter.post("/complaints", async (req, res) => {
  try {
    const data = await workflowService.createComplaint(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/** Tổ trưởng xác nhận nhận khiếu nại */
apiRouter.post("/complaints/:id/acknowledge", async (req, res) => {
  try {
    const { acknowledgedBy, acknowledgedName } = req.body as { acknowledgedBy: string; acknowledgedName: string };
    const data = await workflowService.acknowledgeComplaint(req.params.id, acknowledgedBy, acknowledgedName);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/** Tổ trưởng gửi phương án xử lý */
apiRouter.post("/complaints/:id/respond", async (req, res) => {
  try {
    const data = await workflowService.respondToComplaint(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/** QC kiểm tra lại sau xử lý */
apiRouter.post("/complaints/:id/recheck", async (req, res) => {
  try {
    const { qcRecheckBy, qcRecheckName, result, note } = req.body as {
      qcRecheckBy: string; qcRecheckName: string; result: "passed" | "failed_again"; note: string;
    };
    const data = await workflowService.recheckComplaint(req.params.id, qcRecheckBy, qcRecheckName, result, note);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/** Quản đốc đóng khiếu nại */
apiRouter.post("/complaints/:id/close", async (req, res) => {
  try {
    const data = await workflowService.closeComplaint(req.params.id, req.body.closedBy);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

// ── Production Stats (Thống kê sản lượng) ────────────────────────────────────
apiRouter.get("/stats", async (req, res) => {
  try {
    const data = await workflowService.getStats({
      orderId: req.query.orderId as string,
      bomId: req.query.bomId as string,
      statDate: req.query.statDate as string,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post("/stats", async (req, res) => {
  try {
    const data = await workflowService.upsertStat(req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.get("/stats/summary/:orderId", async (req, res) => {
  try {
    const data = await workflowService.getOrderSummary(req.params.orderId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ── Audit Logs (Nhật ký) ──────────────────────────────────────────────────────
apiRouter.get("/orders/:orderId/audit", async (req, res) => {
  try {
    const data = await workflowService.getAuditLogs(req.params.orderId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post("/orders/:orderId/audit", async (req, res) => {
  try {
    await workflowService.addAuditLog({ ...req.body, orderId: req.params.orderId });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

// ── Notifications (Thông báo) ─────────────────────────────────────────────────
apiRouter.get("/notifications/:userId", async (req, res) => {
  try {
    const unreadOnly = req.query.unread === "true";
    const data = await workflowService.getNotifications(req.params.userId, unreadOnly);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post("/notifications", async (req, res) => {
  try {
    await workflowService.createNotification(req.body);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.patch("/notifications/:id/read", async (req, res) => {
  try {
    await workflowService.markNotificationRead(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post("/notifications/:userId/read-all", async (req, res) => {
  try {
    await workflowService.markAllNotificationsRead(req.params.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

// ── Spec validation ───────────────────────────────────────────────────────────
apiRouter.post("/spec/validate", specController.validate);
