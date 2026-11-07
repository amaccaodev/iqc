import type {
  AuditLogChange,
  AuditLogEntry,
  Company,
  DocItem,
  DocumentStatus,
  DocumentType,
  InboundSourceInfo,
  InventoryCountItem,
  InventoryItem,
  Product,
  Supplier,
  Warehouse,
  WmsDataState,
  WmsDocument,
  WmsPermission,
  WmsRole,
  WmsTransaction,
} from "../types/wms";

export const WMS_STORAGE_KEY = "iqc_wms_enterprise_v1";

export const ROLE_PERMISSIONS: Record<WmsRole, WmsPermission[]> = {
  "Nhân viên kho": [
    "view_documents",
    "create_inbound",
    "create_outbound",
    "create_count",
    "edit_own_documents",
  ],
  "Thủ kho": [
    "view_documents",
    "create_inbound",
    "create_outbound",
    "create_count",
    "edit_own_documents",
    "approve_inbound",
    "approve_outbound",
    "confirm_inbound",
    "confirm_outbound",
    "dispatch_transfer",
    "receive_transfer",
    "resolve_transfer",
    "confirm_count",
  ],
  "Quản lý kho": [
    "view_documents",
    "create_inbound",
    "create_outbound",
    "create_count",
    "edit_own_documents",
    "edit_any_documents",
    "approve_inbound",
    "approve_outbound",
    "approve_count",
    "confirm_inbound",
    "confirm_outbound",
    "dispatch_transfer",
    "receive_transfer",
    "resolve_transfer",
    "confirm_count",
    "return_documents",
  ],
  "Kế toán kho": [
    "view_documents",
    "create_inbound",
    "create_outbound",
    "edit_own_documents",
    "approve_inbound",
    "approve_outbound",
  ],
  "Quản trị tập đoàn": [
    "view_documents",
    "create_inbound",
    "create_outbound",
    "create_count",
    "edit_own_documents",
    "edit_any_documents",
    "approve_inbound",
    "approve_outbound",
    "approve_count",
    "confirm_inbound",
    "confirm_outbound",
    "dispatch_transfer",
    "receive_transfer",
    "resolve_transfer",
    "confirm_count",
    "return_documents",
  ],
};

export function hasPermission(role: WmsRole, permission: WmsPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) === true;
}

const isoDay = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export const defaultCompanies: Company[] = [
  {
    id: "C01",
    name: "Công ty CP Tập đoàn An Phát",
    unitType: "subsidiary",
    status: "active",
    plants: ["Nhà máy Bắc Ninh", "Chi nhánh Hà Nội"],
  },
  {
    id: "C02",
    name: "Công ty TNHH Thiết bị Minh Long",
    unitType: "subsidiary",
    status: "active",
    plants: ["Nhà máy Bình Dương", "Chi nhánh TP. HCM"],
  },
  {
    id: "C03",
    name: "Công ty CP Công nghiệp Đại Việt",
    unitType: "subsidiary",
    status: "active",
    plants: ["Nhà máy Đà Nẵng", "Nhà máy Quảng Nam"],
  },
];

