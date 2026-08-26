/**
 * In-memory API cho VITE_DEMO_MODE / ?demo=1 — đủ để duyệt toàn bộ UI không cần backend.
 */
import type {
  Attachment,
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
  ProductBomLine,
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
import { assertCanCreateShiftClose, assertCanRequestUnlock, assertCanSubmitWorkerRow } from "@shared/utils/shiftCloseGuard";
import {
  bomSpecsFromChecklist,
  resolvePartChecklist,
  validateEntryRows,
} from "@shared/utils/specValidation";
import { SEED_ORDERS, SEED_USERS } from "../../backend/src/data/seed";
import {
  DEMO_MACHINES,
  DEMO_PRODUCT_BOMS,
  DEMO_PRODUCTS,
  DEMO_SEMI,
  DEMO_WAREHOUSE,
} from "./demoCatalog";
import { MOCK_INCIDENTS, MOCK_NOTIFICATIONS } from "./workflowSeed";

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
const productBoms: ProductBomLine[] = clone(DEMO_PRODUCT_BOMS);
const warehouse: WarehouseStock[] = clone(DEMO_WAREHOUSE);
const movements: WarehouseMovement[] = [];
const machines: Machine[] = clone(DEMO_MACHINES);
const changeRequests: MachineChangeRequest[] = [];
const incidents: MachineIncident[] = clone(MOCK_INCIDENTS);
const notifications: Notification[] = clone(MOCK_NOTIFICATIONS);
const overtime: OvertimeRequest[] = [];
const complaints: QCComplaint[] = [];
const stats: ProductionStat[] = [];
const shiftCloses: ShiftClose[] = [
  {
    id: "sc1",
    workerId: "u6",
    workerName: "Cường 2T3",
    orderId: "o1",
    bomId: "b1",
    productId: "p1",
    productName: "Van 1 chiều lò xo NOVO 20",
    partName: "Van 1 chiều lò xo NOVO 20",
    passQty: 80,
    failQty: 2,
    note: "Chốt ca demo",
    status: "pending_teamlead",
    rateVnd: 2500,
    amountVnd: 200_000,
    createdAt: new Date().toISOString(),
  },
];
const shiftUnlocks: ShiftUnlockRequest[] = [];
const payrollRates: Array<{ id: string; userId: string; productId: string; rateVnd: number }> = [
  { id: "pr1", userId: "u6", productId: "p1", rateVnd: 2500 },
  { id: "pr2", userId: "u7", productId: "p1", rateVnd: 2500 },
];
const productAttachments = new Map<string, Attachment[]>();
const semiAttachments = new Map<string, Attachment[]>();
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
    semiProduct: semis.find((s) => s.id === w.semiProductId),
  }));
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
    const lines = productBoms.filter((b) => b.productId === productId);
    const created: ProductionOrder = {
      id: uid("o"),
      orderNo: `LSX-DEMO-${Date.now().toString(36).toUpperCase()}`,
      productLine: product.name,
      productId: product.id,
      customer: String(body?.customer ?? "Nội bộ"),
      targetQty: Number(body?.targetQty ?? 100),
      createdBy: String(body?.createdBy ?? "Demo"),
      createdAt: new Date().toLocaleDateString("vi-VN"),
      deadline: String(body?.deadline ?? ""),
      priority: "normal",
      status: "pending_approval",
      pendingApproval: true,
      attachments: [],
      boms: lines.map((line, idx) => {
        const semi = semis.find((s) => s.id === line.semiProductId);
        const { materialSpecs, specCols } = bomSpecsFromChecklist(
          resolvePartChecklist(semi ?? {}),
        );
        return {
          id: uid("b"),
          bomCode: `BOM-DEMO-${idx + 1}`,
          partCode: semi?.code ?? `P-${idx}`,
          partName: semi?.name ?? "Linh kiện",
          rawMaterial: "",
          machine: "",
          process: "",
          processStage: semi?.processStage,
          targetQty: Number(body?.targetQty ?? 100) * (line.qtyPerUnit || 1),
          passQty: 0,
          failQty: 0,
          assignedTeamId: "",
          assignedTeamName: "",
          assignedWorkers: [],
          status: "unassigned" as const,
          specCols,
          materialSpecs: materialSpecs.length ? materialSpecs : undefined,
          techNote: "",
          workerEntries: [],
          semiProductId: semi?.id,
          attachments: semiAttachments.get(semi?.id ?? "") ?? [],
        };
      }),
    };
    orders.unshift(created);
    return created as T;
  }
  if (path === "/orders/from-products-batch" && m === "POST") {
    const ids = (body?.productIds as string[]) ?? [];
    const created = ids.map((productId) => {
      // reuse from-product logic inline
      const product = products.find((p) => p.id === productId);
      if (!product) throw new Error(`SP ${productId} không tồn tại`);
      const order: ProductionOrder = {
        id: uid("o"),
        orderNo: `LSX-DEMO-${uid("x").slice(-4)}`,
        productLine: product.name,
        productId,
        customer: "Nội bộ",
        targetQty: Number(body?.targetQty ?? 50),
        createdBy: "Demo",
        createdAt: new Date().toLocaleDateString("vi-VN"),
        deadline: "",
        priority: "normal",
        status: "pending_approval",
        pendingApproval: true,
        attachments: [],
        boms: [],
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
    return productBoms
      .filter((b) => b.productId === productId)
      .map((b) => ({
        ...b,
        semiProduct: semis.find((s) => s.id === b.semiProductId),
      })) as T;
  }
  if (/^\/products\/[^/]+\/bom$/.test(path) && (m === "PUT" || m === "POST")) {
    const productId = path.split("/")[2];
    const lines = (body?.lines as ProductBomLine[]) ?? (body as unknown as ProductBomLine[]) ?? [];
    for (let i = productBoms.length - 1; i >= 0; i--) {
      if (productBoms[i].productId === productId) productBoms.splice(i, 1);
    }
    for (const line of lines) {
      productBoms.push({ ...line, id: line.id || uid("pb"), productId });
    }
    return productBoms.filter((b) => b.productId === productId) as T;
  }
  if (/^\/products\/[^/]+\/attachments$/.test(path) && m === "GET") {
    const id = path.split("/")[2];
    return (productAttachments.get(id) ?? []) as T;
  }
  if (/^\/products\/[^/]+\/attachments$/.test(path) && m === "POST") {
    const id = path.split("/")[2];
    const att = { ...(body as unknown as Attachment), id: uid("att") };
    const listAtt = productAttachments.get(id) ?? [];
    listAtt.push(att);
    productAttachments.set(id, listAtt);
    return att as T;
  }
  if (/^\/products\/[^/]+\/attachments\/[^/]+$/.test(path) && m === "DELETE") return undefined as T;

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
      processStage: body?.processStage as SemiProduct["processStage"],
      description: String(body?.description ?? ""),
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
    return (semiAttachments.get(id) ?? []) as T;
  }
  if (/^\/semi-products\/[^/]+\/attachments$/.test(path) && m === "POST") {
    const id = path.split("/")[2];
    const att = { ...(body as unknown as Attachment), id: uid("att") };
    const listAtt = semiAttachments.get(id) ?? [];
    listAtt.push(att);
    semiAttachments.set(id, listAtt);
    return att as T;
  }

  if (path === "/warehouse-stock" && m === "GET") {
    const rows = stockWithSemi();
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
    const semiProductId = path.split("/")[2];
    let row = warehouse.find((w) => w.semiProductId === semiProductId);
    if (!row) {
      row = { semiProductId, qty: 0 };
      warehouse.push(row);
    }
    row.qty = Number(body?.qty ?? row.qty);
    return row as T;
  }
  if (/^\/warehouse-stock\/[^/]+\/adjust$/.test(path) && m === "POST") {
    const semiProductId = path.split("/")[2];
    let row = warehouse.find((w) => w.semiProductId === semiProductId);
    if (!row) {
      row = { semiProductId, qty: 0 };
      warehouse.push(row);
    }
    const delta = Number(body?.delta ?? body?.qty ?? 0);
    row.qty += delta;
    const movement: WarehouseMovement = {
      id: uid("wm"),
      semiProductId,
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
    const rows = (body?.rows as Array<Record<string, unknown>>) ?? [];
    if (!rows.length) throw new Error("File không có dòng dữ liệu");
    const errors: string[] = [];
    const byProduct = new Map<
      string,
      Map<
        string,
        {
          productName: string;
          partName: string;
          qty: number;
          steps: Array<{
            seq: number;
            process: string;
            machine?: string;
            processStage?: SemiProduct["processStage"];
            teamCode?: string;
            techNote?: string;
            quota?: string;
            people?: number;
          }>;
        }
      >
    >();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const productCode = String(r.productCode ?? "").trim();
      const partCode = String(r.partCode ?? "").trim();
      const processName = String(r.processName ?? "").trim();
      if (!productCode || !partCode || !processName) {
        errors.push(`Dòng ${i + 2}: thiếu Mã SP / Mã LK / Tên quy trình`);
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
          productName: String(r.productName ?? productCode),
          partName: String(r.partName ?? partCode),
          qty: Math.max(1, Number(r.qtyPerUnit) || 1),
          steps: [],
        };
        parts.set(partCode, part);
      }
      part.steps.push({
        seq: Math.max(1, Number(r.processSeq) || part.steps.length + 1),
        process: processName,
        machine: r.machine ? String(r.machine) : undefined,
        processStage: (r.processStage as SemiProduct["processStage"]) || "hot_forge",
        teamCode: r.teamCode ? String(r.teamCode) : undefined,
        techNote: r.techNote ? String(r.techNote) : undefined,
        quota: r.quota ? String(r.quota) : undefined,
        people: r.people != null ? Number(r.people) : undefined,
      });
    }
    let productUpserts = 0;
    let semiUpserts = 0;
    let stepCount = 0;
    for (const [productCode, parts] of byProduct) {
      const first = [...parts.values()][0];
      let product = products.find((p) => p.code.toLowerCase() === productCode.toLowerCase());
      if (!product) {
        product = {
          id: uid("p"),
          code: productCode,
          name: first.productName,
          description: "Import BOM demo",
          active: true,
        };
        products.push(product);
        productUpserts += 1;
      } else {
        product.name = first.productName || product.name;
        product.active = true;
        productUpserts += 1;
      }
      // clear old bom lines
      for (let i = productBoms.length - 1; i >= 0; i--) {
        if (productBoms[i].productId === product.id) productBoms.splice(i, 1);
      }
      for (const [partCode, part] of parts) {
        const steps = [...part.steps].sort((a, b) => a.seq - b.seq);
        stepCount += steps.length;
        const stage = steps[0]?.processStage ?? "hot_forge";
        let semi = semis.find((s) => s.code.toLowerCase() === partCode.toLowerCase());
        if (!semi) {
          semi = {
            id: uid("sp"),
            code: partCode,
            name: part.partName,
            processStage: stage,
            description: `Import — ${steps.length} quy trình`,
            active: true,
            processSteps: steps,
          };
          semis.push(semi);
          semiUpserts += 1;
        } else {
          semi.name = part.partName;
          semi.processStage = stage;
          semi.processSteps = steps;
          semi.active = true;
          semiUpserts += 1;
        }
        productBoms.push({
          id: uid("pb"),
          productId: product.id,
          semiProductId: semi.id,
          qtyPerUnit: part.qty,
        });
      }
    }
    return {
      products: byProduct.size,
      parts: [...byProduct.values()].reduce((s, m) => s + m.size, 0),
      steps: stepCount,
      productUpserts,
      semiUpserts,
      errors,
      total: rows.length,
    } as T;
  }
  if (path === "/warehouse-movements" && m === "GET") {
    const limit = Number(sp.get("limit") ?? 50);
    return movements.slice(0, limit).map((mv) => ({
      ...mv,
      semiProduct: semis.find((s) => s.id === mv.semiProductId),
    })) as T;
  }

  if (path === "/machines" && m === "GET") return machines.filter((x) => x.active) as T;
  if (path === "/machines" && m === "POST") {
    const machine: Machine = {
      id: uid("m"),
      code: String(body?.code ?? ""),
      name: String(body?.name ?? ""),
      params: (body?.params as Machine["params"]) ?? [],
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
  if (path === "/machine-change-requests" && m === "GET") return changeRequests as T;
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

  if (path === "/stats" && m === "GET") return stats as T;
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
