-- ============================================================
-- IQC Migration 004 — Products, warehouse, machines, mechanic
-- ============================================================

do $$ begin create type public.process_stage as enum
  ('hot_forge','auto','assembly');
exception when duplicate_object then null; end $$;

do $$ begin create type public.change_request_target as enum
  ('teamlead','mechanic');
exception when duplicate_object then null; end $$;

do $$ begin create type public.change_request_status as enum
  ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

-- Role Cơ điện
insert into public.roles (id, label, description) values
  ('mechanic','Cơ điện','Xử lý sự cố máy và phê duyệt đổi máy')
on conflict (id) do nothing;

-- 3 tổ quy trình (thay Tổ 1–4)
insert into public.groups (id, name, lead, lead_short) values
  ('t_hot','Tổ Dập nóng','Phạm Văn Chí','P.V.Chí'),
  ('t_auto','Tổ Tự động','Phạm Văn Sang','P.V.Sang'),
  ('t_asm','Tổ Lắp ráp','Nguyễn Thị Hoa','N.T.Hoa')
on conflict (id) do update set
  name = excluded.name,
  lead = excluded.lead,
  lead_short = excluded.lead_short;

-- Thành phẩm
create table if not exists public.products (
  id          text primary key,
  code        text not null unique,
  name        text not null,
  description text not null default '',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Bán thành phẩm
create table if not exists public.semi_products (
  id            text primary key,
  code          text not null unique,
  name          text not null,
  process_stage public.process_stage not null default 'hot_forge',
  description   text not null default '',
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Định mức: 1 thành phẩm cần N BTP
create table if not exists public.product_bom (
  id               text primary key,
  product_id       text not null references public.products(id) on delete cascade,
  semi_product_id  text not null references public.semi_products(id) on delete cascade,
  qty_per_unit     numeric(12,3) not null default 1,
  unique (product_id, semi_product_id)
);

-- Tồn kho ước tính BTP
create table if not exists public.warehouse_stock (
  semi_product_id text primary key references public.semi_products(id) on delete cascade,
  qty             numeric(12,3) not null default 0,
  updated_at      timestamptz not null default now()
);

-- Catalog máy
create table if not exists public.machines (
  id          text primary key,
  code        text not null unique,
  name        text not null,
  params      jsonb not null default '[]'::jsonb,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Xin phê duyệt đổi máy
create table if not exists public.machine_change_requests (
  id            text primary key,
  order_id      text references public.production_orders(id) on delete set null,
  bom_id        text references public.boms(id) on delete set null,
  requested_by  text not null,
  requested_name text not null,
  requested_at  timestamptz not null default now(),
  reason        text not null,
  target        public.change_request_target not null,
  from_machine  text not null default '',
  to_machine    text not null default '',
  status        public.change_request_status not null default 'pending',
  reviewed_by   text,
  reviewed_name text,
  reviewed_at   timestamptz,
  review_note   text not null default ''
);

-- Gắn machine_id vào incidents (nullable)
alter table public.machine_incidents
  add column if not exists machine_id text references public.machines(id) on delete set null;

-- Seed user Cơ điện
insert into public.users (id, employee_id, name, password, department, phone, active) values
  ('u11','NV060','Trần Cơ Điện','123456','Cơ điện','0907890123',true)
on conflict (id) do nothing;

insert into public.user_roles (user_id, role_id) values
  ('u11','mechanic')
on conflict do nothing;

-- Seed demo sản phẩm NOVO-20
insert into public.products (id, code, name, description) values
  ('p1','NOVO-20-001','Van 1 chiều lò xo NOVO 20','Thành phẩm demo')
on conflict (id) do nothing;

insert into public.semi_products (id, code, name, process_stage) values
  ('sp1','BTP-BODY-20','Thân van NOVO20','hot_forge'),
  ('sp2','BTP-SPRING-20','Lò xo NOVO20','auto'),
  ('sp3','BTP-ASM-20','Bộ lắp ráp NOVO20','assembly')
on conflict (id) do nothing;

insert into public.product_bom (id, product_id, semi_product_id, qty_per_unit) values
  ('pb1','p1','sp1',1),
  ('pb2','p1','sp2',1),
  ('pb3','p1','sp3',1)
on conflict (id) do nothing;

insert into public.warehouse_stock (semi_product_id, qty) values
  ('sp1',120),
  ('sp2',80),
  ('sp3',50)
on conflict (semi_product_id) do nothing;

insert into public.machines (id, code, name, params) values
  ('m1','CAM-01','Cam 0.1','[{"label":"ĐK ngoài","unit":"mm","min":19.9,"max":20.1}]'::jsonb),
  ('m2','CNC-01','Tiện CNC 1','[{"label":"Chiều dài","unit":"mm","min":49.5,"max":50.5}]'::jsonb)
on conflict (id) do nothing;
