import type {
  ExportOrder,
  ExportUser,
  Material,
  Project,
  Requisition,
  Warehouse,
} from "../types/exportOrder"

export const STORAGE_ORDERS_KEY = "iqc_export_orders_v2"
export const STORAGE_USER_KEY = "iqc_export_current_user_v2"

/* ── 1. DEMO USERS (Role Switcher) ── */
export const DEMO_USERS: ExportUser[] = [
  {
    id: "user-acc-01",
    name: "Nguyễn Văn An",
    role: "Kế toán công trình",
    roleType: "accountant",
    warehouseId: null,
    avatarIcon: "fa-calculator",
  },
  {
    id: "user-wh-lm",
    name: "Trần Đình Trọng",
    role: "Thủ kho Landmark",
    roleType: "warehouse_keeper",
    warehouseId: "KHO-LM",
    avatarIcon: "fa-warehouse",
  },
  {
    id: "user-wh-hn",
    name: "Lê Hoàng Nam",
    role: "Thủ kho Hầm ngầm",
    roleType: "warehouse_keeper",
    warehouseId: "KHO-HN",
    avatarIcon: "fa-dungeon",
  },
  {
    id: "user-wh-gv",
    name: "Phạm Minh Tuấn",
    role: "Thủ kho Gò Vấp",
    roleType: "warehouse_keeper",
    warehouseId: "KHO-GV",
    avatarIcon: "fa-boxes-stacked",
  },
  {
    id: "user-wh-bd",
    name: "Vũ Đức Thắng",
    role: "Thủ kho Bình Dương",
    roleType: "warehouse_keeper",
    warehouseId: "KHO-BD",
    avatarIcon: "fa-truck-ramp-box",
  },
  {
    id: "user-wh-metro",
    name: "Đỗ Quang Hải",
    role: "Thủ kho Metro",
    roleType: "warehouse_keeper",
    warehouseId: "KHO-METRO",
    avatarIcon: "fa-train-subway",
  },
  {
    id: "user-auditor-01",
    name: "Hoàng Gia Bảo",
    role: "Kiểm kê viên bên thứ ba",
    roleType: "auditor",
    warehouseId: null,
    avatarIcon: "fa-clipboard-check",
  },
]

/* ── 2. MASTER DATA ── */
export const PROJECTS: Project[] = [
  {
    id: "DA-LANDMARK",
    name: "Tổ hợp Sky Landmark 81 (Q. Bình Thạnh)",
    code: "SKY-LM",
  },
  {
    id: "DA-HAMNGAM",
    name: "Dự án Hầm ngầm Vượt sông Thủ Thiêm",
    code: "HAM-TT",
  },
  {
    id: "DA-METRO",
    name: "Tuyến Metro số 1 Bến Thành - Suối Tiên (Gói CP2)",
    code: "METRO-CP2",
  },
  {
    id: "DA-GOVAP",
    name: "Khu Phức hợp Dân cư Green Valley (Gò Vấp)",
    code: "GV-ECO",
  },
  {
    id: "DA-BINHDUONG",
    name: "Nhà máy Kỹ thuật cao KCN VSIP Bình Dương",
    code: "VSIP-BD",
  },
]

export const WAREHOUSES: Warehouse[] = [
  {
    id: "KHO-LM",
    name: "Thủ kho Landmark (Kho Công trường Landmark)",
    code: "WH-LM",
    keeperName: "Trần Đình Trọng",
  },
  {
    id: "KHO-HN",
    name: "Thủ kho Hầm ngầm (Kho Dã chiến Hầm Thủ Thiêm)",
    code: "WH-HN",
    keeperName: "Lê Hoàng Nam",
  },
  {
    id: "KHO-GV",
    name: "Thủ kho Gò Vấp (Kho Trung chuyển Gò Vấp)",
    code: "WH-GV",
    keeperName: "Phạm Minh Tuấn",
  },
  {
    id: "KHO-BD",
    name: "Thủ kho Bình Dương (Kho Tổng VSIP Bình Dương)",
    code: "WH-BD",
    keeperName: "Vũ Đức Thắng",
  },
  {
    id: "KHO-METRO",
    name: "Thủ kho Metro (Kho Kỹ thuật Metro CP2)",
    code: "WH-MT",
    keeperName: "Đỗ Quang Hải",
  },
]

