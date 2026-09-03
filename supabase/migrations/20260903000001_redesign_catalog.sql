-- Replace leftover catalog (product_bom / warehouse_stock / catalog_boms)
-- with the model in 20240820000004. Safe on both old and new 004.

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

-- Drop dual / old catalog (order-level public.boms is NOT dropped)
drop table if exists public.product_bom;
drop table if exists public.warehouse_stock;
drop table if exists public.catalog_boms cascade;

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

alter table public.products
  add column if not exists unit_of_measure_id text;

alter table public.semi_products
  add column if not exists product_id text,
  add column if not exists unit_of_measure_id text,
  add column if not exists weight_kg numeric(12,4),
  add column if not exists drawing_id text,
  add column if not exists measurement_specs jsonb not null default '{}'::jsonb;

update public.semi_products s
set product_id = (select p.id from public.products p order by p.created_at nulls last limit 1)
where s.product_id is null
  and exists (select 1 from public.products);

alter table public.machines
  add column if not exists accounting_code text not null default '',
  add column if not exists machine_group_id text,
  add column if not exists specs jsonb not null default '{}'::jsonb,
  add column if not exists production_team_id text;

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'machines' and column_name = 'code'
  ) then
    update public.machines set accounting_code = code where accounting_code = '' and code is not null;
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'machines' and column_name = 'params'
  ) then
    alter table public.machines drop column params;
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'semi_products' and column_name = 'process_stage'
  ) then
    alter table public.semi_products drop column process_stage;
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'semi_products' and column_name = 'description'
  ) then
    alter table public.semi_products drop column description;
  end if;
end $$;

create table if not exists public.warehouse_stocks (
  id              text primary key,
  warehouse_id    text not null references public.warehouses(id) on delete cascade,
  item_kind       public.stock_item_kind not null,
  item_id         text not null,
  qty             numeric(14,4) not null default 0,
  updated_at      timestamptz not null default now(),
  unique (warehouse_id, item_kind, item_id)
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
  unit_of_measure_id   text,
  sort_order           integer not null default 1,
  created_at           timestamptz not null default now(),
  unique (bom_id, sort_order)
);

create table if not exists public.measurement_results (
  id                    text primary key,
  production_order_id   text not null,
  semi_product_id       text not null,
  entered_by_id         text not null,
  machine_id            text,
  measurements          jsonb not null default '{}'::jsonb,
  appearance            text not null default '',
  created_at            timestamptz not null default now()
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
  machine_id           text not null,
  monthly_price        numeric(14,2) not null default 0,
  achievement_quota    numeric(14,4) not null default 0,
  effective_from       timestamptz not null default now(),
  effective_to         timestamptz,
  created_at           timestamptz not null default now()
);

insert into public.warehouses (id, code, name)
values ('wh-main', 'WH-MAIN', 'Kho chính')
on conflict (code) do nothing;

insert into public.units_of_measure (id, code, name) values
  ('uom-pcs', 'pcs', 'Piece'),
  ('uom-kg',  'kg',  'Kilogram'),
  ('uom-mm',  'mm',  'Millimetre')
on conflict (code) do nothing;

drop index if exists public.idx_semi_products_stage;
create index if not exists idx_semi_products_product on public.semi_products (product_id);
create index if not exists idx_warehouse_stocks_item on public.warehouse_stocks (item_kind, item_id);
create index if not exists idx_part_boms_semi on public.part_boms (semi_product_id);
create index if not exists idx_bom_processes_bom on public.bom_processes (bom_id, sort_order);
create index if not exists idx_machines_accounting on public.machines (accounting_code);
