-- ============================================================
-- IQC Production Management — Migration 001 (v2)
-- Chạy toàn bộ file này trong Supabase SQL Editor
-- ============================================================

-- ── Enums ─────────────────────────────────────────────────────────────────────
do $$ begin create type public.priority_level as enum ('normal','high','urgent');
exception when duplicate_object then null; end $$;

do $$ begin create type public.order_status as enum
  ('draft','pending_approval','approved','in_progress','completed');
exception when duplicate_object then null; end $$;

do $$ begin create type public.bom_status as enum
  ('unassigned','assigned','in_progress','team_reported','qc_passed','qc_failed');
exception when duplicate_object then null; end $$;

do $$ begin create type public.attachment_type as enum
  ('pdf','image','cad','excel','word','other');
exception when duplicate_object then null; end $$;

-- ── Roles (có thể thêm/xóa động) ────────────────────────────────────────────
create table if not exists public.roles (
  id          text primary key,             -- vd: 'director', 'worker', 'qc'
  label       text not null,               -- vd: 'Giám đốc', 'Công nhân'
  description text not null default '',
  created_at  timestamptz not null default now()
);

-- ── Groups / Tổ (có thể thêm/xóa động) ──────────────────────────────────────
create table if not exists public.groups (
  id          text primary key,             -- vd: 't1', 't2'
  name        text not null,               -- vd: 'Tổ 1'
  lead        text not null default '',    -- Tên tổ trưởng (denormalized)
  lead_short  text not null default '',
  description text not null default '',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── Users ─────────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id          text primary key,
  employee_id text not null unique,
  name        text not null,
  password    text not null,
  department  text not null default '',
  phone       text not null default '',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── User → Roles  (nhiều-nhiều) ───────────────────────────────────────────────
create table if not exists public.user_roles (
  user_id    text not null references public.users(id) on delete cascade,
  role_id    text not null references public.roles(id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by text,
  primary key (user_id, role_id)
);

-- ── User → Groups  (nhiều-nhiều) ──────────────────────────────────────────────
create table if not exists public.group_members (
  user_id   text not null references public.users(id) on delete cascade,
  group_id  text not null references public.groups(id) on delete cascade,
  is_lead   boolean not null default false,   -- đánh dấu tổ trưởng trong nhóm
  joined_at timestamptz not null default now(),
  primary key (user_id, group_id)
);

-- ── Production Orders ─────────────────────────────────────────────────────────
create table if not exists public.production_orders (
  id               text primary key,
  order_no         text not null unique,
  product_line     text not null,
  customer         text not null default '',
  target_qty       integer not null default 0,
  created_by       text not null,
  created_at       text not null,
  deadline         text not null,
  priority         public.priority_level not null default 'normal',
  status           public.order_status not null default 'draft',
  pending_approval boolean not null default false
);

-- ── Order Attachments ─────────────────────────────────────────────────────────
create table if not exists public.order_attachments (
  id          text primary key,
  order_id    text not null references public.production_orders(id) on delete cascade,
  name        text not null,
  type        public.attachment_type not null,
  size        text not null default '',
  uploaded_by text not null,
  uploaded_at text not null
);

-- ── BOMs ──────────────────────────────────────────────────────────────────────
create table if not exists public.boms (
  id                  text primary key,
  production_order_id text not null references public.production_orders(id) on delete cascade,
  bom_code            text not null,
  part_code           text not null default '',
  part_name           text not null,
  raw_material        text not null default '',
  machine             text not null default '',
  process             text not null default '',
  target_qty          integer not null default 0,
  pass_qty            integer not null default 0,
  fail_qty            integer not null default 0,
  assigned_group_id   text references public.groups(id),
  assigned_group_name text not null default '',
  assigned_workers    text[] not null default '{}',
  status              public.bom_status not null default 'unassigned',
  spec_cols           text[] not null default '{}',
  material_specs      jsonb,
  tech_note           text not null default '',
  unique (production_order_id, bom_code)
);

-- ── BOM Attachments ───────────────────────────────────────────────────────────
create table if not exists public.bom_attachments (
  id          text primary key,
  bom_id      text not null references public.boms(id) on delete cascade,
  name        text not null,
  type        public.attachment_type not null,
  size        text not null default '',
  uploaded_by text not null,
  uploaded_at text not null
);

-- ── Worker Entries ────────────────────────────────────────────────────────────
create table if not exists public.worker_entries (
  id           text primary key,
  bom_id       text not null references public.boms(id) on delete cascade,
  worker_id    text not null,
  worker_name  text not null,
  submitted_at text not null,
  unique (bom_id, worker_id)
);

-- ── Worker Entry Rows (1 row = 1 sản phẩm đo) ────────────────────────────────
create table if not exists public.worker_entry_rows (
  id         text primary key,
  entry_id   text not null references public.worker_entries(id) on delete cascade,
  tt         integer not null,
  dims       text[] not null default '{}',
  ngoai_quan text not null default ''
);

-- ── Team Summary ──────────────────────────────────────────────────────────────
create table if not exists public.team_summaries (
  bom_id      text primary key references public.boms(id) on delete cascade,
  pass_qty    integer not null default 0,
  fail_qty    integer not null default 0,
  note        text not null default '',
  reported_by text not null,
  reported_at text not null
);

-- ── QC Reports ────────────────────────────────────────────────────────────────
create table if not exists public.qc_reports (
  bom_id       text primary key references public.boms(id) on delete cascade,
  pass_qty     integer not null default 0,
  fail_qty     integer not null default 0,
  complaint    text not null default '',
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  inspected_by text not null,
  inspected_at text not null
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists idx_user_roles_user   on public.user_roles(user_id);
create index if not exists idx_user_roles_role   on public.user_roles(role_id);
create index if not exists idx_group_members_usr on public.group_members(user_id);
create index if not exists idx_group_members_grp on public.group_members(group_id);
create index if not exists idx_boms_order        on public.boms(production_order_id);
create index if not exists idx_boms_group        on public.boms(assigned_group_id);
create index if not exists idx_entries_bom       on public.worker_entries(bom_id);
create index if not exists idx_entry_rows        on public.worker_entry_rows(entry_id);
create index if not exists idx_ord_attach        on public.order_attachments(order_id);
create index if not exists idx_bom_attach        on public.bom_attachments(bom_id);

-- ── Seed: Roles ───────────────────────────────────────────────────────────────
insert into public.roles (id, label, description) values
  ('director',   'Giám đốc / PGĐ',  'Tạo và duyệt lệnh sản xuất'),
  ('supervisor', 'Quản đốc',         'Điều phối phân xưởng'),
  ('teamlead',   'Tổ trưởng',        'Phân việc cho công nhân, tổng kết lô'),
  ('worker',     'Công nhân',        'Nhập thông số đo lường'),
  ('qc',         'QC',               'Kiểm tra chất lượng, gửi khiếu nại'),
  ('stats',      'Thống kê / KH',    'Xem báo cáo, kế hoạch sản xuất'),
  ('admin',      'Quản trị hệ thống','Quản lý user, role, nhóm')
on conflict (id) do nothing;

-- ── Seed: Groups ──────────────────────────────────────────────────────────────
insert into public.groups (id, name, lead, lead_short) values
  ('t1', 'Tổ 1', 'Phạm Văn Chí',   'P.V.Chí'),
  ('t2', 'Tổ 2', 'Phạm Văn Sang',  'P.V.Sang'),
  ('t3', 'Tổ 3', 'Nguyễn Thị Hoa', 'N.T.Hoa'),
  ('t4', 'Tổ 4', 'Trần Văn Bình',  'T.V.Bình')
on conflict (id) do nothing;

-- ── Seed: Users ───────────────────────────────────────────────────────────────
insert into public.users (id, employee_id, name, password, department, phone, active) values
  ('u1',  'NV001', 'Nguyễn Văn An',   '123456',   'Ban Giám Đốc',    '0901234567', true),
  ('u2',  'NV002', 'Trần Thị Bình',   '123456',   'Ban Giám Đốc',    '0901234568', true),
  ('u3',  'NV010', 'Lê Văn Quốc',     '123456',   'Phân xưởng',      '0902345678', true),
  ('u4',  'NV020', 'Phạm Văn Chí',    '123456',   'Tổ 1',            '0903456789', true),
  ('u5',  'NV021', 'Phạm Văn Sang',   '123456',   'Tổ 2',            '0903456790', true),
  ('u6',  'NV030', 'Cường 2T3',       '123456',   'Tổ 1',            '0904567890', true),
  ('u7',  'NV031', 'Nga 3/43',        '123456',   'Tổ 1',            '0904567891', true),
  ('u8',  'NV040', 'T.V.Huấn',        '123456',   'Phòng QC',        '0905678901', true),
  ('u9',  'NV050', 'Nguyễn Thị Lan',  '123456',   'Phòng Kế hoạch',  '0906789012', true),
  ('u10', 'NV000', 'Admin',           'admin123', 'IT',              '0900000000', true)
on conflict (id) do nothing;

-- ── Seed: User → Roles ────────────────────────────────────────────────────────
insert into public.user_roles (user_id, role_id) values
  ('u1',  'director'),
  ('u2',  'director'),
  ('u3',  'supervisor'),
  ('u4',  'teamlead'),
  ('u5',  'teamlead'),
  ('u6',  'worker'),
  ('u7',  'worker'),
  ('u8',  'qc'),
  ('u9',  'stats'),
  ('u10', 'admin')
on conflict do nothing;

-- ── Seed: User → Groups ───────────────────────────────────────────────────────
insert into public.group_members (user_id, group_id, is_lead) values
  ('u4', 't1', true),    -- Phạm Văn Chí là tổ trưởng Tổ 1
  ('u5', 't2', true),    -- Phạm Văn Sang là tổ trưởng Tổ 2
  ('u6', 't1', false),   -- Cường là công nhân Tổ 1
  ('u7', 't1', false)    -- Nga là công nhân Tổ 1
on conflict do nothing;
