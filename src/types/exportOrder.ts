export type OrderStatus = "draft" | "pending" | "in_progress" | "partial" | "completed" | "cancelled"

export interface Project {
  id: string
  name: string
  code: string
}

export interface Warehouse {
  id: string
  name: string
  code: string
  keeperName: string
}

export interface Material {
  id: string
  code: string
  name: string
  unit: string
  defaultQuota: number
}

export interface Requisition {
  id: string
  code: string
  projectId: string
  approvedBy: string
  approvedDate: string
  title: string
  quotas: Record<string, number>
}

export interface OrderMaterialItem {
  materialId: string
  approvedQty: number
  reqQty: number
  issuedQty: number
  photo?: string // Base64 or URL
}

export interface OrderLog {
  time: string
  actor: string
  action: string
  note?: string
}

export interface ExportOrder {
  id: string
  code: string // LX-YYYY-XXXX
  status: OrderStatus
  projectId: string
  warehouseId: string
  requisitionId: string
  vehiclePlate?: string
  creatorName: string
  createdAt: string
  expectedDate: string
  notes?: string
  cancelReason?: string
  closeShortReason?: string
  materials: OrderMaterialItem[]
  initialPhotos: string[]
  handoverPhotos: string[]
  logs: OrderLog[]
}

export type ExportRoleType = "accountant" | "warehouse_keeper" | "auditor"

export interface ExportUser {
  id: string
  name: string
  role: string
  roleType: ExportRoleType
  warehouseId: string | null
  avatarIcon?: string
}
