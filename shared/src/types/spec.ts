/** Thông số kỹ thuật do GĐ/quản lý đề ra cho từng cột đo */
export interface MaterialSpec {
  index: number;
  /** Tên thông số hiển thị khi nhập (vd: Đường kính dây, Công suất) */
  label: string;
  type: "numeric" | "qualitative" | "text";
  target?: number;
  min?: number;
  max?: number;
  unit?: string;
  /** Số thứ tự trên bản vẽ / checklist, vd (1), (2), (3) */
  pointNo?: number;
  /** Mô tả ngắn giúp công nhân đối chiếu bản vẽ */
  hint?: string;
}

/**
 * Mục checklist khi thiết kế linh kiện:
 * Sản phẩm → Linh kiện → danh sách thông số này.
 */
export interface PartChecklistItem {
  name: string;
  type?: MaterialSpec["type"];
  target?: number;
  min?: number;
  max?: number;
  unit?: string;
  hint?: string;
}

export type SpecSeverity = "ok" | "warning" | "error";

export interface SpecValidationResult {
  index: number;
  label: string;
  value: string;
  valid: boolean;
  warning?: string;
  severity: SpecSeverity;
}

export interface ValidateEntryPayload {
  specCols: string[];
  materialSpecs?: MaterialSpec[];
  rows: { tt: number; dims: string[]; ngoaiQuan: string }[];
}

export interface ValidateEntryResponse {
  results: SpecValidationResult[][];
  hasErrors: boolean;
  errorCount: number;
}
