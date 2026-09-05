/**
 * In-memory catalog — new model:
 * Product → SemiProduct → Bom → BomProcess
 * Shared warehouse (product | semi_product)
 */
import type {
  Attachment,
  Bom,
  BomProcess,
  EntityListQuery,
  Machine,
  MachineChangeRequest,
  MachineGroup,
  PagedResult,
  Product,
  ProductStructureLine,
  SemiProduct,
  StockItemKind,
  WarehouseMovement,
  WarehouseStock,
} from "../../../shared/src/types/index.js";
import { paginateInMemory } from "../../../shared/src/utils/pagedList.js";
import { withAttachmentPreview } from "../../../shared/src/utils/attachments.js";
import {
  DMKT_BOM_PROCESSES,
  DMKT_BOMS,
  DMKT_MACHINES,
  DMKT_PRODUCTS,
  DMKT_SEMI,
  DMKT_WAREHOUSE,
} from "../../../shared/src/data/dmktCatalog.js";
import {
  SAMPLE_BOM_PROCESSES,
  SAMPLE_BOMS,
  SAMPLE_MACHINES,
  SAMPLE_PRODUCTS,
  SAMPLE_SEMI,
  SAMPLE_WAREHOUSE,
  mockDrawingsById,
} from "../../../shared/src/data/sampleInspection.js";

export const MAIN_WAREHOUSE_ID = "wh-main";

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function aliasMachine(m: Machine): Machine {
  return { ...m, code: m.accountingCode, teamId: m.productionTeamId };
}

const products: Product[] = structuredClone([...SAMPLE_PRODUCTS, ...DMKT_PRODUCTS]);
const semiProducts: SemiProduct[] = structuredClone([...SAMPLE_SEMI, ...DMKT_SEMI]);
const boms: Bom[] = structuredClone([...SAMPLE_BOMS, ...DMKT_BOMS]);
const bomProcesses: BomProcess[] = structuredClone([...SAMPLE_BOM_PROCESSES, ...DMKT_BOM_PROCESSES]);

const machineGroups: MachineGroup[] = [
  { id: "mg_hot", code: "HOT", name: "Group dập nóng", productionTeamId: "t_hot", isActive: true },
  { id: "mg_auto", code: "AUTO", name: "Group tự động", productionTeamId: "t_auto", isActive: true },
  { id: "mg_asm", code: "ASM", name: "Group lắp ráp", productionTeamId: "t_asm", isActive: true },
];

const warehouse: WarehouseStock[] = structuredClone([...SAMPLE_WAREHOUSE, ...DMKT_WAREHOUSE]);
const stockMovements: WarehouseMovement[] = [];
const machines: Machine[] = structuredClone([...SAMPLE_MACHINES, ...DMKT_MACHINES]);
const productAttachments = mockDrawingsById(
  products.map((p) => p.id),
  "prod",
);
const semiAttachments = mockDrawingsById(
  semiProducts.map((s) => s.id),
  "semi",
);
for (const p of products) {
  if (p.attachments?.length) productAttachments.set(p.id, p.attachments);
  else p.attachments = productAttachments.get(p.id);
}
for (const s of semiProducts) {
  if (s.attachments?.length) semiAttachments.set(s.id, s.attachments);
  else s.attachments = semiAttachments.get(s.id);
}
const changeRequests: MachineChangeRequest[] = [];

function stripHeavy(atts: Attachment[] | undefined): Attachment[] | undefined {
  if (!atts?.length) return atts;
  return atts.map(({ contentBase64: _, ...meta }) => meta);
}

function hydrateStock(row: WarehouseStock): WarehouseStock {
  if (row.itemKind === "product") {
    return { ...row, product: products.find((p) => p.id === row.itemId) };
  }
  return { ...row, semiProduct: semiProducts.find((s) => s.id === row.itemId) };
}

function processesOf(bomId: string): BomProcess[] {
  return bomProcesses.filter((p) => p.bomId === bomId).sort((a, b) => a.sortOrder - b.sortOrder);
}