export const MATERIALS: Material[] = [
  {
    id: "VT-XM-PCB40",
    code: "VT-XM-01",
    name: "Xi măng Holcim PCB40",
    unit: "Bao (50kg)",
    defaultQuota: 300,
  },
  {
    id: "VT-THEP-D18",
    code: "VT-TH-02",
    name: "Thép vằn phi 18 Hòa Phát CB400",
    unit: "Cây (11.7m)",
    defaultQuota: 150,
  },
  {
    id: "VT-CAT-VANG",
    code: "VT-CV-03",
    name: "Cát vàng xây dựng hạt trung",
    unit: "m³",
    defaultQuota: 80,
  },
  {
    id: "VT-DA-1X2",
    code: "VT-DA-04",
    name: "Đá dăm 1x2 bê tông tiêu chuẩn",
    unit: "m³",
    defaultQuota: 100,
  },
  {
    id: "VT-GACH-4L",
    code: "VT-GC-05",
    name: "Gạch tuynel 4 lỗ tiêu chuẩn (8x8x18)",
    unit: "Viên",
    defaultQuota: 5000,
  },
  {
    id: "VT-SON-LOT",
    code: "VT-SN-06",
    name: "Sơn lót chống kiềm Dulux Weathershield",
    unit: "Thùng (18L)",
    defaultQuota: 60,
  },
  {
    id: "VT-ONG-PVC110",
    code: "VT-OG-07",
    name: "Ống nhựa PVC D110 Tiền Phong C2",
    unit: "Cây (4m)",
    defaultQuota: 120,
  },
  {
    id: "VT-THEP-D25",
    code: "VT-TH-08",
    name: "Thép vằn phi 25 Hòa Phát CB400",
    unit: "Cây (11.7m)",
    defaultQuota: 200,
  },
  {
    id: "VT-BE-TONG",
    code: "VT-BT-09",
    name: "Bê tông thương phẩm M300 R28",
    unit: "m³",
    defaultQuota: 500,
  },
  {
    id: "VT-BOLON-12",
    code: "VT-BL-10",
    name: "Bulong M12 x 50mm mạ kẽm (Bộ 50 cái)",
    unit: "Bộ",
    defaultQuota: 100,
  },
]

export const REQUISITIONS: Requisition[] = [
  {
    id: "DN-2026-088",
    code: "ĐN-088/XD",
    projectId: "DA-LANDMARK",
    approvedBy: "Lê Quang Trực (Giám đốc BQLDA)",
    approvedDate: "2026-11-01",
    title: "Phiếu đề nghị thi công sàn bê tông tầng 15 - Sky Landmark",
    quotas: {
      "VT-XM-PCB40": 200,
      "VT-THEP-D18": 100,
      "VT-CAT-VANG": 40,
    },
  },
  {
    id: "DN-2026-092",
    code: "ĐN-092/XD",
    projectId: "DA-GOVAP",
    approvedBy: "Trần Anh Quân (Chỉ huy trưởng)",
    approvedDate: "2026-11-02",
    title: "Phiếu đề nghị đổ móng trụ T8 - Green Valley Gò Vấp",
    quotas: {
      "VT-CAT-VANG": 60,
      "VT-DA-1X2": 80,
      "VT-XM-PCB40": 250,
    },
  },
  {
    id: "DN-2026-104",
    code: "ĐN-104/GT",
    projectId: "DA-METRO",
    approvedBy: "Phạm Quốc Dũng (Trưởng ban Điều hành CP2)",
    approvedDate: "2026-11-03",
    title: "Phiếu đề nghị gia cố hầm kỹ thuật Metro Bến Thành",
    quotas: {
      "VT-THEP-D18": 180,
      "VT-ONG-PVC110": 80,
      "VT-BOLON-12": 60,
    },
  },
  {
    id: "DN-2026-115",
    code: "ĐN-115/XD",
    projectId: "DA-HAMNGAM",
    approvedBy: "Vũ Đình Cường (Tư vấn Giám sát)",
    approvedDate: "2026-11-04",
    title: "Phiếu đề nghị lắp đặt ống kỹ thuật & thoát nước hầm",
    quotas: {
      "VT-ONG-PVC110": 100,
      "VT-BOLON-12": 80,
      "VT-THEP-D25": 120,
    },
  },
  {
    id: "DN-2026-125",
    code: "ĐN-125/CN",
    projectId: "DA-BINHDUONG",
    approvedBy: "Ngô Minh Hiếu (Quản lý Nhà xưởng)",
    approvedDate: "2026-11-05",
    title: "Phiếu đề nghị xây tường bao và hoàn thiện nhà xưởng VSIP",
    quotas: {
      "VT-GACH-4L": 5000,
      "VT-SON-LOT": 50,
      "VT-XM-PCB40": 150,
    },
  },
]

