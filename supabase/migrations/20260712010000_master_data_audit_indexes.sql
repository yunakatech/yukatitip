begin;

alter table public.audit_logs
  add column if not exists request_id text;

alter table public.positions
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.route_schedules
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.route_tariffs
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.employee_assignments
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists idx_audit_logs_request_id
  on public.audit_logs(request_id);

create index if not exists idx_branches_is_active
  on public.branches(is_active);

create index if not exists idx_routes_is_active
  on public.routes(is_active);

create index if not exists idx_route_schedules_is_active
  on public.route_schedules(is_active);

create index if not exists idx_route_tariffs_is_active
  on public.route_tariffs(is_active);

create index if not exists idx_customers_status
  on public.customers(status);

create index if not exists idx_stores_is_active
  on public.stores(is_active);

create index if not exists idx_positions_is_active
  on public.positions(is_active);

create index if not exists idx_employees_employment_status
  on public.employees(employment_status);

create index if not exists idx_employee_assignments_branch_id
  on public.employee_assignments(branch_id);

create index if not exists idx_employees_supervisor_employee_id
  on public.employees(supervisor_employee_id);

create index if not exists idx_stores_branch_id
  on public.stores(branch_id);

drop policy if exists branches_internal_read on public.branches;
create policy branches_internal_read
on public.branches for select
to authenticated
using (
  public.is_owner()
  or id = public.current_branch_id()
);

drop policy if exists customers_internal_read on public.customers;
create policy customers_internal_read
on public.customers for select
to authenticated
using (
  public.is_owner()
  or home_branch_id = public.current_branch_id()
);

drop policy if exists stores_internal_read on public.stores;
create policy stores_internal_read
on public.stores for select
to authenticated
using (
  public.is_owner()
  or branch_id = public.current_branch_id()
);

drop policy if exists employees_internal_read on public.employees;
create policy employees_internal_read
on public.employees for select
to authenticated
using (
  public.is_owner()
  or branch_id = public.current_branch_id()
);

drop policy if exists employee_assignments_internal_read on public.employee_assignments;
create policy employee_assignments_internal_read
on public.employee_assignments for select
to authenticated
using (
  public.is_owner()
  or branch_id = public.current_branch_id()
);

grant usage on schema public to authenticated;
grant select on table
  public.roles,
  public.permissions,
  public.role_permissions,
  public.branches,
  public.profiles,
  public.routes,
  public.route_schedules,
  public.route_tariffs,
  public.positions,
  public.expense_categories,
  public.customers,
  public.stores,
  public.employees,
  public.employee_assignments
to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'positions',
    'route_schedules',
    'route_tariffs',
    'employee_assignments'
  ]
  loop
    execute format(
      'drop trigger if exists %I on public.%I',
      'set_' || table_name || '_updated_at',
      table_name
    );
    execute format(
      'create trigger %I before update on public.%I
       for each row execute function public.set_updated_at()',
      'set_' || table_name || '_updated_at',
      table_name
    );
  end loop;
end $$;

commit;
