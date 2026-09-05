-- FKs for drawings / measurement_results / activities.
-- 20260903000001 created these tables without REFERENCES (Table Editor = 3 islands).
-- activities.entity_id stays polymorphic; typed FKs make the ERD.

create or replace function public._iqc_add_fk(p_name text, p_sql text) returns void
language plpgsql as $$
begin
  if exists (select 1 from pg_constraint where conname = p_name) then
    return;
  end if;
  execute p_sql;
exception when others then
  raise notice 'skip %: %', p_name, sqlerrm;
end $$;

create or replace function public._iqc_add_typed_col(p_table text, p_col text, p_like_table text)
returns void language plpgsql as $$
declare
  t text;
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = p_table and column_name = p_col
  ) then
    return;
  end if;
  select data_type into t
  from information_schema.columns
  where table_schema = 'public' and table_name = p_like_table and column_name = 'id';
  if t is null then
    return;
  end if;
  execute format('alter table public.%I add column %I %s', p_table, p_col, t);
end $$;

-- ── drawings.uploaded_by → users ──────────────────────────────────────────────
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'users') then
    update public.drawings d
    set uploaded_by_id = null
    where d.uploaded_by_id is not null
      and not exists (select 1 from public.users u where u.id = d.uploaded_by_id);
  end if;
end $$;

select public._iqc_add_fk(
  'drawings_uploaded_by_fkey',
  'alter table public.drawings add constraint drawings_uploaded_by_fkey foreign key (uploaded_by_id) references public.users(id) on delete set null'
);

select public._iqc_add_fk(
  'semi_products_drawing_id_fkey',
  'alter table public.semi_products add constraint semi_products_drawing_id_fkey foreign key (drawing_id) references public.drawings(id) on delete set null'
);

-- ── measurement_results ───────────────────────────────────────────────────────
select public._iqc_add_typed_col('measurement_results', 'drawing_id', 'drawings');

do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'production_orders') then
    delete from public.measurement_results m
    where not exists (select 1 from public.production_orders o where o.id = m.production_order_id);
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'semi_products') then
    delete from public.measurement_results m
    where not exists (select 1 from public.semi_products s where s.id = m.semi_product_id);
  end if;
end $$;

select public._iqc_add_fk(
  'measurement_results_order_fkey',
  'alter table public.measurement_results add constraint measurement_results_order_fkey foreign key (production_order_id) references public.production_orders(id) on delete cascade'
);
select public._iqc_add_fk(
  'measurement_results_semi_fkey',
  'alter table public.measurement_results add constraint measurement_results_semi_fkey foreign key (semi_product_id) references public.semi_products(id) on delete restrict'
);
select public._iqc_add_fk(
  'measurement_results_machine_fkey',
  'alter table public.measurement_results add constraint measurement_results_machine_fkey foreign key (machine_id) references public.machines(id) on delete set null'
);
select public._iqc_add_fk(
  'measurement_results_entered_by_fkey',
  'alter table public.measurement_results add constraint measurement_results_entered_by_fkey foreign key (entered_by_id) references public.users(id) on delete restrict'
);
select public._iqc_add_fk(
  'measurement_results_drawing_fkey',
  'alter table public.measurement_results add constraint measurement_results_drawing_fkey foreign key (drawing_id) references public.drawings(id) on delete set null'
);

-- ── activities ────────────────────────────────────────────────────────────────
select public._iqc_add_typed_col('activities', 'drawing_id', 'drawings');
select public._iqc_add_typed_col('activities', 'measurement_result_id', 'measurement_results');

do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'users') then
    update public.activities a
    set actor_id = null
    where a.actor_id is not null
      and not exists (select 1 from public.users u where u.id = a.actor_id);
  end if;
end $$;

select public._iqc_add_fk(
  'activities_actor_fkey',
  'alter table public.activities add constraint activities_actor_fkey foreign key (actor_id) references public.users(id) on delete set null'
);
select public._iqc_add_fk(
  'activities_drawing_fkey',
  'alter table public.activities add constraint activities_drawing_fkey foreign key (drawing_id) references public.drawings(id) on delete set null'
);
select public._iqc_add_fk(
  'activities_measurement_fkey',
  'alter table public.activities add constraint activities_measurement_fkey foreign key (measurement_result_id) references public.measurement_results(id) on delete set null'
);

comment on table public.drawings is
  'Kho file bản vẽ. Gắn linh kiện: semi_products.drawing_id. Phiếu đo: measurement_results.drawing_id.';
comment on table public.measurement_results is
  'Số đo: production_orders + semi_products + machines + drawings.';
comment on table public.activities is
  'Nhật ký. actor_id → users. entity_type+entity_id đa hình. drawing_id / measurement_result_id FK tường minh.';

drop function if exists public._iqc_add_fk(text, text);
drop function if exists public._iqc_add_typed_col(text, text, text);
