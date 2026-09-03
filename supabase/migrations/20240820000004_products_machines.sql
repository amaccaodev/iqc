-- ============================================================
-- IQC Migration 004 — Catalog (new model), machines, mechanic
-- Product → SemiProduct → part_boms → bom_processes
-- Shared warehouse: warehouse_stocks (item_kind + item_id)
-- public.boms remains order-level jobs (see 20240101000001)
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

do $$ begin
  create type public.stock_item_kind as enum ('product', 'semi_product');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.activity_entity_type as enum (
    'product',
    'semi_product',
    'bom',
    'bom_process',
    'machine',
    'warehouse_stock',
    'production_order',
    'measurement_result',
    'shift_close',
    'user'
  );
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

create table if not exists public.units_of_measure (
  id          text primary key,
  code        text not null unique,
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.drawings (
  id              text primary key,
  name            text not null,
  mime_type       text not null default 'image/webp',
  content_base64  text,
  file_size_bytes integer,
  uploaded_by_id  text,
  created_at      timestamptz not null default now()
);

create table if not exists public.machine_groups (
  id                  text primary key,
  code                text not null unique,
  name                text not null,
  production_team_id  text references public.groups(id) on delete set null,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

create table if not exists public.warehouses (
  id          text primary key,
  code        text not null unique,
  name        text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.products (
  id                   text primary key,
  code                 text not null unique,
  name                 text not null,
  description          text not null default '',
  unit_of_measure_id   text references public.units_of_measure(id),
  active               boolean not null default true,
  created_at           timestamptz not null default now()
);

create table if not exists public.semi_products (
  id                   text primary key,
  code                 text not null unique,
  name                 text not null,
  product_id           text not null references public.products(id) on delete restrict,
  unit_of_measure_id   text references public.units_of_measure(id),
  weight_kg            numeric(12,4),
  drawing_id           text references public.drawings(id) on delete set null,
  measurement_specs    jsonb not null default '{}'::jsonb,
  active               boolean not null default true,
  created_at           timestamptz not null default now(),
  constraint semi_products_specs_object
    check (jsonb_typeof(measurement_specs) = 'object')
);

create table if not exists public.warehouse_stocks (
  id              text primary key,
  warehouse_id    text not null references public.warehouses(id) on delete cascade,
  item_kind       public.stock_item_kind not null,
  item_id         text not null,
  qty             numeric(14,4) not null default 0,
  updated_at      timestamptz not null default now(),
  unique (warehouse_id, item_kind, item_id),
  constraint warehouse_stocks_qty_non_negative check (qty >= 0)
);

create table if not exists public.warehouse_movements (
  id              text primary key,
  warehouse_id    text not null references public.warehouses(id) on delete cascade,
  item_kind       public.stock_item_kind not null,
  item_id         text not null,
  delta           numeric(14,4) not null,
  qty_after       numeric(14,4) not null,
  note            text not null default '',
  created_by_id   text,
  created_at      timestamptz not null default now()
);

-- Catalog BOM (order jobs stay in public.boms)
create table if not exists public.part_boms (
  id               text primary key,
  name             text not null,
  semi_product_id  text not null references public.semi_products(id) on delete cascade,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.bom_processes (
  id                   text primary key,
  bom_id               text not null references public.part_boms(id) on delete cascade,
  name                 text not null,
  production_team_id   text references public.groups(id) on delete set null,
  machine_group_id     text references public.machine_groups(id) on delete set null,
  quota_per_shift      numeric(12,3) not null default 0,
  unit_of_measure_id   text references public.units_of_measure(id),
  sort_order           integer not null default 1,
  created_at           timestamptz not null default now(),
  unique (bom_id, sort_order)
);

create table if not exists public.machines (
  id                   text primary key,
  name                 text not null,
  accounting_code      text not null default '',
  machine_group_id     text references public.machine_groups(id) on delete set null,
  specs                jsonb not null default '{}'::jsonb,
  production_team_id   text references public.groups(id) on delete set null,
  active               boolean not null default true,
  created_at           timestamptz not null default now()
);

create table if not exists public.measurement_results (
  id                    text primary key,
  production_order_id   text not null,
  semi_product_id       text not null references public.semi_products(id) on delete restrict,
  entered_by_id         text not null,
  machine_id            text references public.machines(id) on delete set null,
  measurements          jsonb not null default '{}'::jsonb,
  appearance            text not null default '',
  created_at            timestamptz not null default now(),
  constraint measurement_results_values_object
    check (jsonb_typeof(measurements) = 'object')
);

create table if not exists public.activities (
  id            text primary key,
  actor_id      text,
  action        text not null,
  entity_type   public.activity_entity_type not null,
  entity_id     text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create table if not exists public.machine_rate_quotas (
  id                   text primary key,
  machine_id           text not null references public.machines(id) on delete cascade,
  monthly_price        numeric(14,2) not null default 0,
  achievement_quota    numeric(14,4) not null default 0,
  effective_from       timestamptz not null default now(),
  effective_to         timestamptz,
  created_at           timestamptz not null default now(),
  constraint machine_rate_quotas_range
    check (effective_to is null or effective_to > effective_from)
);

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

alter table public.machine_incidents
  add column if not exists machine_id text references public.machines(id) on delete set null;

insert into public.users (id, employee_id, name, password, department, phone, active) values
  ('u11','NV060','Trần Cơ Điện','123456','Cơ điện','0907890123',true)
on conflict (id) do nothing;

insert into public.user_roles (user_id, role_id) values
  ('u11','mechanic')
on conflict do nothing;

insert into public.units_of_measure (id, code, name) values
  ('uom-pcs', 'pcs', 'Piece'),
  ('uom-kg',  'kg',  'Kilogram'),
  ('uom-mm',  'mm',  'Millimetre')
on conflict (code) do nothing;

insert into public.warehouses (id, code, name)
values ('wh-main', 'WH-MAIN', 'Kho chính')
on conflict (code) do nothing;

insert into public.products (id, code, name, description) values
  ('p1','NOVO-20-001','Van 1 chiều lò xo NOVO 20','Thành phẩm demo')
on conflict (id) do nothing;

insert into public.semi_products (id, code, name, product_id, measurement_specs) values
  ('sp1','BTP-BODY-20','Thân van NOVO20','p1','{"A":"float","B":"float","C":"float","D":"boolean"}'::jsonb),
  ('sp2','BTP-SPRING-20','Lò xo NOVO20','p1','{"A":"float","B":"float","C":"float","D":"boolean"}'::jsonb),
  ('sp3','BTP-ASM-20','Bộ lắp ráp NOVO20','p1','{"A":"float","B":"text","C":"boolean"}'::jsonb)
on conflict (id) do nothing;

insert into public.part_boms (id, name, semi_product_id) values
  ('pbom-sp1','BOM Thân van NOVO20','sp1'),
  ('pbom-sp2','BOM Lò xo NOVO20','sp2'),
  ('pbom-sp3','BOM Lắp ráp NOVO20','sp3')
on conflict (id) do nothing;

insert into public.bom_processes (id, bom_id, name, production_team_id, quota_per_shift, sort_order) values
  ('bp-sp1-1','pbom-sp1','Dập nóng','t_hot',4000,1),
  ('bp-sp2-1','pbom-sp2','Gia công tự động','t_auto',0,1),
  ('bp-sp3-1','pbom-sp3','Lắp ráp','t_asm',0,1)
on conflict (id) do nothing;

insert into public.warehouse_stocks (id, warehouse_id, item_kind, item_id, qty) values
  ('ws-sp1','wh-main','semi_product','sp1',120),
  ('ws-sp2','wh-main','semi_product','sp2',80),
  ('ws-sp3','wh-main','semi_product','sp3',50)
on conflict (id) do nothing;

insert into public.machines (id, name, accounting_code, specs, production_team_id) values
  ('m1','Cam 0.1','CAM-01','{}'::jsonb,'t_hot'),
  ('m2','Tiện CNC 1','CNC-01','{}'::jsonb,'t_hot')
on conflict (id) do nothing;
