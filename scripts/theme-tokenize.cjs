const fs = require("fs");
const path = require("path");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "dist" || e.name === ".git") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts|css)$/.test(e.name)) out.push(p);
  }
  return out;
}

const pairs = [
  ["hover:bg-[#F1F5F9]", "hover:bg-surface"],
  ["hover:bg-[#EFF2F7]", "hover:bg-surface"],
  ["hover:bg-[#F8FAFC]", "hover:bg-surface"],
  ["hover:border-[#2D6EBD]", "hover:border-ring"],
  ["focus:ring-[#2D6EBD]", "focus:ring-ring"],
  ["focus:border-[#2D6EBD]", "focus:border-ring"],
  ["bg-[#EEF2FF]", "bg-secondary"],
  ["bg-[#EFF2F7]", "bg-background"],
  ["bg-[#F8FAFC]", "bg-surface"],
  ["bg-[#F1F5F9]", "bg-surface"],
  ["bg-[#E8EDF5]", "bg-secondary"],
  ["border-[#CBD5E1]", "border-border"],
  ["border-[#E2E8F0]", "border-border"],
  ["text-[#0F172A]", "text-foreground"],
  ["text-[#1B3A5C]", "text-primary"],
  ["text-[#475569]", "text-muted"],
  ["text-[#64748B]", "text-muted"],
  ["text-[#94A3B8]", "text-muted-foreground"],
  ["bg-[#1B3A5C]", "bg-primary"],
  ["hover:bg-[#2D6EBD]", "hover:bg-ring"],
];

const files = walk("src");
let changed = 0;
for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  const orig = s;
  for (const [a, b] of pairs) s = s.split(a).join(b);
  s = s.replace(/(?<![\w-])bg-white(?!\/)/g, "bg-card");
  if (s !== orig) {
    fs.writeFileSync(f, s);
    changed++;
    console.log(f);
  }
}
console.log("changed", changed);