function bomsOfSemi(semiProductId: string): Bom[] {
  return boms
    .filter((b) => b.semiProductId === semiProductId)
    .map((b) => ({ ...b, processes: processesOf(b.id) }));
}

function ensureStock(itemKind: StockItemKind, itemId: string): WarehouseStock {
  let row = warehouse.find((w) => w.itemKind === itemKind && w.itemId === itemId);
  if (!row) {
    row = {
      id: id("ws"),
      warehouseId: MAIN_WAREHOUSE_ID,
      itemKind,
      itemId,
      qty: 0,
    };
    warehouse.push(row);
  }
  return row;
}

export const catalogStore = {
  listMachineGroups() {
    return [...machineGroups];
  },

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
  getProduct(pid: string) {
    return products.find((p) => p.id === pid) ?? null;
  },
  createProduct(input: Omit<Product, "id">) {
    const p: Product = { ...input, id: id("p") };
    products.push(p);
    ensureStock("product", p.id);
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
  searchSemiProducts(opts: EntityListQuery) {
    let base = semiProducts.filter((s) => s.active);
    if (opts.q && /^\s*p\d/i.test(opts.q) === false && opts.stage && opts.stage !== "all") {
      const team =
        opts.stage === "hot_forge" ? "t_hot" : opts.stage === "auto" ? "t_auto" : "t_asm";
      base = base.filter((s) =>
        bomsOfSemi(s.id).some((b) => b.processes?.some((p) => p.productionTeamId === team)),
      );
    }
    return paginateInMemory(base, {
      q: opts.q,
      page: opts.page,
      pageSize: opts.pageSize,
      match: (s, q) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
    });
  },
  getSemi(sid: string) {
    return semiProducts.find((s) => s.id === sid) ?? null;
  },
  createSemi(input: Omit<SemiProduct, "id">) {
    if (!products.find((p) => p.id === input.productId)) throw new Error("Không tìm thấy thành phẩm");
    const s: SemiProduct = {
      ...input,
      id: id("sp"),
      measurementSpecs: input.measurementSpecs ?? {},
    };
    semiProducts.push(s);
    ensureStock("semi_product", s.id);
    const bom: Bom = { id: id("bom"), name: `BOM ${s.name}`, semiProductId: s.id };
    boms.push(bom);
    return s;
  },
  updateSemi(sid: string, patch: Partial<SemiProduct>) {
    const i = semiProducts.findIndex((s) => s.id === sid);
    if (i < 0) throw new Error("Không tìm thấy BTP");
    semiProducts[i] = { ...semiProducts[i], ...patch, id: sid };
    return semiProducts[i];
  },

  listBoms(semiProductId: string): Bom[] {
    return bomsOfSemi(semiProductId);
  },
  /** Import: 1 BOM / BTP, nhiều quy trình trên BOM đó */
  upsertBom(semiProductId: string, name: string, processes: Array<Partial<BomProcess>>) {
    return this.replaceBoms(semiProductId, [{ name, processes }]);
  },
  replaceBoms(
    semiProductId: string,
    drafts: Array<{ id?: string; name: string; processes: Array<Partial<BomProcess>> }>,
  ) {
    if (!semiProducts.find((s) => s.id === semiProductId)) throw new Error("Không tìm thấy BTP");
    const existing = boms.filter((b) => b.semiProductId === semiProductId);
    const keepIds = new Set<string>();

    for (const draft of drafts) {
      const name = (draft.name || "").trim() || "BOM";
      let bom =
        draft.id && existing.find((b) => b.id === draft.id)
          ? existing.find((b) => b.id === draft.id)
          : undefined;
      if (!bom && drafts.length === 1 && existing.length === 1 && !draft.id) {
        bom = existing[0];
      }
      if (!bom) {
        bom = { id: id("bom"), name, semiProductId };
        boms.push(bom);
      } else {
        bom.name = name;
      }
      keepIds.add(bom.id);
      for (let i = bomProcesses.length - 1; i >= 0; i--) {
        if (bomProcesses[i].bomId === bom.id) bomProcesses.splice(i, 1);
      }
      (draft.processes ?? []).forEach((p, idx) => {
        const pname = (p.name || "").trim();
        if (!pname) return;
        bomProcesses.push({
          id: p.id || id("bp"),
          bomId: bom!.id,
          name: pname,
          productionTeamId: p.productionTeamId,
          machineGroupId: p.machineGroupId,
          quotaPerShift: Number(p.quotaPerShift) || 0,
          unitOfMeasureId: p.unitOfMeasureId,
          sortOrder: p.sortOrder ?? idx + 1,
        });
      });
    }

    for (const old of existing) {
      if (keepIds.has(old.id)) continue;
      for (let i = bomProcesses.length - 1; i >= 0; i--) {
        if (bomProcesses[i].bomId === old.id) bomProcesses.splice(i, 1);
      }
      const bi = boms.findIndex((b) => b.id === old.id);
      if (bi >= 0) boms.splice(bi, 1);
    }
    return bomsOfSemi(semiProductId);
  },

  /** Structure used by create-order + admin: semis of a product */
  listBom(productId: string): ProductStructureLine[] {
    return semiProducts
      .filter((s) => s.active && s.productId === productId)
      .map((s) => ({
        semiProductId: s.id,
        qtyPerUnit: 1,
        stockQty: ensureStock("semi_product", s.id).qty,
        semiProduct: s,
        boms: bomsOfSemi(s.id),
      }));
  },
  setBom(productId: string, lines: Array<{ semiProductId: string; qtyPerUnit?: number }>) {
    const keep = new Set(lines.map((l) => l.semiProductId));
    for (const s of semiProducts) {
      if (s.productId === productId) s.active = keep.has(s.id);
    }
    for (const line of lines) {
      const s = semiProducts.find((x) => x.id === line.semiProductId);
      if (s) {
        s.productId = productId;
        s.active = true;
      }
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

  importProductBom(
    rows: Array<{
      productCode: string;
      productName?: string;
      partCode: string;
      partName?: string;
      processSeq: number;
      processName: string;
      processStage?: string;
      teamCode?: string;
      machine?: string;
      qtyPerUnit?: number;
      quota?: string;
      techNote?: string;
      people?: number;
      productDescription?: string;
    }>,
  ) {
    if (!rows.length) throw new Error("File không có dòng dữ liệu");
    const errors: string[] = [];
    let productUpserts = 0;
    let semiUpserts = 0;
    let stepCount = 0;

    type Acc = {
      productCode: string;
      productName: string;
      productDescription: string;
      partCode: string;
      partName: string;
      processes: Array<{ seq: number; name: string; teamId?: string; quota: number }>;
    };
    const byProduct = new Map<string, Map<string, Acc>>();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const productCode = String(r.productCode ?? "").trim();
      const partCode = String(r.partCode ?? "").trim();
      const processName = String(r.processName ?? "").trim();
      if (!productCode) {
        errors.push(`Dòng ${i + 2}: thiếu mã thành phẩm`);
        continue;
      }
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
          productDescription: String(r.productDescription ?? "").trim(),
          partCode,
          partName: String(r.partName ?? partCode).trim() || partCode,
          processes: [],
        };
        parts.set(partCode || `__product__${productCode}`, part);
      }
      if (r.productName?.trim()) part.productName = r.productName.trim();
      if (r.productDescription?.trim()) part.productDescription = r.productDescription.trim();
      if (!partCode || !processName) continue;
      const blob = `${r.processStage ?? ""} ${r.teamCode ?? ""}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const teamId =
        blob.includes("tu dong") || blob.includes("auto")
          ? "t_auto"
          : blob.includes("lap rap") || blob.includes("assembly") || blob.includes("asm")
            ? "t_asm"
            : "t_hot";
      part.processes.push({
        seq: Math.max(1, Number(r.processSeq) || part.processes.length + 1),
        name: processName,
        teamId,
        quota: Number.parseFloat(String(r.quota ?? "0")) || 0,
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
          description: first.productDescription || "Nhập từ file danh mục",
          active: true,
        });
        productUpserts += 1;
      } else {
        this.updateProduct(product.id, {
          name: first.productName,
          description: first.productDescription || product.description,
          active: true,
        });
        productUpserts += 1;
      }
      for (const part of parts.values()) {
        if (!part.partCode || part.partCode.startsWith("__product__")) continue;
        let semi = this.findSemiByCode(part.partCode);
        if (!semi) {
          semi = this.createSemi({
            code: part.partCode,
            name: part.partName,
            productId: product.id,
            measurementSpecs: {},
            active: true,
          });
          semiUpserts += 1;
        } else {
          this.updateSemi(semi.id, { name: part.partName, productId: product.id, active: true });
          semiUpserts += 1;
          semi = this.getSemi(semi.id)!;
        }
        const procs = [...part.processes].sort((a, b) => a.seq - b.seq);
        if (!procs.length) continue;
        this.upsertBom(
          semi.id,
          `BOM ${part.partName}`,
          procs.map((p) => ({
            name: p.name,
            productionTeamId: p.teamId,
            quotaPerShift: p.quota,
            sortOrder: p.seq,
          })),
        );
      }
    }

    return {
      products: byProduct.size,
      parts: [...byProduct.values()].reduce(
        (s, m) => s + [...m.values()].filter((p) => p.partCode && !p.partCode.startsWith("__product__")).length,
        0,
      ),
      steps: stepCount,
      productUpserts,
      semiUpserts,
      errors,
      total: rows.length,
    };
  },

  listStock() {
    return warehouse.map(hydrateStock);
  },
  searchStock(opts: EntityListQuery) {
    let rows = this.listStock();
    const kind = opts.itemKind && opts.itemKind !== "all"
      ? opts.itemKind
      : opts.stage && opts.stage !== "all"
        ? (opts.stage === "assembly" ? "product" : "semi_product")
        : undefined;
    if (kind) rows = rows.filter((r) => r.itemKind === kind);
    return paginateInMemory(rows, {
      q: opts.q,
      page: opts.page,
      pageSize: opts.pageSize,
      match: (r, q) => {
        const label =
          r.itemKind === "product"
            ? `${r.product?.code ?? ""} ${r.product?.name ?? ""}`
            : `${r.semiProduct?.code ?? ""} ${r.semiProduct?.name ?? ""}`;
        return label.toLowerCase().includes(q);
      },
    });
  },
  setStock(itemId: string, qty: number, note?: string, createdBy?: string, itemKind: StockItemKind = "semi_product") {
    const row = ensureStock(itemKind, itemId);
    const before = row.qty;
    row.qty = qty;
    row.updatedAt = new Date().toISOString();
    if (before !== qty) {
      stockMovements.unshift({
        id: id("wm"),
        warehouseId: MAIN_WAREHOUSE_ID,
        itemKind,
        itemId,
        delta: qty - before,
        qtyAfter: qty,
        note: note ?? "Kiểm kê tồn kho",
        createdBy: createdBy || undefined,
        createdAt: new Date().toISOString(),
      });
    }
    return hydrateStock(row);
  },
  consumeStock(semiProductId: string, qty: number) {
    const row = ensureStock("semi_product", semiProductId);
    const before = row.qty;
    row.qty = Math.max(0, row.qty - qty);
    row.updatedAt = new Date().toISOString();
    if (before !== row.qty) {
      stockMovements.unshift({
        id: id("wm"),
        warehouseId: MAIN_WAREHOUSE_ID,
        itemKind: "semi_product",
        itemId: semiProductId,
        delta: row.qty - before,
        qtyAfter: row.qty,
        note: "Xuất kho (lệnh SX)",
        createdAt: new Date().toISOString(),
      });
    }
  },
  adjustStock(itemId: string, delta: number, note = "", createdBy = "", itemKind: StockItemKind = "semi_product") {
    const row = ensureStock(itemKind, itemId);
    row.qty = Math.max(0, row.qty + delta);
    row.updatedAt = new Date().toISOString();
    const movement: WarehouseMovement = {
      id: id("wm"),
      warehouseId: MAIN_WAREHOUSE_ID,
      itemKind,
      itemId,
      delta,
      qtyAfter: row.qty,
      note: note || (delta >= 0 ? "Nhập kho" : "Xuất kho"),
      createdBy: createdBy || undefined,
      createdAt: new Date().toISOString(),
    };
    stockMovements.unshift(movement);
    return { stock: hydrateStock(row), movement };
  },
  listMovements(limit = 50) {
    return stockMovements.slice(0, limit).map((m) => ({
      ...m,
      ...(m.itemKind === "product"
        ? { product: products.find((p) => p.id === m.itemId) }
        : { semiProduct: semiProducts.find((s) => s.id === m.itemId) }),
    }));
  },

  listMachines() {
    return machines.filter((m) => m.active).map(aliasMachine);
  },
  listAllMachines() {
    return machines.map(aliasMachine);
  },
  searchMachines(opts: { q?: string; page?: number; pageSize?: number; activeOnly?: boolean }) {
    const base = opts.activeOnly === false ? machines : machines.filter((m) => m.active);
    return paginateInMemory(base.map(aliasMachine), {
      q: opts.q,
      page: opts.page,
      pageSize: opts.pageSize,
      match: (m, q) =>
        m.name.toLowerCase().includes(q) ||
        (m.accountingCode ?? "").toLowerCase().includes(q) ||
        (m.code ?? "").toLowerCase().includes(q),
    });
  },
  getMachine(mid: string) {
    const m = machines.find((x) => x.id === mid);
    return m ? aliasMachine(m) : null;
  },
  createMachine(input: Omit<Machine, "id">) {
    const accountingCode = (input.accountingCode || input.code || "").trim();
    const productionTeamId = input.productionTeamId || input.teamId;
    const m: Machine = {
      ...input,
      id: id("m"),
      accountingCode,
      productionTeamId,
      specs: input.specs ?? {},
    };
    machines.push(m);
    return aliasMachine(m);
  },
  updateMachine(mid: string, patch: Partial<Machine>) {
    const i = machines.findIndex((m) => m.id === mid);
    if (i < 0) throw new Error("Không tìm thấy máy");
    const accountingCode = patch.accountingCode ?? patch.code ?? machines[i].accountingCode;
    const productionTeamId = patch.productionTeamId ?? patch.teamId ?? machines[i].productionTeamId;
    machines[i] = { ...machines[i], ...patch, accountingCode, productionTeamId, id: mid };
    return aliasMachine(machines[i]);
  },
  deleteMachine(mid: string) {
    const i = machines.findIndex((m) => m.id === mid);
    if (i < 0) throw new Error("Không tìm thấy máy");
    machines[i].active = false;
    return aliasMachine(machines[i]);
  },

  listChangeRequests(filter?: { status?: string; target?: string }) {
    return changeRequests.filter((r) => {
      if (filter?.status && r.status !== filter.status) return false;
      if (filter?.target && r.target !== filter.target) return false;
      return true;
    });
  },
  searchChangeRequests(query: EntityListQuery): PagedResult<MachineChangeRequest> {
    const rows = this.listChangeRequests({
      status: query.status,
      target: query.target,
    });
    return paginateInMemory(rows, {
      q: query.q,
      page: query.page,
      pageSize: query.pageSize,
      match: (r, q) =>
        r.requestedName.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        (r.fromMachine ?? "").toLowerCase().includes(q) ||
        (r.toMachine ?? "").toLowerCase().includes(q),
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
    if (!input.contentBase64 && !input.url) {
      throw new Error("Thiếu nội dung file (ảnh hoặc đường dẫn)");
    }
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
    if (!input.contentBase64 && !input.url) {
      throw new Error("Thiếu nội dung file (ảnh hoặc đường dẫn)");
    }
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
