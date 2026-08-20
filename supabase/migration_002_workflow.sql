-- ============================================================
-- IQC Migration 002 — Workflow tables
-- Chạy sau migration_001 trong Supabase SQL Editor
-- ============================================================

-- ── Enums mới ─────────────────────────────────────────────────────────────────
do $$ begin create type public.incident_status as enum
  ('open','assigned','in_progress','resolved','closed');
exception when duplicate_object then null; end $$;

do $$ begin create type public.incident_severity as enum ('low','medium','high','critical');
exception when duplicate_object then null; end $$;

do $$ begin create type public.overtime_status as enum
  ('pending','approved','rejected','completed');
exception when duplicate_object then null; end $$;

do $$ begin create type public.complaint_status as enum
  ('open','acknowledged','rework','resolved','closed');
exception when duplicate_object then null; end $$;

-- ── Sự cố máy (Machine Incidents) ────────────────────────────────────────────
-- Công nhân / Tổ trưởng báo cáo → Cơ điện xử lý → Quản đốc xác nhận
create table if not exists public.machine_incidents (
  id              text primary key,
  bom_id          text references public.boms(id) on delete set null,
  order_id        text references public.production_orders(id) on delete set null,
  machine_name    text not null,                      -- Tên/mã máy
  machine_code    text not null default '',
  severity        public.incident_severity not null default 'medium',
  description     text not null,                      -- Mô tả sự cố
  reported_by     text not null,                      -- user_id người báo
  reported_name   text not null,
  reported_at     timestamptz not null default now(),
  status          public.incident_status not null default 'open',
  assigned_to     text,                               -- user_id cơ điện nhận
  assigned_name   text,
  assigned_at     timestamptz,
  resolved_by     text,
  resolved_name   text,
  resolved_at     timestamptz,
  resolution_note text not null default '',           -- Ghi chú xử lý
  supervisor_confirmed_by   text,                     -- Quản đốc xác nhận
  supervisor_confirmed_at   timestamptz,
  downtime_minutes          integer not null default 0   -- Thời gian dừng máy (phút)
);

-- ── Đề xuất làm thêm máy / OT (Overtime Requests) ───────────────────────────
-- Tổ trưởng / NLĐ đề xuất → Quản đốc duyệt → GĐ duyệt (tuỳ chọn)
create table if not exists public.overtime_requests (
  id                text primary key,
  bom_id            text references public.boms(id) on delete set null,
  order_id          text references public.production_orders(id) on delete set null,
  requested_by      text not null,                    -- user_id người đề xuất
  requested_name    text not null,
  requested_at      timestamptz not null default now(),
  reason            text not null,                    -- Lý do làm thêm
  proposed_date     date not null,                    -- Ngày đề xuất làm thêm
  proposed_hours    numeric(4,1) not null default 2,  -- Số giờ làm thêm
  worker_ids        text[] not null default '{}',     -- Danh sách công nhân OT
  worker_names      text[] not null default '{}',
  status            public.overtime_status not null default 'pending',
  supervisor_id     text,
  supervisor_note   text not null default '',
  supervisor_at     timestamptz,
  director_id       text,
  director_note     text not null default '',
  director_at       timestamptz,
  actual_hours      numeric(4,1)                      -- Giờ OT thực tế (điền sau)
);

