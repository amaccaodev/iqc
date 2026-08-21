import { Router } from "express";
import { assessBomReadiness } from "../../../shared/src/utils/bomReadiness.js";
import { catalogStore } from "../services/CatalogMemoryStore.js";
import { shiftSalaryStore } from "../services/ShiftSalaryStore.js";
import { supabaseOrderService } from "../services/SupabaseOrderService.js";
import { workflowService } from "../services/WorkflowService.js";
import { notifyRoles } from "./notifyHelpers.js";

export const ordersRoutes = Router();

ordersRoutes.get("/orders", async (req, res) => {
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

ordersRoutes.get("/orders/stats", async (_req, res) => {
  try {
    const data = await supabaseOrderService.getStats();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

ordersRoutes.get("/orders/:id", async (req, res) => {
  try {
    const order = await supabaseOrderService.getById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: "Không tìm thấy lệnh sản xuất" });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

ordersRoutes.post("/orders", async (req, res) => {
  try {
    const data = await supabaseOrderService.createOrder(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

ordersRoutes.post("/orders/:id/attachments", async (req, res) => {
  try {
    const data = await supabaseOrderService.addAttachment(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

ordersRoutes.post("/orders/:id/boms", async (req, res) => {
  try {
    const data = await supabaseOrderService.addBOM(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

ordersRoutes.post("/orders/:orderId/boms/:bomId/assign", async (req, res) => {
  try {
    const data = await supabaseOrderService.assignBOM(req.params.orderId, req.params.bomId, req.body.teamId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

ordersRoutes.post("/orders/:orderId/boms/:bomId/assign-workers", async (req, res) => {
  try {
    const data = await supabaseOrderService.assignWorkers(
      req.params.orderId,
      req.params.bomId,
      req.body.workerNames ?? [],
      req.body.assignments,
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

ordersRoutes.post("/orders/:id/complete", async (req, res) => {
  try {
    const data = await supabaseOrderService.completeOrder(
      req.params.id,
      typeof req.body?.note === "string" ? req.body.note : undefined,
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

ordersRoutes.post("/orders/:id/approve", async (req, res) => {
  try {
    const data = await supabaseOrderService.approveOrder(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

ordersRoutes.post("/orders/:id/reject", async (req, res) => {
  try {
    const data = await supabaseOrderService.rejectOrder(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

ordersRoutes.post("/orders/:orderId/boms/:bomId/team-report", async (req, res) => {
  try {
    const data = await supabaseOrderService.submitTeamReport(req.params.orderId, req.params.bomId, req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

ordersRoutes.post("/orders/:orderId/boms/:bomId/worker-row", async (req, res) => {
  try {
    const data = await supabaseOrderService.submitWorkerRow(req.params.orderId, req.params.bomId, req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

ordersRoutes.post("/orders/:orderId/boms/:bomId/worker-shift-close", async (req, res) => {
  try {
    const { passQty, failQty, note, reportedBy, workerId } = req.body as {
      passQty: number;
      failQty: number;
      note?: string;
      reportedBy: string;
      workerId?: string;
    };
    const order = await supabaseOrderService.getById(req.params.orderId);
    if (!order) throw new Error("Không tìm thấy lệnh");
    const bom = order.boms.find((b) => b.id === req.params.bomId);
    if (!bom) throw new Error("Không tìm thấy BOM");
    const productId = order.productId || catalogStore.listProducts()[0]?.id || "";
    const product = productId ? catalogStore.getProduct(productId) : null;
    const data = shiftSalaryStore.createClose({
      orderId: order.id,
      bomId: bom.id,
      workerId: workerId || "",
      workerName: reportedBy || "",
      productId,
      productName: product?.name || order.productLine,
      partName: bom.partName,
      passQty: Number(passQty) || 0,
      failQty: Number(failQty) || 0,
      note: note ?? "",
    });
    try {
      await workflowService.addAuditLog({
        orderId: req.params.orderId,
        bomId: req.params.bomId,
        action: "worker_shift_close",
        actorId: workerId ?? "",
        actorName: reportedBy ?? "",
        note: `Đạt ${passQty}, Hỏng ${failQty} — chờ tổ trưởng`,
      });
    } catch {
      /* optional */
    }
    await notifyRoles(
      ["teamlead"],
      "Chốt ca chờ kiểm tra",
      `${reportedBy} chốt ${data.passQty} đạt / ${data.failQty} hỏng — ${bom.partName}`,
      data.id,
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

ordersRoutes.post("/orders/from-product", async (req, res) => {
  try {
    const data = await supabaseOrderService.createOrderFromProduct(req.body);
    const readiness = assessBomReadiness({
      productName: data.productLine,
      productHasAttachments: (data.attachments?.length ?? 0) > 0,
      lines: data.boms.map((b) => ({
        name: b.partName,
        code: b.partCode,
        hasAttachments: (b.attachments?.length ?? 0) > 0,
      })),
    });
    await notifyRoles(
      ["supervisor", "director"],
      `Lệnh mới ${data.orderNo}`,
      `${data.productLine} · ${data.boms.length} BTP · ${readiness.summary}${
        readiness.warnings.length ? ` — ${readiness.warnings.join("; ")}` : ""
      }`,
      { refId: data.id, type: "order", refType: "production_order" },
    );
    res.status(201).json({ success: true, data, readiness });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

ordersRoutes.post("/orders/from-products-batch", async (req, res) => {
  try {
    const data = await supabaseOrderService.createOrdersFromProductsBatch(req.body);
    for (const order of data) {
      const readiness = assessBomReadiness({
        productName: order.productLine,
        productHasAttachments: (order.attachments?.length ?? 0) > 0,
        lines: order.boms.map((b) => ({
          name: b.partName,
          code: b.partCode,
          hasAttachments: (b.attachments?.length ?? 0) > 0,
        })),
      });
      await notifyRoles(
        ["supervisor", "director"],
        `Lệnh mới ${order.orderNo}`,
        `${order.productLine} · ${order.boms.length} BTP · ${readiness.summary}${
          readiness.warnings.length ? ` — ${readiness.warnings.join("; ")}` : ""
        }`,
        { refId: order.id, type: "order", refType: "production_order" },
      );
    }
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});
ordersRoutes.post("/orders/:orderId/boms/:bomId/qc-report", async (req, res) => {
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

ordersRoutes.get("/orders/:orderId/audit", async (req, res) => {
  try {
    const data = await workflowService.getAuditLogs(req.params.orderId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

ordersRoutes.post("/orders/:orderId/audit", async (req, res) => {
  try {
    await workflowService.addAuditLog({ ...req.body, orderId: req.params.orderId });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});
