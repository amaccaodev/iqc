-- Local file storage (no cloud): base64 / webp content in DB
-- Product & linh kiện (semi) can have many drawings / tech specs

alter table public.order_attachments
  add column if not exists mime_type text not null default '',
  add column if not exists content_base64 text,
  add column if not exists kind text not null default 'other';

alter table public.bom_attachments
  add column if not exists mime_type text not null default '',
  add column if not exists content_base64 text,
  add column if not exists kind text not null default 'other';

create table if not exists public.product_attachments (
  id              text primary key,
  product_id      text not null,
  name            text not null,
  type            public.attachment_type not null,
  size            text not null default '',
  uploaded_by     text not null default '',
  uploaded_at     text not null default '',
  mime_type       text not null default '',
  content_base64  text,
  kind            text not null default 'drawing'
);

create table if not exists public.semi_product_attachments (
  id              text primary key,
  semi_product_id text not null,
  name            text not null,
  type            public.attachment_type not null,
  size            text not null default '',
  uploaded_by     text not null default '',
  uploaded_at     text not null default '',
  mime_type       text not null default '',
  content_base64  text,
  kind            text not null default 'drawing'
);

create index if not exists idx_product_attach on public.product_attachments(product_id);
create index if not exists idx_semi_attach on public.semi_product_attachments(semi_product_id);
