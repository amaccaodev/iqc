import type { ProcessStage, SemiProcessStep } from "@shared/types";

/** Một dòng CSV import BOM: SP → linh kiện → quy trình */
export interface ProductBomImportRow {
  productCode: string;
  productName?: string;
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

const HEADER_MAP: Record<string, keyof ProductBomImportRow> = {
  ma_sp: "productCode",
  "mã sp": "productCode",
  masp: "productCode",
  productcode: "productCode",
  ten_sp: "productName",
  "tên sp": "productName",
  tensp: "productName",
  productname: "productName",
  ma_lk: "partCode",
  "mã lk": "partCode",
  ma_btp: "partCode",
  "mã btp": "partCode",
  malk: "partCode",
  partcode: "partCode",
  ten_lk: "partName",
  "tên lk": "partName",
  ten_btp: "partName",
  "tên btp": "partName",
  tenlk: "partName",
  partname: "partName",
  "ten sp/ chi tiet": "partName",
  "tên sp/ chi tiết": "partName",
  stt_qt: "processSeq",
  "stt qt": "processSeq",
  stt: "processSeq",
  processseq: "processSeq",
  seq: "processSeq",
  ten_quy_trinh: "processName",
  "tên quy trình": "processName",
  ten_nguyen_cong: "processName",
  "tên nguyên công": "processName",
  nguyen_cong: "processName",
  "nguyên công": "processName",
  process: "processName",
  processname: "processName",
  cong_doan: "processStage",
  "công đoạn": "processStage",
  processstage: "processStage",
  stage: "processStage",
  to_gia_cong: "teamCode",
  "tổ gia công": "teamCode",
  to: "teamCode",
  "tổ": "teamCode",
  team: "teamCode",
  teamcode: "teamCode",
  may: "machine",
  "máy": "machine",
  machine: "machine",
  sl_tren_sp: "qtyPerUnit",
  "sl/sp": "qtyPerUnit",
  "số lượng/sp": "qtyPerUnit",
  qtyperunit: "qtyPerUnit",
  so_luong: "qtyPerUnit",
  dinh_muc: "quota",
  "định mức": "quota",
  "đmkt/ca": "quota",
  quota: "quota",
  yeu_cau_kt: "techNote",
  "yêu cầu kỹ thuật": "techNote",
  "yeu cau ky thuat": "techNote",
  technote: "techNote",
  note: "techNote",
  so_nguoi: "people",
  "số người": "people",
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

/** Map mã tổ / nhãn ĐMKT → ProcessStage */
export function resolveProcessStageFromImport(
  stageOrTeam?: string,
): ProcessStage | undefined {
  if (!stageOrTeam?.trim()) return undefined;
  const raw = stageOrTeam.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (
    raw === "hot_forge" ||
    raw.includes("dap nong") ||
    raw.includes("dap") ||
    raw === "cp" ||
    raw.includes("cat phoi")
  ) {
    return "hot_forge";
  }
  if (
    raw === "auto" ||
    raw.includes("tu dong") ||
    raw === "td" ||
    raw.includes("cnc") ||
    raw.includes("danh bong")
  ) {
    return "auto";
  }
  if (
    raw === "assembly" ||
    raw.includes("lap rap") ||
    raw === "pk" ||
    raw.includes("hoan thien")
  ) {
    return "assembly";
  }
  return undefined;
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

    if (!row.productCode || !row.partCode || !row.processName) continue;
    rows.push({
      productCode: String(row.productCode),
      productName: row.productName,
      partCode: String(row.partCode),
      partName: row.partName,
      processSeq: Number(row.processSeq) || rows.filter((r) => r.partCode === row.partCode).length + 1,
      processName: String(row.processName),
      processStage: row.processStage ?? resolveProcessStageFromImport(row.teamCode),
      teamCode: row.teamCode,
      machine: row.machine,
      qtyPerUnit: row.qtyPerUnit,
      quota: row.quota,
      techNote: row.techNote,
      people: row.people,
    });
  }
  return rows;
}

/** Gom các dòng import thành processSteps theo mã LK */
export function groupImportRowsToProcessSteps(
  rows: ProductBomImportRow[],
  partCode: string,
): SemiProcessStep[] {
  return rows
    .filter((r) => r.partCode === partCode)
    .sort((a, b) => a.processSeq - b.processSeq)
    .map((r) => ({
      seq: r.processSeq,
      process: r.processName,
      machine: r.machine,
      processStage: r.processStage,
      teamCode: r.teamCode,
      people: r.people,
      techNote: r.techNote,
      quota: r.quota,
    }));
}

export const PRODUCT_BOM_CSV_TEMPLATE = [
  "Mã SP,Tên SP,Mã LK,Tên LK,STT QT,Tên quy trình,Công đoạn,Máy,SL/SP,Định mức,Yêu cầu KT,Số người",
  'NOVO-VG-15,Van góc 1C sau ĐH NOVO 15 tay ABS,VG15-NAP,Nắp van góc novo 15,1,1: Cắt Phôi,hot_forge,CP,1,,"Phôi dài 30 mm",1',
  "NOVO-VG-15,Van góc 1C sau ĐH NOVO 15 tay ABS,VG15-NAP,Nắp van góc novo 15,2,2: Dập nóng,hot_forge,D80T-01,1,4000,Theo bản vẽ,2",
  "NOVO-VG-15,Van góc 1C sau ĐH NOVO 15 tay ABS,VG15-NAP,Nắp van góc novo 15,3,3: Đánh bóng,auto,ĐB,1,,,1",
  'NOVO-VG-15,Van góc 1C sau ĐH NOVO 15 tay ABS,VG15-THAN,Thân van góc 1C sau ĐH novo 15,1,1: Cắt Phôi,hot_forge,CP,1,,"Phôi dài 40 mm",1',
  "NOVO-VG-15,Van góc 1C sau ĐH NOVO 15 tay ABS,VG15-THAN,Thân van góc 1C sau ĐH novo 15,2,2: Dập nóng,hot_forge,D80T-02,1,4000,Theo bản vẽ,1",
].join("\n");

export function downloadProductBomTemplate() {
  const blob = new Blob(["\uFEFF" + PRODUCT_BOM_CSV_TEMPLATE], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mau-import-bom-linh-kien.csv";
  a.click();
  URL.revokeObjectURL(url);
}
