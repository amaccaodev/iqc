/**
 * In-memory catalog (products, BTP, warehouse, machines, change requests)
 * Fallback khi Supabase chưa có bảng / trống.
 */
import type {
  Product,
  SemiProduct,
  ProductBomLine,
  WarehouseStock,
  WarehouseMovement,
  Machine,
  MachineChangeRequest,
  ProcessStage,
  Attachment,
} from "../../../shared/src/types/index.js";
import { paginateInMemory } from "../../../shared/src/utils/pagedList.js";
import { withAttachmentPreview } from "../../../shared/src/utils/attachments.js";

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const products: Product[] = [
  {
    id: "p1",
    code: "NOVO-20-001",
    name: "Van 1 chiều lò xo NOVO 20",
    description: "Thành phẩm demo",
    active: true,
  },
  {
    id: "p2",
    code: "NOVO-VC-20",
    name: "Van cửa NOVO 20",
    description: "Theo ĐMKT documents/2-VAN CỬA NOVO 20.xlsx",
    active: true,
  },
];

const semiProducts: SemiProduct[] = [
  {
    id: "sp1",
    code: "BTP-BODY-20",
    name: "Thân van NOVO20",
    processStage: "hot_forge",
    description: "",
    active: true,
    checklist: [
      { name: "Ø ngoài thân", target: 20, unit: "mm", min: 19.9, max: 20.1 },
      { name: "Ø lỗ", target: 9, unit: "mm", min: 8.95, max: 9.05 },
      { name: "Chiều dày thành", target: 1.5, unit: "mm" },
      { name: "Ren M6", type: "qualitative", hint: "Thử ren chuẩn" },
      { name: "NQ", type: "qualitative", hint: "Ngoại quan" },
    ],
  },
  {
    id: "sp2",
    code: "BTP-SPRING-20",
    name: "Lò xo NOVO20",
    processStage: "auto",
    description: "",
    active: true,
    checklist: [
      { name: "Ø ngoài lò xo", target: 9.5, unit: "mm" },
      { name: "Ø dây", target: 1.2, unit: "mm" },
      { name: "Chiều dài tự do", target: 42, unit: "mm" },
      { name: "Số vòng", target: 8, unit: "vòng" },
      { name: "NQ", type: "qualitative" },
    ],
  },
  {
    id: "sp3",
    code: "BTP-ASM-20",
    name: "Bộ lắp ráp NOVO20",
    processStage: "assembly",
    description: "",
    active: true,
    checklist: [
      { name: "Lực đóng", target: 12, unit: "N" },
      { name: "Kín nước", type: "qualitative", hint: "Không rò" },
      { name: "NQ", type: "qualitative" },
    ],
  },
  {
    id: "sp-vc-body",
    code: "VC20-THAN",
    name: "Thân van cửa NOVO 20",
    processStage: "hot_forge",
    description: "",
    active: true,
    checklist: [
      { name: "Ø thân", target: 20, unit: "mm" },
      { name: "Chiều cao", target: 28, unit: "mm" },
      { name: "NQ", type: "qualitative" },
    ],
  },
  {
    id: "sp-vc-cap",
    code: "VC20-NAP",
    name: "Nắp van cửa NOVO 20",
    processStage: "hot_forge",
    description: "",
    active: true,
    checklist: [
      { name: "Ø nắp", target: 22, unit: "mm" },
      { name: "Độ phẳng", type: "qualitative" },
      { name: "NQ", type: "qualitative" },
    ],
  },
  {
    id: "sp-vc-disc",
    code: "VC20-DIA",
    name: "Đĩa van cửa NOVO 20",
    processStage: "hot_forge",
    description: "",
    active: true,
    checklist: [
      { name: "Ø đĩa", target: 18, unit: "mm" },
      { name: "Độ dày", target: 3, unit: "mm" },
      { name: "NQ", type: "qualitative" },
    ],
  },
  { id: "sp-vc-shaft", code: "VC20-TRUC", name: "Trục van cửa NOVO 20", processStage: "auto", description: "", active: true, checklist: [{ name: "Ø trục", target: 6, unit: "mm" }, { name: "Chiều dài", target: 42, unit: "mm" }] },
  { id: "sp-vc-nut", code: "VC20-OCAL", name: "Ốc áp lực van cửa NOVO 20", processStage: "auto", description: "", active: true, checklist: [{ name: "Ren", type: "qualitative", hint: "T8" }, { name: "NQ", type: "qualitative" }] },
  { id: "sp-vc-washer", code: "VC20-OCDT8", name: "Ốc đệm T8", processStage: "auto", description: "", active: true, checklist: [{ name: "Ø trong", target: 8, unit: "mm" }, { name: "NQ", type: "qualitative" }] },
];