export const defaultWarehouses: Warehouse[] = [
  {
    id: "WH-BN-01",
    name: "Kho nguyên liệu Bắc Ninh",
    companyId: "C01",
    plant: "Nhà máy Bắc Ninh",
    type: "Nguyên vật liệu",
    location: "Lô A2, KCN Yên Phong",
    manager: "Trần Minh Đức",
    status: "active",
    hasTxn: true,
  },
  {
    id: "WH-HN-02",
    name: "Kho thành phẩm Hà Nội",
    companyId: "C01",
    plant: "Chi nhánh Hà Nội",
    type: "Thành phẩm",
    location: "Long Biên, Hà Nội",
    manager: "Nguyễn Thu Hà",
    status: "active",
    hasTxn: true,
  },
  {
    id: "WH-BD-01",
    name: "Kho linh kiện Bình Dương",
    companyId: "C02",
    plant: "Nhà máy Bình Dương",
    type: "Linh kiện",
    location: "KCN VSIP 1, Bình Dương",
    manager: "Lê Quốc Bảo",
    status: "active",
    hasTxn: true,
  },
  {
    id: "WH-HCM-02",
    name: "Kho phân phối TP. HCM",
    companyId: "C02",
    plant: "Chi nhánh TP. HCM",
    type: "Phân phối",
    location: "Quận 12, TP. HCM",
    manager: "Phạm Mỹ Linh",
    status: "active",
    hasTxn: true,
  },
  {
    id: "WH-DN-01",
    name: "Kho tổng Đà Nẵng",
    companyId: "C03",
    plant: "Nhà máy Đà Nẵng",
    type: "Tổng hợp",
    location: "KCN Hòa Khánh, Đà Nẵng",
    manager: "Võ Thành Nam",
    status: "active",
    hasTxn: true,
  },
  {
    id: "WH-QN-01",
    name: "Kho phụ trợ Quảng Nam",
    companyId: "C03",
    plant: "Nhà máy Quảng Nam",
    type: "Phụ trợ",
    location: "Điện Nam - Điện Ngọc",
    manager: "Đặng Thị Mai",
    status: "active",
    hasTxn: false,
  },
];

const rawProductsSeed: [string, string, string, string, boolean, boolean, number, number, number][] = [
  ["VT-001", "Thép cuộn cán nóng", "Nguyên vật liệu", "kg", true, false, 500, 5000, 68000],
  ["VT-002", "Tấm thép SS400 3mm", "Nguyên vật liệu", "tấm", false, false, 120, 800, 230000],
  ["VT-003", "Hạt nhựa PP nguyên sinh", "Nguyên vật liệu", "kg", true, true, 800, 6000, 32500],
  ["VT-004", "Sơn phủ công nghiệp màu xám", "Hóa chất", "lít", true, true, 140, 900, 87000],
  ["VT-005", "Bu lông inox M12", "Linh kiện", "cái", false, false, 300, 3000, 4200],
  ["VT-006", "Vòng bi 6204 ZZ", "Linh kiện", "cái", true, false, 80, 500, 38500],
  ["VT-007", "Động cơ điện 3 pha 5.5kW", "Thiết bị", "bộ", false, false, 12, 80, 3850000],
  ["VT-008", "Dầu thủy lực HLP 46", "Hóa chất", "lít", true, true, 100, 700, 74500],
  ["VT-009", "Bao bì carton 5 lớp", "Bao bì", "cái", false, false, 600, 5000, 8500],
  ["VT-010", "Dây cáp điện CXV 4x6", "Linh kiện", "m", true, false, 200, 1800, 63500],
  ["VT-011", "Găng tay bảo hộ phủ nitrile", "Bảo hộ", "đôi", false, false, 250, 2500, 12500],
  ["VT-012", "Keo dán công nghiệp A-88", "Hóa chất", "kg", true, true, 70, 400, 128000],
  ["VT-013", "Cảm biến tiệm cận M18", "Linh kiện", "cái", false, false, 20, 150, 565000],
  ["VT-014", "Pallet nhựa 1200x1000", "Bao bì", "cái", false, false, 45, 300, 395000],
  ["VT-015", "Mỡ bôi trơn chịu nhiệt", "Hóa chất", "kg", true, true, 60, 350, 112000],
  ["VT-016", "Bộ lọc khí nén AF40", "Thiết bị", "bộ", false, false, 15, 100, 275000],
  ["VT-017", "Ống thép mạ kẽm DN25", "Nguyên vật liệu", "m", true, false, 160, 1200, 94500],
  ["VT-018", "Tem nhãn mã vạch cuộn", "Bao bì", "cuộn", true, true, 50, 450, 28000],
];

