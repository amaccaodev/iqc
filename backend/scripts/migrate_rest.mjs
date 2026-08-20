/**
 * migrate_rest.mjs — Chạy migration qua Supabase REST + rpc
 * Không cần kết nối trực tiếp tới Postgres.
 *
 * Flow:
 *  1. Tạo stored function exec_sql() qua Management API (nếu có PAT)
 *  2. Nếu không có PAT → chạy từng DDL qua supabase-js raw queries
 *  3. Seed data qua supabase-js insert/upsert
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL || "https://mobroigpqtsfbfbvmvwa.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error("Thiếu SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Bước 1: Tạo exec_sql function qua REST API endpoint ──────────────────────
// Supabase expose SQL execution qua /pg endpoint (nội bộ, cần service key)
async function execSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json().catch(() => null);
}

// ── Bootstrap: tạo exec_sql stored proc nếu chưa có ─────────────────────────
async function bootstrap() {
  // Thử gọi rpc exec_sql với câu SQL test
  const testRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: "select 1" }),
  });

  if (testRes.status === 404) {
    // Function chưa tồn tại — cần tạo thủ công
    // Supabase không cho tạo function qua REST nếu không có exec_sql
    // → Dùng cách khác: pg_net hoặc tạo trực tiếp
    return false;
  }
  if (testRes.ok) return true;
  return false;
}

// ── Split SQL thành các statement riêng ──────────────────────────────────────
function splitSQL(sql) {
  // Loại comment, split theo ;
  const noComments = sql
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n");

  const statements = [];
  let cur = "";
  let inDollar = false;
  let dollarTag = "";

  for (let i = 0; i < noComments.length; i++) {
    const ch = noComments[i];
    cur += ch;

    // Detect $$ dollar quoting
    if (ch === "$") {
      let tag = "$";
      let j = i + 1;
      while (j < noComments.length && noComments[j] !== "$") tag += noComments[j++];
      tag += "$";
      if (j < noComments.length) {
        if (!inDollar) { inDollar = true; dollarTag = tag; i = j; cur += tag.slice(1); }
        else if (tag === dollarTag) { inDollar = false; dollarTag = ""; i = j; cur += tag.slice(1); }
      }
    }

    if (!inDollar && ch === ";") {
      const stmt = cur.trim();
      if (stmt.length > 1) statements.push(stmt);
      cur = "";
    }
  }
  if (cur.trim().length > 1) statements.push(cur.trim());
  return statements;
}

// ── Chạy từng DDL statement ───────────────────────────────────────────────────
async function runStatements(filePath) {
  const name = filePath.split(/[\\/]/).pop();
  const sql = readFileSync(filePath, "utf-8");
  const stmts = splitSQL(sql);

  console.log(`\n  Chạy ${name} (${stmts.length} statements)...`);
  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const stmt of stmts) {
    try {
      const res = await execSQL(stmt);
      ok++;
    } catch (e) {
      const msg = e.message || "";
      if (
        msg.includes("already exists") ||
        msg.includes("42710") || // duplicate_object
        msg.includes("42P07") || // duplicate_table
        msg.includes("42723")    // duplicate_function
      ) {
        skip++;
      } else {
        console.log(`    ✗ ${stmt.slice(0, 60).replace(/\n/g, " ")} → ${msg.slice(0, 80)}`);
        fail++;
      }
    }
  }
  console.log(`    ✓ ${ok} OK · ${skip} skipped · ${fail} failed`);
  return fail === 0;
}

// ── Seed data ─────────────────────────────────────────────────────────────────
async function seedData() {
  console.log("\n=== Seeding dữ liệu mẫu ===\n");

  const steps = [
    {
      name: "groups (tổ)",
      table: "groups",
      data: [
        { id: "t1", name: "Tổ 1", lead: "Phạm Văn Chí",   lead_short: "P.V.Chí"  },
        { id: "t2", name: "Tổ 2", lead: "Phạm Văn Sang",  lead_short: "P.V.Sang" },
        { id: "t3", name: "Tổ 3", lead: "Nguyễn Thị Hoa", lead_short: "N.T.Hoa"  },
        { id: "t4", name: "Tổ 4", lead: "Trần Văn Bình",  lead_short: "T.V.Bình" },
      ],
    },
    {
      name: "roles",
      table: "roles",
      data: [
        { id: "director",   label: "Giám đốc / PGĐ",      description: "Tạo và duyệt lệnh sản xuất" },
        { id: "supervisor", label: "Quản đốc",              description: "Điều phối phân xưởng" },
        { id: "teamlead",   label: "Tổ trưởng",             description: "Phân việc cho công nhân" },
        { id: "worker",     label: "Công nhân",             description: "Nhập thông số đo lường" },
        { id: "qc",         label: "QC",                    description: "Kiểm tra chất lượng" },
        { id: "stats",      label: "Thống kê / KH",         description: "Xem báo cáo, kế hoạch" },
        { id: "admin",      label: "Quản trị hệ thống",     description: "Quản lý user, role, nhóm" },
      ],
    },
    {
      name: "users",
      table: "users",
      data: [
        { id: "u1",  employee_id: "NV001", name: "Nguyễn Văn An",   password: "123456",   department: "Ban Giám Đốc",   phone: "0901234567", active: true },
        { id: "u2",  employee_id: "NV002", name: "Trần Thị Bình",   password: "123456",   department: "Ban Giám Đốc",   phone: "0901234568", active: true },
        { id: "u3",  employee_id: "NV010", name: "Lê Văn Quốc",     password: "123456",   department: "Phân xưởng",     phone: "0902345678", active: true },
        { id: "u4",  employee_id: "NV020", name: "Phạm Văn Chí",    password: "123456",   department: "Tổ 1",           phone: "0903456789", active: true },
        { id: "u5",  employee_id: "NV021", name: "Phạm Văn Sang",   password: "123456",   department: "Tổ 2",           phone: "0903456790", active: true },
        { id: "u6",  employee_id: "NV030", name: "Cường 2T3",       password: "123456",   department: "Tổ 1",           phone: "0904567890", active: true },
        { id: "u7",  employee_id: "NV031", name: "Nga 3/43",        password: "123456",   department: "Tổ 1",           phone: "0904567891", active: true },
        { id: "u8",  employee_id: "NV040", name: "T.V.Huấn",        password: "123456",   department: "Phòng QC",       phone: "0905678901", active: true },
        { id: "u9",  employee_id: "NV050", name: "Nguyễn Thị Lan",  password: "123456",   department: "Phòng Kế hoạch", phone: "0906789012", active: true },
        { id: "u10", employee_id: "NV000", name: "Admin",           password: "admin123", department: "IT",             phone: "0900000000", active: true },
      ],
    },
    {
      name: "user_roles",
      table: "user_roles",
      data: [
        { user_id: "u1",  role_id: "director"   },
        { user_id: "u2",  role_id: "director"   },
        { user_id: "u3",  role_id: "supervisor" },
        { user_id: "u4",  role_id: "teamlead"   },
        { user_id: "u5",  role_id: "teamlead"   },
        { user_id: "u6",  role_id: "worker"     },
        { user_id: "u7",  role_id: "worker"     },
        { user_id: "u8",  role_id: "qc"         },
        { user_id: "u9",  role_id: "stats"      },
        { user_id: "u10", role_id: "admin"      },
      ],
    },
    {
      name: "group_members",
      table: "group_members",
      data: [
        { user_id: "u4", group_id: "t1", is_lead: true  },
        { user_id: "u5", group_id: "t2", is_lead: true  },
        { user_id: "u6", group_id: "t1", is_lead: false },
        { user_id: "u7", group_id: "t1", is_lead: false },
      ],
    },
  ];

  for (const { name, table, data } of steps) {
    const { error } = await db.from(table).upsert(data, { onConflict: "id" }).catch((e) => ({ error: e }));
    if (error) {
      // user_roles / group_members có composite PK
      if (table === "user_roles" || table === "group_members") {
        const { error: e2 } = await db.from(table).insert(data).catch((e) => ({ error: e }));
        console.log(e2 ? `  ✗ ${name}: ${e2.message}` : `  ✓ ${name}`);
      } else {
        console.log(`  ✗ ${name}: ${error.message}`);
      }
    } else {
      console.log(`  ✓ ${name}`);
    }
  }

  console.log("\n✓ Seed hoàn tất!");
  console.log("\nTài khoản đăng nhập:");
  console.log("  NV001 / 123456   → Giám đốc (Nguyễn Văn An)");
  console.log("  NV010 / 123456   → Quản đốc (Lê Văn Quốc)");
  console.log("  NV020 / 123456   → Tổ trưởng Tổ 1 (Phạm Văn Chí)");
  console.log("  NV021 / 123456   → Tổ trưởng Tổ 2 (Phạm Văn Sang)");
  console.log("  NV030 / 123456   → Công nhân (Cường 2T3)");
  console.log("  NV040 / 123456   → QC (T.V.Huấn)");
  console.log("  NV050 / 123456   → Thống kê (Nguyễn Thị Lan)");
  console.log("  NV000 / admin123 → Admin");
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== IQC Migration via REST API ===\n");

  // Kiểm tra exec_sql có sẵn không
  const hasFn = await bootstrap();

  if (!hasFn) {
    console.log("⚠️  Chưa có stored function exec_sql().");
    console.log("   Cần chạy SQL này 1 lần trong Supabase SQL Editor:\n");
    console.log(`   create or replace function public.exec_sql(query text)`);
    console.log(`   returns void language plpgsql security definer as $$`);
    console.log(`   begin execute query; end; $$;`);
    console.log(`   grant execute on function public.exec_sql to service_role;\n`);
    console.log("   URL: https://supabase.com/dashboard/project/mobroigpqtsfbfbvmvwa/sql\n");
    console.log("   Sau đó chạy lại: node scripts/migrate_rest.mjs");
    process.exit(1);
  }

  console.log("✓ exec_sql function sẵn sàng\n");

  const migrations = [
    join(__dir, "../../supabase/migration_001_iqc.sql"),
    join(__dir, "../../supabase/migration_002_workflow.sql"),
  ];

  console.log("=== Chạy migrations ===");
  for (const f of migrations) {
    await runStatements(f);
  }

  await seedData();
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
