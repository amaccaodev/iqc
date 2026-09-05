/**
 * In-memory API cho VITE_DEMO_MODE / ?demo=1 — đủ để duyệt toàn bộ UI không cần backend.
 */
import type {
  Attachment,
  Bom,
  BomProcess,
  DeviceLoginRequest,
  LoginRequest,
  LoginResponse,
  Machine,
  MachineChangeRequest,
  MachineIncident,
  Notification,
  OvertimeRequest,
  ProductionOrder,
  ProductionStat,
  Product,
  ProductStructureLine,
  QCComplaint,
  SemiProduct,
  ShiftClose,
  ShiftUnlockRequest,
  User,
  UserPublic,
  WarehouseMovement,
  WarehouseStock,
} from "@shared/types";
import { TEAMS } from "@shared/constants/teams";
import { parseListQueryFromRequest } from "@shared/utils/listQuery";
import { paginateInMemory } from "@shared/utils/pagedList";
import { assertCanCreateShiftClose, assertCanEditShiftClose, assertCanRequestUnlock, assertCanSubmitWorkerRow } from "@shared/utils/shiftCloseGuard";
import { measurementSpecsToMaterialSpecs, validateEntryRows } from "@shared/utils/specValidation";
import { SEED_ORDERS, SEED_USERS } from "../../backend/src/data/seed";
import {
  DEMO_BOM_PROCESSES,
  DEMO_BOMS,
  DEMO_MACHINES,
  DEMO_PRODUCTS,
  DEMO_SEMI,
  DEMO_WAREHOUSE,
} from "./demoCatalog";
import { MOCK_INCIDENTS, MOCK_NOTIFICATIONS } from "./workflowSeed";
import { mockDrawingsById } from "@shared/data/sampleInspection";
import { withAttachmentPreview } from "@shared/utils/attachments";

function clone<T>(v: T): T {
  return structuredClone(v);
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function toPublic(u: User): UserPublic {
  const { password: _, ...rest } = u;
  return rest;
}

function parseQuery(pathWithQs: string) {
  const qIndex = pathWithQs.indexOf("?");
  const path = qIndex >= 0 ? pathWithQs.slice(0, qIndex) : pathWithQs;
  const qs = qIndex >= 0 ? pathWithQs.slice(qIndex + 1) : "";
  const sp = new URLSearchParams(qs);
  const q: Record<string, string | undefined> = {};
  sp.forEach((v, k) => {
    q[k] = v;
  });
  return { path, sp, list: parseListQueryFromRequest(q) };
}

function parseBody<T>(raw?: string | null): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

const users: User[] = clone(SEED_USERS);
const orders: ProductionOrder[] = clone(SEED_ORDERS);
const products: Product[] = clone(DEMO_PRODUCTS);
const semis: SemiProduct[] = clone(DEMO_SEMI);
const warehouse: WarehouseStock[] = clone(DEMO_WAREHOUSE);
const movements: WarehouseMovement[] = [];
const machines: Machine[] = clone(DEMO_MACHINES);
const catalogBoms: Bom[] = clone(DEMO_BOMS);
const catalogProcesses: BomProcess[] = clone(DEMO_BOM_PROCESSES);
const changeRequests: MachineChangeRequest[] = [];
const incidents: MachineIncident[] = clone(MOCK_INCIDENTS);
const notifications: Notification[] = clone(MOCK_NOTIFICATIONS);
const overtime: OvertimeRequest[] = [];
const complaints: QCComplaint[] = [];
const stats: ProductionStat[] = [];
const shiftCloses: ShiftClose[] = [
  {
    id: "sc-yesterday",
    workerId: "u6",
    workerName: "Cường 2T3",
    orderId: "o1",
    bomId: "b-sp-novo-vg-15-01-1",
    productId: "p1",
    productName: "Van góc 1C sau ĐH NOVO 15 tay ABS",
    partName: "Nắp van góc novo 15",
    passQty: 95,
    failQty: 1,
    note: "Ca hôm qua",
    status: "approved",
    rateVnd: 2500,
    amountVnd: 237500,
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    teamleadBy: "Phạm Văn Chí",
    teamleadAt: new Date(Date.now() - 86_400_000 + 3_600_000).toISOString(),
    qcBy: "T.V.Huấn",
    qcAt: new Date(Date.now() - 86_400_000 + 7_200_000).toISOString(),
    supervisorBy: "Lê Văn Quốc",
    supervisorAt: new Date(Date.now() - 86_400_000 + 10_800_000).toISOString(),
  },
  {
    id: "sc-pending-nga",
    workerId: "u7",
    workerName: "Nga 3/43",
    orderId: "o1",
    bomId: "b-sp-novo-vg-15-02-1",
    productId: "p1",
    productName: "Van góc 1C sau ĐH NOVO 15 tay ABS",
    partName: "Thân van góc 1C sau ĐH novo 15",
    passQty: 40,
    failQty: 0,
    note: "Ca sáng — chờ tổ trưởng (demo sửa phiếu)",
    status: "pending_teamlead",
    rateVnd: 2200,
    amountVnd: 88000,
    createdAt: new Date().toISOString(),
  },
  {
    id: "sc-approved-today",
    workerId: "u6",
    workerName: "Cường 2T3",
    orderId: "o-sheet",
    bomId: "b-longden-ht",
    productId: "p-lx20",
    productName: "Van 1 chiều lò xo NOVO 20",
    partName: "Long đen hãm gioăng",
    passQty: 120,
    failQty: 0,
    note: "Ca sáng — tổ trưởng đã duyệt (demo mở khóa)",
    status: "pending_qc",
    rateVnd: 2500,
    amountVnd: 0,
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
    teamleadBy: "Phạm Văn Chí",
    teamleadAt: new Date(Date.now() - 1_800_000).toISOString(),
  },
];
const shiftUnlocks: ShiftUnlockRequest[] = [];
const payrollRates: Array<{ id: string; userId: string; productId: string; rateVnd: number }> = [
  { id: "pr1", userId: "u6", productId: "p1", rateVnd: 2500 },
  { id: "pr2", userId: "u7", productId: "p1", rateVnd: 2500 },
  { id: "pr3", userId: "u6", productId: "p-lx20", rateVnd: 2500 },
];
const ATT_LS_PROD = "iqc_demo_prod_att";
const ATT_LS_SEMI = "iqc_demo_semi_att";

function loadAttMap(key: string): Map<string, Attachment[]> | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entries = JSON.parse(raw) as [string, Attachment[]][];
    if (!Array.isArray(entries)) return null;
    return new Map(entries.map(([id, list]) => [id, (list ?? []).map(withAttachmentPreview)]));
  } catch {
    return null;
  }
}

function persistAttMaps() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(ATT_LS_PROD, JSON.stringify([...productAttachments.entries()]));
    localStorage.setItem(ATT_LS_SEMI, JSON.stringify([...semiAttachments.entries()]));
  } catch {
    /* quota / private mode */
  }
}

const productAttachments =
  loadAttMap(ATT_LS_PROD) ??
  mockDrawingsById(
    products.map((p) => p.id),
    "prod",
  );
const semiAttachments =
  loadAttMap(ATT_LS_SEMI) ??
  mockDrawingsById(
    semis.map((s) => s.id),
    "semi",
  );
