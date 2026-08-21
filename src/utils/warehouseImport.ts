/** Parse CSV for warehouse stock import */

export interface WarehouseImportRow {
  code: string;
  qty: number;
}

const HEADER_MAP: Record<string, "code" | "qty"> = {
  ma_btp: "code",
  "mã btp": "code",
  mabtp: "code",
  code: "code",
  so_luong: "qty",
  "số lượng": "qty",
  soluong: "qty",
  qty: "qty",
  ton: "qty",
  "tồn kho": "qty",
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

export function parseWarehouseCsv(text: string): WarehouseImportRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const semi = (lines[0].match(/;/g) ?? []).length > (lines[0].match(/,/g) ?? []).length ? ";" : ",";
  const headers = parseLine(lines[0], semi).map(normHeader);
  const keys = headers.map((h) => HEADER_MAP[h] ?? null);

  const rows: WarehouseImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i], semi);
    const row: Partial<WarehouseImportRow> = {};
    keys.forEach((key, idx) => {
      if (!key) return;
      const raw = cells[idx]?.trim() ?? "";
      if (!raw) return;
      if (key === "qty") {
        const n = Number(raw.replace(/[^\d.-]/g, ""));
        if (!Number.isNaN(n)) row.qty = n;
      } else {
        row.code = raw;
      }
    });
    if (row.code != null && row.qty != null) rows.push(row as WarehouseImportRow);
  }
  return rows;
}

export const WAREHOUSE_CSV_TEMPLATE = [
  "Mã BTP,Số lượng",
  "BTP-BODY-20,120",
  "BTP-SPRING-20,80",
  "BTP-ASM-20,50",
].join("\n");

export function downloadWarehouseTemplate() {
  const blob = new Blob(["\uFEFF" + WAREHOUSE_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mau-ton-kho-btp.csv";
  a.click();
  URL.revokeObjectURL(url);
}
