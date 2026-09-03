-- ============================================================
-- IQC — Canonical schema (greenfield)
-- Run on an empty database. All names are English snake_case.
--
-- Domain:
--   Product ──< SemiProduct ──< Bom ──< BomProcess
--        \         \                         \
--         \         \                         MachineGroup ──< Machine
--          \         \                              \
--           \         └────────── WarehouseStock ────┘
--            └─────────────────── WarehouseStock
--
-- Do not run together with 20240101000001 — that file owns production_orders
-- and order-level public.boms. This file is catalog-only for empty databases.
-- ============================================================

create extension if not exists pgcrypto;

-- ── Enums ────────────────────────────────────────────────────────────────────

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

-- ── Units of measure ──────────────────────────────────────────────────────────

create table if not exists public.units_of_measure (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,          -- pcs, kg, mm, hour
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ── Drawings ──────────────────────────────────────────────────────────────────

create table if not exists public.drawings (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  mime_type       text not null default 'image/webp',
  content_base64  text,
  file_size_bytes integer,
  uploaded_by_id  text,
  created_at      timestamptz not null default now()
);

-- ── Production teams (tổ sản xuất) ────────────────────────────────────────────

create table if not exists public.production_teams (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  lead_name   text not null default '',
  description text not null default '',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── Machine groups ────────────────────────────────────────────────────────────

create table if not exists public.machine_groups (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,
  name                text not null,
  production_team_id  uuid references public.production_teams(id) on delete set null,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

-- ── Warehouse (one shared store for products + semi-products) ─────────────────

create table if not exists public.warehouses (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── Products (finished goods) ─────────────────────────────────────────────────

create table if not exists public.products (
  id                   uuid primary key default gen_random_uuid(),
  code                 text not null unique,
  name                 text not null,
  description          text not null default '',
  unit_of_measure_id   uuid references public.units_of_measure(id),
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ── Semi-products ─────────────────────────────────────────────────────────────
-- measurement_specs: map of field key → type
--   { "A": "integer", "B": "text", "C": "float", "D": "boolean" }

create table if not exists public.semi_products (
  id                   uuid primary key default gen_random_uuid(),
  code                 text not null unique,
  name                 text not null,
  product_id           uuid not null references public.products(id) on delete restrict,
  unit_of_measure_id   uuid references public.units_of_measure(id),
  weight_kg            numeric(12,4),
  drawing_id           uuid references public.drawings(id) on delete set null,
  measurement_specs    jsonb not null default '{}'::jsonb,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint semi_products_specs_object
    check (jsonb_typeof(measurement_specs) = 'object')
);

-- ── Unified warehouse stock ───────────────────────────────────────────────────

create table if not exists public.warehouse_stocks (
  id              uuid primary key default gen_random_uuid(),
  warehouse_id    uuid not null references public.warehouses(id) on delete cascade,
  item_kind       public.stock_item_kind not null,
  item_id         uuid not null,
  qty             numeric(14,4) not null default 0,
  updated_at      timestamptz not null default now(),
  unique (warehouse_id, item_kind, item_id),
  constraint warehouse_stocks_qty_non_negative check (qty >= 0)
);

create table if not exists public.warehouse_movements (
  id              uuid primary key default gen_random_uuid(),
  warehouse_id    uuid not null references public.warehouses(id) on delete cascade,
  item_kind       public.stock_item_kind not null,
  item_id         uuid not null,
  delta           numeric(14,4) not null,
  qty_after       numeric(14,4) not null,
  note            text not null default '',
  created_by_id   text,
  created_at      timestamptz not null default now()
);

-- ── Catalog BOM (many BOMs per semi-product; many processes per BOM) ──────────
-- Greenfield name: part_boms. Live DBs also keep public.boms for order jobs.

create table if not exists public.part_boms (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  semi_product_id  uuid not null references public.semi_products(id) on delete cascade,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── BOM processes (quy trình trong BOM) ───────────────────────────────────────

create table if not exists public.bom_processes (
  id                   uuid primary key default gen_random_uuid(),
  bom_id               uuid not null references public.part_boms(id) on delete cascade,
  name                 text not null,
  production_team_id   uuid references public.production_teams(id) on delete set null,
  machine_group_id     uuid references public.machine_groups(id) on delete set null,
  quota_per_shift      numeric(12,3) not null default 0,
  unit_of_measure_id   uuid references public.units_of_measure(id),
  sort_order           integer not null default 1,
  created_at           timestamptz not null default now(),
  unique (bom_id, sort_order)
);

-- ── Machines ──────────────────────────────────────────────────────────────────

create table if not exists public.machines (
  id                   uuid primary key default gen_random_uuid(),
  machine_group_id     uuid references public.machine_groups(id) on delete set null,
  name                 text not null,
  specs                jsonb not null default '{}'::jsonb,
  production_team_id   uuid references public.production_teams(id) on delete set null,
  accounting_code      text not null default '',
  is_active            boolean not null default true,
  created_at           timestamptz not null default now()
);

-- ── Production orders (needed by measurement results) ─────────────────────────

create table if not exists public.production_orders (
  id              uuid primary key default gen_random_uuid(),
  order_no        text not null unique,
  product_id      uuid references public.products(id) on delete restrict,
  target_qty      numeric(14,4) not null default 0,
  deadline        date,
  status          text not null default 'draft',
  created_by_id   text,
  created_at      timestamptz not null default now()
);

-- ── Measurement results ───────────────────────────────────────────────────────
-- measurements jsonb keys/types MUST match semi_products.measurement_specs
-- example specs { "A":"integer", "B":"text" } → measurements { "A": 12, "B": "ok" }

create table if not exists public.measurement_results (
  id                    uuid primary key default gen_random_uuid(),
  production_order_id   uuid not null references public.production_orders(id) on delete cascade,
  semi_product_id       uuid not null references public.semi_products(id) on delete restrict,
  entered_by_id         text not null,
  machine_id            uuid references public.machines(id) on delete set null,
  measurements          jsonb not null default '{}'::jsonb,
  appearance            text not null default '',
  created_at            timestamptz not null default now(),
  constraint measurement_results_values_object
    check (jsonb_typeof(measurements) = 'object')
);

-- ── Activity log ──────────────────────────────────────────────────────────────

create table if not exists public.activities (
  id            uuid primary key default gen_random_uuid(),
  actor_id      text,
  action        text not null,                 -- created, updated, measured, stock_adjusted…
  entity_type   public.activity_entity_type not null,
  entity_id     uuid,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- ── Machine rate quotas (định mức giá tiền) ───────────────────────────────────

create table if not exists public.machine_rate_quotas (
  id                   uuid primary key default gen_random_uuid(),
  machine_id           uuid not null references public.machines(id) on delete cascade,
  monthly_price        numeric(14,2) not null default 0,
  achievement_quota    numeric(14,4) not null default 0,
  effective_from       timestamptz not null default now(),
  effective_to         timestamptz,
  created_at           timestamptz not null default now(),
  constraint machine_rate_quotas_range
    check (effective_to is null or effective_to > effective_from)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index if not exists idx_semi_products_product on public.semi_products (product_id);
create index if not exists idx_semi_products_drawing on public.semi_products (drawing_id);
create index if not exists idx_warehouse_stocks_item on public.warehouse_stocks (item_kind, item_id);
create index if not exists idx_warehouse_stocks_wh on public.warehouse_stocks (warehouse_id);
create index if not exists idx_warehouse_movements_item on public.warehouse_movements (item_kind, item_id, created_at desc);
create index if not exists idx_boms_semi_product on public.part_boms (semi_product_id);
create index if not exists idx_bom_processes_bom on public.bom_processes (bom_id, sort_order);
create index if not exists idx_bom_processes_team on public.bom_processes (production_team_id);
create index if not exists idx_bom_processes_mgroup on public.bom_processes (machine_group_id);
create index if not exists idx_machines_group on public.machines (machine_group_id);
create index if not exists idx_machines_team on public.machines (production_team_id);
create index if not exists idx_machines_accounting on public.machines (accounting_code);
create index if not exists idx_measurement_order on public.measurement_results (production_order_id);
create index if not exists idx_measurement_semi on public.measurement_results (semi_product_id);
create index if not exists idx_measurement_entered_by on public.measurement_results (entered_by_id);
create index if not exists idx_measurement_machine on public.measurement_results (machine_id);
create index if not exists idx_measurement_values on public.measurement_results using gin (measurements);
create index if not exists idx_activities_entity on public.activities (entity_type, entity_id, created_at desc);
create index if not exists idx_activities_actor on public.activities (actor_id, created_at desc);
create index if not exists idx_rate_quotas_machine on public.machine_rate_quotas (machine_id, effective_from desc);

-- ── Seed: default warehouse + common UOMs ─────────────────────────────────────

insert into public.warehouses (id, code, name)
values ('00000000-0000-0000-0000-000000000001', 'WH-MAIN', 'Main warehouse')
on conflict (code) do nothing;

insert into public.units_of_measure (code, name) values
  ('pcs', 'Piece'),
  ('kg',  'Kilogram'),
  ('g',   'Gram'),
  ('mm',  'Millimetre'),
  ('m',   'Metre'),
  ('h',   'Hour'),
  ('shift', 'Shift')
on conflict (code) do nothing;