export const defaultProducts: Product[] = rawProductsSeed.map((p, i) => ({
  id: p[0],
  name: p[1],
  category: p[2],
  itemType: p[2].includes("Nguyên vật liệu")
    ? "raw_material"
    : p[2].includes("Bán thành phẩm")
      ? "semi_finished"
      : p[2].includes("Thành phẩm")
        ? "finished"
        : "other",
  unit: p[3],
  lot: p[4],
  expiry: p[5],
  min: p[6],
  max: p[7],
  price: p[8],
  salePrice: p[8],
  costPrice: Math.round(p[8] * 0.85),
  spec: "Tiêu chuẩn công nghiệp",
  active: true,
  companyId: null,
  hasTxn: i < 14,
}));

export const defaultInventory: InventoryItem[] = defaultProducts.slice(0, 16).map((p, i) => {
  const companyId = defaultCompanies[i % 3].id;
  const wh =
    defaultWarehouses.filter((w) => w.companyId === companyId)[i % 2] ||
    defaultWarehouses.find((w) => w.companyId === companyId)!;
  const onHand = [380, 112, 620, 72, 540, 0, 8, 105, 740, 190, 220, 35, 17, 58, 65, 21][i];
  return {
    id: `INV-${String(i + 1).padStart(3, "0")}`,
    productId: p.id,
    companyId,
    warehouseId: wh.id,
    location: `Khu ${String.fromCharCode(65 + (i % 4))}-${(i % 5) + 1}`,
    lot: p.lot ? `LOT-${companyId}-${String(i + 11).padStart(3, "0")}` : "—",
    expiry: p.expiry ? isoDay(90 + i * 15) : "",
    onHand,
  };
});

export const defaultSuppliers: Supplier[] = [
  {
    id: "SUP-001",
    name: "Công ty Thép Việt Nhật",
    tax: "0101245789",
    phone: "024 3765 8900",
    email: "contact@thepvietnhat.vn",
    address: "Hà Nội",
    companyId: "C01",
    status: "active",
  },
  {
    id: "SUP-002",
    name: "Công ty Cơ khí Á Châu",
    tax: "3700891234",
    phone: "0274 382 1212",
    email: "sales@cokhiachau.vn",
    address: "Bình Dương",
    companyId: "C02",
    status: "active",
  },
  {
    id: "SUP-003",
    name: "Công ty Hóa chất Đông Á",
    tax: "0401567890",
    phone: "0236 388 7788",
    email: "info@hoachatdonga.vn",
    address: "Đà Nẵng",
    companyId: "C03",
    status: "active",
  },
  {
    id: "SUP-004",
    name: "Công ty Bao bì Việt",
    tax: "0109988776",
    phone: "024 3555 6622",
    email: "kinhdoanh@baobiviet.vn",
    address: "Bắc Ninh",
    companyId: "C01",
    status: "active",
  },
];

const rawDocsSeed: [string, DocumentType, string, string, string, string, DocumentStatus, number, string][] = [
  ["IN-26001", "inbound", "C01", "WH-BN-01", "Nhập mua từ nhà cung cấp", "Công ty Thép Việt Nhật", "approved", -1, "PO-VN-2601"],
  ["OUT-26001", "outbound", "C01", "WH-BN-01", "Xuất cấp vật tư sản xuất", "Xưởng cơ khí số 1", "pending", 0, "LSX-BN-2608"],
  ["TR-26001", "transfer", "C01", "WH-BN-01", "Điều chuyển nội bộ", "Kho thành phẩm Hà Nội", "in_transit", -2, "TR-REQ-001"],
  ["IN-26002", "inbound", "C02", "WH-BD-01", "Nhập mua từ nhà cung cấp", "Công ty Cơ khí Á Châu", "completed", -3, "PO-AC-2602"],
  ["OUT-26002", "outbound", "C02", "WH-BD-01", "Xuất hàng ra bên ngoài", "Công ty TNHH Minh Phát", "approved", -4, "SO-MP-2603"],
  ["IN-26003", "inbound", "C03", "WH-DN-01", "Nhập hàng khách trả lại", "Khách hàng Miền Trung", "pending", -1, "RMA-2601"],
  ["OUT-26003", "outbound", "C03", "WH-DN-01", "Xuất cấp vật tư sản xuất", "Xưởng lắp ráp Đà Nẵng", "completed", -5, "LSX-DN-2604"],
  ["TR-26002", "transfer", "C02", "WH-BD-01", "Điều chuyển nội bộ", "Kho phân phối TP. HCM", "approved", -1, "TR-REQ-002"],
  ["IN-26004", "inbound", "C01", "WH-HN-02", "Nhập kho sau sản xuất", "Xưởng hoàn thiện", "completed", -6, "LSX-HN-2605"],
  ["OUT-26004", "outbound", "C02", "WH-HCM-02", "Xuất hàng ra bên ngoài", "Đại lý Tân Bình", "completed", -2, "SO-TB-2606"],
  ["TR-26003", "transfer", "C03", "WH-DN-01", "Điều chuyển nội bộ", "Kho phụ trợ Quảng Nam", "completed", -7, "TR-REQ-003"],
  ["IN-26005", "inbound", "C02", "WH-BD-01", "Nhập từ nguồn bên ngoài khác", "Viện kiểm định kỹ thuật", "rejected", -4, "REF-TEST-01"],
];

