-- Lương NV × SP + chốt ca: CN → Tổ trưởng → QC → Quản đốc

create table if not exists public.employee_product_rates (
  id          text primary key,
  user_id     text not null references public.users(id) on delete cascade,
  product_id  text not null,
  rate_vnd    numeric not null default 0,
  updated_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists public.shift_closes (
  id              text primary key,
  order_id        text not null,
  bom_id          text not null,
  worker_id       text not null,
  worker_name     text not null default '',
  product_id      text not null default '',
  product_name    text not null default '',
  part_name       text not null default '',
  pass_qty        integer not null default 0,
  fail_qty        integer not null default 0,
  note            text not null default '',
  status          text not null default 'pending_teamlead',
  rate_vnd        numeric not null default 0,
  amount_vnd      numeric not null default 0,
  created_at      timestamptz not null default now(),
  teamlead_by     text,
  teamlead_at     timestamptz,
  qc_by           text,
  qc_at           timestamptz,
  supervisor_by   text,
  supervisor_at   timestamptz,
  reject_reason   text not null default ''
);

create index if not exists idx_shift_closes_status on public.shift_closes(status);
create index if not exists idx_shift_closes_worker on public.shift_closes(worker_id);
create index if not exists idx_rates_user on public.employee_product_rates(user_id);

-- Demo: NV030 / NV031 trên van NOVO-20 (product p1 nếu catalog memory; DB products id khác thì Admin cấu hình lại)
insert into public.employee_product_rates (id, user_id, product_id, rate_vnd)
values
  ('epr-u6-p1', 'u6', 'p1', 2500),
  ('epr-u7-p1', 'u7', 'p1', 2200)
on conflict (user_id, product_id) do nothing;
