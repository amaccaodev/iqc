import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const empId = process.argv[2] ?? "NV001";

const basic = await supabase.from("users").select("id,employee_id,password,active").eq("employee_id", empId);
console.log("basic query:", JSON.stringify(basic, null, 2));

const withRel = await supabase
  .from("users")
  .select("*, user_roles(role_id), group_members(group_id, is_lead)")
  .eq("employee_id", empId)
  .single();
console.log("with relations:", JSON.stringify(withRel, null, 2));

const count = await supabase.from("users").select("employee_id", { count: "exact", head: true });
console.log("user count:", count.count, count.error?.message ?? "ok");
