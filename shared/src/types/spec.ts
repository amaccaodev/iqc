/** Thông số kỹ thuật do GĐ/quản lý đề ra cho từng cột đo */
export interface MaterialSpec {
  index: number;
  label: string;
  type: "numeric" | "qualitative" | "text";
  target?: number;
  min?: number;
  max?: number;
  unit?: string;
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
