-- ============================================================
-- IQC — Auth sessions & device login approval (memory fallback
-- already works; run this when Supabase schema is ready)
-- ============================================================

create table if not exists public.auth_sessions (
  id            text primary key,
  user_id       text not null,
  refresh_hash  text not null,
  device_id     text not null,
  device_kind   text not null check (device_kind in ('mobile','desktop')),
  ip            text not null default '',
  user_agent    text not null default '',
  is_primary    boolean not null default false,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  revoked_at    timestamptz
);

create index if not exists auth_sessions_user_idx on public.auth_sessions(user_id);
create index if not exists auth_sessions_refresh_idx on public.auth_sessions(refresh_hash);

create table if not exists public.device_login_requests (
  id            text primary key,
  user_id       text not null,
  employee_id   text not null,
  user_name     text not null,
  device_id     text not null,
  ip            text not null default '',
  user_agent    text not null default '',
  status        text not null check (status in ('pending','approved','rejected')),
  requested_at  timestamptz not null default now(),
  reviewed_by   text,
  reviewed_at   timestamptz
);

create index if not exists device_login_user_idx on public.device_login_requests(user_id, status);