export const defaultDocs: WmsDocument[] = rawDocsSeed.map((d, i) => {
  const createdAt = isoDay(d[7]);
  const creator = i % 4 === 0 ? "Nguyễn An" : ["Trần Minh Đức", "Lê Quốc Bảo", "Phạm Mỹ Linh"][i % 3];
  const prod = defaultProducts[i % defaultProducts.length];
  const qty = 15 + ((i * 7) % 65);

  let inboundSource: InboundSourceInfo | undefined = undefined;
  if (d[1] === "inbound") {
    if (d[4].includes("mua")) {
      inboundSource = { type: "purchase", party: d[5], purchaseOrder: d[8], voucherNo: `HD-${26000 + i}`, voucherDate: createdAt };
    } else if (d[4].includes("trả lại")) {
      inboundSource = { type: "return", party: d[5], originalIssueRef: d[8], returnReason: "Sản phẩm không đúng quy cách đơn hàng" };
    } else if (d[4].includes("sản xuất")) {
      inboundSource = { type: "production", department: d[5], productionOrder: d[8] };
    } else {
      inboundSource = { type: "external", party: d[5], externalKind: "Mẫu thử", voucherNo: d[8], reason: "Nhập phục vụ kiểm thử" };
    }
  }

  const doc: WmsDocument = {
    id: d[0],
    type: d[1],
    companyId: d[2],
    warehouseId: d[3],
    kind: d[4],
    partner: d[5],
    status: d[6],
    createdAt,
    documentDate: createdAt,
    reference: d[8],
    creator,
    items: [
      {
        productId: prod.id,
        qty,
        actualQty: d[6] === "completed" ? qty : undefined,
        lot: prod.lot ? `LOT-${d[2]}-0${i + 11}` : "—",
        unit: prod.unit,
        costPrice: prod.costPrice,
      },
    ],
    posted: d[6] === "completed" || d[6] === "in_transit",
    note: "",
    approver: ["approved", "completed", "in_transit"].includes(d[6]) ? "Lê Hoàng Sơn" : "",
    approvedAt: ["approved", "completed", "in_transit"].includes(d[6]) ? `${createdAt}T09:00:00.000Z` : undefined,
    inboundSource,
    submissionHistory: [{ actor: creator, at: `${createdAt}T08:00:00.000Z` }],
    stockPostings: d[6] === "completed" ? ["stock"] : d[6] === "in_transit" ? ["stock_dispatch"] : [],
  };

  if (doc.type === "transfer") {
    const destination = defaultWarehouses.find((w) => w.name === doc.partner);
    doc.targetWarehouseId = destination?.id || (doc.companyId === "C01" ? "WH-HN-02" : "WH-HCM-02");
    doc.targetCompanyId = destination?.companyId || doc.companyId;
    doc.items[0].requestedQty = qty;
    doc.items[0].shippedQty = ["in_transit", "completed"].includes(doc.status) ? qty : 0;
    doc.items[0].receivedQty = doc.status === "completed" ? qty : 0;
    if (doc.status === "in_transit") {
      doc.dispatchedAt = `${createdAt}T10:30:00.000Z`;
    } else if (doc.status === "completed") {
      doc.dispatchedAt = `${createdAt}T10:30:00.000Z`;
      doc.receivedAt = `${createdAt}T15:45:00.000Z`;
    }
  }

  if (doc.status === "rejected") {
    doc.rejectionReason = "Hồ sơ chứng từ chưa đầy đủ, thiếu phiếu đối soát kiểm nghiệm.";
    doc.rejectionHistory = [{ reason: doc.rejectionReason, actor: "Lê Hoàng Sơn", at: `${createdAt}T11:00:00.000Z` }];
  }

  return doc;
});