/* Demo SVG Data URIs for lightweight realistic previews */
export const DEMO_SVG_RECEIPT =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23f8fafc'/><rect x='20' y='20' width='360' height='260' rx='8' fill='%23ffffff' stroke='%23cbd5e1' stroke-width='2'/><text x='40' y='60' font-family='Arial' font-size='16' font-weight='bold' fill='%231d4ed8'>BIÊN BẢN GIAO NHẬN VẬT TƯ</text><text x='40' y='90' font-family='Arial' font-size='12' fill='%2364748b'>Số: BB-2026-XN01 | Đã kiểm định kho</text><line x1='40' y1='110' x2='360' y2='110' stroke='%23e2e8f0'/><text x='40' y='140' font-family='Arial' font-size='12' fill='%230f172a'>- Vật tư theo lệnh xuất đạt quy cách</text><text x='40' y='165' font-family='Arial' font-size='12' fill='%230f172a'>- Phiếu đề nghị đính kèm hợp lệ</text><text x='40' y='220' font-family='Arial' font-size='12' font-weight='bold' fill='%2316a34a'>✓ ĐÃ KÝ XÁC NHẬN BÀN GIAO</text><path d='M250,230 Q280,210 300,240 T340,225' fill='none' stroke='%23dc2626' stroke-width='3'/></svg>"

export const DEMO_SVG_TRUCK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23eff6ff'/><rect x='20' y='20' width='360' height='260' rx='8' fill='%23ffffff' stroke='%23bfdbfe' stroke-width='2'/><text x='40' y='60' font-family='Arial' font-size='16' font-weight='bold' fill='%230284c7'>ẢNH XE BỐC DỠ TẠI BÃI KHO</text><text x='40' y='90' font-family='Arial' font-size='12' fill='%2364748b'>Biển số: 51C-882.14 • Cổng kho số 1</text><circle cx='120' cy='190' r='20' fill='%23334155'/><circle cx='280' cy='190' r='20' fill='%23334155'/><rect x='80' y='120' width='150' height='60' fill='%232563eb' rx='4'/><rect x='230' y='135' width='70' height='45' fill='%231e40af' rx='4'/><text x='40' y='245' font-family='Arial' font-size='12' fill='%2316a34a'>✓ Đã bốc dỡ nghiệm thu và niêm chì</text></svg>"

