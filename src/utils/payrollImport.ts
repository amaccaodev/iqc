/** Parse CSV/Excel-exported payroll rows (UTF-8, comma or semicolon). */

export interface PayrollImportRow {
  employeeId: string;
  name?: string;
  roleLabel?: string;
  department?: string;
  phone?: string;
  productCode?: string;
  rateVnd?: number;
}

const HEADER_MAP: Record<string, keyof PayrollImportRow> = {
  ma_nv: "employeeId",
  "mã nv": "employeeId",
  "ma nhan vien": "employeeId",
  "mã nhân viên": "employeeId",
  employeeid: "employeeId",
  ho_ten: "name",
  "họ tên": "name",
  hoten: "name",
  name: "name",
  chuc_vu: "roleLabel",
  "chức vụ": "roleLabel",
  role: "roleLabel",
  phong_ban: "department",
  "phòng ban": "department",
  to: "department",
  "tổ": "department",
  department: "department",
  sdt: "phone",
  "sđt": "phone",
  phone: "phone",
  ma_sp: "productCode",
  "mã sp": "productCode",
  masanpham: "productCode",
  productcode: "productCode",
  don_gia: "rateVnd",
  "đơn giá": "rateVnd",
  ratevnd: "rateVnd",
  luong_sp: "rateVnd",
  "lương/sp": "rateVnd",
};

function normHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function parseDelimitedLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
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

function detectSep(headerLine: string): string {
  const semi = (headerLine.match(/;/g) ?? []).length;
  const comma = (headerLine.match(/,/g) ?? []).length;
  return semi > comma ? ";" : ",";
}

export function parsePayrollCsv(text: string): PayrollImportRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const sep = detectSep(lines[0]);
  const headers = parseDelimitedLine(lines[0], sep).map(normHeader);
  const colKeys = headers.map((h) => HEADER_MAP[h] ?? null);

  const rows: PayrollImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseDelimitedLine(lines[i], sep);
    const row: Partial<PayrollImportRow> = {};
    colKeys.forEach((key, idx) => {
      if (!key) return;
      const raw = cells[idx]?.trim() ?? "";
      if (!raw) return;
      if (key === "rateVnd") {
        const n = Number(raw.replace(/[^\d.-]/g, ""));
        if (!Number.isNaN(n)) row.rateVnd = n;
      } else {
        row[key] = raw as never;
      }
    });
    if (row.employeeId) rows.push(row as PayrollImportRow);
  }
  return rows;
}

export const PAYROLL_CSV_TEMPLATE = [
  "Mã NV,Họ tên,Chức vụ,Phòng ban/Tổ,SĐT,Mã SP,Đơn giá (VND/SP)",
  "NV001,Nguyễn Văn A,Công nhân,Tổ 2,0901234567,NOVO-20,2500",
  "NV002,Trần Thị B,Tổ trưởng,Tổ 3,0907654321,NOVO-20,2800",
].join("\n");

export function downloadPayrollTemplate() {
  const blob = new Blob(["\uFEFF" + PAYROLL_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mau-luong-nhan-vien.csv";
  a.click();
  URL.revokeObjectURL(url);
}
