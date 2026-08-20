import type { MaterialSpec, SpecValidationResult } from "../types/spec.js";

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

export function resolveMaterialSpecs(
  specCols: string[],
  materialSpecs?: MaterialSpec[],
): MaterialSpec[] {
  if (materialSpecs?.length) return materialSpecs;
  return buildMaterialSpecs(specCols);
}

export function formatSpecRange(spec: MaterialSpec): string {
  if (spec.type !== "numeric" || spec.target === undefined) return spec.label;
  const u = spec.unit ?? "";
  const min = spec.min ?? spec.target;
  const max = spec.max ?? spec.target;
  if (min === max) return `${spec.label} = ${min}${u}`;
  return `${spec.label}: ${min}${u} – ${max}${u}`;
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