/* ── 3. INITIAL SEED ORDERS ── */
export const INITIAL_ORDERS: ExportOrder[] = [
  {
    id: "ord-001",
    code: "LX-2026-0001",
    status: "completed",
    projectId: "DA-LANDMARK",
    warehouseId: "KHO-LM",
    requisitionId: "DN-2026-088",
    vehiclePlate: "51C-774.29",
    creatorName: "Nguyễn Văn An",
    createdAt: "2026-11-01 08:30",
    expectedDate: "2026-11-02",
    notes:
      "Xuất vật tư phục vụ thi công dầm sàn tầng 15. Xe cẩu vào lúc 9h00 sáng.",
    materials: [
      {
        materialId: "VT-XM-PCB40",
        approvedQty: 200,
        reqQty: 120,
        issuedQty: 120,
      },
      {
        materialId: "VT-THEP-D18",
        approvedQty: 100,
        reqQty: 80,
        issuedQty: 80,
      },
    ],
    initialPhotos: [DEMO_SVG_RECEIPT],
    handoverPhotos: [DEMO_SVG_TRUCK],
    logs: [
      {
        time: "2026-11-01 08:30",
        actor: "Nguyễn Văn An (Kế toán)",
        action: "Tạo lệnh xuất nháp",
        note: "Lập lệnh theo đề nghị DN-2026-088",
      },
      {
        time: "2026-11-01 09:15",
        actor: "Nguyễn Văn An (Kế toán)",
        action: "Phát hành lệnh xuất",
        note: "Đã chuyển lệnh đến Kho Landmark",
      },
      {
        time: "2026-11-01 10:00",
        actor: "Trần Đình Trọng (Thủ kho)",
        action: "Tiếp nhận lệnh xuất",
        note: "Đã bố trí xe cẩu và công nhân bốc dỡ",
      },
      {
        time: "2026-11-01 14:30",
        actor: "Trần Đình Trọng (Thủ kho)",
        action: "Xuất kho đủ 100%",
        note: "Đã giao đủ 120 bao xi măng và 80 cây thép, có biên bản ký nhận",
      },
    ],
  },
  {
    id: "ord-002",
    code: "LX-2026-0002",
    status: "partial",
    projectId: "DA-GOVAP",
    warehouseId: "KHO-GV",
    requisitionId: "DN-2026-092",
    vehiclePlate: "50LD-019.82",
    creatorName: "Nguyễn Văn An",
    createdAt: "2026-11-02 09:00",
    expectedDate: "2026-11-04",
    notes: "Đổ bê tông móng trụ T8 phân đợt 1. Cần kiểm tra độ ẩm cát vàng.",
    materials: [
      { materialId: "VT-CAT-VANG", approvedQty: 60, reqQty: 40, issuedQty: 20 },
      { materialId: "VT-DA-1X2", approvedQty: 80, reqQty: 50, issuedQty: 25 },
      {
        materialId: "VT-XM-PCB40",
        approvedQty: 250,
        reqQty: 150,
        issuedQty: 100,
      },
    ],
    initialPhotos: [DEMO_SVG_RECEIPT],
    handoverPhotos: [DEMO_SVG_TRUCK],
    logs: [
      {
        time: "2026-11-02 09:00",
        actor: "Nguyễn Văn An (Kế toán)",
        action: "Phát hành lệnh xuất",
        note: "Phát hành lệnh theo phiếu DN-2026-092",
      },
      {
        time: "2026-11-02 10:20",
        actor: "Phạm Minh Tuấn (Thủ kho)",
        action: "Tiếp nhận lệnh xuất",
        note: "Chuẩn bị cân cát đá tại bãi tập kết Gò Vấp",
      },
      {
        time: "2026-11-02 16:00",
        actor: "Phạm Minh Tuấn (Thủ kho)",
        action: "Xuất đợt 1 (Xuất một phần)",
        note: "Xuất đợt 1 cho 2 xe tải. Khối lượng còn lại xuất vào ngày mai.",
      },
    ],
  },
  {
    id: "ord-003",
    code: "LX-2026-0003",
    status: "in_progress",
    projectId: "DA-METRO",
    warehouseId: "KHO-METRO",
    requisitionId: "DN-2026-104",
    vehiclePlate: "51D-921.33",
    creatorName: "Nguyễn Văn An",
    createdAt: "2026-11-03 14:00",
    expectedDate: "2026-11-04",
    notes:
      "Vật tư gia cố vách hầm hở Metro CP2. Yêu cầu bọc màng chống trầy cho ống PVC.",
    materials: [
      {
        materialId: "VT-THEP-D18",
        approvedQty: 180,
        reqQty: 120,
        issuedQty: 0,
      },
      {
        materialId: "VT-ONG-PVC110",
        approvedQty: 80,
        reqQty: 60,
        issuedQty: 0,
      },
    ],
    initialPhotos: [DEMO_SVG_RECEIPT],
    handoverPhotos: [],
    logs: [
      {
        time: "2026-11-03 14:00",
        actor: "Nguyễn Văn An (Kế toán)",
        action: "Phát hành lệnh xuất",
        note: "Chỉ định Kho Metro xuất hàng",
      },
      {
        time: "2026-11-03 15:30",
        actor: "Đỗ Quang Hải (Thủ kho)",
        action: "Tiếp nhận lệnh xuất",
        note: "Đang xếp thép lên rơ-moóc chuyên dụng",
      },
    ],
  },
  {
    id: "ord-004",
    code: "LX-2026-0004",
    status: "pending",
    projectId: "DA-HAMNGAM",
    warehouseId: "KHO-HN",
    requisitionId: "DN-2026-115",
    vehiclePlate: "60C-441.90",
    creatorName: "Nguyễn Văn An",
    createdAt: "2026-11-04 08:15",
    expectedDate: "2026-11-05",
    notes: "Vật tư ống thoát nước và bulong gia cố vách hầm Thủ Thiêm.",
    materials: [
      {
        materialId: "VT-ONG-PVC110",
        approvedQty: 100,
        reqQty: 50,
        issuedQty: 0,
      },
      { materialId: "VT-BOLON-12", approvedQty: 80, reqQty: 40, issuedQty: 0 },
    ],
    initialPhotos: [DEMO_SVG_RECEIPT],
    handoverPhotos: [],
    logs: [
      {
        time: "2026-11-04 08:15",
        actor: "Nguyễn Văn An (Kế toán)",
        action: "Phát hành lệnh xuất",
        note: "Lệnh mới phát hành, chờ thủ kho Hầm ngầm tiếp nhận",
      },
    ],
  },
  {
    id: "ord-005",
    code: "LX-2026-0005",
    status: "draft",
    projectId: "DA-BINHDUONG",
    warehouseId: "KHO-BD",
    requisitionId: "DN-2026-125",
    vehiclePlate: "61C-322.11",
    creatorName: "Nguyễn Văn An",
    createdAt: "2026-11-04 09:10",
    expectedDate: "2026-11-06",
    notes: "Bản nháp dự trù đợt xây tường nhà xưởng VSIP.",
    materials: [
      {
        materialId: "VT-GACH-4L",
        approvedQty: 5000,
        reqQty: 2500,
        issuedQty: 0,
      },
      { materialId: "VT-SON-LOT", approvedQty: 50, reqQty: 30, issuedQty: 0 },
    ],
    initialPhotos: [],
    handoverPhotos: [],
    logs: [
      {
        time: "2026-11-04 09:10",
        actor: "Nguyễn Văn An (Kế toán)",
        action: "Tạo lệnh xuất nháp",
        note: "Bản nháp đang rà soát khối lượng cùng bên thi công",
      },
    ],
  },
  {
    id: "ord-006",
    code: "LX-2026-0006",
    status: "cancelled",
    projectId: "DA-LANDMARK",
    warehouseId: "KHO-LM",
    requisitionId: "DN-2026-088",
    vehiclePlate: "51C-881.02",
    creatorName: "Nguyễn Văn An",
    createdAt: "2026-10-29 08:00",
    expectedDate: "2026-10-30",
    notes: "Lệnh dự phòng đổ sàn.",
    cancelReason:
      "Thay đổi kế hoạch thi công, đội thi công dời lịch đổ sàn sang tuần sau.",
    materials: [
      { materialId: "VT-XM-PCB40", approvedQty: 200, reqQty: 50, issuedQty: 0 },
    ],
    initialPhotos: [],
    handoverPhotos: [],
    logs: [
      {
        time: "2026-10-29 08:00",
        actor: "Nguyễn Văn An (Kế toán)",
        action: "Tạo lệnh xuất nháp",
        note: "Lập lệnh dự phòng",
      },
      {
        time: "2026-10-29 09:30",
        actor: "Nguyễn Văn An (Kế toán)",
        action: "Phát hành lệnh xuất",
        note: "Phát hành lệnh",
      },
      {
        time: "2026-10-29 11:00",
        actor: "Nguyễn Văn An (Kế toán)",
        action: "Hủy lệnh xuất",
        note: "Lý do: Thay đổi kế hoạch thi công, đội thi công dời lịch đổ sàn sang tuần sau.",
      },
    ],
  },
]

