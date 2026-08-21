import { Router } from "express";
import {
  parseListQueryFromRequest,
  wantsPagedListQuery,
} from "../../../shared/src/utils/listQuery.js";
import { catalogQueryService } from "../services/CatalogQueryService.js";
import { catalogStore } from "../services/CatalogMemoryStore.js";
import { notifyRoles, notifyUser } from "./notifyHelpers.js";

export const catalogRoutes = Router();

catalogRoutes.get("/products", (req, res) => {
  const q = req.query as Record<string, string | undefined>;
  if (wantsPagedListQuery(q)) {
    return res.json({
      success: true,
      data: catalogQueryService.searchProducts(parseListQueryFromRequest(q)),
    });
  }
  res.json({ success: true, data: catalogQueryService.listAllProducts() });
});

catalogRoutes.post("/products", (req, res) => {
  try {
    const body = req.body as { code: string; name: string; description?: string; active?: boolean };
    if (!body.code?.trim() || !body.name?.trim()) throw new Error("Mã và tên sản phẩm bắt buộc");
    const data = catalogStore.createProduct({
      code: body.code.trim(),
      name: body.name.trim(),
      description: body.description ?? "",
      active: body.active !== false,
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

catalogRoutes.patch("/products/:id", (req, res) => {
  try {
    const data = catalogStore.updateProduct(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

catalogRoutes.delete("/products/:id", (req, res) => {
  try {
    const data = catalogStore.deleteProduct(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

catalogRoutes.get("/products/:id/bom", (req, res) => {
  res.json({ success: true, data: catalogStore.listBom(req.params.id) });
});

catalogRoutes.put("/products/:id/bom", (req, res) => {
  try {
    const lines = (req.body?.lines ?? []) as Array<{ semiProductId: string; qtyPerUnit: number }>;
    const data = catalogStore.setBom(req.params.id, lines);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

catalogRoutes.get("/semi-products", (req, res) => {
  const q = req.query as Record<string, string | undefined>;
  if (wantsPagedListQuery(q, ["stage"])) {
    return res.json({
      success: true,
      data: catalogQueryService.searchSemiProducts(parseListQueryFromRequest(q)),
    });
  }
  res.json({ success: true, data: catalogQueryService.listAllSemiProducts() });
});

catalogRoutes.post("/semi-products", (req, res) => {
  try {
    const body = req.body as {
      code: string;
      name: string;
      processStage?: "hot_forge" | "auto" | "assembly";
      description?: string;
    };
    if (!body.code?.trim() || !body.name?.trim()) throw new Error("Mã và tên BTP bắt buộc");
    const data = catalogStore.createSemi({
      code: body.code.trim(),
      name: body.name.trim(),
      processStage: body.processStage ?? "hot_forge",
      description: body.description ?? "",
      active: true,
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

catalogRoutes.patch("/semi-products/:id", (req, res) => {
  try {
    const data = catalogStore.updateSemi(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

catalogRoutes.get("/warehouse-stock", (req, res) => {
  const q = req.query as Record<string, string | undefined>;
  if (wantsPagedListQuery(q, ["stage"])) {
    return res.json({
      success: true,
      data: catalogQueryService.searchStock(parseListQueryFromRequest(q)),
    });
  }
  res.json({ success: true, data: catalogQueryService.listAllStock() });
});

catalogRoutes.patch("/warehouse-stock/:semiProductId", (req, res) => {
  try {
    const qty = Number(req.body?.qty);
    if (Number.isNaN(qty) || qty < 0) throw new Error("Số lượng không hợp lệ");
    const data = catalogStore.setStock(
      req.params.semiProductId,
      qty,
      String(req.body?.note ?? "Kiểm kê tồn kho"),
      String(req.body?.createdBy ?? ""),
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

catalogRoutes.post("/warehouse-stock/:semiProductId/adjust", (req, res) => {
  try {
    const delta = Number(req.body?.delta);
    if (Number.isNaN(delta) || delta === 0) throw new Error("Số lượng điều chỉnh không hợp lệ");
    const note = String(req.body?.note ?? "");
    const createdBy = String(req.body?.createdBy ?? "");
    const data = catalogStore.adjustStock(req.params.semiProductId, delta, note, createdBy);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

catalogRoutes.get("/warehouse-movements", (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  res.json({ success: true, data: catalogStore.listMovements(limit) });
});

catalogRoutes.post("/warehouse-stock/import", (req, res) => {
  try {
    const rows = (req.body as { rows?: Array<{ code: string; qty: number }> }).rows ?? [];
    if (!rows.length) throw new Error("File không có dòng dữ liệu");
    let updated = 0;
    const errors: string[] = [];
    for (let i = 0; i < rows.length; i++) {
      const code = String(rows[i].code ?? "").trim();
      const qty = Number(rows[i].qty);
      if (!code) continue;
      const semi = catalogStore.listSemiProducts().find(
        (s) => s.code.toLowerCase() === code.toLowerCase(),
      );
      if (!semi) {
        errors.push(`Dòng ${i + 2}: Không tìm thấy BTP ${code}`);
        continue;
      }
      if (Number.isNaN(qty) || qty < 0) {
        errors.push(`Dòng ${i + 2}: Số lượng không hợp lệ`);
        continue;
      }
      catalogStore.setStock(semi.id, qty, "Import CSV/Excel", "import");
      updated++;
    }
    res.json({ success: true, data: { updated, errors, total: rows.length } });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

catalogRoutes.get("/machines", (_req, res) => {
  res.json({ success: true, data: catalogStore.listAllMachines() });
});

catalogRoutes.post("/machines", (req, res) => {
  try {
    const body = req.body as { code: string; name: string; params?: unknown[]; active?: boolean };
    if (!body.code?.trim() || !body.name?.trim()) throw new Error("Mã và tên máy bắt buộc");
    const data = catalogStore.createMachine({
      code: body.code.trim(),
      name: body.name.trim(),
      params: Array.isArray(body.params) ? (body.params as never) : [],
      active: body.active !== false,
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

catalogRoutes.patch("/machines/:id", (req, res) => {
  try {
    const data = catalogStore.updateMachine(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

catalogRoutes.delete("/machines/:id", (req, res) => {
  try {
    const data = catalogStore.deleteMachine(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

catalogRoutes.get("/machine-change-requests", (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const target = typeof req.query.target === "string" ? req.query.target : undefined;
  res.json({ success: true, data: catalogStore.listChangeRequests({ status, target }) });
});

catalogRoutes.post("/machine-change-requests", async (req, res) => {
  try {
    const body = req.body as {
      orderId?: string;
      bomId?: string;
      requestedBy: string;
      requestedName: string;
      reason: string;
      target: "teamlead" | "mechanic";
      fromMachine?: string;
      toMachine?: string;
    };
    if (!body.reason?.trim()) throw new Error("Nhập lý do xin phê duyệt");
    if (!body.target) throw new Error("Chọn gửi Tổ trưởng hoặc Cơ điện");
    const data = catalogStore.createChangeRequest({
      orderId: body.orderId,
      bomId: body.bomId,
      requestedBy: body.requestedBy,
      requestedName: body.requestedName,
      reason: body.reason.trim(),
      target: body.target,
      fromMachine: body.fromMachine ?? "",
      toMachine: body.toMachine ?? "",
    });

    const machineLine =
      data.fromMachine || data.toMachine
        ? `Máy: ${data.fromMachine || "—"} → ${data.toMachine || "—"}`
        : "";
    const targetLabel = body.target === "mechanic" ? "Cơ điện" : "Tổ trưởng";
    const bodyText = [
      `${body.requestedName}: ${body.reason}`,
      machineLine,
      `Chờ duyệt: ${targetLabel}`,
    ]
      .filter(Boolean)
      .join(" · ");

    // Người duyệt trực tiếp (tổ trưởng / cơ điện)
    await notifyRoles([body.target === "mechanic" ? "mechanic" : "teamlead"], "Đề xuất đổi/thêm máy", bodyText, {
      refId: data.id,
      type: "approval",
      refType: "machine_change",
    });
    // GĐ + Quản đốc theo dõi đề xuất
    await notifyRoles(
      ["director", "supervisor"],
      "Đề xuất đổi/thêm máy",
      `${bodyText} · Trạng thái: Chờ duyệt`,
      { refId: data.id, type: "approval", refType: "machine_change" },
    );

    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

catalogRoutes.post("/machine-change-requests/:id/review", async (req, res) => {
  try {
    const approved = Boolean(req.body?.approved);
    const data = catalogStore.reviewChangeRequest(
      req.params.id,
      approved,
      { id: req.body?.reviewedBy ?? "", name: req.body?.reviewedName ?? "" },
      req.body?.note ?? "",
    );
    const statusLabel = approved ? "Đã duyệt" : "Từ chối";
    const reviewer = data.reviewedName || "Người duyệt";
    const detail = [
      `${statusLabel} bởi ${reviewer}`,
      data.requestedName ? `Yêu cầu của ${data.requestedName}` : "",
      data.reason,
      data.fromMachine || data.toMachine
        ? `Máy: ${data.fromMachine || "—"} → ${data.toMachine || "—"}`
        : "",
      data.reviewNote ? `Ghi chú: ${data.reviewNote}` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    await notifyRoles(
      ["director", "supervisor"],
      `Đổi máy — ${statusLabel}`,
      detail,
      { refId: data.id, type: "approval", refType: "machine_change" },
    );
    if (data.requestedBy) {
      await notifyUser(
        data.requestedBy,
        `Đổi máy — ${statusLabel}`,
        detail,
        { refId: data.id, type: "approval", refType: "machine_change" },
      );
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

// ── Attachments: bản vẽ / thông số (base64 local, nhiều file / entity) ─────────

catalogRoutes.get("/products/:id/attachments", (req, res) => {
  const withContent = req.query.meta !== "1";
  res.json({
    success: true,
    data: catalogStore.listProductAttachments(req.params.id, withContent),
  });
});

catalogRoutes.post("/products/:id/attachments", (req, res) => {
  try {
    const data = catalogStore.addProductAttachment(req.params.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

catalogRoutes.delete("/products/:id/attachments/:attId", (req, res) => {
  try {
    catalogStore.removeProductAttachment(req.params.id, req.params.attId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

catalogRoutes.get("/semi-products/:id/attachments", (req, res) => {
  const withContent = req.query.meta !== "1";
  res.json({
    success: true,
    data: catalogStore.listSemiAttachments(req.params.id, withContent),
  });
});

catalogRoutes.post("/semi-products/:id/attachments", (req, res) => {
  try {
    const data = catalogStore.addSemiAttachment(req.params.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

catalogRoutes.delete("/semi-products/:id/attachments/:attId", (req, res) => {
  try {
    catalogStore.removeSemiAttachment(req.params.id, req.params.attId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});
