import type { MaterialSpec, PartChecklistItem, SpecValidationResult } from "../types/spec.js";

/** Parse nhãn cột kích thước → thông số có min/max */
export function parseSpecLabel(label: string, index: number): MaterialSpec {
  const trimmed = label.trim();
  if (!trimmed || trimmed.toUpperCase() === "NQ") {
    return { index, label: trimmed, type: "qualitative" };
  }

  // Ø9.5+0.2 — dung sai cộng
  const plusTol = trimmed.match(/^[Øφ]?\s*([\d.]+)\s*\+\s*([\d.]+)$/i);
  if (plusTol) {
    const target = parseFloat(plusTol[1]);
    const tol = parseFloat(plusTol[2]);
    return {
      index,
      label: trimmed,
      type: "numeric",
      target,
      min: target,
      max: target + tol,
      unit: "mm",
    };
  }

  // Ø9.5-0.1 / Ø9.5±0.1
  const pmTol = trimmed.match(/^[Øφ]?\s*([\d.]+)\s*[±]\s*([\d.]+)$/i);
  if (pmTol) {
    const target = parseFloat(pmTol[1]);
    const tol = parseFloat(pmTol[2]);
    return {
      index,
      label: trimmed,
      type: "numeric",
      target,
      min: target - tol,
      max: target + tol,
      unit: "mm",
    };
  }

  const minusTol = trimmed.match(/^[Øφ]?\s*([\d.]+)\s*-\s*([\d.]+)$/i);
  if (minusTol) {
    const target = parseFloat(minusTol[1]);
    const tol = parseFloat(minusTol[2]);
    return {
      index,
      label: trimmed,
      type: "numeric",
      target,
      min: target - tol,
      max: target,
      unit: "mm",
    };
  }

  // Ø20 hoặc số thuần — yêu cầu đúng giá trị (vd: ống Ø20mm)
  const numMatch = trimmed.match(/^[Øφ]?\s*([\d.]+)$/i) ?? trimmed.match(/^([\d.]+)$/);
  if (numMatch) {
    const target = parseFloat(numMatch[1]);
    const isDiameter = /^[Øφ]/i.test(trimmed);
    return {
      index,
      label: trimmed,
      type: "numeric",
      target,
      min: target,
      max: target,
      unit: isDiameter ? "mm" : undefined,
    };
  }

  return { index, label: trimmed, type: "text" };
}

export function buildMaterialSpecs(specCols: string[]): MaterialSpec[] {
  return specCols
    .map((label, index) => parseSpecLabel(label, index))
    .filter((s) => s.label);
}

/**
 * Xây materialSpecs từ checklist thiết kế linh kiện.
 * VD: [{ name: "Đường kính dây", target: 2.5, unit: "mm" }, ...]
 */
export function buildMaterialSpecsFromChecklist(
  items: PartChecklistItem[],
): MaterialSpec[] {
  return items.map((item, i) => {
    const type =
      item.type ??
      (item.target !== undefined ? "numeric" : "text");
    const target = item.target;
    const min = item.min ?? target;
    const max = item.max ?? target;
    return {
      index: i,
      pointNo: i + 1,
      label: item.name,
      type,
      target,
      min,
      max,
      unit: item.unit,
      hint: item.hint,
    } satisfies MaterialSpec;
  });
}

/** Sinh specCols legacy từ checklist (để tương thích lưu DB cũ) */
export function checklistToSpecCols(items: PartChecklistItem[], padTo = 11): string[] {
  const cols = items.map((item) => {
    if (item.target === undefined) return item.name;
    const u = item.unit ? ` ${item.unit}` : "";
    return `${item.name}: ${item.target}${u}`.trim();
  });
  while (cols.length < padTo) cols.push("");
  return cols;
}

/** Checklist ưu tiên theo nguyên công, fallback linh kiện */
export function resolvePartChecklist(
  part: { checklist?: PartChecklistItem[] },
  step?: { checklist?: PartChecklistItem[] } | null,
): PartChecklistItem[] {
  const fromStep = step?.checklist?.filter((i) => i.name?.trim()) ?? [];
  if (fromStep.length) return fromStep;
  return part.checklist?.filter((i) => i.name?.trim()) ?? [];
}

