/** Đánh giá mức độ sẵn sàng BOM khi tạo lệnh từ danh mục SP */

export interface BomLineReadinessInput {
  name: string;
  code?: string;
  hasAttachments: boolean;
  /** Có checklist đo kiểm đầy đủ trên BTP */
  hasChecklist?: boolean;
}

export interface BomReadinessResult {
  /** Đủ để tạo lệnh (có ≥1 BTP) */
  canCreate: boolean;
  /** Đầy đủ bản vẽ/file theo BOM */
  complete: boolean;
  hasBomLines: boolean;
  productHasAttachments: boolean;
  missingSemiAttachments: string[];
  missingChecklists: string[];
  warnings: string[];
  summary: string;
}

export function assessBomReadiness(input: {
  productName: string;
  productHasAttachments: boolean;
  lines: BomLineReadinessInput[];
}): BomReadinessResult {
  const hasBomLines = input.lines.length > 0;
  const missingSemiAttachments = input.lines
    .filter((l) => !l.hasAttachments)
    .map((l) => l.name || l.code || "BTP");
  const missingChecklists = input.lines
    .filter((l) => l.hasChecklist === false)
    .map((l) => l.name || l.code || "BTP");
  const warnings: string[] = [];
  if (!hasBomLines) warnings.push("Chưa có định mức BTP / BOM");
  if (!input.productHasAttachments) warnings.push("Thành phẩm chưa có bản vẽ / file thông số");
  if (missingSemiAttachments.length) {
    warnings.push(
      `Linh kiện chưa có file bản vẽ: ${missingSemiAttachments.slice(0, 4).join(", ")}${
        missingSemiAttachments.length > 4 ? "…" : ""
      }`,
    );
  }
  if (missingChecklists.length) {
    warnings.push(
      `Linh kiện chưa nhập full checklist đo: ${missingChecklists.slice(0, 4).join(", ")}${
        missingChecklists.length > 4 ? "…" : ""
      }`,
    );
  }
  const complete =
    hasBomLines &&
    input.productHasAttachments &&
    missingSemiAttachments.length === 0 &&
    missingChecklists.length === 0;
  const summary = !hasBomLines
    ? "BOM chưa sẵn sàng"
    : complete
      ? "BOM đủ (BTP + bản vẽ + checklist)"
      : `BOM thiếu dữ liệu (${warnings.length} cảnh báo)`;

  return {
    canCreate: hasBomLines,
    complete,
    hasBomLines,
    productHasAttachments: input.productHasAttachments,
    missingSemiAttachments,
    missingChecklists,
    warnings,
    summary,
  };
}
