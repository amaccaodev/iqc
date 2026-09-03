import type { ProcessStage } from "@shared/types";
import { PROCESS_STAGE_LABEL, PROCESS_STAGE_TEAM } from "@shared/constants/teams";

/** Một dòng nhập danh mục: thành phẩm → linh kiện → quy trình (các cột sau có thể trống). */
export interface ProductBomImportRow {
  productCode: string;
  productName?: string;
  productDescription?: string;
  partCode: string;
  partName?: string;
  processSeq: number;
  processName: string;
  processStage?: ProcessStage;
  teamCode?: string;
  machine?: string;
  qtyPerUnit?: number;
  quota?: string;
  techNote?: string;
  people?: number;
}

export const CATALOG_IMPORT_CSV_HEADERS = [
  "Mã thành phẩm",
  "Tên thành phẩm",
  "Mô tả thành phẩm",
  "Mã linh kiện",
  "Tên linh kiện",
  "SL trên SP",
  "STT quy trình",
  "Tên quy trình",
  "Công đoạn",
  "Máy",
  "Định mức/ca",
  "Yêu cầu kỹ thuật",
  "Số người",
] as const;

const HEADER_MAP: Record<string, keyof ProductBomImportRow> = {
  "ma thanh pham": "productCode",
  ma_thanh_pham: "productCode",
  ma_sp: "productCode",
  "ma sp": "productCode",
  masp: "productCode",
  productcode: "productCode",
  "ten thanh pham": "productName",
  ten_thanh_pham: "productName",
  ten_sp: "productName",
  "ten sp": "productName",
  tensp: "productName",
  productname: "productName",
  "mo ta thanh pham": "productDescription",
  mo_ta_thanh_pham: "productDescription",
  "mo ta": "productDescription",
  mota: "productDescription",
  description: "productDescription",
  productdescription: "productDescription",
  "ma linh kien": "partCode",
  ma_linh_kien: "partCode",
  ma_lk: "partCode",
  "ma lk": "partCode",
  ma_btp: "partCode",
  "ma btp": "partCode",
  malk: "partCode",
  partcode: "partCode",
  "ten linh kien": "partName",
  ten_linh_kien: "partName",
  ten_lk: "partName",
  "ten lk": "partName",
  ten_btp: "partName",
  "ten btp": "partName",
  tenlk: "partName",
  partname: "partName",
  "ten sp/ chi tiet": "partName",
  stt_qt: "processSeq",
  "stt quy trinh": "processSeq",
  "stt qt": "processSeq",
  stt: "processSeq",
  processseq: "processSeq",
  seq: "processSeq",
  "ten quy trinh": "processName",
  ten_quy_trinh: "processName",
  ten_nguyen_cong: "processName",
  "ten nguyen cong": "processName",
  nguyen_cong: "processName",
  process: "processName",
  processname: "processName",
  cong_doan: "processStage",
  "cong doan": "processStage",
  processstage: "processStage",
  stage: "processStage",
  to_gia_cong: "teamCode",
  "to gia cong": "teamCode",
  to: "teamCode",
  team: "teamCode",
  teamcode: "teamCode",
  may: "machine",
  machine: "machine",
  "sl tren sp": "qtyPerUnit",
  sl_tren_sp: "qtyPerUnit",
  "sl/sp": "qtyPerUnit",
  "so luong/sp": "qtyPerUnit",
  qtyperunit: "qtyPerUnit",
  so_luong: "qtyPerUnit",
  "dinh muc/ca": "quota",
  dinh_muc: "quota",
  "dinh muc": "quota",
  "dmkt/ca": "quota",
  quota: "quota",
  "yeu cau ky thuat": "techNote",
  yeu_cau_kt: "techNote",
  technote: "techNote",
  note: "techNote",
  "so nguoi": "people",
  so_nguoi: "people",
  people: "people",
};

function normHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function parseLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (const c of line) {
    if (c === '"') {
      q = !q;
      continue;
    }
    if (!q && c === sep) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

function csvCell(value: string | number | undefined): string {
  const s = String(value ?? "");
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function emptyCatalogImportRow(): ProductBomImportRow {
  return {
    productCode: "",
    productName: "",
    productDescription: "",
    partCode: "",
    partName: "",
    processSeq: 1,
    processName: "",
    teamCode: "Dập nóng",
    machine: "",
    qtyPerUnit: 1,
    quota: "",
    techNote: "",
    people: 1,
  };
}

/** Dòng mẫu hiển thị trên giao diện / file CSV. */
export const CATALOG_IMPORT_SAMPLE_ROWS: ProductBomImportRow[] = [
  {
    productCode: "NOVO-20-001",
    productName: "Van 1 chiều lò xo NOVO 20",
    productDescription: "Theo phiếu kiểm tra chi tiết",
    partCode: "NOVO20-LONGDEN",
    partName: "Long đen hãm gioăng",
    processSeq: 1,
    processName: "Hoàn thiện",
    processStage: "assembly",
    teamCode: "Lắp ráp",
    machine: "CAM-01",
    qtyPerUnit: 1,
    quota: "2000",
    techNote: "Theo phiếu kiểm tra",
    people: 1,
  },
  {
    productCode: "NOVO-VG-15",
    productName: "Van góc 1C sau ĐH NOVO 15 tay ABS",
    productDescription: "",
    partCode: "VG15-NAP",
    partName: "Nắp van góc novo 15",
    processSeq: 1,
    processName: "Cắt phôi",
    processStage: "hot_forge",
    teamCode: "Dập nóng",
    machine: "CP",
    qtyPerUnit: 1,
    quota: "",
    techNote: "Phôi dài 30 mm",
    people: 1,
  },
  {
    productCode: "NOVO-VG-15",
    productName: "Van góc 1C sau ĐH NOVO 15 tay ABS",
    productDescription: "",
    partCode: "VG15-NAP",
    partName: "Nắp van góc novo 15",
    processSeq: 2,
    processName: "Dập nóng",
    processStage: "hot_forge",
    teamCode: "Dập nóng",
    machine: "D80T-01",
    qtyPerUnit: 1,
    quota: "4000",
    techNote: "Theo bản vẽ",
    people: 2,
  },
  {
    productCode: "NOVO-VG-15",
    productName: "Van góc 1C sau ĐH NOVO 15 tay ABS",
    productDescription: "",
    partCode: "VG15-THAN",
    partName: "Thân van góc 1C sau ĐH novo 15",
    processSeq: 1,
    processName: "Cắt phôi",
    processStage: "hot_forge",
    teamCode: "Dập nóng",
    machine: "CP",
    qtyPerUnit: 1,
    quota: "",
    techNote: "Phôi dài 40 mm",
    people: 1,
  },
];

export function resolveProcessStageFromImport(stageOrTeam?: string): ProcessStage | undefined {
  if (!stageOrTeam?.trim()) return undefined;
  const raw = stageOrTeam.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (
    raw === "hot_forge" ||
    raw.includes("dap nong") ||
    raw.includes("dap") ||
    raw === "cp" ||
    raw.includes("cat phoi") ||
    raw === "t_hot" ||
    raw === "t1"
  ) {
    return "hot_forge";
  }
  if (
    raw === "auto" ||
    raw.includes("tu dong") ||
    raw === "td" ||
    raw.includes("cnc") ||
    raw.includes("danh bong") ||
    raw === "t_auto" ||
    raw === "t2"
  ) {
    return "auto";
  }
  if (
    raw === "assembly" ||
    raw.includes("lap rap") ||
    raw === "pk" ||
    raw.includes("hoan thien") ||
    raw === "t_asm" ||
    raw === "t3"
  ) {
    return "assembly";
  }
  return undefined;
}

export function resolveTeamIdFromImport(stageOrTeam?: string): string {
  const stage = resolveProcessStageFromImport(stageOrTeam);
  if (stage) return PROCESS_STAGE_TEAM[stage];
  return PROCESS_STAGE_TEAM.hot_forge;
}

export function stageLabelVi(stage?: ProcessStage, teamCode?: string): string {
  if (stage) return PROCESS_STAGE_LABEL[stage];
  const resolved = resolveProcessStageFromImport(teamCode);
  return resolved ? PROCESS_STAGE_LABEL[resolved] : teamCode || "—";
}

export function parseProductBomCsv(text: string): ProductBomImportRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const sep =
    (lines[0].match(/;/g) ?? []).length > (lines[0].match(/,/g) ?? []).length ? ";" : ",";
  const headers = parseLine(lines[0], sep).map(normHeader);
  const keys = headers.map((h) => HEADER_MAP[h] ?? null);

  const rows: ProductBomImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i], sep);
    const row: Partial<ProductBomImportRow> = {};
    keys.forEach((key, idx) => {
      if (!key) return;
      const raw = cells[idx]?.trim() ?? "";
      if (!raw) return;
      if (key === "processSeq" || key === "qtyPerUnit" || key === "people") {
        const n = Number(String(raw).replace(/[^\d.-]/g, ""));
        if (!Number.isNaN(n)) (row as Record<string, number>)[key] = n;
      } else if (key === "processStage") {
        row.processStage = resolveProcessStageFromImport(raw);
        row.teamCode = row.teamCode || raw;
      } else if (key === "teamCode") {
        row.teamCode = raw;
        if (!row.processStage) row.processStage = resolveProcessStageFromImport(raw);
      } else {
        (row as Record<string, string>)[key] = raw;
      }
    });

    if (!row.productCode) continue;
    rows.push({
      productCode: String(row.productCode),
      productName: row.productName,
      productDescription: row.productDescription,
      partCode: String(row.partCode ?? ""),
      partName: row.partName,
      processSeq: Number(row.processSeq) || 1,
      processName: String(row.processName ?? ""),
      processStage: row.processStage ?? resolveProcessStageFromImport(row.teamCode),
      teamCode: stageLabelVi(
        row.processStage ?? resolveProcessStageFromImport(row.teamCode),
        row.teamCode,
      ),
      machine: row.machine,
      qtyPerUnit: row.qtyPerUnit,
      quota: row.quota,
      techNote: row.techNote,
      people: row.people,
    });
  }
  return rows;
}