-- ── Khiếu nại chất lượng (QC Complaints) ─────────────────────────────────────
-- QC gửi → Tổ trưởng nhận → Xử lý (làm lại / loại bỏ) → QC xác nhận lại
create table if not exists public.qc_complaints (
  id                  text primary key,
  bom_id              text not null references public.boms(id) on delete cascade,
  order_id            text not null references public.production_orders(id) on delete cascade,
  -- Thông tin lỗi
  defect_type         text not null,                  -- Loại lỗi (vd: kích thước, ngoại quan)
  defect_description  text not null,
  defect_qty          integer not null default 0,     -- Số lượng lỗi
  sample_tt           integer[] not null default '{}',-- TT sản phẩm lỗi
  attachments         jsonb not null default '[]',    -- [{name, url, type}]
  -- QC gửi
  raised_by           text not null,                  -- user_id QC
  raised_name         text not null,
  raised_at           timestamptz not null default now(),
  -- Tổ trưởng nhận
  status              public.complaint_status not null default 'open',
  acknowledged_by     text,
  acknowledged_name   text,
  acknowledged_at     timestamptz,
  -- Hành động xử lý
  action_type         text,  -- 'rework' | 'scrap' | 'accept_as_is'
  action_note         text not null default '',
  action_by           text,
  action_name         text,
  action_at           timestamptz,
  rework_qty          integer,                        -- Số lượng làm lại
  scrap_qty           integer,                        -- Số lượng loại bỏ
  -- QC xác nhận lại
  qc_recheck_by       text,
  qc_recheck_name     text,
  qc_recheck_at       timestamptz,
  qc_recheck_result   text,  -- 'passed' | 'failed_again'
  qc_recheck_note     text not null default '',
  -- Quản đốc đóng
  closed_by           text,
  closed_at           timestamptz
);

-- ── Thống kê sản lượng thực tế (Production Stats snapshot) ───────────────────
-- Thống kê ghi lại số liệu cuối ca / cuối ngày
create table if not exists public.production_stats (
  id              text primary key,
  order_id        text not null references public.production_orders(id) on delete cascade,
  bom_id          text not null references public.boms(id) on delete cascade,
  stat_date       date not null,
  shift           text not null default 'day',        -- 'day' | 'night'
  recorded_by     text not null,
  recorded_name   text not null,
  recorded_at     timestamptz not null default now(),
  qty_produced    integer not null default 0,         -- Số lượng sản xuất trong ca
  qty_pass        integer not null default 0,
  qty_fail        integer not null default 0,
  qty_rework      integer not null default 0,
  downtime_mins   integer not null default 0,         -- Tổng thời gian dừng máy
  note            text not null default '',
  unique (bom_id, stat_date, shift)
);

-- ── Lịch sử trạng thái đơn hàng (Order Audit Log) ───────────────────────────
create table if not exists public.order_audit_logs (
  id          text primary key,
  order_id    text not null references public.production_orders(id) on delete cascade,
  bom_id      text references public.boms(id) on delete set null,
  action      text not null,          -- vd: 'created','approved','assigned','qc_passed'
  actor_id    text not null,
  actor_name  text not null,
  old_status  text,
  new_status  text,
  note        text not null default '',
  created_at  timestamptz not null default now()
);

-- ── Notifications (thông báo nội bộ) ─────────────────────────────────────────
create table if not exists public.notifications (
  id          text primary key,
  user_id     text not null references public.users(id) on delete cascade,
  type        text not null,          -- 'incident','overtime','complaint','order'
  ref_id      text,                   -- ID của bản ghi liên quan
  ref_type    text,                   -- tên bảng liên quan
  title       text not null,
  body        text not null default '',
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists idx_incidents_order    on public.machine_incidents(order_id);
create index if not exists idx_incidents_bom      on public.machine_incidents(bom_id);
create index if not exists idx_incidents_status   on public.machine_incidents(status);
create index if not exists idx_overtime_order     on public.overtime_requests(order_id);
create index if not exists idx_overtime_status    on public.overtime_requests(status);
create index if not exists idx_complaints_bom     on public.qc_complaints(bom_id);
create index if not exists idx_complaints_order   on public.qc_complaints(order_id);
create index if not exists idx_complaints_status  on public.qc_complaints(status);
create index if not exists idx_stats_bom          on public.production_stats(bom_id);
create index if not exists idx_stats_date         on public.production_stats(stat_date);
create index if not exists idx_audit_order        on public.order_audit_logs(order_id);
create index if not exists idx_notif_user         on public.notifications(user_id);
create index if not exists idx_notif_read         on public.notifications(user_id, is_read);
