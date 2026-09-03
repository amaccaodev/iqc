-- Indexes for paginated search on large lists (users, products, BTP)

create index if not exists idx_users_employee_id on public.users (employee_id);
create index if not exists idx_users_name on public.users (name);
create index if not exists idx_users_department on public.users (department);
create index if not exists idx_users_active on public.users (active);

create index if not exists idx_products_code on public.products (code);
create index if not exists idx_products_name on public.products (name);
create index if not exists idx_products_active on public.products (active);

create index if not exists idx_semi_products_code on public.semi_products (code);
create index if not exists idx_semi_products_name on public.semi_products (name);
create index if not exists idx_semi_products_product on public.semi_products (product_id);
