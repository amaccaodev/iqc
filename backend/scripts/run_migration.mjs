import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import https from "https";

const url = process.env.SUPABASE_URL || "https://mobroigpqtsfbfbvmvwa.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!key) {
  console.error("Thiếu SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sqlFile = join(dirname(fileURLToPath(import.meta.url)), "../../supabase/migration_001_iqc.sql");
const sql = readFileSync(sqlFile, "utf-8");

// Use Supabase's management REST API to execute SQL via pg proxy
// The service-role key allows direct SQL execution through the REST endpoint
const projectRef = "mobroigpqtsfbfbvmvwa";
const restUrl = `${url}/rest/v1/rpc/exec_sql`;

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

// Split into individual statements and run them via supabase-js rpc
// Supabase doesn't expose a direct SQL endpoint — we must use pg_query via REST
// or run statement-by-statement via the supabase client

// Use fetch to hit the Management API
const mgmtUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

// Fallback: use the supabase-js client with a known RPC function
// Since we don't have a stored procedure, we'll run individual inserts via the client
async function seedViaClient() {
  console.log("Seeding teams...");
  const teams = [
    { id: "t1", name: "Tổ 1", lead: "Phạm Văn Chí", lead_short: "P.V.Chí" },
    { id: "t2", name: "Tổ 2", lead: "Phạm Văn Sang", lead_short: "P.V.Sang" },
    { id: "t3", name: "Tổ 3", lead: "Nguyễn Thị Hoa", lead_short: "N.T.Hoa" },
    { id: "t4", name: "Tổ 4", lead: "Trần Văn Bình", lead_short: "T.V.Bình" },
  ];
  const { error: te } = await sb.from("teams").upsert(teams, { onConflict: "id" });
  if (te) console.error("Teams error:", te.message);
  else console.log("Teams OK");

  console.log("Seeding users...");
  const users = [
    { id: "u1",  employee_id: "NV001", name: "Nguyễn Văn An",    password: "123456",   role: "director",   team_id: null, department: "Ban Giám Đốc",    phone: "0901234567", active: true },
    { id: "u2",  employee_id: "NV002", name: "Trần Thị Bình",    password: "123456",   role: "director",   team_id: null, department: "Ban Giám Đốc",    phone: "0901234568", active: true },
    { id: "u3",  employee_id: "NV010", name: "Lê Văn Quốc",      password: "123456",   role: "supervisor", team_id: null, department: "Phân xưởng",      phone: "0902345678", active: true },
    { id: "u4",  employee_id: "NV020", name: "Phạm Văn Chí",     password: "123456",   role: "teamlead",   team_id: "t1", department: "Tổ 1",           phone: "0903456789", active: true },
    { id: "u5",  employee_id: "NV021", name: "Phạm Văn Sang",    password: "123456",   role: "teamlead",   team_id: "t2", department: "Tổ 2",           phone: "0903456790", active: true },
    { id: "u6",  employee_id: "NV030", name: "Cường 2T3",        password: "123456",   role: "worker",     team_id: "t1", department: "Tổ 1",           phone: "0904567890", active: true },
    { id: "u7",  employee_id: "NV031", name: "Nga 3/43",         password: "123456",   role: "worker",     team_id: "t1", department: "Tổ 1",           phone: "0904567891", active: true },
    { id: "u8",  employee_id: "NV040", name: "T.V.Huấn",         password: "123456",   role: "qc",         team_id: null, department: "Phòng QC",       phone: "0905678901", active: true },
    { id: "u9",  employee_id: "NV050", name: "Nguyễn Thị Lan",   password: "123456",   role: "stats",      team_id: null, department: "Phòng Kế hoạch", phone: "0906789012", active: true },
    { id: "u10", employee_id: "NV000", name: "Admin",            password: "admin123", role: "admin",      team_id: null, department: "IT",             phone: "0900000000", active: true },
  ];
  const { error: ue } = await sb.from("users").upsert(users, { onConflict: "id" });
  if (ue) console.error("Users error:", ue.message);
  else console.log("Users OK");
}

// First try to check if tables exist
const { error: checkErr } = await sb.from("teams").select("id").limit(1);
if (checkErr && checkErr.code === "42P01") {
  console.error("Tables do not exist yet. Please run the SQL migration manually in the Supabase SQL Editor.");
  console.log("\nFile to run: d:\\IQC\\supabase\\migration_001_iqc.sql\n");
  console.log("URL: https://supabase.com/dashboard/project/mobroigpqtsfbfbvmvwa/sql");
  process.exit(1);
} else if (checkErr) {
  console.error("Unexpected error:", checkErr.message);
  process.exit(1);
} else {
  console.log("Tables exist. Seeding data...");
  await seedViaClient();
  console.log("\nDone! All seed data inserted.");
}