export const defaultTransactions: WmsTransaction[] = [
  {
    id: "TX-260801",
    date: `${isoDay(-1)}T09:30:00`,
    type: "inbound",
    companyId: "C01",
    warehouseId: "WH-BN-01",
    productId: "VT-001",
    lot: "LOT-C01-011",
    before: 330,
    change: 50,
    after: 380,
    actor: "Nguyễn An",
    reference: "IN-26001",
  },
  {
    id: "TX-260802",
    date: `${isoDay(-2)}T14:10:00`,
    type: "outbound",
    companyId: "C02",
    warehouseId: "WH-BD-01",
    productId: "VT-005",
    lot: "—",
    before: 590,
    change: -50,
    after: 540,
    actor: "Lê Quốc Bảo",
    reference: "OUT-26004",
  },
  {
    id: "TX-260803",
    date: `${isoDay(-3)}T11:00:00`,
    type: "transfer_in",
    companyId: "C02",
    warehouseId: "WH-HCM-02",
    productId: "VT-012",
    lot: "LOT-C02-022",
    before: 18,
    change: 17,
    after: 35,
    actor: "Phạm Mỹ Linh",
    reference: "TR-26003",
  },
];

export function createInitialWmsState(): WmsDataState {
  return {
    version: 1,
    companies: JSON.parse(JSON.stringify(defaultCompanies)),
    warehouses: JSON.parse(JSON.stringify(defaultWarehouses)),
    products: JSON.parse(JSON.stringify(defaultProducts)),
    inventory: JSON.parse(JSON.stringify(defaultInventory)),
    inventoryCounts: [],
    docs: JSON.parse(JSON.stringify(defaultDocs)),
    transactions: JSON.parse(JSON.stringify(defaultTransactions)),
    suppliers: JSON.parse(JSON.stringify(defaultSuppliers)),
    auditLog: [],
    role: "Quản lý kho",
    theme: "light",
    seq: 10,
  };
}

export function loadWmsData(): WmsDataState {
  try {
    const raw = localStorage.getItem(WMS_STORAGE_KEY);
    if (!raw) {
      const initial = createInitialWmsState();
      saveWmsData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.inventory) || !Array.isArray(parsed.docs)) {
      const initial = createInitialWmsState();
      saveWmsData(initial);
      return initial;
    }
    return parsed;
  } catch (err) {
    console.error("Failed to load WMS data from localStorage:", err);
    return createInitialWmsState();
  }
}

export function saveWmsData(state: WmsDataState): boolean {
  try {
    localStorage.setItem(WMS_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error("Failed to save WMS data to localStorage:", err);
    return false;
  }
}

export function resetWmsDemoData(): WmsDataState {
  const initial = createInitialWmsState();
  saveWmsData(initial);
  return initial;
}

export function addWmsTestData(state: WmsDataState, actor = "Nguyễn An"): WmsDataState {
  const cloned: WmsDataState = JSON.parse(JSON.stringify(state));
  const batchId = `TEST-BATCH-${Date.now().toString().slice(-6)}`;
  const today = isoDay();

  // Add 1 test pending inbound
  const inId = `IN-TEST-${Date.now().toString().slice(-4)}`;
  const inDoc: WmsDocument = {
    id: inId,
    type: "inbound",
    companyId: "C01",
    warehouseId: "WH-BN-01",
    kind: "Nhập mua từ nhà cung cấp",
    partner: "Công ty Thép Việt Nhật",
    status: "pending",
    createdAt: today,
    documentDate: today,
    reference: `PO-${batchId}`,
    creator: "Nguyễn Thu Hà",
    items: [
      {
        productId: "VT-001",
        qty: 120,
        lot: `LOT-C01-${Date.now().toString().slice(-3)}`,
        unit: "kg",
        costPrice: 68000,
      },
    ],
    inboundSource: {
      type: "purchase",
      party: "Công ty Thép Việt Nhật",
      purchaseOrder: `PO-${batchId}`,
      voucherNo: `HD-${Date.now().toString().slice(-4)}`,
      voucherDate: today,
    },
    posted: false,
    submissionHistory: [{ actor: "Nguyễn Thu Hà", at: new Date().toISOString() }],
  };

  // Add 1 test pending outbound
  const outId = `OUT-TEST-${Date.now().toString().slice(-4)}`;
  const outDoc: WmsDocument = {
    id: outId,
    type: "outbound",
    companyId: "C02",
    warehouseId: "WH-BD-01",
    kind: "Xuất cấp vật tư sản xuất",
    partner: "Xưởng cơ khí Bình Dương",
    status: "pending",
    createdAt: today,
    documentDate: today,
    reference: `LSX-${batchId}`,
    creator: "Lê Quốc Bảo",
    items: [
      {
        productId: "VT-005",
        qty: 35,
        lot: "—",
        unit: "cái",
        costPrice: 4200,
      },
    ],
    posted: false,
    submissionHistory: [{ actor: "Lê Quốc Bảo", at: new Date().toISOString() }],
  };

  // Add 1 test in-transit transfer
  const trId = `TR-TEST-${Date.now().toString().slice(-4)}`;
  const trDoc: WmsDocument = {
    id: trId,
    type: "transfer",
    companyId: "C01",
    warehouseId: "WH-BN-01",
    targetWarehouseId: "WH-HN-02",
    targetCompanyId: "C01",
    kind: "Điều chuyển nội bộ",
    partner: "Kho thành phẩm Hà Nội",
    status: "in_transit",
    createdAt: today,
    documentDate: today,
    reference: `TRQ-${batchId}`,
    creator: "Trần Minh Đức",
    items: [
      {
        productId: "VT-002",
        qty: 15,
        requestedQty: 15,
        shippedQty: 15,
        receivedQty: 0,
        lot: "—",
        unit: "tấm",
        costPrice: 230000,
      },
    ],
    posted: true,
    approver: "Lê Hoàng Sơn",
    approvedAt: new Date().toISOString(),
    dispatchedAt: new Date().toISOString(),
    stockPostings: ["stock_dispatch"],
  };

  cloned.docs.unshift(inDoc, outDoc, trDoc);

  // Add audit logs
  cloned.auditLog.unshift(
    {
      id: `AUD-${Date.now()}-1`,
      documentId: inId,
      action: "Tạo phiếu nhập từ nạp test data",
      actor,
      role: cloned.role,
      at: new Date().toISOString(),
      changes: [{ field: "Mã phiếu", before: "—", after: inId }],
      demoBatchId: batchId,
    },
    {
      id: `AUD-${Date.now()}-2`,
      documentId: outId,
      action: "Tạo phiếu xuất từ nạp test data",
      actor,
      role: cloned.role,
      at: new Date().toISOString(),
      changes: [{ field: "Mã phiếu", before: "—", after: outId }],
      demoBatchId: batchId,
    },
  );

  saveWmsData(cloned);
  return cloned;
}

export function logAuditAction(
  state: WmsDataState,
  action: string,
  actor: string,
  role: WmsRole,
  documentId?: string,
  changes: AuditLogChange[] = [],
): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: `AUD-${Date.now()}-${state.auditLog.length + 1}`,
    documentId,
    action,
    actor,
    role,
    at: new Date().toISOString(),
    changes,
  };
  state.auditLog.unshift(entry);
  if (documentId) {
    const doc = state.docs.find((d) => d.id === documentId);
    if (doc) {
      doc.auditHistory = doc.auditHistory || [];
      doc.auditHistory.unshift(entry);
      doc.updatedAt = entry.at;
    }
  }
  return entry;
}

export function getAvailableStock(
  inventory: InventoryItem[],
  companyId: string,
  warehouseId: string,
  productId: string,
  lot?: string,
): number {
  return inventory
    .filter(
      (row) =>
        row.companyId === companyId &&
        row.warehouseId === warehouseId &&
        row.productId === productId &&
        (!lot || lot === "—" || row.lot === lot),
    )
    .reduce((sum, row) => sum + (row.onHand || 0), 0);
}

export function applyStockPosting(
  state: WmsDataState,
  doc: WmsDocument,
  sign: number, // +1 for inbound, -1 for outbound
  warehouseId: string,
  companyId: string,
  lines: Array<{ productId: string; qty: number; lot?: string }>,
  actor: string,
  role: WmsRole,
  postingKey = "stock",
): { success: boolean; error?: string } {
  try {
    doc.stockPostings = doc.stockPostings || [];
    if (doc.stockPostings.includes(postingKey)) {
      return { success: false, error: "Giao dịch này đã được ghi nhận trước đó." };
    }

    // Availability validation for deductions
    if (sign < 0) {
      for (const line of lines) {
        const available = getAvailableStock(state.inventory, companyId, warehouseId, line.productId, line.lot);
        if (available < line.qty) {
          return {
            success: false,
            error: `Tồn kho khả dụng không đủ cho ${line.productId}${line.lot ? ` (Lô: ${line.lot})` : ""}. Hiện có: ${available}, yêu cầu: ${line.qty}.`,
          };
        }
      }
    }

    const now = new Date().toISOString();

    for (const line of lines) {
      const targetLot = line.lot || "—";
      let row = state.inventory.find(
        (r) =>
          r.companyId === companyId &&
          r.warehouseId === warehouseId &&
          r.productId === line.productId &&
          r.lot === targetLot,
      );

      if (!row) {
        if (sign < 0) {
          return { success: false, error: `Không tìm thấy dòng tồn kho để trừ cho ${line.productId}.` };
        }
        row = {
          id: `INV-${Date.now().toString().slice(-6)}-${state.inventory.length + 1}`,
          productId: line.productId,
          companyId,
          warehouseId,
          location: "Khu tiếp nhận",
          lot: targetLot,
          expiry: "",
          onHand: 0,
        };
        state.inventory.push(row);
      }

      const before = row.onHand;
      const after = before + sign * line.qty;
      if (after < 0) {
        return { success: false, error: "Tồn kho không được phép âm." };
      }
      row.onHand = after;

      const txType =
        doc.type === "inbound"
          ? "inbound"
          : doc.type === "transfer"
            ? sign > 0
              ? "transfer_in"
              : "transfer_out"
            : "outbound";

      state.transactions.unshift({
        id: `TX-${Date.now().toString().slice(-8)}-${state.transactions.length + 1}`,
        date: now,
        type: txType,
        companyId,
        warehouseId,
        productId: line.productId,
        lot: targetLot,
        before,
        change: sign * line.qty,
        after,
        actor,
        reference: doc.id,
      });
    }

    doc.stockPostings.push(postingKey);
    doc.posted = true;
    doc.updatedAt = now;

    logAuditAction(state, "Ghi nhận biến động tồn kho", actor, role, doc.id, [
      { field: "Giao dịch", before: "Chưa ghi nhận", after: postingKey },
      { field: "Thời điểm ghi sổ", before: "—", after: now },
    ]);

    saveWmsData(state);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi ghi nhận sổ kho." };
  }
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escapeCell = (val: string | number) => {
    const s = String(val ?? "").replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };

  const csvContent =
    "\uFEFF" +
    [headers.map(escapeCell).join(","), ...rows.map((r) => r.map(escapeCell).join(","))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

