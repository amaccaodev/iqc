/**
 * migrate_pg.mjs — Chạy migration SQL qua Postgres (local + CI/CD)
 *
 * Env:
 *   SUPABASE_DB_PASSWORD hoặc DB_PASSWORD  (bắt buộc)
 *   SUPABASE_PROJECT_REF                     (mặc định mobroigpqtsfbfbvmvwa)
 *   SUPABASE_POOLER_HOST                     (mặc định aws-0-ap-northeast-1.pooler.supabase.com)
 *   SUPABASE_POOLER_PORT                     (mặc định 6543)
 *   RUN_DB_SEED=true                         chạy seed demo (mặc định false trên CI)
 *
 * Cách chạy:
 *   DB_PASSWORD=xxx node backend/scripts/migrate_pg.mjs
 *   pnpm db:migrate
 */
import pg from "pg";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "../..");

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "mobroigpqtsfbfbvmvwa";
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD || process.argv[2];
const POOLER_PORT = process.env.SUPABASE_POOLER_PORT || "6543";
const POOLER_HOSTS = process.env.SUPABASE_POOLER_HOST
  ? [process.env.SUPABASE_POOLER_HOST]
  : [
      "aws-0-ap-northeast-1.pooler.supabase.com",
      "aws-0-ap-southeast-1.pooler.supabase.com",
    ];
const RUN_SEED = process.env.RUN_DB_SEED === "true";

if (!DB_PASSWORD) {
  console.error("Thiếu SUPABASE_DB_PASSWORD hoặc DB_PASSWORD");
  process.exit(1);
}

const { Pool } = pg;

function buildConnectionStrings() {
  const enc = encodeURIComponent(DB_PASSWORD);
  const urls = [];
  for (const host of POOLER_HOSTS) {
    urls.push(`postgresql://postgres.${PROJECT_REF}:${enc}@${host}:${POOLER_PORT}/postgres`);
  }
  urls.push(`postgresql://postgres:${enc}@db.${PROJECT_REF}.supabase.co:5432/postgres`);
  return urls;
}