for (const p of products) {
  if (p.attachments?.length && !productAttachments.get(p.id)?.length) {
    productAttachments.set(p.id, p.attachments);
  } else {
    p.attachments = productAttachments.get(p.id);
  }
}
for (const s of semis) {
  if (s.attachments?.length && !semiAttachments.get(s.id)?.length) {
    semiAttachments.set(s.id, s.attachments);
  } else {
    s.attachments = semiAttachments.get(s.id);
  }
}
persistAttMaps();
const deviceRequests: DeviceLoginRequest[] = [];

function findOrder(id: string) {
  return orders.find((o) => o.id === id);
}

function findBom(orderId: string, bomId: string) {
  const order = findOrder(orderId);
  if (!order) return null;
  const bom = order.boms.find((b) => b.id === bomId);
  return bom ? { order, bom } : null;
}

function stockWithSemi() {
  return warehouse.map((w) => ({
    ...w,
    product: w.itemKind === "product" ? products.find((p) => p.id === w.itemId) : undefined,
    semiProduct: w.itemKind === "semi_product" ? semis.find((s) => s.id === w.itemId) : undefined,
  }));
}

function catalogBomsOf(semiProductId: string) {
  return catalogBoms.filter((b) => b.semiProductId === semiProductId).map((b) => ({
    ...b,
    processes: catalogProcesses.filter((p) => p.bomId === b.id).sort((a, c) => a.sortOrder - c.sortOrder),
  }));
}

function consumeWarehouse(semiProductId: string, qty: number) {
  const want = Math.max(0, Number(qty) || 0);
  const row = warehouse.find((w) => w.itemKind === "semi_product" && w.itemId === semiProductId);
  const onHand = row?.qty ?? 0;
  const take = Math.min(want, onHand);
  if (row && take > 0) row.qty = onHand - take;
  return { used: take, left: Math.max(0, onHand - take) };
}

function jobsFromDemoSemi(
  semi: SemiProduct,
  produceQty: number,
  processIds?: string[],
  stock?: { useFromStock: boolean; stockUseQty: number },
): ProductionOrder["boms"] {
  const specs = measurementSpecsToMaterialSpecs(semi.measurementSpecs ?? {});
  const specCols = specs.map((s) => s.label);
  while (specCols.length < 11) specCols.push("");
  const pick = processIds?.length ? new Set(processIds) : null;
  const jobs: ProductionOrder["boms"] = [];
  const stockUse = stock?.useFromStock ? Math.max(0, stock.stockUseQty) : 0;
  const consumed = stockUse > 0 ? consumeWarehouse(semi.id, stockUse) : { used: 0, left: 0 };
  if (produceQty <= 0) {
    if (consumed.used > 0) {
      jobs.push({
        id: uid("b"),
        bomCode: "",
        partCode: semi.code,
        partName: semi.name,
        partGroup: semi.name,
        rawMaterial: "",
        machine: "",
        process: "Xuất kho",
        processSeq: 0,
        targetQty: 0,
        stockUseQty: consumed.used,
        stockLeftQty: consumed.left,
        useFromStock: true,
        passQty: 0,
        failQty: 0,
        assignedTeamId: "",
        assignedTeamName: "",
        assignedWorkers: [],
        status: "qc_passed",
        specCols,
        materialSpecs: specs.length ? specs : undefined,
        techNote: `Dùng kho: ${consumed.used} · Còn lại: ${consumed.left}`,
        workerEntries: [],
        semiProductId: semi.id,
        attachments: semiAttachments.get(semi.id) ?? [],
      });
    }
    return jobs;
  }
  const recipes = catalogBomsOf(semi.id);
  const boms = pick
    ? recipes.filter((bom) => (bom.processes ?? []).some((p) => pick.has(p.id)))
    : recipes.slice(0, 1);
  for (const bom of boms) {
    const steps = (bom.processes ?? []).filter((p) => !pick || pick.has(p.id));
    steps.forEach((step, idx) => {
      jobs.push({
        id: uid("b"),
        bomCode: "",
        partCode: semi.code,
        partName: semi.name,
        partGroup: semi.name,
        rawMaterial: "",
        machine: "",
        process: step.name,
        processSeq: step.sortOrder || idx + 1,
        catalogBomId: bom.id,
        catalogBomName: bom.name,
        catalogProcessId: step.id,
        targetQty: produceQty,
        stockUseQty: jobs.length === 0 ? consumed.used : 0,
        stockLeftQty: jobs.length === 0 && stock?.useFromStock ? consumed.left : undefined,
        useFromStock: jobs.length === 0 ? Boolean(stock?.useFromStock) : false,
        passQty: 0,
        failQty: 0,
        assignedTeamId: "",
        assignedTeamName: "",
        assignedWorkers: [],
        status: "unassigned" as const,
        specCols,
        materialSpecs: specs.length ? specs : undefined,
        techNote: "",
        workerEntries: [],
        semiProductId: semi.id,
        attachments: semiAttachments.get(semi.id) ?? [],
      });
    });
  }
  if (pick && !jobs.length) return [];
  if (!jobs.length) {
    return [
      {
        id: uid("b"),
        bomCode: "",
        partCode: semi.code,
        partName: semi.name,
        partGroup: semi.name,
        rawMaterial: "",
        machine: "",
        process: "",
        processSeq: 1,
        targetQty: produceQty,
        stockUseQty: consumed.used,
        stockLeftQty: stock?.useFromStock ? consumed.left : undefined,
        useFromStock: Boolean(stock?.useFromStock),
        passQty: 0,
        failQty: 0,
        assignedTeamId: "",
        assignedTeamName: "",
        assignedWorkers: [],
        status: "unassigned" as const,
        specCols,
        materialSpecs: specs.length ? specs : undefined,
        techNote: "",
        workerEntries: [],
        semiProductId: semi.id,
        attachments: semiAttachments.get(semi.id) ?? [],
      },
    ];
  }
  return jobs;
}