/** Full specs để gắn vào BOM khi tạo lệnh — không chọn lẻ */
export function bomSpecsFromChecklist(items: PartChecklistItem[]): {
  materialSpecs: MaterialSpec[];
  specCols: string[];
} {
  const list = items.filter((i) => i.name?.trim());
  if (!list.length) {
    return { materialSpecs: [], specCols: Array.from({ length: 11 }, () => "") };
  }
  return {
    materialSpecs: buildMaterialSpecsFromChecklist(list),
    specCols: checklistToSpecCols(list),
  };
}

export function resolveMaterialSpecs(
  specCols: string[],
  materialSpecs?: MaterialSpec[],
): MaterialSpec[] {
  if (materialSpecs?.length) return materialSpecs;
  return buildMaterialSpecs(specCols);
}

/** Các điểm đo hiển thị khi nhập — ưu tiên spec có pointNo (theo bản vẽ / checklist) */
export function getActiveInspectionSpecs(specs: MaterialSpec[]): MaterialSpec[] {
  const numbered = specs.filter((s) => s.pointNo != null && s.label);
  if (numbered.length) {
    return [...numbered].sort((a, b) => (a.pointNo ?? 0) - (b.pointNo ?? 0));
  }
  return specs.filter((s) => s.label);
}

/** Số slot dims cần cấp phát (tương thích mảng cũ tối thiểu 11) */
export function dimSlotCount(specs: MaterialSpec[], minSlots = 11): number {
  if (!specs.length) return minSlots;
  const maxIndex = Math.max(...specs.map((s) => s.index));
  return Math.max(minSlots, maxIndex + 1);
}

export function emptyDims(specs: MaterialSpec[], minSlots = 11): string[] {
  return Array(dimSlotCount(specs, minSlots)).fill("");
}

export function formatSpecRange(spec: MaterialSpec): string {
  if (spec.type === "text" || spec.type === "qualitative") {
    return spec.target !== undefined
      ? `${spec.label} = ${spec.target}${spec.unit ?? ""}`
      : spec.label;
  }
  if (spec.target === undefined) return spec.label;
  const u = spec.unit ?? "";
  const min = spec.min ?? spec.target;
  const max = spec.max ?? spec.target;
  if (min === max) return `${spec.label} = ${min}${u ? ` ${u}` : ""}`;
  return `${spec.label}: ${min}${u ? ` ${u}` : ""} – ${max}${u ? ` ${u}` : ""}`;
}

/** Nhãn field trên form nhập: "Đường kính dây · 2.5 mm" */
export function formatSpecFieldTitle(spec: MaterialSpec): string {
  if (spec.target === undefined) return spec.label;
  const u = spec.unit ? ` ${spec.unit}` : "";
  return `${spec.label} · ${spec.target}${u}`;
}

export function validateDimensionValue(
  spec: MaterialSpec,
  value: string,
): SpecValidationResult {
  const base: SpecValidationResult = {
    index: spec.index,
    label: spec.label,
    value,
    valid: true,
    severity: "ok",
  };

  if (!value || value === "v" || value === "✓") return base;

  if (spec.type !== "numeric") return base;

  const num = parseFloat(value.replace(",", "."));
  if (Number.isNaN(num)) {
    return {
      ...base,
      valid: false,
      severity: "error",
      warning: `"${value}" không phải số hợp lệ`,
    };
  }

  const min = spec.min ?? spec.target ?? num;
  const max = spec.max ?? spec.target ?? num;

  if (num < min || num > max) {
    const unit = spec.unit ?? "";
    const rangeText =
      min === max
        ? `đúng ${min}${unit}`
        : `từ ${min}${unit} đến ${max}${unit}`;
    return {
      ...base,
      valid: false,
      severity: "error",
      warning: `Vượt ngưỡng! Yêu cầu ${rangeText}, đo được ${num}${unit}`,
    };
  }

  return base;
}

export function validateEntryRows(
  specCols: string[],
  rows: { dims: string[] }[],
  materialSpecs?: MaterialSpec[],
): { results: SpecValidationResult[][]; hasErrors: boolean; errorCount: number } {
  const specs = resolveMaterialSpecs(specCols, materialSpecs);
  const results: SpecValidationResult[][] = rows.map((row) =>
    specs.map((spec) => validateDimensionValue(spec, row.dims[spec.index] ?? "")),
  );
  const errorCount = results.flat().filter((r) => !r.valid).length;
  return { results, hasErrors: errorCount > 0, errorCount };
}
