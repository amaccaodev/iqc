import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { orderApi } from "./services/api/OrderApiService"
import QrCodeImage from "./components/qr/QrCodeImage"
import FileSlideshow from "./components/files/FileSlideshow"
import DashboardCharts from "./components/charts/DashboardCharts"
import DayQtySummary from "./components/dashboard/DayQtySummary"
import PaginationBar from "./components/ui/PaginationBar"
import { toast } from "./hooks/useToast"

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "director" | "supervisor" | "teamlead" | "worker" | "qc" | "stats" | "admin" | "mechanic"
type OrderStatus = "draft" | "pending_approval" | "approved" | "in_progress" | "completed"
type BOMStatus = "unassigned" | "assigned" | "in_progress" | "team_reported" | "qc_passed" | "qc_failed"
type Priority = "normal" | "high" | "urgent"

interface User {
  id: string
  employeeId: string
  name: string
  password: string
  role: Role
  teamId: string
  department: string
  phone: string
  active: boolean
}

interface Attachment {
  id: string
  name: string
  type: "pdf" | "image" | "cad" | "excel" | "word" | "other"
  size: string
  uploadedBy: string
  uploadedAt: string
  url?: string
}

interface DimensionRow {
  tt: number
  dims: string[]
  ngoaiQuan: string
}

interface WorkerEntry {
  id: string
  workerId: string
  workerName: string
  submittedAt: string
  rows: DimensionRow[]
}

interface TeamSummary {
  passQty: number
  failQty: number
  note: string
  reportedBy: string
  reportedAt: string
}

interface QCReport {
  passQty: number
  failQty: number
  complaint: string
  status: "pending" | "approved" | "rejected"
  inspectedBy: string
  inspectedAt: string
}

interface BOMItem {
  id: string
  bomCode: string
  partCode: string
  partName: string
  rawMaterial: string
  machine: string
  process: string
  shift?: string
  quota?: string
  workTime?: string
  targetQty: number
  passQty: number
  failQty: number
  assignedTeamId: string
  assignedTeamName: string
  assignedWorkers: string[]
  status: BOMStatus
  specCols: string[]
  materialSpecs?: import("@shared/types/spec").MaterialSpec[]
  techNote: string
  workerEntries: WorkerEntry[]
  attachments?: Attachment[]
  teamSummary?: TeamSummary
  qcReport?: QCReport
}

interface ProductionOrder {
  id: string
  orderNo: string
  productCode?: string
  productLine: string
  customer: string
  targetQty: number
  shift?: string
  quota?: string
  workTime?: string
  createdBy: string
  createdAt: string
  deadline: string
  priority: Priority
  status: OrderStatus
  boms: BOMItem[]
  attachments: Attachment[]
  pendingApproval?: boolean
}

// ─── Static data ──────────────────────────────────────────────────────────────
const TEAMS = [
  { id: "t_hot", name: "Tổ Dập nóng", lead: "Phạm Văn Chí", leadShort: "P.V.Chí" },
  { id: "t_auto", name: "Tổ Tự động", lead: "Phạm Văn Sang", leadShort: "P.V.Sang" },
  { id: "t_asm", name: "Tổ Lắp ráp", lead: "Nguyễn Thị Hoa", leadShort: "N.T.Hoa" },
]

const SEED_USERS: User[] = [
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
]

// Auto-generate helpers
function genOrderNo(orders: ProductionOrder[]): string {
  const year = new Date().getFullYear()
  const sameYear = orders.filter(o => o.orderNo.startsWith(`LSX-${year}`)).length
  return `LSX-${year}-${String(sameYear + 1).padStart(3, "0")}`
}

function genBOMCode(orderNo: string, existingBoms: BOMItem[]): string {
  const base = orderNo.replace(/-/g, "")
  const seq = String(existingBoms.length + 1).padStart(3, "0")
  return `BOM-${base}-${seq}`
}

function today() {
  return new Date().toLocaleDateString("vi-VN")
}

function formatDeadline(d: string): string {
  if (!d) return "—"
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split("-")
    return `${day}/${m}/${y}`
  }
  return d
}

const SEED_ORDERS: ProductionOrder[] = [
  {
    id: "o1", orderNo: "LSX-2024-001", productCode: "BM20", productLine: "Van 1 chiều lò xo NOVO 20",
    customer: "Nội bộ", targetQty: 1570, shift: "day", quota: "80 SP/h", workTime: "8h", createdBy: "Nguyễn Văn An", createdAt: "15/01/2024", deadline: "2024-01-30",
    priority: "high", status: "in_progress", pendingApproval: false,
    attachments: [
      { id: "a1", name: "NOVO20_BanVe.pdf", type: "pdf", size: "2.4 MB", uploadedBy: "Nguyễn Văn An", uploadedAt: "15/01/2024", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
      { id: "a2", name: "ThongSoKyThuat_NOVO20.jpg", type: "image", size: "540 KB", uploadedBy: "Nguyễn Văn An", uploadedAt: "15/01/2024", url: "https://picsum.photos/seed/novo20/900/640" },
      { id: "a3", name: "AnhMauSanPham.jpg", type: "image", size: "1.1 MB", uploadedBy: "Trần Thị Bình", uploadedAt: "16/01/2024", url: "https://picsum.photos/seed/valve20/900/640" },
      { id: "a3b", name: "ChiTietGiaCong.jpg", type: "image", size: "890 KB", uploadedBy: "Trần Thị Bình", uploadedAt: "16/01/2024", url: "https://picsum.photos/seed/machining/900/640" },
    ],
    boms: [
      {
        id: "b1", bomCode: "BOM-LSX2024001-001", partCode: "NOVO-20-001",
        partName: "Van 1 chiều lò xo NOVO 20", rawMaterial: "Hoàn thiện", machine: "Cam 0.1",
        process: "Tiện + Phay", shift: "day", quota: "80 SP/h", workTime: "8h", targetQty: 1570, passQty: 1250, failQty: 23,
        assignedTeamId: "t1", assignedTeamName: "Tổ 1 – P.V.Chí", assignedWorkers: ["Cường 2T3", "Nga 3/43"],
        status: "team_reported",
        specCols: ["Ø20", "Ø9", "1.5", "M6", "Ø4", "NQ", "", "", "", "", ""],
        techNote: "Lắp ghép ren theo tiêu chuẩn. SP không bavia.",
        attachments: [
          { id: "ba1", name: "BanVe_NOVO20.jpg", type: "image", size: "1.1 MB", uploadedBy: "Nguyễn Văn An", uploadedAt: "15/01/2024", url: "https://picsum.photos/seed/novo20/900/640" },
          { id: "ba2", name: "AnhMau.jpg", type: "image", size: "890 KB", uploadedBy: "Trần Thị Bình", uploadedAt: "16/01/2024", url: "https://picsum.photos/seed/valve20/900/640" },
          { id: "ba3", name: "BanVe.pdf", type: "pdf", size: "2.4 MB", uploadedBy: "Nguyễn Văn An", uploadedAt: "15/01/2024", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
        ],
        workerEntries: [
          { id: "we1", workerId: "u6", workerName: "Cường 2T3", submittedAt: "18/01/2024 08:30",
            rows: [1,2,3,4,5,6,7,8].map(i => ({ tt: i, dims: ["3","1.1","9","","v","","","","","",""], ngoaiQuan: "Đạt" })) }
        ],
        teamSummary: { passQty: 1250, failQty: 23, note: "Lô đầu đạt tốt", reportedBy: "P.V.Chí", reportedAt: "19/01/2024" },
        qcReport: undefined
      },
      {
        id: "b2", bomCode: "BOM-LSX2024001-002", partCode: "NOVO-20-002",
        partName: "Lò xo NOVO 20", rawMaterial: "Dây lò xo Ø1.2", machine: "Máy cuộn lò xo",
        process: "Cuộn + Nhiệt luyện", targetQty: 1570, passQty: 1500, failQty: 15,
        assignedTeamId: "t2", assignedTeamName: "Tổ 2 – P.V.Sang", assignedWorkers: ["Minh T2"],
        status: "qc_passed",
        specCols: ["Ø9.5", "Ø6", "42", "38.5", "82", "T8", "", "", "", "", ""],
        techNote: "Không bavia, không biến dạng.",
        workerEntries: [],
        teamSummary: { passQty: 1500, failQty: 15, note: "", reportedBy: "P.V.Sang", reportedAt: "18/01/2024" },
        qcReport: { passQty: 1500, failQty: 15, complaint: "", status: "approved", inspectedBy: "T.V.Huấn", inspectedAt: "19/01/2024" }
      }
    ]
  },
  {
    id: "o2", orderNo: "LSX-2024-002", productLine: "Van cửa NOVO 25",
    customer: "Khách hàng A", targetQty: 350, createdBy: "Trần Thị Bình", createdAt: "16/01/2024", deadline: "2024-02-05",
    priority: "normal", status: "approved", pendingApproval: false,
    attachments: [
      { id: "a4", name: "VanCua_NOVO25_Drawing.pdf", type: "pdf", size: "3.8 MB", uploadedBy: "Trần Thị Bình", uploadedAt: "16/01/2024", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
      { id: "a5", name: "NOVO25_sample.jpg", type: "image", size: "720 KB", uploadedBy: "Trần Thị Bình", uploadedAt: "16/01/2024", url: "https://picsum.photos/seed/novo25/900/640" },
    ],
    boms: [
      {
        id: "b3", bomCode: "BOM-LSX2024002-001", partCode: "NOVO-25-001",
        partName: "Trục van NOVO 25", rawMaterial: "Ren thang", machine: "Tiện CNC",
        process: "Ren thang, Tiện trục", targetQty: 350, passQty: 0, failQty: 0,
        assignedTeamId: "t1", assignedTeamName: "Tổ 1 – P.V.Chí", assignedWorkers: ["Nga 3/43"],
        status: "assigned",
        specCols: ["Ø9.5+0.2", "Ø6", "42", "38.5", "82", "T8x4/2_L", "", "", "", "", ""],
        materialSpecs: [
          {
            index: 2,
            pointNo: 1,
            label: "42",
            type: "numeric",
            target: 42,
            min: 41.95,
            max: 42.05,
            unit: "mm",
            hint: "Chiều dài đoạn ren — vị trí (1) trên bản vẽ",
          },
          {
            index: 3,
            pointNo: 2,
            label: "(38.5)",
            type: "numeric",
            target: 38.5,
            min: 38.3,
            max: 38.7,
            unit: "mm",
            hint: "Kích thước tham chiếu — vị trí (2) trên bản vẽ",
          },
          {
            index: 5,
            pointNo: 3,
            label: "T8x4/2_L",
            type: "qualitative",
            hint: "Thử ren với đĩa chuẩn — vị trí (3) trên bản vẽ",
          },
        ],
        techNote: "SP mối ghép ren theo tiêu chuẩn (Thử ren với đĩa). Không trầy xước sâu, bavia.",
        workerEntries: [], teamSummary: undefined, qcReport: undefined
      }
    ]
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
        workerEntries: [], teamSummary: undefined, qcReport: undefined
      }
    ]
  }
]

// ─── Label/color maps ──────────────────────────────────────────────────────────
const STATUS_LABEL: Record<OrderStatus, string> = {
  draft: "Bản nháp", pending_approval: "Chờ duyệt", approved: "Đã duyệt",
  in_progress: "Đang SX", completed: "Hoàn thành"
}
const BOM_STATUS_LABEL: Record<BOMStatus, string> = {
  unassigned: "Chưa phân", assigned: "Đã phân", in_progress: "Đang làm",
  team_reported: "Tổ BC", qc_passed: "QC Đạt", qc_failed: "QC Không đạt"
}
const PRIORITY_LABEL: Record<Priority, string> = { normal: "Thường", high: "Cao", urgent: "Khẩn cấp" }
const ROLE_LABEL: Record<Role, string> = {
  director: "GĐ/PGĐ", supervisor: "Quản đốc", teamlead: "Tổ trưởng",
  worker: "Công nhân", qc: "QC", stats: "Thống kê", admin: "Admin", mechanic: "Cơ điện"
}

const sColor = (s: OrderStatus) => ({ draft:"bg-gray-100 text-gray-600", pending_approval:"bg-yellow-100 text-yellow-700", approved:"bg-blue-100 text-blue-700", in_progress:"bg-indigo-100 text-indigo-700", completed:"bg-green-100 text-green-700" }[s])
const bColor = (s: BOMStatus) => ({ unassigned:"bg-gray-100 text-gray-500", assigned:"bg-blue-100 text-blue-700", in_progress:"bg-indigo-100 text-indigo-700", team_reported:"bg-yellow-100 text-yellow-700", qc_passed:"bg-green-100 text-green-700", qc_failed:"bg-red-100 text-red-700" }[s])
const pColor = (p: Priority) => ({ normal:"bg-slate-100 text-slate-600", high:"bg-orange-100 text-orange-700", urgent:"bg-red-100 text-red-700" }[p])

const fileIcon = (t: Attachment["type"]) => ({ pdf:"fa-file-pdf text-red-500", image:"fa-file-image text-blue-500", cad:"fa-cube text-teal-600", excel:"fa-file-excel text-green-600", word:"fa-file-word text-blue-600", other:"fa-file text-gray-400" }[t])

// ─── UI atoms ──────────────────────────────────────────────────────────────────
const Badge = ({ children, cls }: { children: React.ReactNode; cls?: string }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{children}</span>
)
const Card = ({ children, cls }: { children: React.ReactNode; cls?: string }) => (
  <div className={`bg-card text-card-foreground rounded-xl border border-border shadow-sm ${cls ?? ""}`}>{children}</div>
)
const Divider = () => <div className="h-px bg-border my-3" />

function Btn({ children, onClick, variant = "primary", size = "md", cls, type = "button", disabled }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary"|"secondary"|"danger"|"ghost"|"success"; size?: "sm"|"md"|"lg"; cls?: string; type?: "button"|"submit"; disabled?: boolean
}) {
  const s = { sm:"px-3 py-1.5 text-xs gap-1", md:"px-4 py-2 text-sm gap-1.5", lg:"px-5 py-3 text-base gap-2" }[size]
  const v = {
    primary:"bg-primary text-primary-foreground hover:bg-ring active:opacity-90",
    secondary:"bg-secondary text-secondary-foreground hover:opacity-90",
    danger:"bg-accent text-accent-foreground hover:opacity-90",
    ghost:"bg-transparent text-muted hover:bg-surface",
    success:"bg-green-600 text-white hover:bg-green-700"
  }[variant]
  return <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center font-medium rounded-lg transition-all border-0 select-none ${s} ${v} ${cls ?? ""} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>{children}</button>
}

