import type {
  Attachment,
  Bom,
  BomProcess,
  Machine,
  ProductionOrder,
  Product,
  SemiProduct,
  WarehouseStock,
} from "../types/index.js";

/** Ảnh phiếu BẢNG KIỂM TRA CHI TIẾT (public/sheets) — demo GitHub Pages + local */
export function inspectionSheetUrl(): string {
  const env = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env;
  const base = env?.BASE_URL ?? "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}sheets/bang-kiem-tra-chi-tiet.jpg`;
}

export function inspectionSheetAttachment(id = "att-sheet-novo20"): Attachment {
  return {
    id,
    name: "BangKiemTraChiTiet_NOVO20.jpg",
    type: "image",
    kind: "drawing",
    mimeType: "image/jpeg",
    size: "1.8 MB",
    uploadedBy: "P.V.Chí",
    uploadedAt: "13/08/2024",
    url: inspectionSheetUrl(),
  };
}

const SHEET = (): Attachment => inspectionSheetAttachment();

/** Thành phẩm / linh kiện / máy lấy từ phiếu kiểm tra giấy */
export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "p-lx20",
    code: "NOVO-20-001",
    name: "Van 1 chiều lò xo NOVO 20",
    description: "Theo phiếu BẢNG KIỂM TRA CHI TIẾT — long đen hãm gioăng",
    unitOfMeasureId: "uom-pcs",
    active: true,
    attachments: [SHEET()],
  },
];

export const SAMPLE_SEMI: SemiProduct[] = [
  {
    id: "sp-longden",
    code: "NOVO20-LONGDEN",
    name: "Long đen hãm gioăng",
    productId: "p-lx20",
    unitOfMeasureId: "uom-pcs",
    weightKg: 0.0039,
    measurementSpecs: {
      "① 3mm": "float",
      "② 1.5mm": "float",
      "③ Ø9": "float",
      "④ M6": "boolean",
      "Ø20": "float",
    },
    active: true,
    attachments: [SHEET()],
  },
];

export const SAMPLE_BOMS: Bom[] = [
  { id: "bom-longden-auto", name: "Máy tự động (cam 01)", semiProductId: "sp-longden" },
  { id: "bom-longden", name: "Máy thường (cắt / dập)", semiProductId: "sp-longden" },
];

export const SAMPLE_BOM_PROCESSES: BomProcess[] = [
  {
    id: "bp-longden-auto-1",
    bomId: "bom-longden-auto",
    name: "Cắt phôi",
    productionTeamId: "t_auto",
    machineGroupId: "mg_auto",
    quotaPerShift: 1570,
    sortOrder: 1,
  },
  {
    id: "bp-longden-auto-2",
    bomId: "bom-longden-auto",
    name: "Hoàn thiện",
    productionTeamId: "t_auto",
    machineGroupId: "mg_auto",
    quotaPerShift: 1570,
    sortOrder: 2,
  },
  {
    id: "bp-longden-man-1",
    bomId: "bom-longden",
    name: "Cắt phôi",
    productionTeamId: "t_hot",
    machineGroupId: "mg_hot",
    quotaPerShift: 2000,
    sortOrder: 1,
  },
  {
    id: "bp-longden-ht",
    bomId: "bom-longden",
    name: "Hoàn thiện",
    productionTeamId: "t_hot",
    machineGroupId: "mg_hot",
    quotaPerShift: 2000,
    sortOrder: 2,
  },
];

export const SAMPLE_MACHINES: Machine[] = [
  {
    id: "m-cam-01",
    name: "cam 01",
    accountingCode: "CAM-01",
    code: "CAM-01",
    machineGroupId: "mg_auto",
    productionTeamId: "t_auto",
    teamId: "t_auto",
    specs: { outer_dia: "Ø20 mm", height: "3 mm" },
    active: true,
  },
];

export const SAMPLE_WAREHOUSE: WarehouseStock[] = [
  { id: "ws-p-lx20", warehouseId: "wh-main", itemKind: "product", itemId: "p-lx20", qty: 12 },
  { id: "ws-sp-longden", warehouseId: "wh-main", itemKind: "semi_product", itemId: "sp-longden", qty: 200 },
];

const DIMS = ["3", "1.4", "9", "v", "20", "", "", "", "", "", ""];

