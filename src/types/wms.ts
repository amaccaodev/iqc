export type WmsRole =
  | "Nhân viên kho"
  | "Thủ kho"
  | "Quản lý kho"
  | "Kế toán kho"
  | "Quản trị tập đoàn";

export type WmsPermission =
  | "view_documents"
  | "create_inbound"
  | "create_outbound"
  | "create_count"
  | "edit_own_documents"
  | "edit_any_documents"
  | "approve_inbound"
  | "approve_outbound"
  | "approve_count"
  | "confirm_inbound"
  | "confirm_outbound"
  | "dispatch_transfer"
  | "receive_transfer"
  | "resolve_transfer"
  | "confirm_count"
  | "return_documents";

export interface Company {
  id: string;
  name: string;
  unitType: "subsidiary" | "headquarters";
  status: "active" | "inactive";
  plants: string[];
}

export interface Warehouse {
  id: string;
  name: string;
  companyId: string;
  plant: string;
  type: string;
  location: string;
  manager: string;
  status: "active" | "inactive";
  hasTxn?: boolean;
}

export type ProductItemType = "raw_material" | "semi_finished" | "finished" | "other";

export interface Product {
  id: string;
  name: string;
  category: string;
  itemType: ProductItemType;
  unit: string;
  lot: boolean;
  expiry: boolean;
  min: number;
  max: number;
  price: number;
  salePrice: number;
  costPrice: number | null;
  spec: string;
  active: boolean;
  companyId: string | null;
  hasTxn?: boolean;
}

export interface InventoryItem {
  id: string;
  productId: string;
  companyId: string;
  warehouseId: string;
  location: string;
  lot: string;
  expiry: string;
  onHand: number;
}

export type InboundSourceType = "production" | "purchase" | "return" | "external" | "legacy";

export interface InboundSourceInfo {
  type: InboundSourceType;
  department?: string;
  productionOrder?: string;
  party?: string;
  purchaseOrder?: string;
  voucherNo?: string;
  voucherDate?: string;
  originalIssueRef?: string;
  returnReason?: string;
  externalKind?: string;
  reason?: string;
  historicalSource?: string;
}

export interface DocItem {
  productId: string;
  qty: number;
  actualQty?: number;
  lot?: string;
  unit?: string;
  costPrice?: number | null;
  requestedQty?: number;
  shippedQty?: number;
  receivedQty?: number;
}

export type DocumentType = "inbound" | "outbound" | "transfer" | "count";

export type DocumentStatus =
  | "draft"
  | "counted"
  | "pending"
  | "approved"
  | "rejected"
  | "returned"
  | "completed"
  | "partially_received"
  | "in_transit"
  | "received"
  | "cancelled";

export interface AuditLogChange {
  field: string;
  before: string | number;
  after: string | number;
}

export interface AuditLogEntry {
  id: string;
  documentId?: string;
  inventoryCountSessionId?: string;
  action: string;
  actor: string;
  role: string;
  at: string;
  changes: AuditLogChange[];
  demoBatchId?: string;
}

export interface TransferEvent {
  id: string;
  at: string;
  actor: string;
  warehouseId: string;
  companyId: string;
  lines: Array<{
    productId: string;
    lot: string;
    qty: number;
    unit: string;
  }>;
}

export interface TransferResolution {
  reason: string;
  actor: string;
  at: string;
  lines: Array<{
    productId: string;
    lot: string;
    unshippedQty: number;
    shippedNotReceivedQty: number;
  }>;
}

export interface WmsDocument {
  id: string;
  type: DocumentType;
  companyId: string;
  warehouseId: string;
  targetWarehouseId?: string;
  targetCompanyId?: string;
  kind?: string;
  partner?: string;
  status: DocumentStatus;
  createdAt: string;
  documentDate: string;
  reference?: string;
  creator: string;
  items: DocItem[];
  posted?: boolean;
  note?: string;
  approver?: string;
  approvedAt?: string;
  rejectionReason?: string;
  rejectionHistory?: Array<{
    reason: string;
    actor: string;
    at: string;
  }>;
  returnReason?: string;
  returnHistory?: Array<{
    reason: string;
    actor: string;
    at: string;
  }>;
  submissionHistory?: Array<{
    actor: string;
    at: string;
  }>;
  auditHistory?: AuditLogEntry[];
  stockPostings?: string[];
  inboundSource?: InboundSourceInfo;
  legacyInbound?: boolean;
  legacyExternalSource?: string;
  executionStatus?: "pending_execution" | "partially_executed" | "executed";
  dispatchedAt?: string;
  receivedAt?: string;
  transferHistory?: Array<TransferEvent | { id: string; at: string; actor: string; reason: string; lines: any[] }>;
  dispatchHistory?: TransferEvent[];
  receiptHistory?: TransferEvent[];
  transferResolved?: boolean;
  transferResolution?: TransferResolution;
  snapshotAt?: string;
  responsible?: string;
  updatedAt?: string;
}

export interface WmsTransaction {
  id: string;
  date: string;
  type: "inbound" | "outbound" | "transfer_in" | "transfer_out" | "count_adjust";
  companyId: string;
  warehouseId: string;
  productId: string;
  lot: string;
  before: number;
  change: number;
  after: number;
  actor: string;
  reference: string;
}

export interface Supplier {
  id: string;
  name: string;
  tax: string;
  phone: string;
  email: string;
  address: string;
  companyId: string;
  status: "active" | "inactive";
}

export interface InventoryCountItem {
  id: string;
  sessionId: string;
  companyId: string;
  warehouseId: string;
  productId: string;
  lot: string;
  unit: string;
  systemQty: number;
  countedQty: number | null;
  delta: number | null;
  countedAt: string;
  actor: string;
}

export interface WmsDataState {
  version: number;
  companies: Company[];
  warehouses: Warehouse[];
  products: Product[];
  inventory: InventoryItem[];
  inventoryCounts: InventoryCountItem[];
  docs: WmsDocument[];
  transactions: WmsTransaction[];
  suppliers: Supplier[];
  auditLog: AuditLogEntry[];
  role: WmsRole;
  theme: "light" | "dark";
  seq: number;
}

