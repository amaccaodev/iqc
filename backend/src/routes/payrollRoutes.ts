import { Router } from "express";
import type { ShiftClose, ShiftUnlockRequest, User } from "../../../shared/src/types/index.js";
import { SEED_USERS } from "../data/seed.js";
import { supabase } from "../lib/supabase.js";
import { supabaseUserRepository } from "../repositories/SupabaseUserRepository.js";
import { catalogStore } from "../services/CatalogMemoryStore.js";
import { shiftSalaryStore } from "../services/ShiftSalaryStore.js";
import { workflowService } from "../services/WorkflowService.js";
import { notifyRoles } from "./notifyHelpers.js";
import { resolveActor } from "./routeHelpers.js";

export const payrollRoutes = Router();

payrollRoutes.get("/payroll/rates", (req, res) => {
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
  res.json({ success: true, data: shiftSalaryStore.listRates(userId) });
});

payrollRoutes.put("/payroll/rates", (req, res) => {
  try {
    const { userId, productId, rateVnd } = req.body as { userId: string; productId: string; rateVnd: number };
    if (!userId || !productId) throw new Error("Thiếu nhân viên hoặc sản phẩm");
    const data = shiftSalaryStore.upsertRate(userId, productId, Number(rateVnd) || 0);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

payrollRoutes.post("/payroll/import", async (req, res) => {
  try {
    const rows = (req.body as { rows?: Array<Record<string, unknown>> }).rows ?? [];
    if (!rows.length) throw new Error("File không có dòng dữ liệu");

    const users = await supabaseUserRepository.findAll();
    const userList = users.length ? users : SEED_USERS;
    const products = catalogStore.listProducts();

    let profileUpdates = 0;
    let rateUpdates = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const employeeId = String(r.employeeId ?? "").trim();
      if (!employeeId) continue;

      const user = userList.find(
        (u: User) => u.employeeId.toLowerCase() === employeeId.toLowerCase(),
      );
      if (!user) {
        errors.push(`Dòng ${i + 2}: Không tìm thấy mã NV ${employeeId}`);
        continue;
      }

      const patch: Record<string, unknown> = {};
      if (r.name) patch.name = String(r.name).trim();
      if (r.department) patch.department = String(r.department).trim();
      if (r.phone) patch.phone = String(r.phone).trim();

      if (Object.keys(patch).length && users.length) {
        const { error } = await supabase.from("users").update(patch).eq("id", user.id);
        if (!error) profileUpdates++;
      }

      const productCode = String(r.productCode ?? "").trim();
      if (productCode) {
        const product = products.find(
          (p) => p.code.toLowerCase() === productCode.toLowerCase(),
        );
        if (!product) {
          errors.push(`Dòng ${i + 2}: Không tìm thấy mã SP ${productCode}`);
          continue;
        }
        const rateVnd = Number(r.rateVnd);
        if (!rateVnd || Number.isNaN(rateVnd)) {
          errors.push(`Dòng ${i + 2}: Đơn giá không hợp lệ`);
          continue;
        }
        shiftSalaryStore.upsertRate(user.id, product.id, rateVnd);
        rateUpdates++;
      }
    }

    res.json({
      success: true,
      data: { profileUpdates, rateUpdates, errors, total: rows.length },
    });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

payrollRoutes.get("/shift-closes", (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const workerId = typeof req.query.workerId === "string" ? req.query.workerId : undefined;
  const orderId = typeof req.query.orderId === "string" ? req.query.orderId : undefined;
  const bomId = typeof req.query.bomId === "string" ? req.query.bomId : undefined;
  const actor = resolveActor(req);
  const scopedWorker = actor?.role === "worker" ? actor.id : workerId;
  res.json({
    success: true,
    data: shiftSalaryStore.listCloses({ status, workerId: scopedWorker, orderId, bomId }),
  });
});

payrollRoutes.get("/shift-unlocks", (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const workerId = typeof req.query.workerId === "string" ? req.query.workerId : undefined;
  const orderId = typeof req.query.orderId === "string" ? req.query.orderId : undefined;
  const bomId = typeof req.query.bomId === "string" ? req.query.bomId : undefined;
  const actor = resolveActor(req);
  const scopedWorker = actor?.role === "worker" ? actor.id : workerId;
  res.json({
    success: true,
    data: shiftSalaryStore.listUnlocks({ status, workerId: scopedWorker, orderId, bomId }),
  });
});

payrollRoutes.post("/shift-unlocks", async (req, res) => {
  try {
    const body = req.body as {
      orderId: string;
      bomId: string;
      workerId?: string;
      workerName?: string;
      partName?: string;
      reason?: string;
    };
    const actor = resolveActor(req);
    if (actor && actor.role !== "worker") throw new Error("Chỉ công nhân được xin mở khóa.");
    const workerId = actor?.id || body.workerId || "";
    const workerName = actor?.name || body.workerName || "";
    if (!workerId || !body.orderId || !body.bomId) throw new Error("Thiếu thông tin mở khóa.");
    const data: ShiftUnlockRequest = shiftSalaryStore.requestUnlock({
      orderId: body.orderId,
      bomId: body.bomId,
      workerId,
      workerName,
      partName: body.partName ?? "",
      reason: body.reason,
    });
    await notifyRoles(
      ["teamlead"],
      "Yêu cầu mở khóa chốt ca",
      `${workerName} xin mở khóa — ${data.partName}`,
      { refId: data.id, type: "shift", refType: "shift_unlock" },
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

payrollRoutes.post("/shift-unlocks/:id/review", async (req, res) => {
  try {
    const { approved, reviewerName, rejectReason } = req.body as {
      approved: boolean;
      reviewerName?: string;
      rejectReason?: string;
    };
    const actor = resolveActor(req);
    if (actor && actor.role !== "teamlead" && actor.role !== "supervisor" && actor.role !== "admin") {
      throw new Error("Không có quyền duyệt mở khóa.");
    }
    const name = actor?.name || reviewerName || "";
    if (!name) throw new Error("Thiếu người duyệt");
    const data = shiftSalaryStore.reviewUnlock(req.params.id, Boolean(approved), name, rejectReason ?? "");
    try {
      await workflowService.createNotification({
        userId: data.workerId,
        type: "shift",
        refId: data.id,
        refType: "shift_unlock",
        title: approved ? "Đã mở khóa chốt ca" : "Từ chối mở khóa chốt ca",
        body: approved
          ? "Bạn có thể chốt ca tiếp trong ngày."
          : data.rejectReason || "Tổ trưởng từ chối mở khóa.",
      });
    } catch {
      /* optional */
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

payrollRoutes.patch("/shift-closes/:id", (req, res) => {
  try {
    const actor = resolveActor(req);
    if (actor && actor.role !== "worker") throw new Error("Chỉ công nhân được sửa phiếu chốt ca.");
    const workerId = actor?.id || String((req.body as { workerId?: string })?.workerId ?? "");
    if (!workerId) throw new Error("Thiếu công nhân");
    const body = req.body as { passQty?: number; failQty?: number; note?: string };
    const data = shiftSalaryStore.updatePendingClose(req.params.id, workerId, {
      passQty: Number(body.passQty) || 0,
      failQty: Number(body.failQty) || 0,
      note: body.note ?? "",
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

payrollRoutes.post("/shift-closes/:id/review", async (req, res) => {
  try {
    const { stage, approved, reviewerName, rejectReason } = req.body as {
      stage: "teamlead" | "qc" | "supervisor";
      approved: boolean;
      reviewerName: string;
      rejectReason?: string;
    };
    if (!stage || !reviewerName) throw new Error("Thiếu bước duyệt hoặc người duyệt");
    const data: ShiftClose = shiftSalaryStore.reviewClose(
      req.params.id,
      stage,
      Boolean(approved),
      reviewerName,
      rejectReason ?? "",
    );
    try {
      await workflowService.addAuditLog({
        orderId: data.orderId,
        bomId: data.bomId,
        action: `shift_${stage}_${approved ? "approve" : "reject"}`,
        actorId: "",
        actorName: reviewerName,
        oldStatus: stage,
        newStatus: data.status,
        note: approved
          ? `Đạt ${data.passQty}${data.status === "approved" ? ` · ${data.amountVnd} đ` : ""}`
          : (data.rejectReason ?? ""),
      });
    } catch {
      /* optional */
    }
    if (approved && stage === "teamlead") {
      await notifyRoles(["qc"], "Chốt ca chờ QC", `${data.workerName} — ${data.partName} (${data.passQty} đạt)`, data.id);
      try {
        await workflowService.createNotification({
          userId: data.workerId,
          type: "shift",
          refId: data.id,
          refType: "shift_close",
          title: "Tổ trưởng đã duyệt chốt ca",
          body: "Xin mở khóa để đo kiểm / chốt ca tiếp trong ngày.",
        });
      } catch {
        /* optional */
      }
    } else if (approved && stage === "qc") {
      await notifyRoles(["supervisor"], "Chốt ca chờ Quản đốc", `${data.workerName} — ${data.partName}`, data.id);
    } else if (approved && stage === "supervisor") {
      try {
        await workflowService.createNotification({
          userId: data.workerId,
          type: "shift",
          refId: data.id,
          refType: "shift_close",
          title: "Lương ca đã chốt",
          body: `${data.passQty} SP × ${data.rateVnd.toLocaleString("vi-VN")} đ = ${data.amountVnd.toLocaleString("vi-VN")} đ`,
        });
      } catch {
        /* optional */
      }
    } else if (!approved && data.workerId) {
      try {
        await workflowService.createNotification({
          userId: data.workerId,
          type: "shift",
          refId: data.id,
          refType: "shift_close",
          title: "Chốt ca bị từ chối",
          body: data.rejectReason || `Bước ${stage}`,
        });
      } catch {
        /* optional */
      }
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});