function Input({ label, value, onChange, placeholder, type="text", required, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean; hint?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground" />
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  )
}

function Select({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function Modal({ title, children, onClose, size = "md" }: { title: string; children: React.ReactNode; onClose: () => void; size?: "md"|"lg" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div onClick={e => e.stopPropagation()}
        className={`relative bg-card text-card-foreground rounded-t-2xl sm:rounded-2xl w-full ${size === "lg" ? "sm:max-w-3xl" : "sm:max-w-xl"} max-h-[92vh] flex flex-col shadow-2xl`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-display font-700 text-base text-foreground">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface text-muted cursor-pointer border-0 bg-transparent text-lg">✕</button>
        </div>
        <div className="overflow-y-auto p-5 flex-1">{children}</div>
      </div>
    </div>
  )
}

function StatTile({ label, value, icon, color, sub, onClick }: { label: string; value: string|number; icon: string; color: string; sub?: string; onClick?: () => void }) {
  const inner = (
    <Card cls={`p-4 ${onClick ? "hover:border-ring transition-all" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <i className={`fas ${icon} text-sm`} />
        </div>
      </div>
      <div className="font-display font-800 text-2xl text-foreground">{value}</div>
      <div className="text-xs font-medium text-muted mt-0.5">{label}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </Card>
  )
  if (!onClick) return inner
  return (
    <button type="button" onClick={onClick} className="w-full text-left bg-transparent border-0 p-0 cursor-pointer">
      {inner}
    </button>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ users, onLogin }: { users: User[]; onLogin: (u: User) => void }) {
  const [empId, setEmpId] = useState("")
  const [pwd, setPwd] = useState("")
  const [err, setErr] = useState("")
  const [showPwd, setShowPwd] = useState(false)

  const submit = () => {
    const user = users.find(u => u.employeeId === empId.trim() && u.password === pwd && u.active)
    if (user) { setErr(""); onLogin(user) }
    else setErr("Mã nhân viên hoặc mật khẩu không đúng.")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1923] via-[#1B3A5C] to-[#2D6EBD] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-4 border border-white/20">
            <i className="fas fa-industry text-white text-2xl" />
          </div>
          <div className="text-white/60 text-xs uppercase tracking-widest mb-1">CTCP Công nghệ Đồng</div>
          <h1 className="font-display font-800 text-white text-2xl">COPEX</h1>
          <p className="text-white/50 text-sm mt-1">Hệ thống Quản lý Sản xuất</p>
        </div>
        <Card cls="p-6 shadow-2xl">
          <h2 className="font-display font-700 text-lg text-foreground mb-5">Đăng nhập</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Mã nhân viên <span className="text-red-500">*</span></label>
              <div className="relative">
                <i className="fas fa-id-badge absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                <input value={empId} onChange={e => setEmpId(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
                  placeholder="VD: NV001" className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Mật khẩu <span className="text-red-500">*</span></label>
              <div className="relative">
                <i className="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                <input value={pwd} onChange={e => setPwd(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
                  type={showPwd ? "text" : "password"} placeholder="Nhập mật khẩu"
                  className="w-full pl-9 pr-10 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <button onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted cursor-pointer bg-transparent border-0">
                  <i className={`fas ${showPwd ? "fa-eye-slash" : "fa-eye"} text-sm`} />
                </button>
              </div>
            </div>
            {err && <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 rounded-lg p-2.5"><i className="fas fa-circle-exclamation" />{err}</div>}
            <Btn onClick={submit} cls="w-full justify-center" size="lg">
              <i className="fas fa-right-to-bracket" /> Đăng nhập
            </Btn>
          </div>
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground font-medium mb-2">Tài khoản demo:</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-muted">
              {[["NV001","GĐ"],["NV010","Quản đốc"],["NV020","Tổ trưởng"],["NV030","Công nhân"],["NV040","QC"],["NV000","Admin"]].map(([id, r]) => (
                <button key={id} onClick={() => { setEmpId(id); setPwd(id === "NV000" ? "admin123" : "123456") }}
                  className="text-left px-2 py-1 rounded hover:bg-surface cursor-pointer bg-transparent border-0 transition-colors">
                  <span className="font-mono text-primary">{id}</span> – {r}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── App Shell ─────────────────────────────────────────────────────────────────
const NAV_CFG: Record<Role, { id: string; label: string; fa: string }[]> = {
  director: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high" },
    { id: "orders", label: "Lệnh SX", fa: "fa-file-contract" },
    { id: "approvals", label: "Phê duyệt", fa: "fa-check-circle" },
  ],
  supervisor: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high" },
    { id: "orders", label: "Lệnh SX", fa: "fa-file-contract" },
    { id: "assign", label: "Phân công", fa: "fa-users-gear" },
  ],
  teamlead: [
    { id: "dashboard", label: "Công việc", fa: "fa-list-check" },
    { id: "boms", label: "BOM", fa: "fa-boxes-stacked" },
    { id: "report", label: "Báo cáo", fa: "fa-chart-bar" },
  ],
  worker: [
    { id: "dashboard", label: "Việc của tôi", fa: "fa-screwdriver-wrench" },
    { id: "entry", label: "Sản xuất", fa: "fa-faucet" },
  ],
  qc: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high" },
    { id: "inspect", label: "Kiểm tra", fa: "fa-magnifying-glass" },
  ],
  stats: [
    { id: "dashboard", label: "Thống kê", fa: "fa-chart-pie" },
    { id: "reports", label: "Báo cáo", fa: "fa-table-list" },
  ],
  admin: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high" },
    { id: "accounts", label: "Tài khoản", fa: "fa-users" },
  ],
  mechanic: [
    { id: "incidents", label: "Sự cố máy", fa: "fa-triangle-exclamation" },
    { id: "approvals", label: "Phê duyệt", fa: "fa-hand" },
  ],
}

const ROLE_ICON: Record<Role, string> = {
  director: "fa-star", supervisor: "fa-hard-hat", teamlead: "fa-wrench",
  worker: "fa-gear", qc: "fa-magnifying-glass", stats: "fa-chart-line", admin: "fa-shield",
  mechanic: "fa-screwdriver-wrench",
}

function AppShell({ user, screen, setScreen, onLogout, badge, children }: {
  user: User; screen: string; setScreen: (s: string) => void; onLogout: () => void; badge?: number; children: React.ReactNode
}) {
  const nav = NAV_CFG[user.role]
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-primary text-white px-4 h-14 flex items-center justify-between shadow-lg z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <i className={`fas ${ROLE_ICON[user.role]} text-sm text-white/90`} />
          </div>
          <div className="hidden sm:block">
            <div className="font-display font-700 text-sm leading-tight">COPEX</div>
            <div className="text-xs text-blue-300">{ROLE_LABEL[user.role]} – {user.name}</div>
          </div>
          <div className="sm:hidden font-display font-700 text-sm">{user.name}</div>
        </div>
        <nav className="hidden sm:flex items-center gap-0.5">
          {nav.map(n => (
            <button key={n.id} onClick={() => setScreen(n.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border-0 ${screen === n.id ? "bg-white/20 text-white" : "text-blue-200 hover:bg-white/10 hover:text-white"}`}>
              <i className={`fas ${n.fa} text-xs`} /> {n.label}
              {n.id === "approvals" && badge ? <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{badge}</span> : null}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-xs text-blue-300 font-mono">{user.employeeId}</span>
          <button onClick={onLogout} className="flex items-center gap-1.5 text-blue-300 hover:text-white text-xs transition-all cursor-pointer bg-transparent border-0 px-2 py-1 rounded hover:bg-white/10">
            <i className="fas fa-right-from-bracket" /> <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto pb-20 sm:pb-6">
        <div className="max-w-5xl mx-auto px-4 py-5">{children}</div>
      </main>
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border flex z-30 shadow-xl">
        {nav.map(n => (
          <button key={n.id} onClick={() => setScreen(n.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-all cursor-pointer border-0 bg-transparent relative ${screen === n.id ? "text-primary" : "text-muted-foreground"}`}>
            <i className={`fas ${n.fa} text-lg`} />
            {n.label}
            {n.id === "approvals" && badge ? <span className="absolute top-1.5 right-1/3 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{badge}</span> : null}
          </button>
        ))}
      </nav>
    </div>
  )
}

// ─── Shared: Attachment list ───────────────────────────────────────────────────
function AttachmentList({ attachments, onAdd }: { attachments: Attachment[]; onAdd?: (a: Attachment) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? [])
    if (!onAdd) return
    list.forEach((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? ""
      const type: Attachment["type"] = ext === "pdf" ? "pdf" : ["jpg","jpeg","png","webp","gif"].includes(ext) ? "image" : ["xls","xlsx"].includes(ext) ? "excel" : ["doc","docx"].includes(ext) ? "word" : ext === "dwg" ? "cad" : "other"
      const reader = new FileReader()
      reader.onload = () => {
        onAdd({
          id: `a${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: f.name,
          type,
          size: `${(f.size/1024).toFixed(0)} KB`,
          uploadedBy: "Bạn",
          uploadedAt: today(),
          url: typeof reader.result === "string" ? reader.result : undefined,
        })
      }
      reader.readAsDataURL(f)
    })
    e.target.value = ""
  }
  return (
    <div>
      <FileSlideshow files={attachments} />
      {onAdd && (
        <>
          <input ref={fileRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleFile} />
          <button onClick={() => fileRef.current?.click()}
            className="mt-2 flex items-center gap-2 text-sm text-[#2D6EBD] hover:text-primary cursor-pointer bg-transparent border-0 font-medium">
            <i className="fas fa-paperclip" /> Đính kèm ảnh / PDF
          </button>
        </>
      )}
    </div>
  )
}

// ─── Shared: Order list ────────────────────────────────────────────────────────
function OrderList({ orders, onSelect, columns = 1 }: { orders: ProductionOrder[]; onSelect: (o: ProductionOrder) => void; columns?: 1 | 2 }) {
  const [page, setPage] = useState(1)
  const pageSize = 8
  if (!orders.length) return <Card cls="p-10 text-center text-muted-foreground text-sm"><i className="fas fa-inbox text-3xl block mb-2 opacity-30" />Chưa có lệnh sản xuất nào</Card>
  const slice = orders.slice((page - 1) * pageSize, page * pageSize)
  const listClass = columns === 2 ? "space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0" : "space-y-2"
  return (
    <div className={listClass}>
      {slice.map(o => (
        <button key={o.id} onClick={() => onSelect(o)} className="w-full text-left cursor-pointer bg-transparent border-0 p-0 group">
          <Card cls="p-4 hover:border-ring hover:shadow-md transition-all group-active:scale-[0.99]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-display font-700 text-sm text-primary">{o.orderNo}</span>
                  <Badge cls={pColor(o.priority)}>{PRIORITY_LABEL[o.priority]}</Badge>
                  {o.pendingApproval && <Badge cls="bg-yellow-100 text-yellow-700"><i className="fas fa-clock text-[10px]" /> Chờ duyệt</Badge>}
                </div>
                <div className="text-sm text-foreground font-medium truncate">{o.productLine}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span><i className="fas fa-user-tie mr-1" />{o.createdBy}</span>
                  <span><i className="fas fa-boxes-stacked mr-1" />SL: {(o.targetQty ?? 0).toLocaleString()} cái</span>
                  <span><i className="fas fa-calendar mr-1" />Hạn: {formatDeadline(o.deadline)}</span>
                  <span><i className="fas fa-layer-group mr-1" />{o.boms.length} BOM</span>
                  {o.attachments.length > 0 && <span><i className="fas fa-paperclip mr-1" />{o.attachments.length} tệp</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Badge cls={sColor(o.status)}>{STATUS_LABEL[o.status]}</Badge>
                <i className="fas fa-chevron-right text-[#CBD5E1] text-xs" />
              </div>
            </div>
          </Card>
        </button>
      ))}
      <PaginationBar page={page} pageSize={pageSize} total={orders.length} onPage={setPage} />
    </div>
  )
}

// ─── Shared: BOM detail panel ──────────────────────────────────────────────────
function BOMDetail({
  bom,
  orderId,
  orderNo,
  onBack,
}: {
  bom: BOMItem
  orderId: string
  orderNo: string
  onBack: () => void
}) {
  const workerTaskUrl = `${window.location.origin}/worker/task/${orderId}/${bom.id}`

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-muted hover:text-primary text-sm mb-4 cursor-pointer bg-transparent border-0 font-medium">
        <i className="fas fa-arrow-left text-xs" /> Quay lại
      </button>
      <Card cls="p-4 mb-4 border-l-4 border-[#1B3A5C]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="font-display font-700 text-base">{bom.partName}</div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <code className="text-xs bg-background text-primary px-2 py-0.5 rounded font-mono font-bold">{bom.bomCode}</code>
              <span className="text-xs text-muted">{bom.partCode}</span>
            </div>
          </div>
          <Badge cls={bColor(bom.status)}>{BOM_STATUS_LABEL[bom.status]}</Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
          <div><span className="text-muted-foreground block mb-0.5">Máy</span><span className="font-medium">{bom.machine}</span></div>
          <div><span className="text-muted-foreground block mb-0.5">Nguyên vật liệu</span><span className="font-medium">{bom.rawMaterial}</span></div>
          <div><span className="text-muted-foreground block mb-0.5">Số lượng</span><span className="font-bold text-primary">{bom.targetQty.toLocaleString()}</span></div>
          <div><span className="text-muted-foreground block mb-0.5">Tổ</span><span className="font-medium">{bom.assignedTeamName || "—"}</span></div>
        </div>
        {bom.techNote && <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-xs text-blue-800"><i className="fas fa-circle-info mr-1.5" />{bom.techNote}</div>}
      </Card>
      {(bom.attachments?.length ?? 0) > 0 && (
        <Card cls="p-4 mb-4">
          <FileSlideshow files={bom.attachments ?? []} title="Bản vẽ / tài liệu BOM" />
        </Card>
      )}
      <Card cls="p-4 mb-4 border-l-4 border-[#16A34A] bg-green-50/40">
        <div className="font-display font-600 text-sm mb-3 flex items-center gap-2 text-[#15803D]">
          <i className="fas fa-qrcode" /> QR cho công nhân
        </div>
        <div className="flex items-start gap-4">
          <QrCodeImage value={workerTaskUrl} size={120} className="rounded-lg bg-card border border-border" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">Quét để mở trang Sản xuất</div>
            <div className="text-xs text-muted mt-1 break-all">{workerTaskUrl}</div>
            <a
              href={workerTaskUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-[#2D6EBD] hover:text-primary"
            >
              <i className="fas fa-arrow-up-right-from-square text-[10px]" /> Mở trang nhập
            </a>
          </div>
        </div>
      </Card>
      {bom.teamSummary && (
        <Card cls="p-4 mb-4">
          <div className="font-display font-600 text-sm mb-3 flex items-center gap-2"><i className="fas fa-chart-bar text-primary" /> Báo cáo Tổ trưởng</div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-green-50 rounded-lg p-3"><div className="text-xl font-bold text-green-600">{bom.teamSummary.passQty}</div><div className="text-xs text-muted">Đạt</div></div>
            <div className="bg-red-50 rounded-lg p-3"><div className="text-xl font-bold text-red-500">{bom.teamSummary.failQty}</div><div className="text-xs text-muted">Hỏng</div></div>
            <div className="bg-background rounded-lg p-3"><div className="text-xl font-bold text-primary">{Math.round((bom.teamSummary.passQty / bom.targetQty) * 100)}%</div><div className="text-xs text-muted">Tỷ lệ</div></div>
          </div>
          {bom.teamSummary.note && <div className="text-xs text-muted mt-2 italic">"{bom.teamSummary.note}"</div>}
          <div className="text-xs text-muted-foreground mt-2">Báo cáo bởi {bom.teamSummary.reportedBy} · {bom.teamSummary.reportedAt}</div>
        </Card>
      )}
      {bom.qcReport && (
        <Card cls={`p-4 mb-4 border-l-4 ${bom.qcReport.status === "approved" ? "border-green-500" : "border-red-500"}`}>
          <div className="font-display font-600 text-sm mb-2 flex items-center gap-2">
            <i className={`fas ${bom.qcReport.status === "approved" ? "fa-circle-check text-green-600" : "fa-circle-xmark text-red-500"}`} />
            Kết quả QC – {bom.qcReport.status === "approved" ? "ĐẠT" : "KHÔNG ĐẠT"}
          </div>
          <div className="text-xs text-muted">{bom.qcReport.passQty} đạt · {bom.qcReport.failQty} hỏng · {bom.qcReport.inspectedBy} · {bom.qcReport.inspectedAt}</div>
          {bom.qcReport.complaint && <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700"><i className="fas fa-triangle-exclamation mr-1" />Khiếu nại: {bom.qcReport.complaint}</div>}
        </Card>
      )}
      {bom.workerEntries.length > 0 && (
        <Card cls="p-4">
          <div className="font-display font-600 text-sm mb-3 flex items-center gap-2"><i className="fas fa-table text-primary" /> Bảng kiểm tra ({bom.workerEntries.length} lần nhập)</div>
          {bom.workerEntries.map(e => (
            <div key={e.id} className="mb-3">
              <div className="flex justify-between text-xs text-muted mb-2">
                <span className="font-semibold text-foreground"><i className="fas fa-user mr-1" />{e.workerName}</span>
                <span>{e.submittedAt}</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs border-collapse">
                  <thead><tr className="bg-surface">
                    <th className="border-b border-r border-border px-2 py-1.5 text-left font-semibold w-8">TT</th>
                    {bom.specCols.filter(c => c && c !== "NQ").map((c, i) => <th key={i} className="border-b border-r border-border px-2 py-1.5 font-mono font-semibold">{c}</th>)}
                  </tr></thead>
                  <tbody>{e.rows.map(r => (
                    <tr key={r.tt} className="hover:bg-surface">
                      <td className="border-b border-r border-border px-2 py-1.5 text-center font-mono font-medium text-muted">{r.tt}</td>
                      {bom.specCols.filter(c => c && c !== "NQ").map((_, i) => (
                        <td key={i} className={`border-b border-r border-border px-2 py-1.5 text-center font-mono ${r.dims[i] === "v" || r.dims[i] === "✓" ? "text-green-600 font-bold" : ""}`}>{r.dims[i] || "—"}</td>
                      ))}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

// ─── Director view ─────────────────────────────────────────────────────────────
function DirectorView({ user, orders, setOrders, screen, onCreateOrder }: { user: User; orders: ProductionOrder[]; setOrders: (o: ProductionOrder[]) => void; screen: string; onCreateOrder?: () => void }) {
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null)
  const [selectedBOM, setSelectedBOM] = useState<BOMItem | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showBOMForm, setShowBOMForm] = useState(false)
  const [form, setForm] = useState({
    productCode: "",
    productLine: "",
    customer: "",
    deadline: "",
    targetQty: "",
    shift: "day",
    quota: "",
    workTime: "",
    priority: "normal" as Priority,
  })
  const [bomForm, setBomForm] = useState({ partCode: "", partName: "", rawMaterial: "", machine: "", process: "", targetQty: "", techNote: "", specCols: ["","","","","","","","","","",""] as string[], teamId: "" })
  const [draftOrder, setDraftOrder] = useState<ProductionOrder | null>(null)

  const pending = orders.filter(o => o.pendingApproval)

  const startCreate = () => {
    const orderNo = genOrderNo(orders)
    const newOrder: ProductionOrder = { id: `o${Date.now()}`, orderNo, productLine: "", customer: "", targetQty: 0, createdBy: user.name, createdAt: today(), deadline: "", priority: "normal", status: "draft", boms: [], attachments: [], pendingApproval: false }
    setDraftOrder(newOrder)
    setForm({
      productCode: "",
      productLine: "",
      customer: "",
      deadline: "",
      targetQty: "",
      shift: "day",
      quota: "",
      workTime: "",
      priority: "normal",
    })
    setShowCreate(true)
  }

  const updateDraftBomTeam = (bomId: string, teamId: string) => {
    if (!draftOrder) return
    const team = TEAMS.find(t => t.id === teamId)
    setDraftOrder({
      ...draftOrder,
      boms: draftOrder.boms.map(b => b.id === bomId ? {
        ...b,
        assignedTeamId: teamId,
        assignedTeamName: team ? `${team.name} – ${team.leadShort}` : "",
        status: teamId ? "assigned" as BOMStatus : "unassigned" as BOMStatus,
      } : b),
    })
  }

  const addBOMToDraft = () => {
    if (!draftOrder || !bomForm.partName || !bomForm.targetQty || !bomForm.teamId) {
      toast.error("Vui lòng điền tên chi tiết, số lượng và chọn tổ phụ trách.")
      return
    }
    const bomCode = genBOMCode(draftOrder.orderNo, draftOrder.boms)
    const team = TEAMS.find(t => t.id === bomForm.teamId)
    const newBOM: BOMItem = {
      id: `b${Date.now()}`, bomCode,
      partCode: bomForm.partCode || `${draftOrder.orderNo.replace(/[^A-Z0-9]/g,"")}-${String(draftOrder.boms.length+1).padStart(3,"0")}`,
      partName: bomForm.partName, rawMaterial: bomForm.rawMaterial, machine: bomForm.machine,
      process: bomForm.process, targetQty: Number(bomForm.targetQty), passQty: 0, failQty: 0,
      assignedTeamId: bomForm.teamId, assignedTeamName: team ? `${team.name} – ${team.leadShort}` : "",
      assignedWorkers: [], status: bomForm.teamId ? "assigned" : "unassigned",
      specCols: bomForm.specCols, techNote: bomForm.techNote,
      workerEntries: [], teamSummary: undefined, qcReport: undefined
    }
    setDraftOrder({ ...draftOrder, boms: [...draftOrder.boms, newBOM] })
    setBomForm({ partCode: "", partName: "", rawMaterial: "", machine: "", process: "", targetQty: "", techNote: "", specCols: ["","","","","","","","","","",""], teamId: "" })
    setShowBOMForm(false)
  }

  const saveOrder = async () => {
    if (!draftOrder || !form.productLine || !form.productCode || !form.targetQty || !form.shift || !form.quota || !form.workTime) {
      toast.error("Vui lòng điền mã SP, tên sản phẩm, số lượng, ca làm việc, định mức và thời gian làm.")
      return
    }
    if (!form.deadline) {
      toast.error("Vui lòng chọn ngày hạn hoàn thành.")
      return
    }
    let boms = draftOrder.boms
    if (boms.length === 0) {
      const teamId = bomForm.teamId
      boms = [{
        id: `b${Date.now()}`,
        bomCode: genBOMCode(draftOrder.orderNo, []),
        partCode: form.productCode,
        partName: form.productLine,
        rawMaterial: "",
        machine: "",
        process: "",
        shift: form.shift,
        quota: form.quota,
        workTime: form.workTime,
        targetQty: Number(form.targetQty),
        passQty: 0,
        failQty: 0,
        assignedTeamId: teamId,
        assignedTeamName: "",
        assignedWorkers: [],
        status: teamId ? "assigned" : "unassigned",
        specCols: ["","","","","","","","","","",""],
        techNote: "",
        workerEntries: [],
      }]
    } else {
      boms = boms.map(b => ({
        ...b,
        partCode: b.partCode || form.productCode,
        shift: form.shift,
        quota: form.quota,
        workTime: form.workTime,
      }))
    }
    const finalOrder: ProductionOrder = {
      ...draftOrder,
      productCode: form.productCode,
      productLine: form.productLine,
      customer: form.customer,
      deadline: form.deadline,
      targetQty: Number(form.targetQty),
      shift: form.shift,
      quota: form.quota,
      workTime: form.workTime,
      priority: form.priority,
      status: "approved",
      boms,
    }
    try {
      await orderApi.create(finalOrder)
    } catch {
      setOrders([...orders, finalOrder])
    }
    setDraftOrder(null); setShowCreate(false)
  }

  const draftTeamSummary = draftOrder
    ? TEAMS.map(t => ({ team: t, boms: draftOrder.boms.filter(b => b.assignedTeamId === t.id) })).filter(x => x.boms.length > 0)
    : []

  const addAttachment = (orderId: string, a: Attachment) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, attachments: [...o.attachments, a] } : o))
    if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, attachments: [...prev.attachments, a] } : prev)
  }

  if (selectedBOM && selectedOrder) return (
    <BOMDetail
      bom={selectedBOM}
      orderId={selectedOrder.id}
      orderNo={selectedOrder.orderNo}
      onBack={() => setSelectedBOM(null)}
    />
  )

  if (selectedOrder) return (
    <div>
      <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-1.5 text-muted hover:text-primary text-sm mb-4 cursor-pointer bg-transparent border-0 font-medium">
        <i className="fas fa-arrow-left text-xs" /> Quay lại
      </button>
      <Card cls="p-5 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-display font-800 text-lg">{selectedOrder.orderNo}</div>
            <div className="text-muted text-sm mt-0.5">{selectedOrder.productLine}</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge cls={pColor(selectedOrder.priority)}>{PRIORITY_LABEL[selectedOrder.priority]}</Badge>
            <Badge cls={sColor(selectedOrder.status)}>{STATUS_LABEL[selectedOrder.status]}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-xs text-muted">
          <div><i className="fas fa-barcode mr-1" />Mã SP: {selectedOrder.productCode || selectedOrder.boms[0]?.partCode || "—"}</div>
          <div><i className="fas fa-boxes-stacked mr-1" />SL cần: {(selectedOrder.targetQty ?? 0).toLocaleString()}</div>
          <div><i className="fas fa-clock mr-1" />Ca: {selectedOrder.shift === "night" ? "Ca đêm" : selectedOrder.shift === "ot" ? "Ca tăng" : selectedOrder.shift === "day" ? "Ca ngày" : (selectedOrder.shift || "—")}</div>
          <div><i className="fas fa-gauge mr-1" />Định mức: {selectedOrder.quota || selectedOrder.boms[0]?.quota || "—"}</div>
          <div><i className="fas fa-hourglass-half mr-1" />Thời gian làm: {selectedOrder.workTime || selectedOrder.boms[0]?.workTime || "—"}</div>
          <div><i className="fas fa-calendar-days mr-1" />Hạn: {formatDeadline(selectedOrder.deadline)}</div>
        </div>
        <Divider />
        <div className="font-semibold text-xs text-muted mb-2 flex items-center gap-2"><i className="fas fa-paperclip text-muted-foreground" /> Tài liệu đính kèm</div>
        <AttachmentList attachments={selectedOrder.attachments} onAdd={(a) => addAttachment(selectedOrder.id, a)} />
      </Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-700 text-base">Danh sách BOM ({selectedOrder.boms.length})</h3>
      </div>
      <div className="space-y-2">
        {selectedOrder.boms.map(b => (
          <button key={b.id} onClick={() => setSelectedBOM(b)} className="w-full text-left cursor-pointer border-0 bg-transparent p-0">
            <Card cls="p-4 hover:border-ring transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-[11px] bg-background text-primary px-2 py-0.5 rounded font-mono font-bold">{b.bomCode}</code>
                    <Badge cls={bColor(b.status)}>{BOM_STATUS_LABEL[b.status]}</Badge>
                  </div>
                  <div className="font-semibold text-sm mt-1">{b.partName}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{b.machine} · {b.targetQty.toLocaleString()} cái · {b.assignedTeamName || "Chưa phân"}</div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {b.passQty > 0 && <div className="text-green-600 font-semibold">{b.passQty.toLocaleString()} đạt</div>}
                  {b.failQty > 0 && <div className="text-red-500">{b.failQty} hỏng</div>}
                  <i className="fas fa-chevron-right text-[#CBD5E1] mt-1" />
                </div>
              </div>
            </Card>
          </button>
        ))}
        {selectedOrder.boms.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">Chưa có BOM nào</div>}
      </div>
    </div>
  )

  return (
    <div>
      {screen === "dashboard" && (
        <>
          <div className="flex items-center justify-between mb-5 lg:mb-6 gap-3">
            <div>
              <h2 className="font-display font-800 text-xl lg:text-2xl text-foreground">Xin chào, {user.name.split(" ").pop()} 👋</h2>
              <p className="text-sm lg:text-base text-muted">Tổng quan sản xuất hôm nay</p>
            </div>
            <Btn onClick={onCreateOrder ?? startCreate}><i className="fas fa-plus" /> Tạo lệnh</Btn>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 lg:gap-6 mb-5 lg:mb-6">
            <div className="xl:col-span-4 min-w-0">
              <DayQtySummary orders={orders} onOpenJob={({ orderId, bomId }) => {
                const o = orders.find(x => x.id === orderId)
                if (!o) return
                setSelectedOrder(o)
                setSelectedBOM(o.boms.find(b => b.id === bomId) ?? null)
              }} />
            </div>
            <div className="xl:col-span-8 min-w-0">
              <DashboardCharts orders={orders} onOpenItem={({ orderId, bomId }) => {
                const o = orders.find(x => x.id === orderId)
                if (!o) return
                setSelectedOrder(o)
                setSelectedBOM(bomId ? o.boms.find(b => b.id === bomId) ?? null : null)
              }} />
            </div>
          </div>
          <div className={`grid grid-cols-1 gap-5 lg:gap-6 ${pending.length > 0 ? "xl:grid-cols-2" : ""}`}>
          {pending.length > 0 && (
            <div>
              <h3 className="font-display font-700 text-base lg:text-lg mb-3 flex items-center gap-2"><i className="fas fa-bell text-yellow-500" /> Phân công chờ phê duyệt</h3>
              {pending.map(o => (
                <Card key={o.id} cls="p-4 mb-2 border-l-4 border-yellow-400">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="font-semibold text-sm">{o.orderNo} – {o.productLine}</div>
                      <div className="text-xs text-muted">Quản đốc đã điều chỉnh phân công</div>
                    </div>
                    <div className="flex gap-2">
                      <Btn size="sm" variant="success" onClick={async () => {
                        try { await orderApi.approve(o.id) }
                        catch { setOrders(orders.map(x => x.id === o.id ? { ...x, pendingApproval: false, status: "approved" as OrderStatus } : x)) }
                      }}>
                        <i className="fas fa-check" /> Duyệt
                      </Btn>
                      <Btn size="sm" variant="ghost" onClick={async () => {
                        try { await orderApi.reject(o.id) }
                        catch { setOrders(orders.map(x => x.id === o.id ? { ...x, pendingApproval: false } : x)) }
                      }}><i className="fas fa-times" /> Từ chối</Btn>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <div className="min-w-0">
          <h3 className="font-display font-700 text-base lg:text-lg mb-3">Lệnh gần đây</h3>
          <OrderList orders={orders.slice(0, 5)} onSelect={setSelectedOrder} columns={2} />
          </div>
          </div>
        </>
      )}
      {screen === "orders" && (
        <>
          <div className="flex items-center justify-between mb-4 lg:mb-6 gap-3">
            <h2 className="font-display font-700 text-xl lg:text-2xl">Lệnh sản xuất</h2>
            <Btn onClick={onCreateOrder ?? startCreate}><i className="fas fa-plus" /> Tạo lệnh</Btn>
          </div>
          <OrderList orders={orders} onSelect={setSelectedOrder} columns={2} />
        </>
      )}
      {screen === "approvals" && (
        <>
          <h2 className="font-display font-700 text-xl lg:text-2xl mb-4 lg:mb-6">Phê duyệt Phân công</h2>
          {pending.length === 0
            ? <Card cls="p-10 text-center text-muted-foreground"><i className="fas fa-check-circle text-3xl block mb-2 text-green-400 opacity-60" />Không có phân công nào cần duyệt</Card>
            : <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{pending.map(o => (
              <Card key={o.id} cls="p-4 mb-0 border-l-4 border-yellow-400">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="font-display font-600 text-sm">{o.orderNo} – {o.productLine}</div>
                    <div className="text-xs text-muted mt-1">Quản đốc đã điều chỉnh phân công tổ:</div>
                    {o.boms.filter(b => b.assignedTeamName).map(b => (
                      <div key={b.id} className="text-xs text-primary mt-0.5 flex items-center gap-1"><i className="fas fa-arrow-right text-[10px]" />{b.partName} → {b.assignedTeamName}</div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Btn size="sm" variant="success" onClick={async () => {
                      try { await orderApi.approve(o.id) }
                      catch { setOrders(orders.map(x => x.id === o.id ? { ...x, pendingApproval: false, status: "approved" as OrderStatus } : x)) }
                    }}>
                      <i className="fas fa-check" /> Duyệt
                    </Btn>
                    <Btn size="sm" variant="danger" onClick={async () => {
                      try { await orderApi.reject(o.id) }
                      catch { setOrders(orders.map(x => x.id === o.id ? { ...x, pendingApproval: false } : x)) }
                    }}><i className="fas fa-times" /> Từ chối</Btn>
                  </div>
                </div>
              </Card>
            ))}</div>
          }
        </>
      )}

      {/* Create order modal (legacy — dùng onCreateOrder để mở form danh mục SP) */}
      {!onCreateOrder && showCreate && draftOrder && (
        <Modal title={`Tạo lệnh – ${draftOrder.orderNo}`} onClose={() => { setShowCreate(false); setDraftOrder(null) }} size="lg">
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-background rounded-xl p-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <i className="fas fa-hashtag text-white text-sm" />
              </div>
              <div>
                <div className="text-xs text-muted">Số lệnh SX (tự động)</div>
                <div className="font-display font-800 text-lg text-primary">{draftOrder.orderNo}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Mã SP" value={form.productCode} onChange={v => setForm({ ...form, productCode: v })} placeholder="VD: BM20 / NOVO-20-001" required />
              <Input label="Tên sản phẩm" value={form.productLine} onChange={v => setForm({ ...form, productLine: v })} placeholder="VD: Thân Van BM20" required />
              <Input label="Số lượng cần" value={form.targetQty} onChange={v => setForm({ ...form, targetQty: v })} type="number" placeholder="VD: 1570" required />
              <Select label="Ca làm việc" value={form.shift} onChange={v => setForm({ ...form, shift: v })}
                options={[{ value: "day", label: "Ca ngày" }, { value: "night", label: "Ca đêm" }, { value: "ot", label: "Ca tăng" }]} />
              <Input label="Định mức" value={form.quota} onChange={v => setForm({ ...form, quota: v })} placeholder="VD: 80 SP/h" required />
              <Input label="Thời gian làm" value={form.workTime} onChange={v => setForm({ ...form, workTime: v })} placeholder="VD: 8h hoặc 07:00–15:00" required />
              <Input label="Ngày hạn hoàn thành" value={form.deadline} onChange={v => setForm({ ...form, deadline: v })} type="date" required />
              <Input label="Khách hàng" value={form.customer} onChange={v => setForm({ ...form, customer: v })} placeholder="VD: Nội bộ / Khách A" />
              <Select label="Mức độ ưu tiên" value={form.priority} onChange={v => setForm({ ...form, priority: v as Priority })}
                options={[{ value: "normal", label: "Thường" }, { value: "high", label: "Cao" }, { value: "urgent", label: "Khẩn cấp" }]} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted">Danh sách BOM & phân công tổ ({draftOrder.boms.length})</span>
                <Btn size="sm" variant="secondary" onClick={() => setShowBOMForm(true)}><i className="fas fa-plus" /> Thêm BOM</Btn>
              </div>
              {draftOrder.boms.length === 0 && <div className="text-xs text-muted-foreground italic px-1">Chưa có BOM. Thêm BOM và chọn tổ phụ trách từng loại.</div>}
              <div className="space-y-2">
                {draftOrder.boms.map(b => (
                  <div key={b.id} className="bg-surface border border-border rounded-lg px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <code className="text-[11px] font-mono text-primary font-bold">{b.bomCode}</code>
                        <span className="text-sm font-medium ml-2">{b.partName}</span>
                        <div className="text-xs text-muted-foreground mt-0.5">{b.targetQty.toLocaleString()} cái · {b.machine || "—"}</div>
                      </div>
                    </div>
                    <Select
                      label="Tổ phụ trách"
                      value={b.assignedTeamId}
                      onChange={v => updateDraftBomTeam(b.id, v)}
                      options={[{ value: "", label: "— Chọn tổ —" }, ...TEAMS.map(t => ({ value: t.id, label: `${t.name} – ${t.lead}` }))]}
                    />
                  </div>
                ))}
              </div>
            </div>

            {draftTeamSummary.length > 0 && (
              <div className="bg-secondary border border-[#C7D2FE] rounded-xl p-4">
                <div className="text-xs font-semibold text-[#4338CA] mb-3 flex items-center gap-2">
                  <i className="fas fa-users-gear" /> Phân công tổ — ai làm gì
                </div>
                <div className="space-y-2">
                  {draftTeamSummary.map(({ team, boms }) => (
                    <div key={team.id} className="bg-card rounded-lg px-3 py-2 border border-[#E0E7FF]">
                      <div className="text-sm font-semibold text-primary">{team.name} – {team.lead}</div>
                      <ul className="mt-1 space-y-0.5">
                        {boms.map(b => (
                          <li key={b.id} className="text-xs text-muted flex items-center gap-1.5">
                            <i className="fas fa-arrow-right text-[10px] text-[#6366F1]" />
                            {b.partName} ({b.targetQty.toLocaleString()} cái)
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Btn onClick={() => void saveOrder()} cls="flex-1 justify-center"><i className="fas fa-save" /> Tạo lệnh & phân công</Btn>
              <Btn variant="secondary" onClick={() => { setShowCreate(false); setDraftOrder(null) }}>Hủy</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Add BOM modal */}
      {showBOMForm && draftOrder && (
        <Modal title={`Thêm BOM – ${genBOMCode(draftOrder.orderNo, draftOrder.boms)}`} onClose={() => setShowBOMForm(false)} size="lg">
          <div className="space-y-3">
            <div className="bg-background rounded-lg p-3 flex items-center gap-3">
              <i className="fas fa-qrcode text-primary text-xl" />
              <div>
                <div className="text-xs text-muted">Mã BOM (tự động)</div>
                <code className="font-display font-800 text-base text-primary">{genBOMCode(draftOrder.orderNo, draftOrder.boms)}</code>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Tên chi tiết / sản phẩm" value={bomForm.partName} onChange={v => setBomForm({ ...bomForm, partName: v })} placeholder="VD: Van 1 chiều lò xo NOVO 20" required />
              <Input label="Mã chi tiết (tùy chọn)" value={bomForm.partCode} onChange={v => setBomForm({ ...bomForm, partCode: v })} placeholder="Tự động nếu để trống" />
              <Input label="Nguyên vật liệu" value={bomForm.rawMaterial} onChange={v => setBomForm({ ...bomForm, rawMaterial: v })} placeholder="VD: Hoàn thiện / Phôi thép" />
              <Input label="Máy sản xuất" value={bomForm.machine} onChange={v => setBomForm({ ...bomForm, machine: v })} placeholder="VD: Tiện CNC / Cam 0.1" />
              <Input label="Quy trình" value={bomForm.process} onChange={v => setBomForm({ ...bomForm, process: v })} placeholder="VD: Tiện + Phay" />
              <Input label="Số lượng cần SX" value={bomForm.targetQty} onChange={v => setBomForm({ ...bomForm, targetQty: v })} type="number" placeholder="VD: 1000" required />
            </div>
            <Select label="Phân cho Tổ *" value={bomForm.teamId} onChange={v => setBomForm({ ...bomForm, teamId: v })}
              options={[{ value: "", label: "— Chọn tổ phụ trách —" }, ...TEAMS.map(t => ({ value: t.id, label: `${t.name} – ${t.lead}` }))]} />
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Các cột kích thước (tối đa 11)</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {bomForm.specCols.map((c, i) => (
                  <input key={i} value={c} onChange={e => { const s = [...bomForm.specCols]; s[i] = e.target.value; setBomForm({ ...bomForm, specCols: s }) }}
                    placeholder={`Cột ${i+1}`} className="border border-border rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring" />
                ))}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Để trống nếu không dùng (VD: Ø20, 1.5, M6…)</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Yêu cầu kỹ thuật</label>
              <textarea value={bomForm.techNote} onChange={e => setBomForm({ ...bomForm, techNote: e.target.value })} rows={2}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="VD: Lắp ghép ren theo tiêu chuẩn. Không bavia." />
            </div>
            <div className="flex gap-3">
              <Btn onClick={addBOMToDraft}><i className="fas fa-plus" /> Thêm BOM này</Btn>
              <Btn variant="secondary" onClick={() => setShowBOMForm(false)}>Hủy</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Supervisor view ───────────────────────────────────────────────────────────
function SupervisorView({ orders, setOrders, screen }: { orders: ProductionOrder[]; setOrders: (o: ProductionOrder[]) => void; screen: string }) {
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null)
  const [assignModal, setAssignModal] = useState<BOMItem | null>(null)
  const [assignTeamId, setAssignTeamId] = useState("")

  const saveAssignment = async () => {
    if (!assignModal || !assignTeamId || !selectedOrder) return
    const team = TEAMS.find(t => t.id === assignTeamId)!
    try {
      await orderApi.assignBOM(selectedOrder.id, assignModal.id, assignTeamId)
    } catch {
      setOrders(orders.map(o => o.id === selectedOrder.id ? {
        ...o, pendingApproval: true, status: "pending_approval" as OrderStatus,
        boms: o.boms.map(b => b.id === assignModal.id ? { ...b, assignedTeamId: team.id, assignedTeamName: `${team.name} – ${team.leadShort}`, status: "assigned" as BOMStatus } : b)
      } : o))
      setSelectedOrder(prev => prev ? { ...prev, pendingApproval: true, boms: prev.boms.map(b => b.id === assignModal.id ? { ...b, assignedTeamId: team.id, assignedTeamName: `${team.name} – ${team.leadShort}`, status: "assigned" as BOMStatus } : b) } : prev)
    }
    setAssignModal(null); setAssignTeamId("")
  }

  if (selectedOrder) return (
    <div>
      <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-1.5 text-muted hover:text-primary text-sm mb-4 cursor-pointer bg-transparent border-0 font-medium">
        <i className="fas fa-arrow-left text-xs" /> Quay lại
      </button>
      <Card cls="p-4 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="font-display font-800 text-lg">{selectedOrder.orderNo}</div>
            <div className="text-sm text-muted">{selectedOrder.productLine}</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge cls={pColor(selectedOrder.priority)}>{PRIORITY_LABEL[selectedOrder.priority]}</Badge>
            <Badge cls={sColor(selectedOrder.status)}>{STATUS_LABEL[selectedOrder.status]}</Badge>
            {selectedOrder.pendingApproval && <Badge cls="bg-yellow-100 text-yellow-700"><i className="fas fa-clock text-[10px]" /> Chờ GĐ duyệt</Badge>}
          </div>
        </div>
        {selectedOrder.attachments.length > 0 && (
          <div className="mt-3"><div className="text-xs font-semibold text-muted mb-2"><i className="fas fa-paperclip mr-1" /> Tài liệu</div>
          <AttachmentList attachments={selectedOrder.attachments} /></div>
        )}
      </Card>
      <h3 className="font-display font-700 text-base mb-3">Phân công BOM</h3>
      <div className="space-y-3">
        {selectedOrder.boms.map(b => (
          <Card key={b.id} cls="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
              <div>
                <code className="text-[11px] bg-background text-primary px-2 py-0.5 rounded font-mono font-bold">{b.bomCode}</code>
                <div className="font-semibold text-sm mt-1">{b.partName}</div>
                <div className="text-xs text-muted-foreground">{b.machine} · {b.process} · {b.targetQty.toLocaleString()} cái</div>
              </div>
              <Badge cls={bColor(b.status)}>{BOM_STATUS_LABEL[b.status]}</Badge>
            </div>
            {b.assignedTeamName
              ? <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 text-sm text-primary font-medium"><i className="fas fa-users" />{b.assignedTeamName}</div>
                  <Btn size="sm" variant="ghost" onClick={() => { setAssignModal(b); setAssignTeamId(b.assignedTeamId) }}><i className="fas fa-pen text-xs" /> Chỉnh</Btn>
                </div>
              : <Btn size="sm" onClick={() => { setAssignModal(b); setAssignTeamId("") }}><i className="fas fa-users-gear" /> Phân tổ</Btn>
            }
          </Card>
        ))}
      </div>
      {assignModal && (
        <Modal title={`Phân công: ${assignModal.partName}`} onClose={() => setAssignModal(null)}>
          <div className="space-y-4">
            <div className="bg-background rounded-xl p-3">
              <code className="text-xs font-mono text-primary font-bold">{assignModal.bomCode}</code>
              <div className="font-semibold text-sm mt-0.5">{assignModal.partName}</div>
              <div className="text-xs text-muted-foreground">{assignModal.targetQty.toLocaleString()} cái · {assignModal.machine}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-2">Chọn Tổ phụ trách</label>
              <div className="space-y-2">
                {TEAMS.map(t => (
                  <label key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${assignTeamId === t.id ? "border-[#1B3A5C] bg-secondary" : "border-border hover:border-border"}`}>
                    <input type="radio" name="teamRadio" value={t.id} checked={assignTeamId === t.id} onChange={() => setAssignTeamId(t.id)} className="accent-[#1B3A5C]" />
                    <div>
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-xs text-muted">Tổ trưởng: {t.lead}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800 flex gap-2">
              <i className="fas fa-triangle-exclamation mt-0.5 flex-shrink-0" />
              Thay đổi phân công sẽ gửi GĐ/PGĐ phê duyệt trước khi có hiệu lực.
            </div>
            <div className="flex gap-3">
              <Btn onClick={saveAssignment}><i className="fas fa-paper-plane" /> Lưu & Gửi duyệt</Btn>
              <Btn variant="secondary" onClick={() => setAssignModal(null)}>Hủy</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )

  return (
    <div>
      {(screen === "dashboard" || screen === "orders") && (
        <>
          {screen === "dashboard" && (
            <>
              <h2 className="font-display font-800 text-xl mb-4">Quản đốc – Điều phối SX</h2>
              <DayQtySummary orders={orders} onOpenJob={({ orderId, bomId }) => {
                const o = orders.find(x => x.id === orderId)
                if (!o) return
                setSelectedOrder(o)
                const b = o.boms.find(x => x.id === bomId)
                if (b && !b.assignedTeamId) { setAssignModal(b); setAssignTeamId("") }
              }} />
              <DashboardCharts orders={orders} onOpenItem={({ orderId, bomId }) => {
                const o = orders.find(x => x.id === orderId)
                if (!o) return
                setSelectedOrder(o)
                if (bomId) {
                  const b = o.boms.find(x => x.id === bomId)
                  if (b && !b.assignedTeamId) { setAssignModal(b); setAssignTeamId("") }
                }
              }} />
            </>
          )}
          <h3 className="font-display font-700 text-base mb-3">{screen === "dashboard" ? "Tất cả Lệnh SX" : "Lệnh Sản Xuất"}</h3>
          <OrderList orders={orders} onSelect={setSelectedOrder} />
        </>
      )}
      {screen === "assign" && (
        <>
          <h2 className="font-display font-800 text-xl mb-4">BOM chưa phân tổ</h2>
          {orders.flatMap(o => o.boms.filter(b => !b.assignedTeamId).map(b => ({ o, b }))).length === 0
            ? <Card cls="p-10 text-center text-muted-foreground"><i className="fas fa-check-circle text-3xl text-green-400 opacity-60 block mb-2" />Tất cả BOM đã được phân công</Card>
            : orders.flatMap(o => o.boms.filter(b => !b.assignedTeamId).map(b => (
              <Card key={b.id} cls="p-4 mb-3 border-l-4 border-orange-300">
                <div className="text-xs text-muted-foreground mb-1">{o.orderNo} · {o.productLine}</div>
                <code className="text-[11px] font-mono text-primary font-bold">{b.bomCode}</code>
                <div className="font-semibold text-sm">{b.partName}</div>
                <div className="text-xs text-muted-foreground mb-3">{b.machine} · {b.targetQty.toLocaleString()} cái</div>
                <Btn size="sm" onClick={() => { setSelectedOrder(o); setAssignModal(b); setAssignTeamId("") }}><i className="fas fa-users-gear" /> Phân tổ ngay</Btn>
              </Card>
            )))
          }
        </>
      )}
    </div>
  )
}

// ─── Team lead view ────────────────────────────────────────────────────────────
function TeamLeadView({ user, orders, setOrders, screen, teamWorkers = [] }: {
  user: User; orders: ProductionOrder[]; setOrders: (o: ProductionOrder[]) => void; screen: string
  teamWorkers?: User[]
}) {
  const [selectedItem, setSelectedItem] = useState<{ o: ProductionOrder; b: BOMItem } | null>(null)
  const [reportModal, setReportModal] = useState<{ o: ProductionOrder; b: BOMItem } | null>(null)
  const [assignModal, setAssignModal] = useState<{ o: ProductionOrder; b: BOMItem } | null>(null)
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([])
  const [rForm, setRForm] = useState({ passQty: "", failQty: "", note: "" })

  const teamId = user.teamId
  const team = TEAMS.find(t => t.id === teamId)
  const myBOMs = orders.flatMap(o => o.boms.filter(b => b.assignedTeamId === teamId).map(b => ({ o, b })))

  const saveAssignment = async () => {
    if (!assignModal) return
    const { o, b } = assignModal
    const names = teamWorkers.filter(w => selectedWorkers.includes(w.id)).map(w => w.name)
    try {
      await orderApi.assignWorkers(o.id, b.id, names)
    } catch {
      setOrders(orders.map(x => x.id === o.id ? {
        ...x, boms: x.boms.map(bb => bb.id === b.id ? {
          ...bb, assignedWorkers: names, status: names.length ? "in_progress" as BOMStatus : bb.status
        } : bb)
      } : x))
    }
    setAssignModal(null); setSelectedWorkers([])
  }

  const submitReport = async () => {
    if (!reportModal) return
    const { o, b } = reportModal
    const ts: TeamSummary = { passQty: Number(rForm.passQty), failQty: Number(rForm.failQty), note: rForm.note, reportedBy: user.name, reportedAt: today() }
    try {
      await orderApi.submitTeamReport(o.id, b.id, { passQty: ts.passQty, failQty: ts.failQty, note: ts.note, reportedBy: user.name })
    } catch {
      setOrders(orders.map(x => x.id === o.id ? { ...x, boms: x.boms.map(bb => bb.id === b.id ? { ...bb, teamSummary: ts, passQty: ts.passQty, failQty: ts.failQty, status: "team_reported" as BOMStatus } : bb) } : x))
    }
    setReportModal(null); setRForm({ passQty: "", failQty: "", note: "" })
  }

  if (selectedItem) return (
    <BOMDetail
      bom={selectedItem.b}
      orderId={selectedItem.o.id}
      orderNo={selectedItem.o.orderNo}
      onBack={() => setSelectedItem(null)}
    />
  )

  return (
    <div>
      {(screen === "dashboard" || screen === "boms") && (
        <>
          <h2 className="font-display font-800 text-xl mb-1">{team?.name || "Tổ của tôi"}</h2>
          <p className="text-sm text-muted mb-4">Tổ trưởng: {team?.lead} · {myBOMs.length} BOM được giao</p>
          {myBOMs.length === 0
            ? <Card cls="p-10 text-center text-muted-foreground"><i className="fas fa-inbox text-3xl block mb-2 opacity-30" />Chưa có BOM nào được phân công</Card>
            : <div className="space-y-2">
                {myBOMs.map(({ o, b }) => (
                  <button key={b.id} onClick={() => setSelectedItem({ o, b })} className="w-full text-left cursor-pointer border-0 bg-transparent p-0">
                    <Card cls="p-4 hover:border-ring transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <code className="text-[11px] bg-background text-primary px-2 py-0.5 rounded font-mono font-bold">{b.bomCode}</code>
                            <Badge cls={bColor(b.status)}>{BOM_STATUS_LABEL[b.status]}</Badge>
                          </div>
                          <div className="font-semibold text-sm truncate">{b.partName}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{o.orderNo} · {b.targetQty.toLocaleString()} cái</div>
                          {b.assignedWorkers.length > 0 && <div className="text-xs text-muted mt-0.5"><i className="fas fa-users text-[10px] mr-1" />{b.assignedWorkers.join(", ")}</div>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {b.passQty > 0 && <div className="text-xs text-green-600 font-bold">{b.passQty.toLocaleString()}/{b.targetQty.toLocaleString()}</div>}
                          <i className="fas fa-chevron-right text-[#CBD5E1] text-xs mt-1 block" />
                        </div>
                      </div>
                    </Card>
                  </button>
                ))}
              </div>
          }
        </>
      )}
      {screen === "report" && (
        <>
          <h2 className="font-display font-800 text-xl mb-1">Tổng kết sản lượng BOM</h2>
          <p className="text-sm text-muted mb-4">Tổ trưởng báo cáo số lượng đạt/hỏng theo lô — gửi QC kiểm tra</p>
          {myBOMs.filter(({ b }) => b.status !== "team_reported" && b.status !== "qc_passed" && b.status !== "qc_failed").map(({ o, b }) => (
            <Card key={b.id} cls="p-4 mb-3">
              <code className="text-[11px] font-mono text-primary font-bold">{b.bomCode}</code>
              <div className="font-semibold text-sm">{b.partName}</div>
              <div className="text-xs text-muted-foreground mb-3">{o.orderNo} · {b.targetQty.toLocaleString()} cái</div>
              <Btn size="sm" onClick={() => { setReportModal({ o, b }); setRForm({ passQty: String(b.passQty || ""), failQty: String(b.failQty || ""), note: "" }) }}>
                <i className="fas fa-file-pen" /> Lập báo cáo
              </Btn>
            </Card>
          ))}
          {myBOMs.filter(({ b }) => b.status === "team_reported" || b.status === "qc_passed" || b.status === "qc_failed").map(({ b }) => (
            <Card key={b.id} cls="p-4 mb-3 border-l-4 border-green-400 opacity-80">
              <code className="text-[11px] font-mono text-primary font-bold">{b.bomCode}</code>
              <div className="font-semibold text-sm">{b.partName}</div>
              {b.teamSummary && <div className="text-xs text-muted mt-1"><i className="fas fa-check text-green-500 mr-1" />Đã BC: {b.teamSummary.passQty} đạt / {b.teamSummary.failQty} hỏng · {b.teamSummary.reportedAt}</div>}
            </Card>
          ))}
        </>
      )}
      {screen === "assign" && (
        <>
          <h2 className="font-display font-800 text-xl mb-1">Phân công Công nhân</h2>
          <p className="text-sm text-muted mb-4">Chỉ định người lao động Sản xuất từng linh kiện theo BOM được giao</p>
          {myBOMs.length === 0
            ? <Card cls="p-10 text-center text-muted-foreground"><i className="fas fa-inbox text-3xl block mb-2 opacity-30" />Chưa có BOM nào được phân cho tổ</Card>
            : myBOMs.map(({ o, b }) => (
              <Card key={b.id} cls="p-4 mb-3">
                <code className="text-[11px] font-mono text-primary font-bold">{b.bomCode}</code>
                <div className="font-semibold text-sm">{b.partName}</div>
                <div className="text-xs text-muted-foreground mb-2">{o.orderNo} · {b.targetQty.toLocaleString()} cái</div>
                {b.assignedWorkers.length > 0
                  ? <div className="text-xs text-muted mb-3"><i className="fas fa-users mr-1" />{b.assignedWorkers.join(", ")}</div>
                  : <div className="text-xs text-orange-600 mb-3"><i className="fas fa-circle-exclamation mr-1" />Chưa phân công nhân</div>
                }
                <Btn size="sm" onClick={() => {
                  setAssignModal({ o, b })
                  setSelectedWorkers(teamWorkers.filter(w => b.assignedWorkers.includes(w.name)).map(w => w.id))
                }}><i className="fas fa-user-plus" /> Chỉ định công nhân</Btn>
              </Card>
            ))
          }
        </>
      )}
      {assignModal && (
        <Modal title={`Phân công: ${assignModal.b.partName}`} onClose={() => setAssignModal(null)}>
          <div className="space-y-4">
            <div className="bg-background rounded-xl p-3">
              <code className="text-xs font-mono text-primary font-bold">{assignModal.b.bomCode}</code>
              <div className="font-semibold text-sm mt-0.5">{assignModal.b.partName}</div>
              <div className="text-xs text-muted-foreground">{assignModal.o.orderNo}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-2">Chọn công nhân phụ trách Sản xuất</label>
              {teamWorkers.length === 0
                ? <div className="text-xs text-muted-foreground italic">Không có công nhân trong tổ</div>
                : <div className="space-y-2">
                    {teamWorkers.map(w => (
                      <label key={w.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedWorkers.includes(w.id) ? "border-[#1B3A5C] bg-secondary" : "border-border"}`}>
                        <input type="checkbox" checked={selectedWorkers.includes(w.id)} onChange={() => setSelectedWorkers(prev => prev.includes(w.id) ? prev.filter(id => id !== w.id) : [...prev, w.id])} className="accent-[#1B3A5C]" />
                        <div>
                          <div className="font-semibold text-sm">{w.name}</div>
                          <div className="text-xs text-muted font-mono">{w.employeeId}</div>
                        </div>
                      </label>
                    ))}
                  </div>
              }
            </div>
            <div className="flex gap-3">
              <Btn onClick={saveAssignment}><i className="fas fa-save" /> Lưu phân công</Btn>
              <Btn variant="secondary" onClick={() => setAssignModal(null)}>Hủy</Btn>
            </div>
          </div>
        </Modal>
      )}
      {reportModal && (
        <Modal title={`Báo cáo: ${reportModal.b.partName}`} onClose={() => setReportModal(null)}>
          <div className="space-y-4">
            <div className="bg-background rounded-xl p-3">
              <code className="text-xs font-mono text-primary font-bold">{reportModal.b.bomCode}</code>
              <div className="font-semibold text-sm mt-0.5">{reportModal.b.partName}</div>
              <div className="text-xs text-muted-foreground">Mục tiêu: {reportModal.b.targetQty.toLocaleString()} cái</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Số lượng ĐẠT" value={rForm.passQty} onChange={v => setRForm({ ...rForm, passQty: v })} type="number" required placeholder="VD: 1250" />
              <Input label="Số lượng HỎNG" value={rForm.failQty} onChange={v => setRForm({ ...rForm, failQty: v })} type="number" placeholder="VD: 23" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Ghi chú</label>
              <textarea value={rForm.note} onChange={e => setRForm({ ...rForm, note: e.target.value })} rows={3}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Ghi chú thêm nếu có..." />
            </div>
            <div className="flex gap-3">
              <Btn onClick={submitReport}><i className="fas fa-paper-plane" /> Gửi báo cáo</Btn>
              <Btn variant="secondary" onClick={() => setReportModal(null)}>Hủy</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Worker view – danh sách công việc ───────────────────────────────────────
/** @deprecated Dùng WorkerJobsList từ pages; giữ export tương thích. */
function WorkerView({ user, orders }: { user: User; orders: ProductionOrder[]; setOrders?: (o: ProductionOrder[]) => void; screen: string }) {
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const jobs = orders
    .map((order) => {
      const myBoms = order.boms.filter((b) => b.assignedWorkers.includes(user.name))
      if (!myBoms.length) return null
      const parts = myBoms.map((bom) => {
        const done = bom.workerEntries.reduce((s, e) => s + e.rows.length, 0)
        const target = bom.targetQty || 0
        const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0
        return { bom, done, target, pct, fail: bom.failQty || 0 }
      })
      const unfinished = myBoms.filter((b) => b.status !== "qc_passed" && b.status !== "team_reported").length
      const avgPct = parts.length ? Math.round(parts.reduce((s, p) => s + p.pct, 0) / parts.length) : 0
      return { order, parts, unfinished, avgPct }
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
  const unfinishedTotal = jobs.reduce((s, j) => s + j.unfinished, 0)

  return (
    <div>
      <h2 className="font-display font-800 text-xl tracking-wide mb-3">CÔNG VIỆC</h2>
      {unfinishedTotal > 0 && (
        <div className="bg-border text-red-600 text-sm font-medium rounded-xl px-4 py-3 mb-4">
          Còn {unfinishedTotal} công việc chưa hoàn thành
        </div>
      )}
      {jobs.length === 0
        ? <Card cls="p-10 text-center text-muted-foreground"><i className="fas fa-inbox text-3xl block mb-2 opacity-30" />Chưa được tổ trưởng phân công</Card>
        : <div className="space-y-3">
            {jobs.map(({ order, parts, avgPct }) => {
              const expanded = expandedId === order.id
              const name = order.productLine || order.productCode || order.orderNo
              const code = order.productCode || order.orderNo
              return (
                <Card key={order.id} cls="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : order.id)}
                    className="w-full text-left px-4 py-4 flex items-center justify-between gap-3 bg-transparent border-0 cursor-pointer hover:bg-surface"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm">{name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 font-mono">{code}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-green-600 font-bold text-sm">{avgPct}%</span>
                      <i className={`fas ${expanded ? "fa-chevron-down" : "fa-chevron-right"} text-[10px] text-muted`} />
                    </div>
                  </button>
                  <div className="px-4 pb-3">
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${avgPct}%` }} />
                    </div>
                  </div>
                  {expanded && (
                    <div className="border-t border-border px-3 pb-3 pt-2 space-y-2 bg-surface/40">
                      <div className="text-[11px] font-semibold text-muted px-1 mb-1">Linh kiện được phân công · số lượng</div>
                      {parts.map(({ bom, done, target, pct, fail }) => (
                        <button
                          key={bom.id}
                          type="button"
                          onClick={() => navigate(`/worker/task/${order.id}/${bom.id}`)}
                          className="w-full text-left rounded-xl border border-border bg-card p-3 cursor-pointer hover:border-ring"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <div className="font-semibold text-sm">{bom.partName}</div>
                              <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{bom.partCode || bom.bomCode}</div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-display font-700 text-base text-primary tabular-nums">
                                {done.toLocaleString()}
                                <span className="text-muted-foreground font-medium text-sm"> / {target.toLocaleString()}</span>
                              </div>
                              <div className="text-[11px] text-muted">{pct}%</div>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-border overflow-hidden">
                            <div className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : "bg-[#2D6EBD]"}`} style={{ width: `${pct}%` }} />
                          </div>
                          {fail > 0 ? <div className="mt-1.5 text-[11px] text-red-600">Hỏng: {fail}</div> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
      }
    </div>
  )
}

// ─── QC view ───────────────────────────────────────────────────────────────────
function QCView({ user, orders, setOrders, screen }: { user: User; orders: ProductionOrder[]; setOrders: (o: ProductionOrder[]) => void; screen: string }) {
  const [qcModal, setQCModal] = useState<{ o: ProductionOrder; b: BOMItem } | null>(null)
  const [qcForm, setQCForm] = useState({ passQty: "", failQty: "", complaint: "", decision: "approve" })
  const [peek, setPeek] = useState<{ o: ProductionOrder; b: BOMItem } | null>(null)

  const pending = orders.flatMap(o => o.boms.filter(b => b.status === "team_reported").map(b => ({ o, b })))
  const done = orders.flatMap(o => o.boms.filter(b => b.status === "qc_passed" || b.status === "qc_failed").map(b => ({ o, b })))

  const submit = async () => {
    if (!qcModal) return
    const { o, b } = qcModal
    const teamPass = b.teamSummary?.passQty ?? 0
    const teamFail = b.teamSummary?.failQty ?? 0
    const qcPass = Number(qcForm.passQty) || teamPass
    const qcFail = Number(qcForm.failQty) || teamFail

    if (qcForm.decision === "reject") {
      if (!qcForm.complaint.trim()) {
        toast.error("Vui lòng nhập nội dung khiếu nại.")
        return
      }
    } else if (qcPass !== teamPass || qcFail !== teamFail) {
      const ok = await toast.confirm({
        title: "Xác nhận QC",
        message: "Số lượng QC khác báo cáo tổ trưởng. Vẫn xác nhận?",
        confirmLabel: "Vẫn xác nhận",
      })
      if (!ok) return
    }

    const report: QCReport = {
      passQty: qcPass, failQty: qcFail, complaint: qcForm.complaint,
      status: qcForm.decision === "approve" ? "approved" : "rejected",
      inspectedBy: user.name, inspectedAt: today(),
    }
    const passed = qcForm.decision === "approve"
    try {
      await orderApi.submitQCReport(o.id, b.id, report, passed)
    } catch {
      setOrders(orders.map(x => x.id === o.id ? { ...x, boms: x.boms.map(bb => bb.id === b.id ? { ...bb, qcReport: report, status: (passed ? "qc_passed" : "qc_failed") as BOMStatus } : bb) } : x))
    }
    setQCModal(null); setQCForm({ passQty: "", failQty: "", complaint: "", decision: "approve" })
  }

  if (peek) {
    return (
      <BOMDetail
        bom={peek.b}
        orderId={peek.o.id}
        orderNo={peek.o.orderNo}
        onBack={() => setPeek(null)}
      />
    )
  }

  return (
    <div>
      {screen === "dashboard" && (
        <>
          <h2 className="font-display font-800 text-xl mb-4">QC – Kiểm tra Chất lượng</h2>
          <DayQtySummary orders={orders} onOpenJob={({ orderId, bomId }) => {
            const o = orders.find(x => x.id === orderId)
            if (!o) return
            const b = o.boms.find(x => x.id === bomId)
            if (!b) return
            if (b.status === "team_reported") {
              setQCModal({ o, b })
              setQCForm({ passQty: String(b.teamSummary?.passQty ?? ""), failQty: String(b.teamSummary?.failQty ?? ""), complaint: "", decision: "approve" })
            } else {
              setPeek({ o, b })
            }
          }} />
          <DashboardCharts orders={orders} onOpenItem={({ orderId, bomId }) => {
            const o = orders.find(x => x.id === orderId)
            if (!o) return
            const b = bomId ? o.boms.find(x => x.id === bomId) : o.boms[0]
            if (!b) return
            if (b.status === "team_reported") {
              setQCModal({ o, b })
              setQCForm({ passQty: String(b.teamSummary?.passQty ?? ""), failQty: String(b.teamSummary?.failQty ?? ""), complaint: "", decision: "approve" })
            } else {
              setPeek({ o, b })
            }
          }} />
        </>
      )}
      <h3 className="font-display font-700 text-base mb-3 flex items-center gap-2"><i className="fas fa-hourglass-half text-yellow-500" /> Chờ kiểm tra ({pending.length})</h3>
      {pending.length === 0
        ? <Card cls="p-8 text-center text-muted-foreground mb-4"><i className="fas fa-check-circle text-3xl text-green-400 opacity-60 block mb-2" />Không có BOM nào chờ QC</Card>
        : <div className="space-y-3 mb-5">
            {pending.map(({ o, b }) => (
              <Card key={b.id} cls="p-4 border-l-4 border-yellow-400">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-xs text-muted-foreground">{o.orderNo}</div>
                    <code className="text-[11px] bg-background text-primary px-2 py-0.5 rounded font-mono font-bold">{b.bomCode}</code>
                    <div className="font-semibold text-sm mt-0.5">{b.partName}</div>
                  </div>
                  <Badge cls="bg-yellow-100 text-yellow-700"><i className="fas fa-clock text-[10px]" /> Chờ QC</Badge>
                </div>
                {b.teamSummary && (
                  <div className="flex gap-3 text-xs mb-3">
                    <span className="text-green-600 font-semibold"><i className="fas fa-check mr-1" />{b.teamSummary.passQty} đạt</span>
                    <span className="text-red-500 font-semibold"><i className="fas fa-times mr-1" />{b.teamSummary.failQty} hỏng</span>
                    <span className="text-muted-foreground">BC bởi {b.teamSummary.reportedBy}</span>
                  </div>
                )}
                {b.workerEntries.length > 0 && <div className="text-xs text-muted mb-3"><i className="fas fa-table mr-1" />{b.workerEntries.length} bảng đo · {b.workerEntries.reduce((s, e) => s + e.rows.length, 0)} mẫu</div>}
                <Btn size="sm" onClick={() => { setQCModal({ o, b }); setQCForm({ passQty: String(b.teamSummary?.passQty ?? ""), failQty: String(b.teamSummary?.failQty ?? ""), complaint: "", decision: "approve" }) }}>
                  <i className="fas fa-magnifying-glass" /> Kiểm tra
                </Btn>
              </Card>
            ))}
          </div>
      }
      {done.length > 0 && (
        <>
          <h3 className="font-display font-700 text-base mb-3 flex items-center gap-2"><i className="fas fa-history text-muted-foreground" /> Đã kiểm tra</h3>
          <div className="space-y-2">
            {done.map(({ o, b }) => (
              <Card key={b.id} cls="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{o.orderNo}</div>
                    <code className="text-[11px] font-mono text-primary font-bold">{b.bomCode}</code>
                    <div className="text-sm font-medium truncate">{b.partName}</div>
                    {b.qcReport && <div className="text-xs text-muted-foreground mt-0.5">{b.qcReport.passQty} đạt · {b.qcReport.inspectedBy} · {b.qcReport.inspectedAt}</div>}
                  </div>
                  <Badge cls={bColor(b.status)}>{BOM_STATUS_LABEL[b.status]}</Badge>
                </div>
                {b.qcReport?.complaint && <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-2 text-xs text-red-700"><i className="fas fa-triangle-exclamation mr-1" />{b.qcReport.complaint}</div>}
              </Card>
            ))}
          </div>
        </>
      )}
      {qcModal && (
        <Modal title={`QC: ${qcModal.b.partName}`} onClose={() => setQCModal(null)}>
          <div className="space-y-4">
            <div className="bg-background rounded-xl p-3">
              <code className="text-xs font-mono text-primary font-bold">{qcModal.b.bomCode}</code>
              <div className="font-semibold text-sm mt-0.5">{qcModal.b.partName}</div>
              {qcModal.b.teamSummary && <div className="text-xs text-muted mt-1">Tổ báo cáo: <span className="text-green-600 font-semibold">{qcModal.b.teamSummary.passQty} đạt</span> · <span className="text-red-500 font-semibold">{qcModal.b.teamSummary.failQty} hỏng</span></div>}
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800">
              <i className="fas fa-circle-info mr-1" />
              <strong>Quy trình:</strong> Khớp số lượng tổ trưởng → Xác nhận gửi Quản đốc. Không đạt chuẩn → Gửi khiếu nại cho Tổ trưởng & Quản đốc.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Số lượng QC xác nhận ĐẠT" value={qcForm.passQty} onChange={v => setQCForm({ ...qcForm, passQty: v })} type="number" required />
              <Input label="Số lượng HỎNG" value={qcForm.failQty} onChange={v => setQCForm({ ...qcForm, failQty: v })} type="number" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-2">Kết quả kiểm tra</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ v: "approve", label: "Xác nhận đúng BC tổ", icon: "fa-circle-check", c: "border-green-500 bg-green-50 text-green-700" }, { v: "reject", label: "Không đạt chuẩn", icon: "fa-circle-xmark", c: "border-red-500 bg-red-50 text-red-700" }].map(opt => (
                  <label key={opt.v} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${qcForm.decision === opt.v ? opt.c : "border-border hover:border-border"}`}>
                    <input type="radio" name="qcDecision" value={opt.v} checked={qcForm.decision === opt.v} onChange={() => setQCForm({ ...qcForm, decision: opt.v })} className="sr-only" />
                    <i className={`fas ${opt.icon} text-lg`} />
                    <span className="font-semibold text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            {qcForm.decision === "reject" && (
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Đơn khiếu nại (gửi Tổ trưởng & Quản đốc) <span className="text-red-500">*</span></label>
                <textarea value={qcForm.complaint} onChange={e => setQCForm({ ...qcForm, complaint: e.target.value })} rows={3}
                  className="w-full border-2 border-red-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  placeholder="Mô tả lỗi, kích thước không đạt, vị trí lỗi..." />
              </div>
            )}
            <Btn onClick={submit} variant={qcForm.decision === "approve" ? "success" : "danger"} cls="w-full justify-center" size="lg">
              <i className={`fas ${qcForm.decision === "approve" ? "fa-circle-check" : "fa-paper-plane"}`} />
              {qcForm.decision === "approve" ? "Xác nhận & Gửi Quản đốc" : "Gửi khiếu nại → Tổ trưởng & Quản đốc"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Stats view ────────────────────────────────────────────────────────────────
function StatsView({ orders, screen }: { orders: ProductionOrder[]; screen: string }) {
  const all = orders.flatMap(o => o.boms)
  const totalTarget = all.reduce((s, b) => s + b.targetQty, 0)
  const totalPass = all.reduce((s, b) => s + b.passQty, 0)
  const totalFail = all.reduce((s, b) => s + b.failQty, 0)
  const rate = totalTarget > 0 ? Math.round((totalPass / totalTarget) * 100) : 0
  const [peek, setPeek] = useState<{ o: ProductionOrder; b: BOMItem } | null>(null)

  if (peek) {
    return (
      <BOMDetail
        bom={peek.b}
        orderId={peek.o.id}
        orderNo={peek.o.orderNo}
        onBack={() => setPeek(null)}
      />
    )
  }

  return (
    <div>
      <h2 className="font-display font-800 text-xl mb-4">Thống kê Sản xuất</h2>
      <DayQtySummary orders={orders} onOpenJob={({ orderId, bomId }) => {
        const o = orders.find(x => x.id === orderId)
        if (!o) return
        const b = o.boms.find(x => x.id === bomId)
        if (b) setPeek({ o, b })
      }} />
      <DashboardCharts orders={orders} onOpenItem={({ orderId, bomId }) => {
        const o = orders.find(x => x.id === orderId)
        if (!o) return
        const b = bomId ? o.boms.find(x => x.id === bomId) : o.boms[0]
        if (b) setPeek({ o, b })
      }} />
      <Card cls="p-4 mb-4">
        <div className="flex justify-between text-sm font-semibold mb-2"><span>Tiến độ tổng</span><span className="text-muted">{totalPass.toLocaleString()} / {totalTarget.toLocaleString()}</span></div>
        <div className="h-3 bg-surface rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#1B3A5C] to-[#2D6EBD] rounded-full transition-all" style={{ width: `${rate}%` }} /></div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1.5"><span>Đạt: {totalPass.toLocaleString()}</span><span>Hỏng: {totalFail}</span><span>Chưa: {(totalTarget - totalPass - totalFail).toLocaleString()}</span></div>
      </Card>
      <h3 className="font-display font-700 text-base mb-3">Chi tiết theo Lệnh SX</h3>
      <div className="space-y-3 mb-5">
        {orders.map(o => {
          const pass = o.boms.reduce((s, b) => s + b.passQty, 0)
          const tgt = o.boms.reduce((s, b) => s + b.targetQty, 0)
          const r = tgt > 0 ? Math.round((pass / tgt) * 100) : 0
          return (
            <Card key={o.id} cls="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-display font-700 text-sm">{o.orderNo}</div>
                  <div className="text-xs text-muted">{o.productLine}</div>
                </div>
                <Badge cls={sColor(o.status)}>{STATUS_LABEL[o.status]}</Badge>
              </div>
              <div className="grid grid-cols-4 gap-1 text-xs text-center mb-2">
                {[["BOM",o.boms.length,"text-primary"],["Mục tiêu",tgt.toLocaleString(),"text-foreground"],["Đạt",pass.toLocaleString(),"text-green-600"],["Tỷ lệ",`${r}%`,r>=90?"text-green-600":r>=70?"text-yellow-600":"text-red-500"]].map(([l,v,c]) => (
                  <div key={l as string}><div className={`font-bold ${c}`}>{v}</div><div className="text-muted-foreground">{l}</div></div>
                ))}
              </div>
              <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#1B3A5C] to-[#2D6EBD] rounded-full" style={{ width: `${r}%` }} /></div>
            </Card>
          )
        })}
      </div>
      <h3 className="font-display font-700 text-base mb-3">Theo Tổ</h3>
      <Card cls="divide-y divide-[#F1F5F9]">
        {TEAMS.map(t => {
          const tBOMs = all.filter(b => b.assignedTeamId === t.id)
          const p = tBOMs.reduce((s, b) => s + b.passQty, 0)
          const tgt = tBOMs.reduce((s, b) => s + b.targetQty, 0)
          return (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.lead} · {tBOMs.length} BOM</div>
              </div>
              <div className="text-right text-xs">
                <div className="font-bold text-green-600">{p.toLocaleString()} đạt</div>
                <div className="text-muted-foreground">/ {tgt.toLocaleString()}</div>
              </div>
            </div>
          )
        })}
      </Card>
    </div>
  )
}

// ─── Admin / Account Management view ─────────────────────────────────────────
function AdminView({ users, setUsers, screen }: { users: User[]; setUsers: (u: User[]) => void; screen: string }) {
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [form, setForm] = useState<Omit<User,"id">>({ employeeId: "", name: "", password: "", role: "worker", teamId: "", department: "", phone: "", active: true })

  const filtered = users.filter(u =>
    (filterRole === "all" || u.role === filterRole) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.employeeId.toLowerCase().includes(search.toLowerCase()))
  )

  const openCreate = () => {
    const nextId = `NV${String(users.length + 1).padStart(3, "0")}`
    setForm({ employeeId: nextId, name: "", password: "123456", role: "worker", teamId: "", department: "", phone: "", active: true })
    setEditUser(null); setShowForm(true)
  }

  const openEdit = (u: User) => {
    setForm({ employeeId: u.employeeId, name: u.name, password: u.password, role: u.role, teamId: u.teamId, department: u.department, phone: u.phone, active: u.active })
    setEditUser(u); setShowForm(true)
  }

  const save = () => {
    if (!form.name || !form.employeeId) return
    if (editUser) {
      setUsers(users.map(u => u.id === editUser.id ? { ...u, ...form } : u))
    } else {
      setUsers([...users, { id: `u${Date.now()}`, ...form }])
    }
    setShowForm(false); setEditUser(null)
  }

  const toggleActive = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, active: !u.active } : u))
  }

  const ROLE_COLOR: Record<Role, string> = {
    director: "bg-secondary text-[#4F46E5]", supervisor: "bg-[#EFF6FF] text-[#2563EB]",
    teamlead: "bg-[#FFFBEB] text-[#D97706]", worker: "bg-[#F0FDF4] text-[#16A34A]",
    qc: "bg-[#FAF5FF] text-[#7C3AED]", stats: "bg-[#F0FDFA] text-[#0F766E]",
    admin: "bg-[#FFF1F2] text-[#DC2626]", mechanic: "bg-surface text-muted",
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-800 text-xl">Quản lý Tài khoản</h2>
        <Btn onClick={openCreate}><i className="fas fa-user-plus" /> Thêm</Btn>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatTile label="Tổng TK" value={users.length} icon="fa-users" color="bg-[#EFF6FF] text-[#2563EB]" />
        <StatTile label="Đang HĐ" value={users.filter(u => u.active).length} icon="fa-circle-dot" color="bg-[#F0FDF4] text-[#16A34A]" />
        <StatTile label="Vô hiệu" value={users.filter(u => !u.active).length} icon="fa-ban" color="bg-[#FFF1F2] text-[#DC2626]" />
        <StatTile label="Công nhân" value={users.filter(u => u.role === "worker").length} icon="fa-gear" color="bg-[#FFFBEB] text-[#D97706]" />
      </div>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên, mã NV..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card">
          <option value="all">Tất cả</option>
          {(["director","supervisor","teamlead","worker","qc","stats","admin"] as Role[]).map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        {filtered.map(u => (
          <Card key={u.id} cls={`p-4 transition-all ${!u.active ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ROLE_COLOR[u.role]}`}>
                  <i className={`fas ${ROLE_ICON[u.role]} text-sm`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{u.name}</span>
                    {!u.active && <Badge cls="bg-red-100 text-red-600"><i className="fas fa-ban text-[10px]" /> Vô hiệu</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <code className="text-xs font-mono font-bold text-primary bg-background px-1.5 py-0.5 rounded">{u.employeeId}</code>
                    <Badge cls={ROLE_COLOR[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {u.department}{u.teamId && ` · ${TEAMS.find(t => t.id === u.teamId)?.name}`}{u.phone && ` · ${u.phone}`}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(u)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface text-muted cursor-pointer border-0 bg-transparent transition-all">
                  <i className="fas fa-pen text-sm" />
                </button>
                <button onClick={() => toggleActive(u.id)} className={`w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer border-0 transition-all ${u.active ? "hover:bg-red-50 text-muted-foreground hover:text-red-500" : "hover:bg-green-50 text-muted-foreground hover:text-green-500"}`}>
                  <i className={`fas ${u.active ? "fa-ban" : "fa-circle-check"} text-sm`} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <Card cls="p-8 text-center text-muted-foreground"><i className="fas fa-search text-2xl block mb-2 opacity-30" />Không tìm thấy tài khoản</Card>}
      </div>

      {showForm && (
        <Modal title={editUser ? `Sửa: ${editUser.name}` : "Thêm tài khoản mới"} onClose={() => { setShowForm(false); setEditUser(null) }} size="lg">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Mã nhân viên <span className="text-red-500">*</span></label>
                <div className="relative">
                  <i className="fas fa-id-badge absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                  <input value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-ring" placeholder="NV001" />
                </div>
                <div className="text-xs text-muted-foreground mt-1">Tự động tạo, có thể sửa</div>
              </div>
              <Input label="Họ và tên" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Nguyễn Văn A" required />
              <Input label="Mật khẩu" value={form.password} onChange={v => setForm({ ...form, password: v })} type="password" required />
              <Input label="Số điện thoại" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="09xxxxxxxx" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Vai trò" value={form.role} onChange={v => setForm({ ...form, role: v as Role })}
                options={(["director","supervisor","teamlead","worker","qc","stats","admin"] as Role[]).map(r => ({ value: r, label: ROLE_LABEL[r] }))} />
              <Select label="Tổ (nếu có)" value={form.teamId} onChange={v => setForm({ ...form, teamId: v })}
                options={[{ value: "", label: "— Không thuộc tổ —" }, ...TEAMS.map(t => ({ value: t.id, label: `${t.name} – ${t.lead}` }))]} />
            </div>
            <Input label="Bộ phận / Phòng ban" value={form.department} onChange={v => setForm({ ...form, department: v })} placeholder="VD: Tổ 1 / Phòng QC" />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="accent-[#1B3A5C] w-4 h-4" />
                <span className="text-sm font-medium">Tài khoản đang hoạt động</span>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <Btn onClick={save} cls="flex-1 justify-center"><i className="fas fa-save" /> {editUser ? "Lưu thay đổi" : "Tạo tài khoản"}</Btn>
              <Btn variant="secondary" onClick={() => { setShowForm(false); setEditUser(null) }}>Hủy</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Exports for modular pages ────────────────────────────────────────────────
export {
  LoginScreen,
  AppShell,
  DirectorView,
  SupervisorView,
  TeamLeadView,
  WorkerView,
  QCView,
  StatsView,
  AdminView,
  NAV_CFG,
  ROLE_ICON,
  ROLE_LABEL,
  SEED_USERS,
  Badge,
  Btn,
  Card,
  Divider,
  Input,
  Modal,
  Select,
  StatTile,
}
export type { User, ProductionOrder, Role, BOMItem }
