import { Router } from "express";
import type { ShiftClose, User } from "../../../shared/src/types/index.js";
import { SEED_USERS } from "../data/seed.js";
import { supabase } from "../lib/supabase.js";
import { supabaseUserRepository } from "../repositories/SupabaseUserRepository.js";
import { catalogStore } from "../services/CatalogMemoryStore.js";
import { shiftSalaryStore } from "../services/ShiftSalaryStore.js";
import { workflowService } from "../services/WorkflowService.js";
import { notifyRoles } from "./notifyHelpers.js";

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
  res.json({ success: true, data: shiftSalaryStore.listCloses({ status, workerId }) });
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