export function catalogImportRowsToCsv(rows: ProductBomImportRow[]): string {
  const body = rows.map((r) =>
    [
      r.productCode,
      r.productName,
      r.productDescription,
      r.partCode,
      r.partName,
      r.qtyPerUnit ?? 1,
      r.processSeq || "",
      r.processName,
      stageLabelVi(r.processStage, r.teamCode),
      r.machine,
      r.quota,
      r.techNote,
      r.people ?? "",
    ]
      .map(csvCell)
      .join(","),
  );
  return [CATALOG_IMPORT_CSV_HEADERS.join(","), ...body].join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const PRODUCT_BOM_CSV_TEMPLATE = catalogImportRowsToCsv(CATALOG_IMPORT_SAMPLE_ROWS);

export function downloadProductBomTemplate() {
  downloadCsv("mau-nhap-danh-muc.csv", PRODUCT_BOM_CSV_TEMPLATE);
}

export function downloadCatalogImportRows(rows: ProductBomImportRow[], filename = "danh-muc-xuat.csv") {
  downloadCsv(filename, catalogImportRowsToCsv(rows.length ? rows : CATALOG_IMPORT_SAMPLE_ROWS));
}

export function summarizeCatalogImport(rows: ProductBomImportRow[]) {
  const products = new Set(rows.map((r) => r.productCode).filter(Boolean));
  const parts = new Set(rows.filter((r) => r.partCode).map((r) => r.partCode));
  const steps = rows.filter((r) => r.partCode && r.processName.trim()).length;
  return { products: products.size, parts: parts.size, steps };
}

export function groupImportRowsToBomProcesses(
  rows: ProductBomImportRow[],
  partCode: string,
): Array<{ sortOrder: number; name: string; quotaPerShift: number; teamCode?: string }> {
  return rows
    .filter((r) => r.partCode === partCode && r.processName.trim())
    .sort((a, b) => a.processSeq - b.processSeq)
    .map((r) => ({
      sortOrder: r.processSeq,
      name: r.processName,
      quotaPerShift: Number.parseFloat(String(r.quota ?? "0")) || 0,
      teamCode: r.teamCode,
    }));
}
