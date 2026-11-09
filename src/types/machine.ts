export type MachineStatus = "running" | "idle" | "maintenance" | "broken";

export type MachineType =
  | "Phay CNC"
  | "Tiện CNC"
  | "Cắt dây EDM"
  | "Dập thủy lực"
  | "Dập cơ"
  | "Mài phẳng"
  | "Hàn robot"
  | "Ép nhựa"
  | "Đo CMM"
  | "Uốn ống CNC";

export type WorkshopType =
  | "Xưởng Cơ khí 1"
  | "Xưởng Cơ khí 2"
  | "Xưởng Dập & Hàn"
  | "Xưởng Đúc & Ép"
  | "Phòng Kiểm tra QC";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentStatus = "pending" | "in_progress" | "resolved";

export type MaintenanceType = "periodic" | "preventive" | "overhaul" | "calibration";

export type MaintenanceStatus = "scheduled" | "completed" | "cancelled";

export interface MachineWorkHistory {
  id: string;
  machineId: string;
  orderNo: string; // e.g. "LX-2026-012"
  productName: string;
  targetQty: number;
  actualQty: number;
  startTime: string;
  endTime: string;
  downtimeMinutes: number;
  operator: string;
}

export interface MaintenanceRecord {
  id: string;
  machineId: string;
  date: string; // YYYY-MM-DD
  type: MaintenanceType;
  description: string;
  technician: string;
  costVnd: number;
  status: MaintenanceStatus;
  result?: string;
  nextDueDate?: string;
}

export interface MachineIncident {
  id: string;
  machineId: string;
  reportedAt: string; // ISO string
  resolvedAt?: string;
  downtimeMinutes: number;
  severity: IncidentSeverity;
  description: string;
  rootCause?: string;
  solution?: string;
  technician?: string;
  status: IncidentStatus;
}

export interface MachineDayStats {
  date: string; // YYYY-MM-DD
  runHours: number;
  idleHours: number;
  downtimeHours: number;
}

export interface Machine {
  id: string;
  code: string; // e.g. "CNC-01"
  name: string; // e.g. "Máy phay CNC 5 trục"
  type: MachineType;
  workshop: WorkshopType;
  line: string; // e.g. "Dây chuyền A"
  status: MachineStatus;

  // Running context
  currentOrder?: string; // e.g. "LX-2026-088"
  orderProductName?: string;
  progress?: number; // 0-100
  operator?: string;

  // Counters & Schedule
  totalRunHours: number;
  lastMaintenanceDate: string; // YYYY-MM-DD
  nextMaintenanceDate: string; // YYYY-MM-DD

  // Specifications
  model: string;
  brand: string;
  manufacturerCountry: string;
  yearOfManufacture: number;
  yearCommissioned: number;
  powerKw: number;
  weightKg: number;
  dimensionsMm: string; // Dài x Rộng x Cao
  ipAddress?: string;

  // History relations
  workHistory: MachineWorkHistory[];
  maintenanceRecords: MaintenanceRecord[];
  incidents: MachineIncident[];
  dailyStats: MachineDayStats[];
}

export interface MachineFilterOptions {
  search: string;
  workshop: string;
  type: string;
  status: string;
}