export async function handleDemoApi<T>(
  method: string,
  pathWithQs: string,
  bodyRaw?: string | null,
): Promise<T> {
  const m = method.toUpperCase();
  const { path, sp, list } = parseQuery(pathWithQs);
  const body = parseBody<Record<string, unknown>>(bodyRaw);

  // ── Auth ──────────────────────────────────────────────────────────────
  if (path === "/auth/login" && m === "POST") {
    const req = (body ?? {}) as Partial<LoginRequest>;
    const emp = String(req.employeeId ?? "").trim();
    const pwd = String(req.password ?? "");
    const user = users.find((u) => u.employeeId === emp && u.active);
    if (!user || user.password !== pwd) throw new Error("Sai mã NV hoặc mật khẩu (demo)");
    const result: LoginResponse = {
      user: toPublic(user),
      token: `demo-token-${user.id}`,
      status: "ok",
    };
    return result as T;
  }
  if (path === "/auth/refresh" && m === "POST") {
    const raw = localStorage.getItem("iqc_user");
    const token = localStorage.getItem("iqc_token");
    if (!raw || !token?.startsWith("demo-")) throw new Error("Chưa đăng nhập demo");
    const stored = JSON.parse(raw) as UserPublic;
    const user = users.find((u) => u.id === stored.id);
    if (!user) throw new Error("Session demo hết hạn");
    return { user: toPublic(user), token: `demo-token-${user.id}`, status: "ok" } as T;
  }
  if (path === "/auth/logout" && m === "POST") return undefined as T;
  if (path === "/auth/device-requests" && m === "GET") return deviceRequests as T;
  if (path.startsWith("/auth/device-requests/") && path.endsWith("/review") && m === "POST") {
    return (deviceRequests[0] ?? null) as T;
  }
  if (path === "/auth/change-password" && m === "POST") return { ok: true } as T;

  // ── Users / teams ─────────────────────────────────────────────────────
  if (path === "/users" && m === "GET") {
    const items = users.filter((u) => u.active).map(toPublic);
    if (sp.has("page") || sp.has("q") || sp.has("pageSize")) {
      return paginateInMemory(items, {
        ...list,
        match: (u, q) =>
          u.name.toLowerCase().includes(q) ||
          u.employeeId.toLowerCase().includes(q) ||
          (u.department ?? "").toLowerCase().includes(q),
      }) as T;
    }
    return items as T;
  }
  if (path === "/users" && m === "POST") {
    const input = body as Partial<User>;
    const u: User = {
      id: uid("u"),
      employeeId: String(input.employeeId ?? ""),
      name: String(input.name ?? ""),
      password: String(input.password ?? "123456"),
      role: (input.role as User["role"]) ?? "worker",
      teamId: String(input.teamId ?? ""),
      department: String(input.department ?? ""),
      phone: String(input.phone ?? ""),
      active: true,
    };
    users.push(u);
    return toPublic(u) as T;
  }
  if (/^\/users\/[^/]+$/.test(path) && m === "PATCH") {
    const id = path.split("/")[2];
    const i = users.findIndex((u) => u.id === id);
    if (i < 0) throw new Error("Không tìm thấy user");
    users[i] = { ...users[i], ...(body as Partial<User>), id };
    return toPublic(users[i]) as T;
  }
  if (/^\/users\/[^/]+\/toggle$/.test(path) && m === "PATCH") {
    const id = path.split("/")[2];
    const i = users.findIndex((u) => u.id === id);
    if (i < 0) throw new Error("Không tìm thấy user");
    users[i].active = !users[i].active;
    return toPublic(users[i]) as T;
  }
  if (path === "/teams" && m === "GET") return TEAMS as T;

  // ── Orders ────────────────────────────────────────────────────────────
  if (path === "/orders" && m === "GET") {
    let rows = [...orders];
    const status = sp.get("status");
    if (status) rows = rows.filter((o) => o.status === status);
    if (sp.has("page") || sp.has("q") || sp.has("pageSize")) {
      return paginateInMemory(rows, {
        ...list,
        match: (o, q) =>
          o.orderNo.toLowerCase().includes(q) ||
          o.productLine.toLowerCase().includes(q) ||
          (o.customer ?? "").toLowerCase().includes(q),
      }) as T;
    }
    return rows as T;
  }
  if (path === "/orders" && m === "POST") {
    const input = body as Partial<ProductionOrder>;
    const created: ProductionOrder = {
      id: uid("o"),
      orderNo: String(input.orderNo ?? `LSX-DEMO-${orders.length + 1}`),
      productLine: String(input.productLine ?? "SP demo"),
      customer: String(input.customer ?? ""),
      targetQty: Number(input.targetQty ?? 0),
      createdBy: String(input.createdBy ?? "Demo"),
      createdAt: new Date().toLocaleDateString("vi-VN"),
      deadline: String(input.deadline ?? ""),
      priority: (input.priority as ProductionOrder["priority"]) ?? "normal",
      status: "pending_approval",
      pendingApproval: true,
      attachments: input.attachments ?? [],
      boms: input.boms ?? [],
      productId: input.productId,
    };
    orders.unshift(created);
    return created as T;
  }
  if (path === "/orders/from-product" && m === "POST") {
    const productId = String(body?.productId ?? "");
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error("Không tìm thấy SP");
    const reqLines = (body?.lines as Array<{
      semiProductId: string;
      produceQty?: number;
      processIds?: string[];
      useFromStock?: boolean;
      stockUseQty?: number;
    }>) ?? [];
    const source = reqLines.length
      ? reqLines
      : semis.filter((s) => s.active && s.productId === productId).map((s) => ({
          semiProductId: s.id,
          produceQty: Number(body?.finishedQty ?? body?.targetQty ?? 100),
          useFromStock: false,
          stockUseQty: 0,
        }));
    const boms = source.flatMap((line) => {
      const semi = semis.find((s) => s.id === line.semiProductId);
      if (!semi) return [];
      return jobsFromDemoSemi(
        semi,
        Number(line.produceQty ?? body?.finishedQty ?? 100),
        "processIds" in line ? line.processIds : undefined,
        {
          useFromStock: Boolean("useFromStock" in line && line.useFromStock),
          stockUseQty: Number("stockUseQty" in line ? line.stockUseQty : 0) || 0,
        },
      );
    });
    const created: ProductionOrder = {
      id: uid("o"),
      orderNo: `LSX-DEMO-${Date.now().toString(36).toUpperCase()}`,
      productLine: product.name,
      productId: product.id,
      customer: String(body?.customer ?? "Nội bộ"),
      targetQty: Number(body?.finishedQty ?? body?.targetQty ?? 100),
      createdBy: String(body?.createdBy ?? "Demo"),
      createdAt: new Date().toLocaleDateString("vi-VN"),
      deadline: String(body?.deadline ?? ""),
      priority: "normal",
      status: "pending_approval",
      pendingApproval: true,
      attachments: [],
      boms,
    };
    orders.unshift(created);
    return created as T;
  }
  if (path === "/orders/from-products-batch" && m === "POST") {
    const items = (body?.items as Array<{
      productId: string;
      finishedQty: number;
      lines?: Array<{
        semiProductId: string;
        produceQty?: number;
        processIds?: string[];
        useFromStock?: boolean;
        stockUseQty?: number;
      }>;
    }>) ?? [];
    const created = items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`SP ${item.productId} không tồn tại`);
      const source = item.lines?.length
        ? item.lines
        : semis.filter((s) => s.active && s.productId === item.productId).map((s) => ({
            semiProductId: s.id,
            produceQty: item.finishedQty,
            useFromStock: false,
            stockUseQty: 0,
          }));
      const boms = source.flatMap((line) => {
        const semi = semis.find((s) => s.id === line.semiProductId);
        if (!semi) return [];
        return jobsFromDemoSemi(
          semi,
          Number(line.produceQty ?? item.finishedQty),
          "processIds" in line ? line.processIds : undefined,
          {
            useFromStock: Boolean("useFromStock" in line && line.useFromStock),
            stockUseQty: Number("stockUseQty" in line ? line.stockUseQty : 0) || 0,
          },
        );
      });
      const order: ProductionOrder = {
        id: uid("o"),
        orderNo: `LSX-DEMO-${uid("x").slice(-4)}`,
        productLine: product.name,
        productId: item.productId,
        customer: "Nội bộ",
        targetQty: Number(item.finishedQty ?? 50),
        createdBy: String(body?.createdBy ?? "Demo"),
        createdAt: new Date().toLocaleDateString("vi-VN"),
        deadline: String(body?.deadline ?? ""),
        priority: "normal",
        status: "pending_approval",
        pendingApproval: true,
        attachments: [],
        boms,
      };
      orders.unshift(order);
      return order;
    });
    return created as T;
  }
  if (/^\/orders\/[^/]+$/.test(path) && m === "GET") {
    const id = path.split("/")[2];
    const order = findOrder(id);
    if (!order) throw new Error("Không tìm thấy lệnh");
    return order as T;
  }
  if (/^\/orders\/[^/]+\/approve$/.test(path) && m === "POST") {
    const id = path.split("/")[2];
    const order = findOrder(id);
    if (!order) throw new Error("Không tìm thấy lệnh");
    order.status = "approved";
    order.pendingApproval = false;
    return order as T;
  }
  if (/^\/orders\/[^/]+\/reject$/.test(path) && m === "POST") {
    const id = path.split("/")[2];
    const order = findOrder(id);
    if (!order) throw new Error("Không tìm thấy lệnh");
    order.status = "draft";
    order.pendingApproval = false;
    if (order.boms.some((b) => b.assignedTeamId)) {
      order.status = "approved";
    }
    return order as T;
  }
  if (/^\/orders\/[^/]+\/complete$/.test(path) && m === "POST") {
    const id = path.split("/")[2];
    const order = findOrder(id);
    if (!order) throw new Error("Không tìm thấy lệnh");
    order.status = "completed";
    return order as T;
  }
  if (/^\/orders\/[^/]+\/audit$/.test(path) && m === "GET") return [] as T;

  const bomAssign = path.match(/^\/orders\/([^/]+)\/boms\/([^/]+)\/assign$/);
  if (bomAssign && m === "POST") {
    const hit = findBom(bomAssign[1], bomAssign[2]);
    if (!hit) throw new Error("Không tìm thấy BOM");
    hit.bom.assignedTeamId = String(body?.teamId ?? body?.assignedTeamId ?? "");
    hit.bom.assignedTeamName = String(body?.teamName ?? body?.assignedTeamName ?? "");
    hit.bom.status = "assigned";
    return hit.order as T;
  }
  const bomWorkers = path.match(/^\/orders\/([^/]+)\/boms\/([^/]+)\/assign-workers$/);
  if (bomWorkers && m === "POST") {
    const hit = findBom(bomWorkers[1], bomWorkers[2]);
    if (!hit) throw new Error("Không tìm thấy BOM");
    const names = (body?.workerNames as string[]) ?? (body?.assignedWorkers as string[]) ?? [];
    hit.bom.assignedWorkers = names;
    if (Array.isArray(body?.workerAssignments)) {
      hit.bom.workerAssignments = body.workerAssignments as typeof hit.bom.workerAssignments;
    }
    return hit.order as T;
  }
  const teamReport = path.match(/^\/orders\/([^/]+)\/boms\/([^/]+)\/team-report$/);
  if (teamReport && m === "POST") {
    const hit = findBom(teamReport[1], teamReport[2]);
    if (!hit) throw new Error("Không tìm thấy BOM");
    hit.bom.passQty = Number(body?.passQty ?? hit.bom.passQty);
    hit.bom.failQty = Number(body?.failQty ?? hit.bom.failQty);
    hit.bom.status = "team_reported";
    hit.bom.teamSummary = {
      passQty: hit.bom.passQty,
      failQty: hit.bom.failQty,
      note: String(body?.note ?? ""),
      reportedBy: String(body?.reportedBy ?? "Demo"),
      reportedAt: new Date().toLocaleDateString("vi-VN"),
    };
    return hit.order as T;
  }
  const qcReport = path.match(/^\/orders\/([^/]+)\/boms\/([^/]+)\/qc-report$/);
  if (qcReport && m === "POST") {
    const hit = findBom(qcReport[1], qcReport[2]);
    if (!hit) throw new Error("Không tìm thấy BOM");
    hit.bom.status = "qc_passed";
    hit.bom.qcReport = {
      passQty: Number(body?.passQty ?? hit.bom.passQty),
      failQty: Number(body?.failQty ?? 0),
      complaint: String(body?.complaint ?? ""),
      status: "approved",
      inspectedBy: String(body?.inspectedBy ?? "QC Demo"),
      inspectedAt: new Date().toLocaleDateString("vi-VN"),
    };
    return hit.order as T;
  }
  const workerRow = path.match(/^\/orders\/([^/]+)\/boms\/([^/]+)\/worker-row$/);
  if (workerRow && m === "POST") {
    const hit = findBom(workerRow[1], workerRow[2]);
    if (!hit) throw new Error("Không tìm thấy BOM");
    const workerId = String(body?.workerId ?? "");
    const workerName = String(body?.workerName ?? "CN Demo");
    assertCanSubmitWorkerRow(shiftCloses, shiftUnlocks, {
      workerId,
      orderId: hit.order.id,
      bomId: hit.bom.id,
    });
    let entry = hit.bom.workerEntries.find((e) => e.workerId === workerId);
    if (!entry) {
      entry = {
        id: uid("we"),
        workerId,
        workerName,
        submittedAt: new Date().toLocaleString("vi-VN"),
        rows: [],
      };
      hit.bom.workerEntries.push(entry);
    }
    const row = {
      dims: (body?.dims as string[]) ?? [],
      ngoaiQuan: String(body?.ngoaiQuan ?? "Đạt"),
    };
    entry.rows.push({
      tt: entry.rows.length + 1,
      ...row,
    });

    // Chỉ báo tổ trưởng khi số đo ngoài chuẩn
    const check = validateEntryRows(
      hit.bom.specCols,
      [row],
      hit.bom.materialSpecs,
    );
    const bad = (check.results[0] ?? []).filter((v) => !v.valid);
    if (bad.length > 0) {
      const detail = bad
        .map((v) => `${v.label}: ${v.value}${v.warning ? ` (${v.warning})` : ""}`)
        .join("; ");
      const spNo = entry.rows.length;
      for (const u of users.filter((x) => x.role === "teamlead" && x.active)) {
        notifications.unshift({
          id: uid("n"),
          userId: u.id,
          type: "order",
          refId: hit.order.id,
          refType: "measurement_error",
          title: "Số đo ngoài chuẩn",
          body: `${workerName} — ${hit.bom.partName} (SP #${spNo}): ${detail}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return { order: hit.order, row: entry.rows[entry.rows.length - 1] } as T;
  }
  const workerEntry = path.match(/^\/orders\/([^/]+)\/boms\/([^/]+)\/worker-entry$/);
  if (workerEntry && m === "POST") {
    const hit = findBom(workerEntry[1], workerEntry[2]);
    if (!hit) throw new Error("Không tìm thấy BOM");
    return hit.order as T;
  }
  const shiftCloseBom = path.match(/^\/orders\/([^/]+)\/boms\/([^/]+)\/worker-shift-close$/);
  if (shiftCloseBom && m === "POST") {
    const hit = findBom(shiftCloseBom[1], shiftCloseBom[2]);
    if (!hit) throw new Error("Không tìm thấy BOM");
    const workerId = String(body?.workerId ?? "");
    assertCanCreateShiftClose(shiftCloses, shiftUnlocks, {
      workerId,
      orderId: hit.order.id,
      bomId: hit.bom.id,
    });
    const passQty = Number(body?.passQty ?? body?.qty ?? 0);
    const rateVnd = Number(body?.rateVnd ?? 2500);
    const closeRow = {
      id: uid("sc"),
      workerId,
      workerName: String(body?.workerName ?? body?.reportedBy ?? ""),
      orderId: hit.order.id,
      bomId: hit.bom.id,
      productId: hit.order.productId ?? "p1",
      productName: hit.order.productLine,
      partName: hit.bom.partName,
      passQty,
      failQty: Number(body?.failQty ?? 0),
      note: String(body?.note ?? ""),
      status: "pending_teamlead" as const,
      rateVnd,
      amountVnd: 0,
      createdAt: new Date().toISOString(),
    };
    shiftCloses.unshift(closeRow);
    for (const u of users.filter((x) => x.role === "teamlead" && x.active)) {
      notifications.unshift({
        id: uid("n"),
        userId: u.id,
        type: "shift",
        refId: closeRow.id,
        refType: "shift_close",
        title: "Chốt ca chờ kiểm tra",
        body: `${closeRow.workerName} chốt ${closeRow.passQty} đạt / ${closeRow.failQty} hỏng — ${closeRow.partName}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
    return hit.order as T;
  }

  // ── Catalog ───────────────────────────────────────────────────────────
  if (path === "/products" && m === "GET") {
    const active = products.filter((p) => p.active);
    if (sp.has("page") || sp.has("q") || sp.has("pageSize")) {
      return paginateInMemory(active, {
        ...list,
        match: (p, q) =>
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      }) as T;
    }
    return active as T;
  }
  if (path === "/products" && m === "POST") {
    const p: Product = {
      id: uid("p"),
      code: String(body?.code ?? ""),
      name: String(body?.name ?? ""),
      description: String(body?.description ?? ""),
      active: true,
    };
    products.push(p);
    return p as T;
  }
  if (/^\/products\/[^/]+$/.test(path) && m === "PATCH") {
    const id = path.split("/")[2];
    const i = products.findIndex((p) => p.id === id);
    if (i < 0) throw new Error("Không tìm thấy SP");
    products[i] = { ...products[i], ...(body as Partial<Product>), id };
    return products[i] as T;
  }
  if (/^\/products\/[^/]+$/.test(path) && m === "DELETE") {
    const id = path.split("/")[2];
    const i = products.findIndex((p) => p.id === id);
    if (i < 0) throw new Error("Không tìm thấy SP");
    products[i].active = false;
    return products[i] as T;
  }
  if (/^\/products\/[^/]+\/bom$/.test(path) && m === "GET") {
    const productId = path.split("/")[2];
    return semis
      .filter((s) => s.active && s.productId === productId)
      .map((s) => ({
        semiProductId: s.id,
        qtyPerUnit: 1,
        stockQty: warehouse.find((w) => w.itemKind === "semi_product" && w.itemId === s.id)?.qty ?? 0,
        semiProduct: s,
        boms: catalogBomsOf(s.id),
      })) as T;
  }
  if (/^\/products\/[^/]+\/bom$/.test(path) && (m === "PUT" || m === "POST")) {
    const productId = path.split("/")[2];
    const lines = (body?.lines as ProductStructureLine[]) ?? [];
    for (const line of lines) {
      const semi = semis.find((s) => s.id === line.semiProductId);
      if (semi) {
        semi.productId = productId;
        semi.active = true;
      }
    }
    return semis
      .filter((s) => s.productId === productId)
      .map((s) => ({
        semiProductId: s.id,
        qtyPerUnit: 1,
        stockQty: 0,
        semiProduct: s,
      })) as T;
  }
  if (/^\/products\/[^/]+\/attachments$/.test(path) && m === "GET") {
    const id = path.split("/")[2];
    return (productAttachments.get(id) ?? []).map(withAttachmentPreview) as T;
  }
  if (/^\/products\/[^/]+\/attachments$/.test(path) && m === "POST") {
    const id = path.split("/")[2];
    const att = withAttachmentPreview({ ...(body as unknown as Attachment), id: uid("att") });
    const listAtt = productAttachments.get(id) ?? [];
    listAtt.push(att);
    productAttachments.set(id, listAtt);
    persistAttMaps();
    return att as T;
  }
  if (/^\/products\/[^/]+\/attachments\/[^/]+$/.test(path) && m === "DELETE") {
    const [, , id, , attId] = path.split("/");
    productAttachments.set(
      id,
      (productAttachments.get(id) ?? []).filter((a) => a.id !== attId),
    );
    persistAttMaps();
    return undefined as T;
  }

  if (path === "/semi-products" && m === "GET") {
    const active = semis.filter((s) => s.active);
    if (sp.has("page") || sp.has("q") || sp.has("pageSize")) {
      return paginateInMemory(active, {
        ...list,
        match: (s, q) =>
          s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
      }) as T;
    }
    return active as T;
  }
  if (path === "/semi-products" && m === "POST") {
    const s: SemiProduct = {
      id: uid("sp"),
      code: String(body?.code ?? ""),
      name: String(body?.name ?? ""),
      productId: String(body?.productId ?? products[0]?.id ?? "p1"),
      measurementSpecs: (body?.measurementSpecs as SemiProduct["measurementSpecs"]) ?? {},
      active: true,
    };
    semis.push(s);
    return s as T;
  }
  if (/^\/semi-products\/[^/]+$/.test(path) && m === "PATCH") {
    const id = path.split("/")[2];
    const i = semis.findIndex((s) => s.id === id);
    if (i < 0) throw new Error("Không tìm thấy BTP");
    semis[i] = { ...semis[i], ...(body as Partial<SemiProduct>), id };
    return semis[i] as T;
  }
  if (/^\/semi-products\/[^/]+\/attachments$/.test(path) && m === "GET") {
    const id = path.split("/")[2];
    return (semiAttachments.get(id) ?? []).map(withAttachmentPreview) as T;
  }
  if (/^\/semi-products\/[^/]+\/attachments$/.test(path) && m === "POST") {
    const id = path.split("/")[2];
    const att = withAttachmentPreview({ ...(body as unknown as Attachment), id: uid("att") });
    const listAtt = semiAttachments.get(id) ?? [];
    listAtt.push(att);
    semiAttachments.set(id, listAtt);
    persistAttMaps();
    return att as T;
  }
  if (/^\/semi-products\/[^/]+\/attachments\/[^/]+$/.test(path) && m === "DELETE") {
    const [, , id, , attId] = path.split("/");
    semiAttachments.set(
      id,
      (semiAttachments.get(id) ?? []).filter((a) => a.id !== attId),
    );
    persistAttMaps();
    return undefined as T;
  }

  if (path === "/warehouse-stock" && m === "GET") {
    let rows = stockWithSemi();
    const kind = sp.get("itemKind");
    if (kind === "product" || kind === "semi_product") {
      rows = rows.filter((w) => w.itemKind === kind);
    }
    if (sp.has("page") || sp.has("q") || sp.has("pageSize")) {
      return paginateInMemory(rows, {
        ...list,
        match: (w, q) =>
          (w.semiProduct?.code ?? "").toLowerCase().includes(q) ||
          (w.semiProduct?.name ?? "").toLowerCase().includes(q),
      }) as T;
    }
    return rows as T;
  }
  if (/^\/warehouse-stock\/[^/]+$/.test(path) && m === "PATCH") {
    const itemId = path.split("/")[2];
    let row = warehouse.find((w) => w.itemId === itemId);
    if (!row) {
      row = {
        id: uid("ws"),
        warehouseId: "wh-main",
        itemKind: "semi_product",
        itemId,
        qty: 0,
      };
      warehouse.push(row);
    }
    row.qty = Number(body?.qty ?? row.qty);
    return row as T;
  }
  if (/^\/warehouse-stock\/[^/]+\/adjust$/.test(path) && m === "POST") {
    const semiProductId = path.split("/")[2];
    let row = warehouse.find((w) => w.itemKind === "semi_product" && w.itemId === semiProductId);
    if (!row) {
      row = {
        id: uid("ws"),
        warehouseId: "wh-main",
        itemKind: "semi_product",
        itemId: semiProductId,
        qty: 0,
      };
      warehouse.push(row);
    }
    const delta = Number(body?.delta ?? body?.qty ?? 0);
    row.qty += delta;
    const movement: WarehouseMovement = {
      id: uid("wm"),
      warehouseId: "wh-main",
      itemKind: "semi_product",
      itemId: semiProductId,
      delta,
      qtyAfter: row.qty,
      note: String(body?.note ?? ""),
      createdBy: String(body?.createdBy ?? "Demo"),
      createdAt: new Date().toISOString(),
    };
    movements.unshift(movement);
    return { stock: row, movement } as T;
  }
  if (path === "/warehouse-stock/import" && m === "POST") {
    return { updated: 0, errors: [], total: 0 } as T;
  }
  if (path === "/products/import-bom" && m === "POST") {
    const importRows = (body?.rows as Array<Record<string, unknown>>) ?? [];
    if (!importRows.length) throw new Error("File không có dòng dữ liệu");
    const errors: string[] = [];
    const byProduct = new Map<
      string,
      Map<
        string,
        {
          productName: string;
          productDescription: string;
          partCode: string;
          partName: string;
          processes: Array<{ seq: number; name: string; teamId: string; quota: number }>;
        }
      >
    >();
    let steps = 0;
    for (let i = 0; i < importRows.length; i++) {
      const r = importRows[i];
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
      const partKey = partCode || `__product__${productCode}`;
      let part = parts.get(partKey);
      if (!part) {
        part = {
          productName: String(r.productName ?? productCode).trim() || productCode,
          productDescription: String(r.productDescription ?? "").trim(),
          partCode,
          partName: String(r.partName ?? partCode).trim() || partCode,
          processes: [],
        };
        parts.set(partKey, part);
      }
      if (!partCode || !processName) continue;
      const blob = `${r.processStage ?? ""} ${r.teamCode ?? ""}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const teamId = blob.includes("tu dong") || blob.includes("auto")
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
      steps += 1;
    }
    let productUpserts = 0;
    let semiUpserts = 0;
    for (const [productCode, parts] of byProduct) {
      const first = [...parts.values()][0];
      let product = products.find((p) => p.code.toLowerCase() === productCode.toLowerCase());
      if (!product) {
        product = {
          id: uid("p"),
          code: productCode,
          name: first.productName,
          description: first.productDescription || "Nhập từ file danh mục",
          active: true,
        };
        products.push(product);
      } else {
        product.name = first.productName;
        if (first.productDescription) product.description = first.productDescription;
        product.active = true;
      }
      productUpserts += 1;
      for (const part of parts.values()) {
        if (!part.partCode || part.partCode.startsWith("__product__")) continue;
        let semi = semis.find((s) => s.code.toLowerCase() === part.partCode.toLowerCase());
        if (!semi) {
          semi = {
            id: uid("sp"),
            code: part.partCode,
            name: part.partName,
            productId: product.id,
            measurementSpecs: {},
            active: true,
          };
          semis.push(semi);
        } else {
          semi.name = part.partName;
          semi.productId = product.id;
          semi.active = true;
        }
        semiUpserts += 1;
        if (!part.processes.length) continue;
        let bom = catalogBoms.find((b) => b.semiProductId === semi.id);
        if (!bom) {
          bom = { id: uid("bom"), name: `BOM ${part.partName}`, semiProductId: semi.id };
          catalogBoms.push(bom);
        }
        for (let i = catalogProcesses.length - 1; i >= 0; i--) {
          if (catalogProcesses[i].bomId === bom.id) catalogProcesses.splice(i, 1);
        }
        for (const p of [...part.processes].sort((a, b) => a.seq - b.seq)) {
          catalogProcesses.push({
            id: uid("bp"),
            bomId: bom.id,
            name: p.name,
            productionTeamId: p.teamId,
            quotaPerShift: p.quota,
            sortOrder: p.seq,
          });
        }
      }
    }
    return {
      products: byProduct.size,
      parts: [...byProduct.values()].reduce(
        (s, m) => s + [...m.values()].filter((p) => p.partCode && !p.partCode.startsWith("__product__")).length,
        0,
      ),
      steps,
      productUpserts,
      semiUpserts,
      errors,
      total: importRows.length,
    } as T;
  }
  if (path === "/warehouse-movements" && m === "GET") {
    const limit = Number(sp.get("limit") ?? 50);
    return movements.slice(0, limit).map((mv) => ({
      ...mv,
      semiProduct: mv.itemKind === "semi_product" ? semis.find((s) => s.id === mv.itemId) : undefined,
      product: mv.itemKind === "product" ? products.find((p) => p.id === mv.itemId) : undefined,
    })) as T;
  }

  if (path === "/machines" && m === "GET") {
    const active = machines.filter((x) => x.active !== false);
    if (sp.has("page") || sp.has("q") || sp.has("pageSize")) {
      return paginateInMemory(active, {
        ...list,
        match: (x, q) =>
          x.name.toLowerCase().includes(q) ||
          (x.accountingCode ?? "").toLowerCase().includes(q) ||
          (x.code ?? "").toLowerCase().includes(q),
      }) as T;
    }
    return active as T;
  }
  if (path === "/machine-groups" && m === "GET") {
    return [
      { id: "mg-hot", code: "HOT", name: "Nhóm dập nóng", productionTeamId: "t_hot", isActive: true },
      { id: "mg-auto", code: "AUTO", name: "Nhóm tự động", productionTeamId: "t_auto", isActive: true },
    ] as T;
  }
  if (/^\/semi-products\/[^/]+\/boms$/.test(path) && m === "GET") {
    const sid = path.split("/")[2];
    return catalogBomsOf(sid) as T;
  }
  if (/^\/semi-products\/[^/]+\/boms$/.test(path) && (m === "PUT" || m === "POST")) {
    const sid = path.split("/")[2];
    if (!semis.find((s) => s.id === sid)) throw new Error("Không tìm thấy linh kiện");
    const drafts = Array.isArray(body?.boms)
      ? (body.boms as Array<{ id?: string; name: string; processes?: Array<Partial<BomProcess>> }>)
      : [{ name: String(body?.name ?? "").trim() || "BOM", processes: (body?.processes as Array<Partial<BomProcess>>) ?? [] }];
    const existing = catalogBoms.filter((b) => b.semiProductId === sid);
    const keepIds = new Set<string>();
    for (const draft of drafts) {
      const name = String(draft.name ?? "").trim() || "BOM";
      let bom =
        draft.id && existing.find((b) => b.id === draft.id)
          ? existing.find((b) => b.id === draft.id)
          : undefined;
      if (!bom && drafts.length === 1 && existing.length === 1 && !draft.id) bom = existing[0];
      if (!bom) {
        bom = { id: uid("bom"), name, semiProductId: sid };
        catalogBoms.push(bom);
      } else {
        bom.name = name;
      }
      keepIds.add(bom.id);
      for (let i = catalogProcesses.length - 1; i >= 0; i--) {
        if (catalogProcesses[i].bomId === bom.id) catalogProcesses.splice(i, 1);
      }
      (draft.processes ?? []).forEach((p, idx) => {
        const pname = (p.name || "").trim();
        if (!pname) return;
        catalogProcesses.push({
          id: p.id || uid("bp"),
          bomId: bom!.id,
          name: pname,
          productionTeamId: p.productionTeamId,
          machineGroupId: p.machineGroupId,
          quotaPerShift: Number(p.quotaPerShift) || 0,
          sortOrder: p.sortOrder ?? idx + 1,
        });
      });
    }
    for (const old of existing) {
      if (keepIds.has(old.id)) continue;
      for (let i = catalogProcesses.length - 1; i >= 0; i--) {
        if (catalogProcesses[i].bomId === old.id) catalogProcesses.splice(i, 1);
      }
      const bi = catalogBoms.findIndex((b) => b.id === old.id);
      if (bi >= 0) catalogBoms.splice(bi, 1);
    }
    return catalogBomsOf(sid) as T;
  }
  if (path === "/machines" && m === "POST") {
    const machine: Machine = {
      id: uid("m"),
      accountingCode: String(body?.accountingCode ?? body?.code ?? ""),
      code: String(body?.accountingCode ?? body?.code ?? ""),
      name: String(body?.name ?? ""),
      specs: (body?.specs as Machine["specs"]) ?? {},
      productionTeamId: body?.productionTeamId ? String(body.productionTeamId) : undefined,
      teamId: body?.teamId ? String(body.teamId) : undefined,
      active: true,
    };
    machines.push(machine);
    return machine as T;
  }
  if (/^\/machines\/[^/]+$/.test(path) && m === "PATCH") {
    const id = path.split("/")[2];
    const i = machines.findIndex((x) => x.id === id);
    if (i < 0) throw new Error("Không tìm thấy máy");
    machines[i] = { ...machines[i], ...(body as Partial<Machine>), id };
    return machines[i] as T;
  }
  if (/^\/machines\/[^/]+$/.test(path) && m === "DELETE") {
    const id = path.split("/")[2];
    const i = machines.findIndex((x) => x.id === id);
    if (i < 0) throw new Error("Không tìm thấy máy");
    machines[i].active = false;
    return machines[i] as T;
  }
  if (path === "/machine-change-requests" && m === "GET") {
    let rows = [...changeRequests];
    const status = sp.get("status");
    const target = sp.get("target");
    if (status) rows = rows.filter((r) => r.status === status);
    if (target) rows = rows.filter((r) => r.target === target);
    if (sp.has("page") || sp.has("q") || sp.has("pageSize")) {
      return paginateInMemory(rows, {
        ...list,
        match: (r, q) =>
          r.requestedName.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          (r.fromMachine ?? "").toLowerCase().includes(q),
      }) as T;
    }
    return rows as T;
  }
  if (path === "/machine-change-requests" && m === "POST") {
    const req: MachineChangeRequest = {
      id: uid("mcr"),
      orderId: body?.orderId ? String(body.orderId) : undefined,
      bomId: body?.bomId ? String(body.bomId) : undefined,
      requestedBy: String(body?.requestedBy ?? ""),
      requestedName: String(body?.requestedName ?? ""),
      requestedAt: new Date().toISOString(),
      reason: String(body?.reason ?? ""),
      kind: (body?.kind as MachineChangeRequest["kind"]) ?? "change_machine",
      target: (body?.target as MachineChangeRequest["target"]) ?? "teamlead",
      fromMachine: String(body?.fromMachine ?? ""),
      toMachine: String(body?.toMachine ?? ""),
      status: "pending",
      reviewNote: "",
    };
    changeRequests.unshift(req);
    return req as T;
  }
  if (/^\/machine-change-requests\/[^/]+\/review$/.test(path) && m === "POST") {
    const id = path.split("/")[2];
    const req = changeRequests.find((r) => r.id === id);
    if (!req) throw new Error("Không tìm thấy yêu cầu");
    req.status = body?.approved === false ? "rejected" : "approved";
    return req as T;
  }

  // ── Workflow ──────────────────────────────────────────────────────────
  if (path === "/incidents" && m === "GET") {
    if (sp.has("page") || sp.has("q") || sp.has("pageSize")) {
      return paginateInMemory(incidents, { ...list }) as T;
    }
    return incidents as T;
  }
  if (path === "/incidents/stats" && m === "GET") {
    return {
      open: incidents.filter((i) => i.status === "open").length,
      resolved: incidents.filter((i) => i.status === "resolved").length,
      total: incidents.length,
    } as T;
  }
  if (path === "/incidents" && m === "POST") {
    const inc: MachineIncident = {
      id: uid("inc"),
      orderId: body?.orderId ? String(body.orderId) : undefined,
      bomId: body?.bomId ? String(body.bomId) : undefined,
      machineName: String(body?.machineName ?? ""),
      machineCode: String(body?.machineCode ?? ""),
      severity: (body?.severity as MachineIncident["severity"]) ?? "medium",
      description: String(body?.description ?? ""),
      reportedBy: String(body?.reportedBy ?? ""),
      reportedName: String(body?.reportedName ?? ""),
      reportedAt: new Date().toISOString(),
      status: "open",
      resolutionNote: "",
      downtimeMinutes: 0,
    };
    incidents.unshift(inc);
    return inc as T;
  }
  if (/^\/incidents\/[^/]+$/.test(path) && m === "GET") {
    const id = path.split("/")[2];
    const inc = incidents.find((i) => i.id === id);
    if (!inc) throw new Error("Không tìm thấy sự cố");
    return inc as T;
  }
  if (/^\/incidents\/[^/]+\/(assign|resolve|confirm)$/.test(path) && m === "POST") {
    const id = path.split("/")[2];
    const action = path.split("/")[3];
    const inc = incidents.find((i) => i.id === id);
    if (!inc) throw new Error("Không tìm thấy sự cố");
    if (action === "assign") {
      inc.assignedTo = String(body?.assignedTo ?? "");
      inc.assignedName = String(body?.assignedName ?? "");
      inc.status = "assigned";
    } else if (action === "resolve") {
      inc.status = "resolved";
      inc.resolutionNote = String(body?.resolutionNote ?? "");
      inc.resolvedBy = String(body?.resolvedBy ?? "");
      inc.resolvedName = String(body?.resolvedName ?? "");
      inc.resolvedAt = new Date().toISOString();
      inc.downtimeMinutes = Number(body?.downtimeMinutes ?? 0);
    } else {
      inc.status = "closed";
    }
    return inc as T;
  }

  if (path === "/overtime" && m === "GET") {
    if (sp.has("page") || sp.has("q") || sp.has("pageSize")) {
      return paginateInMemory(overtime, { ...list }) as T;
    }
    return overtime as T;
  }
  if (path === "/overtime" && m === "POST") {
    const row: OvertimeRequest = {
      id: uid("ot"),
      ...(body as Omit<OvertimeRequest, "id">),
    } as OvertimeRequest;
    overtime.unshift(row);
    return row as T;
  }
  if (/^\/overtime\/[^/]+\/(review|complete)$/.test(path) && m === "POST") {
    const id = path.split("/")[2];
    const row = overtime.find((o) => o.id === id);
    if (!row) throw new Error("Không tìm thấy OT");
    return row as T;
  }

  if (path === "/complaints" && m === "GET") {
    if (sp.has("page") || sp.has("q") || sp.has("pageSize")) {
      return paginateInMemory(complaints, { ...list }) as T;
    }
    return complaints as T;
  }
  if (path === "/complaints" && m === "POST") {
    const row = { id: uid("c"), ...(body as object) } as QCComplaint;
    complaints.unshift(row);
    return row as T;
  }
  if (/^\/complaints\/[^/]+/.test(path)) {
    const id = path.split("/")[2];
    const row = complaints.find((c) => c.id === id);
    if (!row && m === "GET") throw new Error("Không tìm thấy khiếu nại");
    return (row ?? ({ id } as QCComplaint)) as T;
  }

  if (path === "/stats" && m === "GET") {
    if (sp.has("page") || sp.has("q") || sp.has("pageSize")) {
      return paginateInMemory(stats, {
        ...list,
        match: (s, q) =>
          s.bomId.toLowerCase().includes(q) ||
          s.orderId.toLowerCase().includes(q) ||
          (s.note ?? "").toLowerCase().includes(q),
      }) as T;
    }
    return stats as T;
  }
  if (path === "/stats" && m === "POST") {
    const row = { id: uid("st"), ...(body as object) } as ProductionStat;
    stats.unshift(row);
    return row as T;
  }
  if (/^\/stats\/summary\//.test(path) && m === "GET") {
    return { pass: 0, fail: 0, total: 0 } as T;
  }

  if (/^\/notifications\/[^/]+\/read-all$/.test(path) && m === "POST") {
    const userId = path.split("/")[2];
    for (const n of notifications) if (n.userId === userId) n.isRead = true;
    return undefined as T;
  }
  if (/^\/notifications\/[^/]+\/read$/.test(path) && m === "PATCH") {
    const id = path.split("/")[2];
    const n = notifications.find((x) => x.id === id);
    if (n) n.isRead = true;
    return undefined as T;
  }
  if (/^\/notifications\/[^/]+$/.test(path) && m === "GET") {
    const userId = path.split("/")[2];
    let rows = notifications.filter((n) => n.userId === userId || n.userId === "u1");
    if (sp.get("unread") === "true") rows = rows.filter((n) => !n.isRead);
    if (sp.has("page") || sp.has("pageSize")) return paginateInMemory(rows, { ...list }) as T;
    return rows as T;
  }

  // ── Salary ────────────────────────────────────────────────────────────
  if (path === "/payroll/rates" && m === "GET") return payrollRates as T;
  if (path === "/payroll/rates" && m === "PUT") {
    const userId = String(body?.userId ?? "");
    const productId = String(body?.productId ?? "");
    const rateVnd = Number(body?.rateVnd ?? 0);
    let row = payrollRates.find((r) => r.userId === userId && r.productId === productId);
    if (!row) {
      row = { id: uid("pr"), userId, productId, rateVnd };
      payrollRates.push(row);
    } else row.rateVnd = rateVnd;
    return row as T;
  }
  if (path === "/payroll/import" && m === "POST") {
    return { profileUpdates: 0, rateUpdates: 0, errors: [], total: 0 } as T;
  }
  if (path === "/shift-closes" && m === "GET") {
    let list = [...shiftCloses];
    const workerId = sp.get("workerId");
    const orderId = sp.get("orderId");
    const bomId = sp.get("bomId");
    const status = sp.get("status");
    if (workerId) list = list.filter((s) => s.workerId === workerId);
    if (orderId) list = list.filter((s) => s.orderId === orderId);
    if (bomId) list = list.filter((s) => s.bomId === bomId);
    if (status) list = list.filter((s) => s.status === status);
    return list as T;
  }
  if (/^\/shift-closes\/[^/]+$/.test(path) && m === "PATCH") {
    const id = path.split("/")[2];
    const workerId = String(body?.workerId ?? "");
    const row = assertCanEditShiftClose(shiftCloses, id, workerId);
    row.passQty = Number(body?.passQty) || 0;
    row.failQty = Number(body?.failQty) || 0;
    row.note = String(body?.note ?? "");
    return row as T;
  }
  if (/^\/shift-closes\/[^/]+\/review$/.test(path) && m === "POST") {
    const id = path.split("/")[2];
    const row = shiftCloses.find((s) => s.id === id);
    if (!row) throw new Error("Không tìm thấy chốt ca");
    const stage = String(body?.stage ?? "teamlead");
    const now = new Date().toISOString();
    if (body?.approved === false) {
      row.status = "rejected";
      row.rejectReason = String(body?.rejectReason ?? "");
    } else if (stage === "teamlead" && row.status === "pending_teamlead") {
      row.status = "pending_qc";
      row.teamleadBy = String(body?.reviewerName ?? "");
      row.teamleadAt = now;
      notifications.unshift({
        id: uid("n"),
        userId: row.workerId,
        type: "shift",
        refId: row.id,
        refType: "shift_close",
        title: "Tổ trưởng đã duyệt chốt ca",
        body: "Xin mở khóa để đo kiểm / chốt ca tiếp trong ngày.",
        isRead: false,
        createdAt: now,
      });
    } else if (stage === "qc" && row.status === "pending_qc") {
      row.status = "pending_supervisor";
      row.qcBy = String(body?.reviewerName ?? "");
      row.qcAt = now;
    } else if (stage === "supervisor" && row.status === "pending_supervisor") {
      row.status = "approved";
      row.supervisorBy = String(body?.reviewerName ?? "");
      row.supervisorAt = now;
      row.amountVnd = Math.round(row.passQty * row.rateVnd);
    } else {
      throw new Error("Phiếu không ở bước duyệt này");
    }
    return row as T;
  }
  if (path === "/shift-unlocks" && m === "GET") {
    let list = [...shiftUnlocks];
    const workerId = sp.get("workerId");
    const orderId = sp.get("orderId");
    const bomId = sp.get("bomId");
    const status = sp.get("status");
    if (workerId) list = list.filter((s) => s.workerId === workerId);
    if (orderId) list = list.filter((s) => s.orderId === orderId);
    if (bomId) list = list.filter((s) => s.bomId === bomId);
    if (status) list = list.filter((s) => s.status === status);
    return list as T;
  }
  if (path === "/shift-unlocks" && m === "POST") {
    const orderId = String(body?.orderId ?? "");
    const bomId = String(body?.bomId ?? "");
    const workerId = String(body?.workerId ?? "");
    assertCanRequestUnlock(shiftCloses, shiftUnlocks, { workerId, orderId, bomId });
    const row: ShiftUnlockRequest = {
      id: uid("su"),
      orderId,
      bomId,
      workerId,
      workerName: String(body?.workerName ?? ""),
      partName: String(body?.partName ?? ""),
      reason: String(body?.reason ?? "Xin mở khóa để chốt ca tiếp trong ngày"),
      status: "pending_teamlead",
      createdAt: new Date().toISOString(),
    };
    shiftUnlocks.unshift(row);
    return row as T;
  }
  if (/^\/shift-unlocks\/[^/]+\/review$/.test(path) && m === "POST") {
    const id = path.split("/")[2];
    const row = shiftUnlocks.find((s) => s.id === id);
    if (!row) throw new Error("Không tìm thấy yêu cầu mở khóa");
    if (row.status !== "pending_teamlead") throw new Error("Yêu cầu không còn chờ tổ trưởng");
    row.status = body?.approved === false ? "rejected" : "approved";
    row.reviewedBy = String(body?.reviewerName ?? "");
    row.reviewedAt = new Date().toISOString();
    if (body?.approved === false) row.rejectReason = String(body?.rejectReason ?? "");
    return row as T;
  }

  // ── Spec ──────────────────────────────────────────────────────────────
  if (path === "/spec/validate" && m === "POST") {
    return {
      ok: true,
      errors: [],
      warnings: [],
      normalized: body ?? {},
    } as T;
  }

  // Fallback: empty success so UI screens don't hard-crash
  console.warn(`[demo-api] unhandled ${m} ${path}`);
  if (m === "GET") return [] as T;
  return { ok: true } as T;
}