const productBoms: ProductBomLine[] = [
  { id: "pb1", productId: "p1", semiProductId: "sp1", qtyPerUnit: 1 },
  { id: "pb2", productId: "p1", semiProductId: "sp2", qtyPerUnit: 1 },
  { id: "pb3", productId: "p1", semiProductId: "sp3", qtyPerUnit: 1 },
  { id: "pb-vc1", productId: "p2", semiProductId: "sp-vc-body", qtyPerUnit: 1 },
  { id: "pb-vc2", productId: "p2", semiProductId: "sp-vc-cap", qtyPerUnit: 1 },
  { id: "pb-vc3", productId: "p2", semiProductId: "sp-vc-disc", qtyPerUnit: 1 },
  { id: "pb-vc4", productId: "p2", semiProductId: "sp-vc-shaft", qtyPerUnit: 1 },
  { id: "pb-vc5", productId: "p2", semiProductId: "sp-vc-nut", qtyPerUnit: 1 },
  { id: "pb-vc6", productId: "p2", semiProductId: "sp-vc-washer", qtyPerUnit: 1 },
];

const warehouse: WarehouseStock[] = [
  { semiProductId: "sp1", qty: 120 },
  { semiProductId: "sp2", qty: 80 },
  { semiProductId: "sp3", qty: 50 },
  { semiProductId: "sp-vc-body", qty: 40 },
  { semiProductId: "sp-vc-cap", qty: 35 },
  { semiProductId: "sp-vc-disc", qty: 30 },
  { semiProductId: "sp-vc-shaft", qty: 55 },
  { semiProductId: "sp-vc-nut", qty: 80 },
  { semiProductId: "sp-vc-washer", qty: 70 },
];

const stockMovements: WarehouseMovement[] = [];

const machines: Machine[] = [
  {
    id: "m1",
    code: "CAM-01",
    name: "Cam 0.1",
    location: "Khu Dập nóng — Dãy A1",
    teamId: "t_hot",
    params: [{ label: "ĐK ngoài", unit: "mm", min: 19.9, max: 20.1 }],
    active: true,
  },
  {
    id: "m2",
    code: "CNC-01",
    name: "Tiện CNC 1",
    location: "Khu Dập nóng — Dãy A2",
    teamId: "t_hot",
    params: [{ label: "Chiều dài", unit: "mm", min: 49.5, max: 50.5 }],
    active: true,
  },
  {
    id: "m3",
    code: "AUTO-01",
    name: "D80T-01",
    location: "Khu Tự động — Line B",
    teamId: "t_auto",
    params: [],
    active: true,
  },
  {
    id: "m4",
    code: "ASM-01",
    name: "Bàn lắp 1",
    location: "Khu Lắp ráp — Bàn C1",
    teamId: "t_asm",
    params: [],
    active: true,
  },
  {
    id: "m5",
    code: "ASM-02",
    name: "Bàn lắp",
    location: "Khu Lắp ráp — Bàn C2",
    teamId: "t_asm",
    params: [],
    active: true,
  },
];

const changeRequests: MachineChangeRequest[] = [];

const productAttachments = new Map<string, Attachment[]>();
const semiAttachments = new Map<string, Attachment[]>();

