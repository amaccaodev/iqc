/**
 * migrate.mjs — Chạy toàn bộ migration SQL lên Supabase
 * Sử dụng Supabase Management API (không cần dashboard)
 *
 * Cách chạy: node scripts/migrate.mjs
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "mobroigpqtsfbfbvmvwa";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error("Thiếu SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

/**
 * Supabase hỗ trợ execute SQL qua endpoint /rest/v1/rpc hoặc
 * qua pg REST endpoint của project. Ta dùng pg endpoint.
 * URL pattern: https://<ref>.supabase.co/rest/v1/rpc/<function>
 *
 * Cách đơn giản nhất: dùng @supabase/supabase-js với rpc
 * nếu không có stored proc → tạo stored proc trước bằng Management API.
 *
 * Management API v1: https://api.supabase.com/v1/projects/{ref}/database/query
 */
async function runSQL(sql) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const text = await res.text();
    // Management API trả 401 nếu dùng service key thay vì personal access token
    // → fallback sang pg-rest approach
    throw new Error(`Management API error ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * Fallback: execute SQL trực tiếp qua Supabase postgres REST
 * bằng cách tạo anonymous function và gọi qua rpc
 */
async function runSQLViaRPC(sql) {
  // Wrap câu SQL trong một anonymous DO block và gọi qua rpc exec_sql
  // Supabase không có exec_sql mặc định, ta phải tạo nó trước
  const createFn = `
    create or replace function public.exec_sql(query text)
    returns void language plpgsql security definer as $$
    begin execute query; end; $$;
  `;

  // Gọi REST POST để create function
  const baseUrl = `https://${PROJECT_REF}.supabase.co`;

  // Dùng pg endpoint qua supabase-js client
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(baseUrl, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Tạo helper function exec_sql nếu chưa có
  console.log("Tạo helper function exec_sql...");
  // Ta không thể tạo function nếu không có quyền execute arbitrary SQL
  // → dùng cách khác: split SQL thành từng statement và insert/upsert trực tiếp

  return db;
}

/**
 * Split SQL file thành các statement riêng biệt
 * (bỏ comment -- và block /* *\/, xử lý $$ blocks)
 */
function splitStatements(sql) {
  const statements = [];
  let current = "";
  let inDollarQuote = false;
  let dollarTag = "";
  const lines = sql.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Bỏ comment đơn (trừ khi trong dollar quote)
    if (!inDollarQuote && trimmed.startsWith("--")) continue;

    current += line + "\n";

    // Detect dollar quote tags ($$, $body$, etc.)
    const dollarMatches = [...line.matchAll(/\$([^$]*)\$/g)];
    for (const m of dollarMatches) {
      const tag = m[0];
      if (!inDollarQuote) {
        inDollarQuote = true;
        dollarTag = tag;
      } else if (tag === dollarTag) {
        inDollarQuote = false;
        dollarTag = "";
      }
    }

    if (!inDollarQuote && trimmed.endsWith(";")) {
      const stmt = current.trim();
      if (stmt && stmt !== ";") statements.push(stmt);
      current = "";
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements.filter((s) => s.length > 1);
}

async function main() {
  console.log("=== IQC Migration Runner ===\n");

  const migrations = [
    join(__dir, "../../supabase/migration_001_iqc.sql"),
    join(__dir, "../../supabase/migration_002_workflow.sql"),
  ];

  // Thử Management API trước
  const testSql = "select 1";
  let useManagementAPI = false;
  try {
    await runSQL(testSql);
    useManagementAPI = true;
    console.log("✓ Dùng Supabase Management API\n");
  } catch (e) {
    console.log("Management API không khả dụng, dùng supabase-js client...\n");
  }

  if (useManagementAPI) {
    for (const file of migrations) {
      const name = file.split(/[\\/]/).pop();
      console.log(`\nChạy ${name}...`);
      const sql = readFileSync(file, "utf-8");
      try {
        await runSQL(sql);
        console.log(`  ✓ ${name} OK`);
      } catch (e) {
        console.error(`  ✗ ${name} FAILED:`, e.message);
      }
    }
  } else {
    // Fallback: dùng supabase-js + chạy từng statement
    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(`https://${PROJECT_REF}.supabase.co`, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Kiểm tra bảng đã tồn tại chưa
    const { error: checkErr } = await db.from("users").select("id").limit(1);
    if (!checkErr) {
      console.log("Bảng đã tồn tại. Chỉ seed dữ liệu...\n");
      await seedData(db);
      return;
    }

    console.log(
      "\n⚠️  Không thể tự động tạo bảng qua client.\n" +
        "Vui lòng chạy 2 file SQL sau trong Supabase SQL Editor:\n" +
        "  1. d:\\IQC\\supabase\\migration_001_iqc.sql\n" +
        "  2. d:\\IQC\\supabase\\migration_002_workflow.sql\n" +
        "\nURL: https://supabase.com/dashboard/project/mobroigpqtsfbfbvmvwa/sql\n" +
        "\nSau khi chạy SQL xong, chạy lại lệnh này để seed dữ liệu mẫu.",
    );
    process.exit(1);
  }

  // Seed sau khi migration thành công
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(`https://${PROJECT_REF}.supabase.co`, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await seedData(db);
}

async function seedData(db) {
  console.log("\n=== Seeding dữ liệu mẫu ===\n");

  const teams = [
    { id: "t1", name: "Tổ 1", lead: "Phạm Văn Chí", lead_short: "P.V.Chí" },
    { id: "t2", name: "Tổ 2", lead: "Phạm Văn Sang", lead_short: "P.V.Sang" },
    { id: "t3", name: "Tổ 3", lead: "Nguyễn Thị Hoa", lead_short: "N.T.Hoa" },
    { id: "t4", name: "Tổ 4", lead: "Trần Văn Bình", lead_short: "T.V.Bình" },
  ];
  const { error: te } = await db.from("groups").upsert(teams, { onConflict: "id" });
  console.log(te ? `  ✗ groups: ${te.message}` : "  ✓ groups");

  const roles = [
    { id: "director", label: "Giám đốc / PGĐ", description: "Tạo và duyệt lệnh sản xuất" },
    { id: "supervisor", label: "Quản đốc", description: "Điều phối phân xưởng" },
    { id: "teamlead", label: "Tổ trưởng", description: "Phân việc cho công nhân" },
    { id: "worker", label: "Công nhân", description: "Nhập thông số đo lường" },
    { id: "qc", label: "QC", description: "Kiểm tra chất lượng" },
    { id: "stats", label: "Thống kê / KH", description: "Xem báo cáo" },
    { id: "admin", label: "Quản trị hệ thống", description: "Quản lý user, role, nhóm" },
  ];
  const { error: re } = await db.from("roles").upsert(roles, { onConflict: "id" });
  console.log(re ? `  ✗ roles: ${re.message}` : "  ✓ roles");

  const users = [
    { id: "u1",  employee_id: "NV001", name: "Nguyễn Văn An",   password: "123456",   department: "Ban Giám Đốc",    phone: "0901234567", active: true },
    { id: "u2",  employee_id: "NV002", name: "Trần Thị Bình",   password: "123456",   department: "Ban Giám Đốc",    phone: "0901234568", active: true },
    { id: "u3",  employee_id: "NV010", name: "Lê Văn Quốc",     password: "123456",   department: "Phân xưởng",      phone: "0902345678", active: true },
    { id: "u4",  employee_id: "NV020", name: "Phạm Văn Chí",    password: "123456",   department: "Tổ 1",            phone: "0903456789", active: true },
    { id: "u5",  employee_id: "NV021", name: "Phạm Văn Sang",   password: "123456",   department: "Tổ 2",            phone: "0903456790", active: true },
    { id: "u6",  employee_id: "NV030", name: "Cường 2T3",       password: "123456",   department: "Tổ 1",            phone: "0904567890", active: true },
    { id: "u7",  employee_id: "NV031", name: "Nga 3/43",        password: "123456",   department: "Tổ 1",            phone: "0904567891", active: true },
    { id: "u8",  employee_id: "NV040", name: "T.V.Huấn",        password: "123456",   department: "Phòng QC",        phone: "0905678901", active: true },
    { id: "u9",  employee_id: "NV050", name: "Nguyễn Thị Lan",  password: "123456",   department: "Phòng Kế hoạch",  phone: "0906789012", active: true },
    { id: "u10", employee_id: "NV000", name: "Admin",           password: "admin123", department: "IT",              phone: "0900000000", active: true },
  ];
  const { error: ue } = await db.from("users").upsert(users, { onConflict: "id" });
  console.log(ue ? `  ✗ users: ${ue.message}` : "  ✓ users");

  const userRoles = [
    { user_id: "u1", role_id: "director" },
    { user_id: "u2", role_id: "director" },
    { user_id: "u3", role_id: "supervisor" },
    { user_id: "u4", role_id: "teamlead" },
    { user_id: "u5", role_id: "teamlead" },
    { user_id: "u6", role_id: "worker" },
    { user_id: "u7", role_id: "worker" },
    { user_id: "u8", role_id: "qc" },
    { user_id: "u9", role_id: "stats" },
    { user_id: "u10", role_id: "admin" },
  ];
  const { error: ure } = await db.from("user_roles").upsert(userRoles, { onConflict: "user_id,role_id" });
  console.log(ure ? `  ✗ user_roles: ${ure.message}` : "  ✓ user_roles");

  const groupMembers = [
    { user_id: "u4", group_id: "t1", is_lead: true },
    { user_id: "u5", group_id: "t2", is_lead: true },
    { user_id: "u6", group_id: "t1", is_lead: false },
    { user_id: "u7", group_id: "t1", is_lead: false },
  ];
  const { error: gme } = await db.from("group_members").upsert(groupMembers, { onConflict: "user_id,group_id" });
  console.log(gme ? `  ✗ group_members: ${gme.message}` : "  ✓ group_members");

  console.log("\n✓ Seed hoàn tất!\n");
  console.log("Tài khoản mẫu:");
  console.log("  NV001 / 123456 → Giám đốc");
  console.log("  NV010 / 123456 → Quản đốc");
  console.log("  NV020 / 123456 → Tổ trưởng Tổ 1");
  console.log("  NV030 / 123456 → Công nhân");
  console.log("  NV040 / 123456 → QC");
  console.log("  NV000 / admin123 → Admin");
}

main().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });
