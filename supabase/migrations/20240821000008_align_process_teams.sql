-- Align legacy groups t1/t2/t3 with process teams t_hot/t_auto/t_asm
insert into public.groups (id, name, lead, lead_short) values
  ('t_hot',  'Tổ Dập nóng', 'Phạm Văn Chí',   'P.V.Chí'),
  ('t_auto', 'Tổ Tự động',  'Phạm Văn Sang',  'P.V.Sang'),
  ('t_asm',  'Tổ Lắp ráp',  'Nguyễn Thị Hoa', 'N.T.Hoa')
on conflict (id) do update set
  name = excluded.name,
  lead = excluded.lead,
  lead_short = excluded.lead_short;

-- Remap memberships from legacy ids
update public.group_members set group_id = 't_hot'  where group_id = 't1';
update public.group_members set group_id = 't_auto' where group_id = 't2';
update public.group_members set group_id = 't_asm'  where group_id = 't3';

-- Remap BOM assignments still on legacy group ids
update public.boms set assigned_group_id = 't_hot'  where assigned_group_id = 't1';
update public.boms set assigned_group_id = 't_auto' where assigned_group_id = 't2';
update public.boms set assigned_group_id = 't_asm'  where assigned_group_id = 't3';

-- Fill null group id from assigned name when possible
update public.boms
set assigned_group_id = 't_hot'
where assigned_group_id is null
  and (assigned_group_name ilike '%dập nóng%' or assigned_group_name ilike '%dap nong%');

update public.boms
set assigned_group_id = 't_auto'
where assigned_group_id is null
  and (assigned_group_name ilike '%tự động%' or assigned_group_name ilike '%tu dong%');

update public.boms
set assigned_group_id = 't_asm'
where assigned_group_id is null
  and (assigned_group_name ilike '%lắp ráp%' or assigned_group_name ilike '%lap rap%');

-- Workers / teamlead demo (seed) → process teams
-- u12 = tổ trưởng Lắp ráp (có trong seed FE, chưa có ở migration core cũ)
insert into public.users (id, employee_id, name, password, department, phone, active) values
  ('u12', 'NV022', 'Nguyễn Thị Hoa', '123456', 'Tổ Lắp ráp', '0903456791', true),
  ('u13', 'NV032', 'Minh T2',        '123456', 'Tổ Tự động', '0904567892', true),
  ('u14', 'NV033', 'Hùng T2',        '123456', 'Tổ Tự động', '0904567893', true),
  ('u15', 'NV034', 'Lan LR',         '123456', 'Tổ Lắp ráp', '0904567894', true),
  ('u16', 'NV035', 'Đức LR',         '123456', 'Tổ Lắp ráp', '0904567895', true)
on conflict (id) do update set
  employee_id = excluded.employee_id,
  name = excluded.name,
  department = excluded.department,
  phone = excluded.phone,
  active = excluded.active;

insert into public.user_roles (user_id, role_id) values
  ('u12', 'teamlead'),
  ('u13', 'worker'),
  ('u14', 'worker'),
  ('u15', 'worker'),
  ('u16', 'worker')
on conflict do nothing;

-- Chỉ gán membership khi user thật sự tồn tại (tránh FK fail trên DB lệch seed)
insert into public.group_members (user_id, group_id, is_lead)
select v.user_id, v.group_id, v.is_lead
from (
  values
    ('u6',  't_hot',  false),
    ('u7',  't_hot',  false),
    ('u13', 't_auto', false),
    ('u14', 't_auto', false),
    ('u15', 't_asm',  false),
    ('u16', 't_asm',  false),
    ('u4',  't_hot',  true),
    ('u5',  't_auto', true),
    ('u12', 't_asm',  true)
) as v(user_id, group_id, is_lead)
where exists (select 1 from public.users u where u.id = v.user_id)
on conflict (user_id, group_id) do update set is_lead = excluded.is_lead;