function listMigrationFiles() {
  const dir = join(ROOT, "supabase/migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => join(dir, f));
}

async function ensureTrackingTable(client) {
  await client.query(`
    create table if not exists public.iqc_schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    );
  `);
}

async function getApplied(client) {
  const { rows } = await client.query("select version from public.iqc_schema_migrations");
  return new Set(rows.map((r) => r.version));
}

async function bootstrapIfNeeded(client, files) {
  const applied = await getApplied(client);
  if (applied.size > 0) return;

  const check = await client.query("select to_regclass('public.users') as reg");
  if (!check.rows[0]?.reg) return;

  console.log("DB đã có schema — đánh dấu migrations hiện có là đã chạy");
  for (const file of files) {
    const version = file.split(/[\\/]/).pop();
    await client.query(
      "insert into public.iqc_schema_migrations (version) values ($1) on conflict do nothing",
      [version],
    );
  }
}

async function runMigration(client, filePath) {
  const version = filePath.split(/[\\/]/).pop();
  console.log(`\n→ ${version}`);
  const sql = readFileSync(filePath, "utf-8");
  await client.query("begin");
  try {
    await client.query(sql);
    await client.query(
      "insert into public.iqc_schema_migrations (version) values ($1) on conflict do nothing",
      [version],
    );
    await client.query("commit");
    console.log(`  ✓ ${version}`);
  } catch (err) {
    await client.query("rollback");
    const msg = err.message || "";
    if (msg.includes("already exists") || err.code === "42710" || err.code === "42P07") {
      await client.query(
        "insert into public.iqc_schema_migrations (version) values ($1) on conflict do nothing",
        [version],
      );
      console.log(`  ✓ ${version} (đã tồn tại, bỏ qua)`);
      return;
    }
    throw err;
  }
}

async function seedData(client) {
  console.log("\n=== Seed demo (RUN_DB_SEED=true) ===\n");
  const inserts = [
    {
      name: "groups",
      sql: `insert into public.groups (id, name, lead, lead_short) values
        ('t1','Tổ 1','Phạm Văn Chí','P.V.Chí'),('t2','Tổ 2','Phạm Văn Sang','P.V.Sang'),
        ('t3','Tổ 3','Nguyễn Thị Hoa','N.T.Hoa'),('t4','Tổ 4','Trần Văn Bình','T.V.Bình')
        on conflict (id) do nothing;`,
    },
    {
      name: "roles",
      sql: `insert into public.roles (id, label, description) values
        ('director','Giám đốc / PGĐ','Tạo và duyệt lệnh sản xuất'),
        ('supervisor','Quản đốc','Điều phối phân xưởng'),
        ('teamlead','Tổ trưởng','Phân việc cho công nhân'),
        ('worker','Công nhân','Nhập thông số đo lường'),
        ('qc','QC','Kiểm tra chất lượng'),
        ('stats','Thống kê / KH','Xem báo cáo'),
        ('admin','Quản trị hệ thống','Quản lý user, role, nhóm')
        on conflict (id) do nothing;`,
    },
    {
      name: "users",
      sql: `insert into public.users (id, employee_id, name, password, department, phone, active) values
        ('u1','NV001','Nguyễn Văn An','123456','Ban Giám Đốc','0901234567',true),
        ('u2','NV002','Trần Thị Bình','123456','Ban Giám Đốc','0901234568',true),
        ('u3','NV010','Lê Văn Quốc','123456','Phân xưởng','0902345678',true),
        ('u4','NV020','Phạm Văn Chí','123456','Tổ 1','0903456789',true),
        ('u5','NV021','Phạm Văn Sang','123456','Tổ 2','0903456790',true),
        ('u6','NV030','Cường 2T3','123456','Tổ 1','0904567890',true),
        ('u7','NV031','Nga 3/43','123456','Tổ 1','0904567891',true),
        ('u8','NV040','T.V.Huấn','123456','Phòng QC','0905678901',true),
        ('u9','NV050','Nguyễn Thị Lan','123456','Phòng Kế hoạch','0906789012',true),
        ('u10','NV000','Admin','admin123','IT','0900000000',true)
        on conflict (id) do nothing;`,
    },
    {
      name: "user_roles",
      sql: `insert into public.user_roles (user_id, role_id) values
        ('u1','director'),('u2','director'),('u3','supervisor'),
        ('u4','teamlead'),('u5','teamlead'),('u6','worker'),('u7','worker'),
        ('u8','qc'),('u9','stats'),('u10','admin')
        on conflict do nothing;`,
    },
    {
      name: "group_members",
      sql: `insert into public.group_members (user_id, group_id, is_lead) values
        ('u4','t1',true),('u5','t2',true),('u6','t1',false),('u7','t1',false)
        on conflict do nothing;`,
    },
  ];
  for (const { name, sql } of inserts) {
    try {
      await client.query(sql);
      console.log(`  ✓ ${name}`);
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
    }
  }
}

async function connectPool() {
  for (const connectionString of buildConnectionStrings()) {
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 25000,
    });
    try {
      const client = await pool.connect();
      console.log("✓ Kết nối Postgres OK");
      return { pool, client };
    } catch (err) {
      console.log(`  thử kết nối thất bại: ${String(err.message).slice(0, 100)}`);
      await pool.end();
    }
  }
  throw new Error("Không kết nối được Postgres");
}

async function main() {
  console.log("=== IQC DB Migrate ===");
  console.log(`Project: ${PROJECT_REF}\n`);

  const files = listMigrationFiles();
  if (files.length === 0) {
    console.log("Không có file trong supabase/migrations/");
    return;
  }

  let pool;
  let client;
  try {
    ({ pool, client } = await connectPool());
    await ensureTrackingTable(client);
    await bootstrapIfNeeded(client, files);

    const applied = await getApplied(client);
    let ran = 0;
    for (const file of files) {
      const version = file.split(/[\\/]/).pop();
      if (applied.has(version)) {
        console.log(`  · ${version} (đã chạy)`);
        continue;
      }
      await runMigration(client, file);
      ran++;
    }

    console.log(ran ? `\n✓ Đã chạy ${ran} migration mới` : "\n✓ Không có migration mới");

    if (RUN_SEED) await seedData(client);
  } catch (err) {
    console.error("\n✗ Lỗi:", err.message);
    process.exit(1);
  } finally {
    client?.release();
    if (pool) await pool.end();
  }
}

main();