/* ── 4. STORAGE HELPERS & CANVAS IMAGE COMPRESSION ── */

export function loadStoredOrders(): ExportOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY)
    if (!raw) {
      saveStoredOrders(INITIAL_ORDERS)
      return INITIAL_ORDERS
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
  } catch (e) {
    console.error("Failed to load export orders from localStorage:", e)
  }
  saveStoredOrders(INITIAL_ORDERS)
  return INITIAL_ORDERS
}

export function saveStoredOrders(orders: ExportOrder[]): void {
  try {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders))
  } catch (e) {
    console.error("Failed to save export orders to localStorage:", e)
  }
}

export function loadStoredCurrentUser(): ExportUser {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.id) return parsed
    }
  } catch {
    /* ignore */
  }
  return DEMO_USERS[0] // Nguyễn Văn An
}

export function saveStoredCurrentUser(user: ExportUser): void {
  try {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user))
  } catch {
    /* ignore */
  }
}

export function resetDemoExportData(): {
  orders: ExportOrder[]
  user: ExportUser
} {
  saveStoredOrders(INITIAL_ORDERS)
  saveStoredCurrentUser(DEMO_USERS[0])
  return { orders: INITIAL_ORDERS, user: DEMO_USERS[0] }
}

/**
 * Nén ảnh tự động qua HTML5 Canvas trước khi lưu vào localStorage để tránh tràn quota
 * Max width/height: 1024px, JPEG quality: 0.75
 */
export function compressImageFile(
  file: File,
  maxDim = 1024,
  quality = 0.75,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(e.target?.result as string)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality)
        resolve(compressedBase64)
      }
      img.src = (e.target?.result as string)
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Tự động sinh mã lệnh LX-YYYY-XXXX tiếp theo
 */
export function generateNextOrderCode(orders: ExportOrder[]): string {
  const currentYear = new Date().getFullYear()
  const prefix = `LX-${currentYear}-`
  let maxSeq = 0

  for (const o of orders) {
    if (o.code && o.code.startsWith(prefix)) {
      const seqStr = o.code.substring(prefix.length)
      const seq = parseInt(seqStr, 10)
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq
      }
    }
  }

  const nextSeq = maxSeq + 1
  return `${prefix}${String(nextSeq).padStart(4, "0")}`
}

export function getProjectById(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id)
}

export function getWarehouseById(id: string): Warehouse | undefined {
  return WAREHOUSES.find((w) => w.id === id)
}

export function getMaterialById(id: string): Material | undefined {
  return MATERIALS.find((m) => m.id === id)
}

export function getRequisitionById(id: string): Requisition | undefined {
  return REQUISITIONS.find((r) => r.id === id)
}

/**
 * Tính toán tiến độ xuất kho của lệnh
 */
export function calculateOrderProgress(
  order: ExportOrder,
): {
  totalReq: number
  totalIssued: number
  percent: number
} {
  let totalReq = 0
  let totalIssued = 0

  for (const m of order.materials) {
    totalReq += m.reqQty || 0
    totalIssued += m.issuedQty || 0
  }

  const percent =
    totalReq > 0 ? Math.min(100, Math.round((totalIssued / totalReq) * 100)) : 0
  return { totalReq, totalIssued, percent }
}

export function getStatusBadgeInfo(
  status: ExportOrder["status"],
): {
  label: string
  badgeCls: string
  icon: string
} {
  switch (status) {
    case "draft":
      return {
        label: "Bản nháp",
        badgeCls:
          "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
        icon: "fa-file-lines",
      }
    case "pending":
      return {
        label: "Chờ xuất kho",
        badgeCls:
          "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
        icon: "fa-clock",
      }
    case "in_progress":
      return {
        label: "Đang xuất kho",
        badgeCls:
          "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
        icon: "fa-dolly",
      }
    case "partial":
      return {
        label: "Xuất một phần",
        badgeCls:
          "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30",
        icon: "fa-boxes-packing",
      }
    case "completed":
      return {
        label: "Hoàn tất xuất",
        badgeCls:
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        icon: "fa-circle-check",
      }
    case "cancelled":
      return {
        label: "Đã hủy",
        badgeCls:
          "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
        icon: "fa-ban",
      }
    default:
      return {
        label: "Không xác định",
        badgeCls: "bg-slate-500/10 text-slate-600 border-slate-500/30",
        icon: "fa-question",
      }
  }
}