function stripHeavy(atts: Attachment[] | undefined): Attachment[] | undefined {
  if (!atts?.length) return atts;
  return atts.map(({ contentBase64: _, url: __, ...meta }) => meta);
}

export const catalogStore = {
  listProducts() {
    return products.filter((p) => p.active);
  },
  listAllProducts() {
    return [...products];
  },
  searchProducts(opts: { q?: string; page?: number; pageSize?: number; activeOnly?: boolean }) {
    const base = opts.activeOnly !== false ? products.filter((p) => p.active) : products;
    return paginateInMemory(base, {
      q: opts.q,
      page: opts.page,
      pageSize: opts.pageSize,
      match: (p, q) =>
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    });
  },
  getProduct(id: string) {
    return products.find((p) => p.id === id) ?? null;
  },
  createProduct(input: Omit<Product, "id">) {
    const p: Product = { ...input, id: id("p") };
    products.push(p);
    return p;
  },
  updateProduct(pid: string, patch: Partial<Product>) {
    const i = products.findIndex((p) => p.id === pid);
    if (i < 0) throw new Error("Không tìm thấy sản phẩm");
    products[i] = { ...products[i], ...patch, id: pid };
    return products[i];
  },
  deleteProduct(pid: string) {
    const i = products.findIndex((p) => p.id === pid);
    if (i < 0) throw new Error("Không tìm thấy sản phẩm");
    products[i].active = false;
    return products[i];
  },

  listSemiProducts() {
    return semiProducts.filter((s) => s.active);
  },
  listAllSemiProducts() {
    return [...semiProducts];
  },
  searchSemiProducts(opts: { q?: string; page?: number; pageSize?: number; stage?: ProcessStage | "all" }) {
    let base = semiProducts.filter((s) => s.active);
    if (opts.stage && opts.stage !== "all") base = base.filter((s) => s.processStage === opts.stage);
    return paginateInMemory(base, {
      q: opts.q,
      page: opts.page,
      pageSize: opts.pageSize,
      match: (s, q) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
    });
  },
  getSemi(id: string) {
    return semiProducts.find((s) => s.id === id) ?? null;
  },
  createSemi(input: Omit<SemiProduct, "id">) {
    const s: SemiProduct = { ...input, id: id("sp") };
    semiProducts.push(s);
    if (!warehouse.find((w) => w.semiProductId === s.id)) {
      warehouse.push({ semiProductId: s.id, qty: 0 });
    }
    return s;
  },
  updateSemi(sid: string, patch: Partial<SemiProduct>) {
    const i = semiProducts.findIndex((s) => s.id === sid);
    if (i < 0) throw new Error("Không tìm thấy BTP");
    semiProducts[i] = { ...semiProducts[i], ...patch, id: sid };
    return semiProducts[i];
  },

  listBom(productId: string): ProductBomLine[] {
    return productBoms
      .filter((b) => b.productId === productId)
      .map((b) => ({
        ...b,
        semiProduct: semiProducts.find((s) => s.id === b.semiProductId),
        stockQty: warehouse.find((w) => w.semiProductId === b.semiProductId)?.qty ?? 0,
      }));
  },
  setBom(productId: string, lines: Array<{ semiProductId: string; qtyPerUnit: number }>) {
    for (let i = productBoms.length - 1; i >= 0; i--) {
      if (productBoms[i].productId === productId) productBoms.splice(i, 1);
    }
    for (const line of lines) {
      productBoms.push({
        id: id("pb"),
        productId,
        semiProductId: line.semiProductId,
        qtyPerUnit: line.qtyPerUnit,
      });
    }
    return this.listBom(productId);
  },

  findProductByCode(code: string) {
    const c = code.trim().toLowerCase();
    return products.find((p) => p.code.toLowerCase() === c) ?? null;
  },
  findSemiByCode(code: string) {
    const c = code.trim().toLowerCase();
    return semiProducts.find((s) => s.code.toLowerCase() === c) ?? null;
  },

  /**
   * Import BOM từ CSV Mẫu van: mỗi dòng = 1 quy trình của 1 linh kiện thuộc 1 SP.
   * Upsert SP + BTP (kèm processSteps) + định mức product BOM.
   */
  importProductBom(
    rows: Array<{
      productCode: string;
      productName?: string;
      partCode: string;
      partName?: string;
      processSeq: number;
      processName: string;
      processStage?: ProcessStage;
      teamCode?: string;
      machine?: string;
      qtyPerUnit?: number;
      quota?: string;
      techNote?: string;
      people?: number;
    }>,
  ) {
    if (!rows.length) throw new Error("File không có dòng dữ liệu");
    const errors: string[] = [];
    let productUpserts = 0;
    let semiUpserts = 0;
    let stepCount = 0;

    type AccPart = {
      productCode: string;
      productName: string;
      partCode: string;
      partName: string;
      qtyPerUnit: number;
      steps: import("../../../shared/src/types/index.js").SemiProcessStep[];
      stage: ProcessStage;
    };
    const byProduct = new Map<string, Map<string, AccPart>>();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const productCode = String(r.productCode ?? "").trim();
      const partCode = String(r.partCode ?? "").trim();
      const processName = String(r.processName ?? "").trim();
      if (!productCode || !partCode || !processName) {
        errors.push(`Dòng ${i + 2}: thiếu Mã SP / Mã LK / Tên quy trình`);
        continue;
      }
      const stage = (r.processStage ?? "hot_forge") as ProcessStage;
      let parts = byProduct.get(productCode);
      if (!parts) {
        parts = new Map();
        byProduct.set(productCode, parts);
      }
      let part = parts.get(partCode);
      if (!part) {
        part = {
          productCode,
          productName: String(r.productName ?? productCode).trim() || productCode,
          partCode,
          partName: String(r.partName ?? partCode).trim() || partCode,
          qtyPerUnit: Math.max(1, Number(r.qtyPerUnit) || 1),
          steps: [],
          stage,
        };
        parts.set(partCode, part);
      } else {
        if (r.productName?.trim()) part.productName = r.productName.trim();
        if (r.partName?.trim()) part.partName = r.partName.trim();
        if (r.qtyPerUnit != null && Number(r.qtyPerUnit) > 0) {
          part.qtyPerUnit = Number(r.qtyPerUnit);
        }
      }
      part.steps.push({
        seq: Math.max(1, Number(r.processSeq) || part.steps.length + 1),
        process: processName,
        machine: r.machine?.trim() || undefined,
        processStage: stage,
        teamCode: r.teamCode?.trim() || undefined,
        people: r.people != null ? Number(r.people) : undefined,
        techNote: r.techNote?.trim() || undefined,
        quota: r.quota?.trim() || undefined,
      });
      stepCount += 1;
    }

    for (const [productCode, parts] of byProduct) {
      const first = [...parts.values()][0];
      let product = this.findProductByCode(productCode);
      if (!product) {
        product = this.createProduct({
          code: productCode,
          name: first.productName,
          description: "Import BOM từ CSV",
          active: true,
        });
        productUpserts += 1;
      } else if (first.productName && first.productName !== product.name) {
        this.updateProduct(product.id, { name: first.productName, active: true });
        productUpserts += 1;
      }

      const bomLines: Array<{ semiProductId: string; qtyPerUnit: number }> = [];
      for (const part of parts.values()) {
        const steps = [...part.steps].sort((a, b) => a.seq - b.seq);
        const stage =
          steps.find((s) => s.processStage)?.processStage ?? part.stage ?? "hot_forge";
        let semi = this.findSemiByCode(part.partCode);
        if (!semi) {
          semi = this.createSemi({
            code: part.partCode,
            name: part.partName,
            processStage: stage,
            description: `Import — ${steps.length} quy trình`,
            active: true,
            processSteps: steps,
          });
          semiUpserts += 1;
        } else {
          this.updateSemi(semi.id, {
            name: part.partName || semi.name,
            processStage: stage,
            active: true,
            description: `Import — ${steps.length} quy trình`,
            processSteps: steps,
            // Giữ checklist đã nhập — import BOM không xóa thông số đo
            checklist: semi.checklist,
          });
          semiUpserts += 1;
          semi = this.getSemi(semi.id)!;
        }
        bomLines.push({ semiProductId: semi.id, qtyPerUnit: part.qtyPerUnit });
      }
      this.setBom(product.id, bomLines);
    }

    return {
      products: byProduct.size,
      parts: [...byProduct.values()].reduce((s, m) => s + m.size, 0),
      steps: stepCount,
      productUpserts,
      semiUpserts,
      errors,
      total: rows.length,
    };
  },

  listStock() {
    return warehouse.map((w) => ({
      ...w,
      semiProduct: semiProducts.find((s) => s.id === w.semiProductId),
    }));
  },
  searchStock(opts: { q?: string; page?: number; pageSize?: number; stage?: ProcessStage | "all" }) {
    let rows = this.listStock();
    if (opts.stage && opts.stage !== "all") {
      rows = rows.filter((r) => r.semiProduct?.processStage === opts.stage);
    }
    return paginateInMemory(rows, {
      q: opts.q,
      page: opts.page,
      pageSize: opts.pageSize,
      match: (r, q) => {
        const s = r.semiProduct;
        if (!s) return false;
        return s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
      },
    });
  },
  setStock(semiProductId: string, qty: number, note?: string, createdBy?: string) {
    let row = warehouse.find((w) => w.semiProductId === semiProductId);
    if (!row) {
      row = { semiProductId, qty: 0 };
      warehouse.push(row);
    }
    const before = row.qty;
    row.qty = qty;
    row.updatedAt = new Date().toISOString();
    if (before !== qty) {
      stockMovements.unshift({
        id: id("wm"),
        semiProductId,
        delta: qty - before,
        qtyAfter: qty,
        note: note ?? "Kiểm kê tồn kho",
        createdBy: createdBy || undefined,
        createdAt: new Date().toISOString(),
      });
    }
    return row;
  },
  consumeStock(semiProductId: string, qty: number) {
    const row = warehouse.find((w) => w.semiProductId === semiProductId);
    if (!row) return;
    const before = row.qty;
    row.qty = Math.max(0, row.qty - qty);
    row.updatedAt = new Date().toISOString();
    if (before !== row.qty) {
      stockMovements.unshift({
        id: id("wm"),
        semiProductId,
        delta: row.qty - before,
        qtyAfter: row.qty,
        note: "Xuất kho (lệnh SX)",
        createdAt: new Date().toISOString(),
      });
    }
  },
  adjustStock(semiProductId: string, delta: number, note = "", createdBy = "") {
    let row = warehouse.find((w) => w.semiProductId === semiProductId);
    if (!row) {
      row = { semiProductId, qty: 0 };
      warehouse.push(row);
    }
    row.qty = Math.max(0, row.qty + delta);
    row.updatedAt = new Date().toISOString();
    const movement: WarehouseMovement = {
      id: id("wm"),
      semiProductId,
      delta,
      qtyAfter: row.qty,
      note: note || (delta >= 0 ? "Nhập kho" : "Xuất kho"),
      createdBy: createdBy || undefined,
      createdAt: new Date().toISOString(),
    };
    stockMovements.unshift(movement);
    return { stock: row, movement };
  },
  listMovements(limit = 50) {
    return stockMovements.slice(0, limit).map((m) => ({
      ...m,
      semiProduct: semiProducts.find((s) => s.id === m.semiProductId),
    }));
  },

  listMachines() {
    return machines.filter((m) => m.active);
  },
  listAllMachines() {
    return [...machines];
  },
  getMachine(mid: string) {
    return machines.find((m) => m.id === mid) ?? null;
  },
  createMachine(input: Omit<Machine, "id">) {
    const m: Machine = { ...input, id: id("m") };
    machines.push(m);
    return m;
  },
  updateMachine(mid: string, patch: Partial<Machine>) {
    const i = machines.findIndex((m) => m.id === mid);
    if (i < 0) throw new Error("Không tìm thấy máy");
    machines[i] = { ...machines[i], ...patch, id: mid };
    return machines[i];
  },
  deleteMachine(mid: string) {
    const i = machines.findIndex((m) => m.id === mid);
    if (i < 0) throw new Error("Không tìm thấy máy");
    machines[i].active = false;
    return machines[i];
  },

  listChangeRequests(filter?: { status?: string; target?: string }) {
    return changeRequests.filter((r) => {
      if (filter?.status && r.status !== filter.status) return false;
      if (filter?.target && r.target !== filter.target) return false;
      return true;
    });
  },
  createChangeRequest(
    input: Omit<MachineChangeRequest, "id" | "status" | "reviewNote" | "requestedAt"> & {
      requestedAt?: string;
    },
  ) {
    const r: MachineChangeRequest = {
      ...input,
      id: id("mcr"),
      status: "pending",
      reviewNote: "",
      requestedAt: input.requestedAt ?? new Date().toISOString(),
    };
    changeRequests.unshift(r);
    return r;
  },
  reviewChangeRequest(
    rid: string,
    approved: boolean,
    reviewer: { id: string; name: string },
    note = "",
  ) {
    const r = changeRequests.find((x) => x.id === rid);
    if (!r) throw new Error("Không tìm thấy yêu cầu");
    if (r.status !== "pending") throw new Error("Yêu cầu đã xử lý");
    r.status = approved ? "approved" : "rejected";
    r.reviewedBy = reviewer.id;
    r.reviewedName = reviewer.name;
    r.reviewedAt = new Date().toISOString();
    r.reviewNote = note;
    return r;
  },

  listProductAttachments(productId: string, withContent = true): Attachment[] {
    const list = productAttachments.get(productId) ?? [];
    if (!withContent) return stripHeavy(list) ?? [];
    return list.map(withAttachmentPreview);
  },
  addProductAttachment(productId: string, input: Omit<Attachment, "id">): Attachment {
    if (!products.find((p) => p.id === productId)) throw new Error("Không tìm thấy sản phẩm");
    if (!input.contentBase64) throw new Error("Thiếu nội dung file (contentBase64)");
    const att: Attachment = withAttachmentPreview({
      ...input,
      id: id("pa"),
      uploadedAt: input.uploadedAt || new Date().toLocaleDateString("vi-VN"),
    });
    const cur = productAttachments.get(productId) ?? [];
    cur.push(att);
    productAttachments.set(productId, cur);
    return att;
  },
  removeProductAttachment(productId: string, attId: string) {
    const cur = productAttachments.get(productId) ?? [];
    productAttachments.set(
      productId,
      cur.filter((a) => a.id !== attId),
    );
    return true;
  },

  listSemiAttachments(semiId: string, withContent = true): Attachment[] {
    const list = semiAttachments.get(semiId) ?? [];
    if (!withContent) return stripHeavy(list) ?? [];
    return list.map(withAttachmentPreview);
  },
  addSemiAttachment(semiId: string, input: Omit<Attachment, "id">): Attachment {
    if (!semiProducts.find((s) => s.id === semiId)) throw new Error("Không tìm thấy linh kiện/BTP");
    if (!input.contentBase64) throw new Error("Thiếu nội dung file (contentBase64)");
    const att: Attachment = withAttachmentPreview({
      ...input,
      id: id("sa"),
      uploadedAt: input.uploadedAt || new Date().toLocaleDateString("vi-VN"),
    });
    const cur = semiAttachments.get(semiId) ?? [];
    cur.push(att);
    semiAttachments.set(semiId, cur);
    return att;
  },
  removeSemiAttachment(semiId: string, attId: string) {
    const cur = semiAttachments.get(semiId) ?? [];
    semiAttachments.set(
      semiId,
      cur.filter((a) => a.id !== attId),
    );
    return true;
  },
};

export type { ProcessStage };
