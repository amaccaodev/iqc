import type { ProductionOrder, User } from "../../../shared/src/types/index.js";

export const SEED_USERS: User[] = [
  { id: "u1", employeeId: "NV001", name: "Nguyễn Văn An", password: "123456", role: "director", teamId: "", department: "Ban Giám Đốc", phone: "0901234567", active: true },
  { id: "u2", employeeId: "NV002", name: "Trần Thị Bình", password: "123456", role: "director", teamId: "", department: "Ban Giám Đốc", phone: "0901234568", active: true },
  { id: "u3", employeeId: "NV010", name: "Lê Văn Quốc", password: "123456", role: "supervisor", teamId: "", department: "Phân xưởng", phone: "0902345678", active: true },
  { id: "u4", employeeId: "NV020", name: "Phạm Văn Chí", password: "123456", role: "teamlead", teamId: "t1", department: "Tổ 1", phone: "0903456789", active: true },
  { id: "u5", employeeId: "NV021", name: "Phạm Văn Sang", password: "123456", role: "teamlead", teamId: "t2", department: "Tổ 2", phone: "0903456790", active: true },
  { id: "u6", employeeId: "NV030", name: "Cường 2T3", password: "123456", role: "worker", teamId: "t1", department: "Tổ 1", phone: "0904567890", active: true },
  { id: "u7", employeeId: "NV031", name: "Nga 3/43", password: "123456", role: "worker", teamId: "t1", department: "Tổ 1", phone: "0904567891", active: true },
  { id: "u8", employeeId: "NV040", name: "T.V.Huấn", password: "123456", role: "qc", teamId: "", department: "Phòng QC", phone: "0905678901", active: true },
  { id: "u9", employeeId: "NV050", name: "Nguyễn Thị Lan", password: "123456", role: "stats", teamId: "", department: "Phòng Kế hoạch", phone: "0906789012", active: true },
  { id: "u10", employeeId: "NV000", name: "Admin", password: "admin123", role: "admin", teamId: "", department: "IT", phone: "0900000000", active: true },
];