export const SAMPLE_ORDERS: ProductionOrder[] = [
  {
    id: "o-sheet",
    orderNo: "LSX-2024-007",
    productId: "p-lx20",
    productCode: "NOVO-20-001",
    productLine: "Van 1 chiều lò xo NOVO 20",
    customer: "Nội bộ",
    targetQty: 1570,
    createdBy: "P.V.Chí",
    createdAt: "13/08/2024",
    deadline: "2024-08-20",
    priority: "high",
    status: "in_progress",
    pendingApproval: false,
    note: "Phiếu BẢNG KIỂM TRA CHI TIẾT — nguyên công hoàn thiện, máy cam 01, ca 1+3 (6h–14h), tần suất 1h/lần.",
    shift: "day",
    workTime: "6h-14h",
    attachments: [SHEET()],
    boms: [
      {
        id: "b-longden-cut",
        bomCode: "BOM-NOVO20-LONGDEN-01",
        partCode: "NOVO20-LONGDEN",
        partName: "Long đen hãm gioăng",
        partGroup: "Long đen hãm gioăng",
        processSeq: 1,
        catalogBomId: "bom-longden-auto",
        catalogBomName: "Máy tự động (cam 01)",
        catalogProcessId: "bp-longden-auto-1",
        rawMaterial: "3.9 g / 1 SP",
        machine: "cam 01",
        process: "Cắt phôi",
        targetQty: 1570,
        passQty: 1570,
        failQty: 0,
        assignedTeamId: "t_auto",
        assignedTeamName: "Tổ Tự động – P.V.Sang",
        assignedWorkers: ["Cường 2T3"],
        workerAssignments: [{ workerId: "u6", workerName: "Cường 2T3", machineName: "cam 01" }],
        processStage: "auto",
        status: "qc_passed",
        quota: "2000",
        workTime: "6h-14h",
        shift: "day",
        specCols: ["3", "1.5", "Ø9", "M6", "Ø20", "NQ", "", "", "", "", ""],
        techNote: "",
        semiProductId: "sp-longden",
        attachments: [inspectionSheetAttachment("att-sheet-cut")],
        workerEntries: [],
      },
      {
        id: "b-longden-ht",
        bomCode: "BOM-NOVO20-LONGDEN-02",
        partCode: "NOVO20-LONGDEN",
        partName: "Long đen hãm gioăng",
        partGroup: "Long đen hãm gioăng",
        processSeq: 2,
        catalogBomId: "bom-longden-auto",
        catalogBomName: "Máy tự động (cam 01)",
        catalogProcessId: "bp-longden-auto-2",
        rawMaterial: "3.9 g / 1 SP",
        machine: "cam 01",
        process: "Hoàn thiện",
        targetQty: 1570,
        passQty: 1570,
        failQty: 0,
        assignedTeamId: "t_auto",
        assignedTeamName: "Tổ Tự động – P.V.Sang",
        assignedWorkers: ["Cường 2T3"],
        workerAssignments: [{ workerId: "u6", workerName: "Cường 2T3", machineName: "cam 01" }],
        processStage: "auto",
        status: "in_progress",
        quota: "1570",
        workTime: "6h-14h",
        shift: "day",
        specCols: ["3", "1.5", "Ø9", "M6", "Ø20", "NQ", "", "", "", "", ""],
        techNote: "Theo bản vẽ phiếu kiểm tra: ① 3mm · ② 1.5mm · ③ Ø9 · ④ M6 · ngoài Ø20. Ngoại quan đạt.",
        semiProductId: "sp-longden",
        attachments: [inspectionSheetAttachment("att-sheet-bom")],
        workerEntries: [
          {
            id: "we-sheet-u6",
            workerId: "u6",
            workerName: "Cường 2T3",
            submittedAt: "13/08/2024 14:00",
            rows: [1, 2, 3, 4, 5, 6, 7, 8].map((tt) => ({
              tt,
              dims: [...DIMS],
              ngoaiQuan: "Đạt",
            })),
          },
        ],
      },
    ],
  },
];

/** Gắn ảnh phiếu vào lệnh/BOM — chi tiết việc cần làm (không thay file đã có) */
export function withInspectionDrawings(orders: ProductionOrder[]): ProductionOrder[] {
  return orders.map((o) => ({
    ...o,
    attachments: mergeSheet(o.attachments, `${o.id}-order`),
    boms: o.boms.map((b, i) => ({
      ...b,
      attachments: mergeSheet(b.attachments, `${o.id}-${b.id || i}`),
    })),
  }));
}

function mergeSheet(existing: Attachment[] | undefined, suffix: string): Attachment[] {
  const sheet = inspectionSheetAttachment(`att-sheet-${suffix}`);
  const list = existing ?? [];
  if (list.some((a) => a.type === "image" && (a.name.includes("KiemTra") || a.kind === "drawing"))) {
    return list;
  }
  return [sheet, ...list];
}

/** Gắn phiếu kiểm tra mẫu cho mọi id catalog (thành phẩm / linh kiện). */
export function mockDrawingsById(ids: string[], prefix: string): Map<string, Attachment[]> {
  return new Map(ids.map((id) => [id, [inspectionSheetAttachment(`att-${prefix}-${id}`)]]));
}