export const SEED_ORDERS: ProductionOrder[] = [
  {
    id: "o1", orderNo: "LSX-2024-001", productLine: "Van 1 chiều lò xo NOVO 20",
    customer: "Nội bộ", targetQty: 3140, createdBy: "Nguyễn Văn An", createdAt: "15/01/2024", deadline: "2024-01-30",
    priority: "high", status: "in_progress", pendingApproval: false,
    attachments: [
      { id: "a1", name: "NOVO20_BanVe.pdf", type: "pdf", size: "2.4 MB", uploadedBy: "Nguyễn Văn An", uploadedAt: "15/01/2024" },
      { id: "a2", name: "ThongSoKyThuat_NOVO20.xlsx", type: "excel", size: "540 KB", uploadedBy: "Nguyễn Văn An", uploadedAt: "15/01/2024" },
      { id: "a3", name: "AnhMauSanPham.jpg", type: "image", size: "1.1 MB", uploadedBy: "Trần Thị Bình", uploadedAt: "16/01/2024" },
    ],
    boms: [
      {
        id: "b1", bomCode: "BOM-LSX2024001-001", partCode: "NOVO-20-001",
        partName: "Van 1 chiều lò xo NOVO 20", rawMaterial: "Hoàn thiện", machine: "Cam 0.1",
        process: "Tiện + Phay", targetQty: 1570, passQty: 1250, failQty: 23,
        assignedTeamId: "t1", assignedTeamName: "Tổ 1 – P.V.Chí", assignedWorkers: ["Cường 2T3", "Nga 3/43"],
        status: "team_reported",
        specCols: ["Ø20", "Ø9", "1.5", "M6", "Ø4", "NQ", "", "", "", "", ""],
        techNote: "Lắp ghép ren theo tiêu chuẩn. SP không bavia.",
        attachments: [
          { id: "ba1", name: "ThongSoKyThuat_NOVO20.xlsx", type: "excel", size: "540 KB", uploadedBy: "Nguyễn Văn An", uploadedAt: "15/01/2024" },
          { id: "ba2", name: "NOVO20_BanVe.pdf", type: "pdf", size: "2.4 MB", uploadedBy: "Nguyễn Văn An", uploadedAt: "15/01/2024" },
          { id: "ba3", name: "AnhMauSanPham.jpg", type: "image", size: "1.1 MB", uploadedBy: "Trần Thị Bình", uploadedAt: "16/01/2024" },
        ],
        workerEntries: [
          { id: "we1", workerId: "u6", workerName: "Cường 2T3", submittedAt: "18/01/2024 08:30",
            rows: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ tt: i, dims: ["3", "1.1", "9", "", "v", "", "", "", "", "", ""], ngoaiQuan: "Đạt" })) },
        ],
        teamSummary: { passQty: 1250, failQty: 23, note: "Lô đầu đạt tốt", reportedBy: "P.V.Chí", reportedAt: "19/01/2024" },
      },
      {
        id: "b2", bomCode: "BOM-LSX2024001-002", partCode: "NOVO-20-002",
        partName: "Lò xo NOVO 20", rawMaterial: "Dây lò xo Ø1.2", machine: "Máy cuộn lò xo",
        process: "Cuộn + Nhiệt luyện", targetQty: 1570, passQty: 1500, failQty: 15,
        assignedTeamId: "t2", assignedTeamName: "Tổ 2 – P.V.Sang", assignedWorkers: ["Minh T2"],
        status: "qc_passed",
        specCols: ["Ø9.5", "Ø6", "42", "38.5", "82", "T8", "", "", "", "", ""],
        techNote: "Không bavia, không biến dạng.",
        attachments: [
          { id: "ba4", name: "LoXo_NOVO20_Spec.xlsx", type: "excel", size: "320 KB", uploadedBy: "Nguyễn Văn An", uploadedAt: "15/01/2024" },
          { id: "ba5", name: "LoXo_NOVO20_CAD.dwg", type: "cad", size: "890 KB", uploadedBy: "Nguyễn Văn An", uploadedAt: "15/01/2024" },
        ],
        workerEntries: [],
        teamSummary: { passQty: 1500, failQty: 15, note: "", reportedBy: "P.V.Sang", reportedAt: "18/01/2024" },
        qcReport: { passQty: 1500, failQty: 15, complaint: "", status: "approved", inspectedBy: "T.V.Huấn", inspectedAt: "19/01/2024" },
      },
    ],
  },
  {
    id: "o2", orderNo: "LSX-2024-002", productLine: "Van cửa NOVO 25",
    customer: "Khách hàng A", targetQty: 350, createdBy: "Trần Thị Bình", createdAt: "16/01/2024", deadline: "2024-02-05",
    priority: "normal", status: "approved", pendingApproval: false,
    attachments: [
      { id: "a4", name: "VanCua_NOVO25_Drawing.pdf", type: "pdf", size: "3.8 MB", uploadedBy: "Trần Thị Bình", uploadedAt: "16/01/2024" },
    ],
    boms: [
      {
        id: "b3", bomCode: "BOM-LSX2024002-001", partCode: "NOVO-25-001",
        partName: "Trục van NOVO 25", rawMaterial: "Ren thang", machine: "Tiện CNC",
        process: "Ren thang, Tiện trục", targetQty: 350, passQty: 0, failQty: 0,
        assignedTeamId: "t1", assignedTeamName: "Tổ 1 – P.V.Chí", assignedWorkers: ["Nga 3/43"],
        status: "assigned",
        specCols: ["Ø9.5+0.2", "Ø6", "42", "38.5", "82", "T8x4/2_L", "", "", "", "", ""],
        techNote: "SP mối ghép ren theo tiêu chuẩn (Thử ren với đĩa). Không trầy xước sâu, bavia.",
        attachments: [
          { id: "ba6", name: "VanCua_NOVO25_Drawing.pdf", type: "pdf", size: "3.8 MB", uploadedBy: "Trần Thị Bình", uploadedAt: "16/01/2024" },
          { id: "ba7", name: "TrucVan_NOVO25_Spec.xlsx", type: "excel", size: "410 KB", uploadedBy: "Trần Thị Bình", uploadedAt: "16/01/2024" },
        ],
        workerEntries: [],
      },
    ],
  },
  {
    id: "o3", orderNo: "LSX-2024-003", productLine: "Bơm thủy lực HP-40",
    customer: "Khách hàng B", targetQty: 200, createdBy: "Nguyễn Văn An", createdAt: "17/01/2024", deadline: "2024-02-10",
    priority: "urgent", status: "draft", pendingApproval: false,
    attachments: [],
    boms: [
      {
        id: "b4", bomCode: "BOM-LSX2024003-001", partCode: "HP40-001",
        partName: "Thân bơm HP-40", rawMaterial: "Phôi nhôm đúc", machine: "Phay CNC 5 trục",
        process: "Phay + Khoan + Doa", targetQty: 200, passQty: 0, failQty: 0,
        assignedTeamId: "", assignedTeamName: "", assignedWorkers: [],
        status: "unassigned",
        specCols: ["A", "B", "C", "D", "E", "F", "", "", "", "", ""],
        techNote: "",
        workerEntries: [],
      },
    ],
  },
];
