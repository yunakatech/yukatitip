-- ============================================================================
-- Yukatitip MVP Database Schema
-- Target: Supabase PostgreSQL
-- Source of truth: PRD_Yukatitip.md + AGENTS.md
-- Generated: 2026-07-12
--
-- Security model:
-- - Supabase Auth handles internal user authentication.
-- - Sensitive business data is deny-by-default through RLS.
-- - Cloudflare Pages Functions / Workers perform server-side authorization
--   and access sensitive tables using the Supabase service-role key.
-- - Never expose the service-role key to the browser.
-- ============================================================================

begin;

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ============================================================================
-- ENUMS
-- ============================================================================

do $$ begin
  create type public.account_status as enum ('active', 'inactive', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.employment_status as enum ('active', 'inactive', 'suspended', 'resigned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.customer_type as enum ('individual', 'business', 'reseller');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.service_type as enum ('purchase', 'pickup', 'delivery');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.staff_task_revenue_type as enum (
    'purchase_service',
    'pickup_service',
    'delivery_service',
    'local_delivery_service',
    'handling_service',
    'other_service'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.fulfillment_method as enum ('branch_pickup', 'local_delivery');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum (
    'recorded',
    'waiting_payment',
    'payment_received',
    'waiting_origin_process',
    'purchasing_or_collecting',
    'received_at_origin',
    'waiting_departure',
    'in_transit',
    'arrived_at_destination',
    'ready_for_handover',
    'completed',
    'problem',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_item_status as enum (
    'recorded',
    'waiting_confirmation',
    'available',
    'unavailable',
    'purchased',
    'collected',
    'received_at_origin',
    'packed',
    'completed',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum (
    'unpaid',
    'partial',
    'paid',
    'refunded',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.trip_status as enum (
    'draft',
    'preparing',
    'ready_to_depart',
    'in_transit',
    'arrived',
    'completed',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_status as enum (
    'draft',
    'assigned',
    'started',
    'in_progress',
    'waiting_confirmation',
    'completed',
    'problem',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.handover_type as enum ('departure', 'arrival');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.advance_status as enum (
    'submitted',
    'approved',
    'disbursed',
    'in_use',
    'waiting_settlement',
    'settled',
    'overdue',
    'rejected',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.expense_approval_status as enum (
    'draft',
    'submitted',
    'waiting_verification',
    'approved',
    'rejected',
    'included_in_commission'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.commission_period_status as enum (
    'draft',
    'calculated',
    'waiting_approval',
    'approved',
    'locked'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payroll_status as enum (
    'draft',
    'calculated',
    'waiting_approval',
    'approved',
    'paid',
    'locked'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payroll_item_type as enum (
    'base_salary',
    'vehicle_allowance',
    'communication_allowance',
    'commission',
    'deduction',
    'reimbursement'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.branch_expense_status as enum (
    'draft',
    'waiting_approval',
    'approved',
    'paid',
    'rejected',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.petty_cash_transaction_type as enum (
    'cash_in',
    'cash_out',
    'advance_return',
    'adjustment'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attachment_entity_type as enum (
    'order',
    'order_item',
    'payment',
    'trip',
    'trip_handover',
    'task',
    'operational_advance',
    'operational_expense',
    'branch_expense',
    'rent_contract',
    'employee'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.revenue_status as enum (
    'pending',
    'eligible',
    'excluded',
    'included_in_commission'
  );
exception when duplicate_object then null; end $$;

-- ============================================================================
-- SHARED FUNCTIONS
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ============================================================================
-- ORGANIZATION, ACCESS, AND SETTINGS
-- ============================================================================

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  module text not null,
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (role_id, permission_id)
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code)),
  name text not null,
  city text not null,
  address text,
  whatsapp text,
  maps_url text,
  opening_hours text,
  is_active boolean not null default true,
  head_employee_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role_id uuid not null references public.roles(id),
  branch_id uuid references public.branches(id),
  status public.account_status not null default 'active',
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  origin_branch_id uuid not null references public.branches(id),
  destination_branch_id uuid not null references public.branches(id),
  name text not null,
  estimated_duration_minutes integer check (estimated_duration_minutes is null or estimated_duration_minutes > 0),
  base_fee bigint not null default 0 check (base_fee >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint routes_different_branches check (origin_branch_id <> destination_branch_id),
  constraint routes_unique_direction unique (origin_branch_id, destination_branch_id)
);

create table if not exists public.route_schedules (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  departure_time time not null,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (route_id, day_of_week, departure_time)
);

create table if not exists public.route_tariffs (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  service_type public.service_type not null,
  minimum_service_fee bigint not null default 0 check (minimum_service_fee >= 0),
  percentage_fee numeric(5,2) not null default 0 check (percentage_fee between 0 and 100),
  local_delivery_fee bigint not null default 0 check (local_delivery_fee >= 0),
  handling_fee bigint not null default 0 check (handling_fee >= 0),
  effective_from date not null,
  effective_until date,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint route_tariffs_valid_period check (
    effective_until is null or effective_until >= effective_from
  )
);

create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete cascade,
  setting_key text not null,
  setting_value jsonb not null,
  description text,
  is_public boolean not null default false,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique nulls not distinct (branch_id, setting_key)
);

-- ============================================================================
-- EMPLOYEES AND COMPENSATION
-- ============================================================================

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  level smallint not null default 1 check (level > 0),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_number text not null unique,
  profile_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  address text,
  branch_id uuid not null references public.branches(id),
  position_id uuid not null references public.positions(id),
  supervisor_employee_id uuid references public.employees(id) on delete set null,
  join_date date not null,
  employment_status public.employment_status not null default 'active',
  bank_name text,
  bank_account text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.branches
  drop constraint if exists branches_head_employee_id_fkey;

alter table public.branches
  add constraint branches_head_employee_id_fkey
  foreign key (head_employee_id)
  references public.employees(id)
  on delete set null;

create or replace function public.validate_branch_head_employee()
returns trigger
language plpgsql
as $$
declare
  employee_branch_id uuid;
  employee_status public.employment_status;
  employee_position_code text;
begin
  if new.head_employee_id is null then
    return new;
  end if;

  select e.branch_id, e.employment_status, p.code
    into employee_branch_id, employee_status, employee_position_code
  from public.employees e
  join public.positions p on p.id = e.position_id
  where e.id = new.head_employee_id;

  if not found then
    raise exception 'Head employee % does not exist', new.head_employee_id;
  end if;

  if employee_branch_id <> new.id then
    raise exception 'Head employee % must belong to the same branch', new.head_employee_id;
  end if;

  if employee_status <> 'active' then
    raise exception 'Head employee % must be active', new.head_employee_id;
  end if;

  if employee_position_code <> 'branch_manager' then
    raise exception 'Head employee % must have branch_manager position', new.head_employee_id;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_branch_head_employee_trigger on public.branches;
create trigger validate_branch_head_employee_trigger
before insert or update of head_employee_id
on public.branches
for each row execute function public.validate_branch_head_employee();

create or replace function public.validate_employee_branch_head_assignment()
returns trigger
language plpgsql
as $$
declare
  branch_head_id uuid;
begin
  select b.id
    into branch_head_id
  from public.branches b
  where b.head_employee_id = old.id
  limit 1;

  if branch_head_id is null then
    return new;
  end if;

  if new.branch_id <> branch_head_id then
    raise exception 'Head employee % must stay in the same branch', old.id;
  end if;

  if new.employment_status <> 'active' then
    raise exception 'Head employee % must remain active', old.id;
  end if;

  if not exists (
    select 1
    from public.positions p
    where p.id = new.position_id
      and p.code = 'branch_manager'
  ) then
    raise exception 'Head employee % must keep branch_manager position', old.id;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_employee_branch_head_assignment_trigger on public.employees;
create trigger validate_employee_branch_head_assignment_trigger
before update of branch_id, position_id, employment_status
on public.employees
for each row execute function public.validate_employee_branch_head_assignment();

create table if not exists public.employee_assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  position_id uuid not null references public.positions(id),
  effective_from date not null,
  effective_until date,
  supervisor_employee_id uuid references public.employees(id) on delete set null,
  reason text not null default '',
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint employee_assignments_valid_period check (
    effective_until is null or effective_until >= effective_from
  )
);

create unique index if not exists idx_employee_assignments_one_active
  on public.employee_assignments(employee_id)
  where effective_until is null;

create index if not exists idx_employee_assignments_employee_effective
  on public.employee_assignments(employee_id, effective_from desc, created_at desc);

drop index if exists idx_employee_assignments_employee_id;
create index if not exists idx_employee_assignments_employee_id
  on public.employee_assignments(employee_id);

alter table public.employee_assignments drop constraint if exists employee_assignments_no_overlap;
alter table public.employee_assignments
  add constraint employee_assignments_no_overlap
  exclude using gist (
    employee_id with =,
    daterange(effective_from, coalesce(effective_until, 'infinity'::date), '[]') with &&
  );

create table if not exists public.employee_compensations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  base_salary bigint not null default 0 check (base_salary >= 0),
  vehicle_allowance bigint not null default 0 check (vehicle_allowance >= 0),
  communication_allowance bigint not null default 0 check (communication_allowance >= 0),
  commission_rate numeric(5,2) not null default 0 check (commission_rate between 0 and 100),
  effective_from date not null,
  effective_until date,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  constraint employee_compensations_valid_period check (
    effective_until is null or effective_until >= effective_from
  )
);

-- ============================================================================
-- CUSTOMERS, STORES, ORDERS, AND PAYMENTS
-- ============================================================================

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  home_branch_id uuid references public.branches(id),
  name text not null,
  phone text not null unique,
  email text,
  customer_type public.customer_type not null default 'individual',
  address text,
  district text,
  city text,
  landmark text,
  status public.account_status not null default 'active',
  notes text,
  first_transaction_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id),
  name text not null,
  address text,
  city text,
  phone text,
  maps_url text,
  opening_hours text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tracking_number text not null unique,
  service_type public.service_type not null,
  fulfillment_method public.fulfillment_method not null default 'branch_pickup',
  origin_branch_id uuid not null references public.branches(id),
  destination_branch_id uuid not null references public.branches(id),
  route_id uuid not null references public.routes(id),
  sender_customer_id uuid not null references public.customers(id),
  receiver_customer_id uuid references public.customers(id),
  status public.order_status not null default 'recorded',
  payment_status public.payment_status not null default 'unpaid',
  goods_amount bigint not null default 0 check (goods_amount >= 0),
  service_revenue bigint not null default 0 check (service_revenue >= 0),
  additional_service_fees bigint not null default 0 check (additional_service_fees >= 0),
  discount_amount bigint not null default 0 check (discount_amount >= 0),
  total_customer_payment bigint generated always as (
    greatest(
      0::bigint,
      goods_amount + service_revenue + additional_service_fees - discount_amount
    )
  ) stored,
  delivery_address text,
  public_notes text,
  internal_notes text,
  created_by uuid not null references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  version integer not null default 1 check (version >= 1),
  constraint orders_different_branches check (origin_branch_id <> destination_branch_id)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  store_id uuid references public.stores(id),
  product_name text not null,
  product_url text,
  quantity integer not null default 1 check (quantity > 0),
  estimated_unit_price bigint not null default 0 check (estimated_unit_price >= 0),
  actual_unit_price bigint check (actual_unit_price is null or actual_unit_price >= 0),
  weight_grams integer check (weight_grams is null or weight_grams >= 0),
  attributes jsonb not null default '{}'::jsonb,
  notes text,
  status public.order_item_status not null default 'recorded',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  public_description text not null,
  internal_description text,
  location text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount bigint not null check (amount > 0),
  payment_method text not null,
  status public.payment_status not null default 'unpaid',
  paid_at timestamptz,
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

-- ============================================================================
-- TRIPS, HANDOVERS, AND STAFF TASKS
-- ============================================================================

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  trip_number text not null unique,
  route_id uuid not null references public.routes(id),
  origin_branch_id uuid not null references public.branches(id),
  destination_branch_id uuid not null references public.branches(id),
  departure_at timestamptz,
  arrival_at timestamptz,
  origin_staff_id uuid references public.employees(id),
  destination_staff_id uuid references public.employees(id),
  status public.trip_status not null default 'draft',
  vehicle_description text,
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint trips_different_branches check (origin_branch_id <> destination_branch_id),
  constraint trips_valid_time check (
    arrival_at is null or departure_at is null or arrival_at >= departure_at
  )
);

create table if not exists public.trip_orders (
  trip_id uuid not null references public.trips(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  package_count integer not null default 1 check (package_count > 0),
  added_by uuid references public.profiles(id),
  added_at timestamptz not null default timezone('utc', now()),
  primary key (trip_id, order_id),
  unique (order_id)
);

create table if not exists public.trip_handovers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  handover_type public.handover_type not null,
  employee_id uuid not null references public.employees(id),
  total_packages integer not null check (total_packages >= 0),
  notes text,
  confirmed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (trip_id, handover_type)
);

create table if not exists public.staff_tasks (
  id uuid primary key default gen_random_uuid(),
  task_number text not null unique,
  branch_id uuid not null references public.branches(id),
  trip_id uuid references public.trips(id) on delete set null,
  assigned_to uuid not null references public.employees(id),
  area text,
  operational_budget bigint not null default 0 check (operational_budget >= 0),
  status public.task_status not null default 'draft',
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint staff_tasks_valid_time check (
    completed_at is null or started_at is null or completed_at >= started_at
  )
);

create table if not exists public.task_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.staff_tasks(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  status public.task_status not null default 'assigned',
  actual_price bigint check (actual_price is null or actual_price >= 0),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (task_id, order_item_id)
);

-- ============================================================================
-- EXPENSE CATEGORIES, ADVANCES, AND DAILY OPERATIONAL EXPENSES
-- ============================================================================

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  scope text not null check (scope in ('field', 'branch', 'both')),
  requires_receipt boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.commission_periods (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id),
  period_start date not null,
  period_end date not null,
  status public.commission_period_status not null default 'draft',
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  locked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint commission_periods_valid_period check (period_end >= period_start),
  unique (branch_id, period_start, period_end)
);

create table if not exists public.daily_operational_advances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id),
  branch_id uuid not null references public.branches(id),
  task_id uuid references public.staff_tasks(id) on delete set null,
  trip_id uuid references public.trips(id) on delete set null,
  advance_date date not null,
  amount bigint not null check (amount > 0),
  status public.advance_status not null default 'submitted',
  submitted_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  disbursed_by uuid references public.profiles(id),
  disbursed_at timestamptz,
  settled_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.daily_operational_expenses (
  id uuid primary key default gen_random_uuid(),
  advance_id uuid references public.daily_operational_advances(id) on delete set null,
  employee_id uuid not null references public.employees(id),
  branch_id uuid not null references public.branches(id),
  task_id uuid references public.staff_tasks(id) on delete set null,
  trip_id uuid references public.trips(id) on delete set null,
  category_id uuid not null references public.expense_categories(id),
  expense_date date not null,
  amount bigint not null check (amount > 0),
  notes text,
  approval_status public.expense_approval_status not null default 'draft',
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  commission_period_id uuid references public.commission_periods(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Canonical revenue_type values:
-- purchase_service, pickup_service, delivery_service, local_delivery_service, handling_service, other_service.
create table if not exists public.staff_task_revenues (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id),
  task_id uuid not null references public.staff_tasks(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  revenue_type public.staff_task_revenue_type not null,
  gross_revenue bigint not null check (gross_revenue >= 0),
  allocated_revenue bigint not null check (allocated_revenue >= 0),
  revenue_date date not null,
  status public.revenue_status not null default 'pending',
  commission_period_id uuid references public.commission_periods(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (employee_id, task_id, order_id, revenue_type)
);

-- net_contribution is clamped to zero and commission_amount is rounded by the database.
create table if not exists public.employee_commissions (
  id uuid primary key default gen_random_uuid(),
  commission_period_id uuid not null references public.commission_periods(id) on delete cascade,
  employee_id uuid not null references public.employees(id),
  total_revenue bigint not null default 0 check (total_revenue >= 0),
  total_operational_expense bigint not null default 0 check (total_operational_expense >= 0),
  net_contribution bigint generated always as (
    greatest(0::bigint, total_revenue - total_operational_expense)
  ) stored,
  commission_rate numeric(5,2) not null check (commission_rate between 0 and 100),
  commission_amount bigint generated always as (
    round(
      greatest(0::numeric, (total_revenue - total_operational_expense)::numeric)
      * commission_rate
      / 100.0
    )::bigint
  ) stored,
  status public.commission_period_status not null default 'draft',
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (commission_period_id, employee_id)
);

-- ============================================================================
-- PAYROLL
-- ============================================================================

create table if not exists public.payroll_periods (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id),
  period_start date not null,
  period_end date not null,
  status public.payroll_status not null default 'draft',
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  paid_at timestamptz,
  locked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint payroll_periods_valid_period check (period_end >= period_start),
  unique (branch_id, period_start, period_end)
);

create table if not exists public.payroll_items (
  id uuid primary key default gen_random_uuid(),
  payroll_period_id uuid not null references public.payroll_periods(id) on delete cascade,
  employee_id uuid not null references public.employees(id),
  item_type public.payroll_item_type not null,
  description text not null,
  amount bigint not null,
  reference_id uuid,
  created_at timestamptz not null default timezone('utc', now())
);

-- ============================================================================
-- BRANCH EXPENSES, BUDGETS, RENT, AND PETTY CASH
-- ============================================================================

create table if not exists public.branch_expenses (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id),
  category_id uuid not null references public.expense_categories(id),
  vendor text,
  amount bigint not null check (amount > 0),
  period_start date,
  period_end date,
  invoice_date date,
  due_date date,
  paid_at timestamptz,
  status public.branch_expense_status not null default 'draft',
  notes text,
  created_by uuid not null references public.profiles(id),
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint branch_expenses_valid_period check (
    period_end is null or period_start is null or period_end >= period_start
  )
);

create table if not exists public.branch_budgets (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id),
  category_id uuid not null references public.expense_categories(id),
  budget_month date not null check (budget_month = date_trunc('month', budget_month)::date),
  budget_amount bigint not null check (budget_amount >= 0),
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (branch_id, category_id, budget_month)
);

create table if not exists public.branch_rent_contracts (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id),
  landlord_name text not null,
  start_date date not null,
  end_date date not null,
  total_amount bigint not null check (total_amount > 0),
  payment_date date,
  monthly_allocation bigint not null check (monthly_allocation >= 0),
  status public.account_status not null default 'active',
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint branch_rent_contracts_valid_period check (end_date >= start_date)
);

create table if not exists public.petty_cash_transactions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id),
  transaction_type public.petty_cash_transaction_type not null,
  category_id uuid references public.expense_categories(id),
  amount bigint not null check (amount > 0),
  employee_id uuid references public.employees(id),
  description text not null,
  transaction_date date not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now())
);

-- ============================================================================
-- FILE METADATA AND AUDIT
-- ============================================================================

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  entity_type public.attachment_entity_type not null,
  entity_id uuid not null,
  object_key text not null unique,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  is_private boolean not null default true,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  request_id text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

-- ============================================================================
-- DOMAIN VALIDATION TRIGGERS
-- ============================================================================

create or replace function public.validate_order_route()
returns trigger
language plpgsql
as $$
declare
  route_origin uuid;
  route_destination uuid;
begin
  select origin_branch_id, destination_branch_id
    into route_origin, route_destination
  from public.routes
  where id = new.route_id;

  if route_origin is null then
    raise exception 'Route % does not exist', new.route_id;
  end if;

  if route_origin <> new.origin_branch_id
     or route_destination <> new.destination_branch_id then
    raise exception 'Order branches must match selected route direction';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_order_route_trigger on public.orders;
create trigger validate_order_route_trigger
before insert or update of route_id, origin_branch_id, destination_branch_id
on public.orders
for each row execute function public.validate_order_route();

create or replace function public.validate_trip_route()
returns trigger
language plpgsql
as $$
declare
  route_origin uuid;
  route_destination uuid;
begin
  select origin_branch_id, destination_branch_id
    into route_origin, route_destination
  from public.routes
  where id = new.route_id;

  if route_origin is null then
    raise exception 'Route % does not exist', new.route_id;
  end if;

  if route_origin <> new.origin_branch_id
     or route_destination <> new.destination_branch_id then
    raise exception 'Trip branches must match selected route direction';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_trip_route_trigger on public.trips;
create trigger validate_trip_route_trigger
before insert or update of route_id, origin_branch_id, destination_branch_id
on public.trips
for each row execute function public.validate_trip_route();

create or replace function public.validate_trip_order_route()
returns trigger
language plpgsql
as $$
declare
  trip_route uuid;
  order_route uuid;
begin
  select route_id into trip_route from public.trips where id = new.trip_id;
  select route_id into order_route from public.orders where id = new.order_id;

  if trip_route is null or order_route is null then
    raise exception 'Trip or order does not exist';
  end if;

  if trip_route <> order_route then
    raise exception 'Order route must match trip route';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_trip_order_route_trigger on public.trip_orders;
create trigger validate_trip_order_route_trigger
before insert or update of trip_id, order_id
on public.trip_orders
for each row execute function public.validate_trip_order_route();

create or replace function public.increment_order_version()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.version = old.version + 1;
  return new;
end;
$$;

drop trigger if exists increment_orders_version_trigger on public.orders;
create trigger increment_orders_version_trigger
before update on public.orders
for each row execute function public.increment_order_version();

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'branches',
    'profiles',
    'routes',
    'system_settings',
    'positions',
    'route_schedules',
    'route_tariffs',
    'employees',
    'employee_assignments',
    'customers',
    'stores',
    'orders',
    'order_items',
    'trips',
    'staff_tasks',
    'task_items',
    'daily_operational_advances',
    'daily_operational_expenses',
    'employee_commissions',
    'branch_expenses',
    'branch_budgets',
    'branch_rent_contracts'
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

-- ============================================================================
-- INDEXES
-- ============================================================================

create index if not exists idx_profiles_role_id on public.profiles(role_id);
create index if not exists idx_profiles_branch_id on public.profiles(branch_id);
create index if not exists idx_branches_head_employee_id on public.branches(head_employee_id);
create index if not exists idx_branches_is_active on public.branches(is_active);
create index if not exists idx_employees_branch_id on public.employees(branch_id);
create index if not exists idx_employees_position_id on public.employees(position_id);
create index if not exists idx_employees_supervisor_employee_id on public.employees(supervisor_employee_id);
create index if not exists idx_employees_employment_status on public.employees(employment_status);
create index if not exists idx_employee_assignments_employee_id on public.employee_assignments(employee_id);
create index if not exists idx_employee_assignments_branch_id on public.employee_assignments(branch_id);
create index if not exists idx_employee_compensations_employee_effective
  on public.employee_compensations(employee_id, effective_from desc);

create index if not exists idx_routes_origin_destination
  on public.routes(origin_branch_id, destination_branch_id);
create index if not exists idx_routes_is_active on public.routes(is_active);
create index if not exists idx_route_schedules_route_id on public.route_schedules(route_id);
create index if not exists idx_route_schedules_is_active on public.route_schedules(is_active);
create index if not exists idx_route_tariffs_route_effective
  on public.route_tariffs(route_id, service_type, effective_from desc);
create index if not exists idx_route_tariffs_is_active on public.route_tariffs(is_active);

create index if not exists idx_customers_home_branch_id on public.customers(home_branch_id);
create index if not exists idx_customers_status on public.customers(status);
create index if not exists idx_customers_name on public.customers using gin (to_tsvector('simple', name));
create index if not exists idx_orders_origin_branch_id on public.orders(origin_branch_id);
create index if not exists idx_orders_destination_branch_id on public.orders(destination_branch_id);
create index if not exists idx_orders_route_id on public.orders(route_id);
create index if not exists idx_orders_sender_customer_id on public.orders(sender_customer_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_store_id on public.order_items(store_id);
create index if not exists idx_tracking_events_order_created
  on public.tracking_events(order_id, created_at desc);
create index if not exists idx_payments_order_id on public.payments(order_id);

create index if not exists idx_trips_route_id on public.trips(route_id);
create index if not exists idx_trips_status_departure on public.trips(status, departure_at);
create index if not exists idx_trip_orders_order_id on public.trip_orders(order_id);
create index if not exists idx_staff_tasks_branch_id on public.staff_tasks(branch_id);
create index if not exists idx_staff_tasks_assigned_to on public.staff_tasks(assigned_to);
create index if not exists idx_staff_tasks_status on public.staff_tasks(status);
create index if not exists idx_task_items_task_id on public.task_items(task_id);
create index if not exists idx_stores_is_active on public.stores(is_active);
create index if not exists idx_positions_is_active on public.positions(is_active);

create index if not exists idx_advances_employee_date
  on public.daily_operational_advances(employee_id, advance_date desc);
create index if not exists idx_advances_branch_status
  on public.daily_operational_advances(branch_id, status);
create index if not exists idx_expenses_employee_date
  on public.daily_operational_expenses(employee_id, expense_date desc);
create index if not exists idx_expenses_branch_status
  on public.daily_operational_expenses(branch_id, approval_status);
create index if not exists idx_expenses_commission_period
  on public.daily_operational_expenses(commission_period_id);
create index if not exists idx_staff_revenues_employee_date
  on public.staff_task_revenues(employee_id, revenue_date desc);
create index if not exists idx_employee_commissions_period
  on public.employee_commissions(commission_period_id);

create index if not exists idx_payroll_items_period_employee
  on public.payroll_items(payroll_period_id, employee_id);
create index if not exists idx_branch_expenses_branch_period
  on public.branch_expenses(branch_id, period_start, period_end);
create index if not exists idx_petty_cash_branch_date
  on public.petty_cash_transactions(branch_id, transaction_date desc);
create index if not exists idx_attachments_entity
  on public.attachments(entity_type, entity_id);
create index if not exists idx_audit_logs_entity
  on public.audit_logs(entity_type, entity_id, created_at desc);
create index if not exists idx_audit_logs_actor
  on public.audit_logs(actor_profile_id, created_at desc);
create index if not exists idx_audit_logs_request_id
  on public.audit_logs(request_id);

-- ============================================================================
-- AUTHORIZATION HELPERS
-- ============================================================================

create or replace function public.current_role_code()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.code
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = auth.uid()
    and p.status = 'active'
  limit 1;
$$;

create or replace function public.current_branch_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.branch_id
  from public.profiles p
  where p.id = auth.uid()
    and p.status = 'active'
  limit 1;
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role_code() = 'owner', false);
$$;

create or replace function public.can_access_branch(target_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_owner()
    or public.current_branch_id() = target_branch_id;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- Sensitive transactional tables intentionally have no broad browser policies.
-- Workers/Pages Functions must enforce role and branch authorization server-side.
-- ============================================================================

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.routes enable row level security;
alter table public.route_schedules enable row level security;
alter table public.route_tariffs enable row level security;
alter table public.system_settings enable row level security;
alter table public.positions enable row level security;
alter table public.employees enable row level security;
alter table public.employee_assignments enable row level security;
alter table public.employee_compensations enable row level security;
alter table public.customers enable row level security;
alter table public.stores enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.tracking_events enable row level security;
alter table public.payments enable row level security;
alter table public.trips enable row level security;
alter table public.trip_orders enable row level security;
alter table public.trip_handovers enable row level security;
alter table public.staff_tasks enable row level security;
alter table public.task_items enable row level security;
alter table public.expense_categories enable row level security;
alter table public.commission_periods enable row level security;
alter table public.daily_operational_advances enable row level security;
alter table public.daily_operational_expenses enable row level security;
alter table public.staff_task_revenues enable row level security;
alter table public.employee_commissions enable row level security;
alter table public.payroll_periods enable row level security;
alter table public.payroll_items enable row level security;
alter table public.branch_expenses enable row level security;
alter table public.branch_budgets enable row level security;
alter table public.branch_rent_contracts enable row level security;
alter table public.petty_cash_transactions enable row level security;
alter table public.attachments enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists roles_authenticated_read on public.roles;
create policy roles_authenticated_read
on public.roles for select
to authenticated
using (true);

drop policy if exists permissions_authenticated_read on public.permissions;
create policy permissions_authenticated_read
on public.permissions for select
to authenticated
using (true);

drop policy if exists role_permissions_authenticated_read on public.role_permissions;
create policy role_permissions_authenticated_read
on public.role_permissions for select
to authenticated
using (true);

drop policy if exists own_profile_read on public.profiles;
create policy own_profile_read
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_owner());

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

drop policy if exists routes_internal_read on public.routes;
create policy routes_internal_read
on public.routes for select
to authenticated
using (
  public.is_owner()
  or origin_branch_id = public.current_branch_id()
  or destination_branch_id = public.current_branch_id()
);

drop policy if exists route_schedules_internal_read on public.route_schedules;
create policy route_schedules_internal_read
on public.route_schedules for select
to authenticated
using (
  exists (
    select 1
    from public.routes r
    where r.id = route_id
      and (
        public.is_owner()
        or r.origin_branch_id = public.current_branch_id()
        or r.destination_branch_id = public.current_branch_id()
      )
  )
);

drop policy if exists route_tariffs_internal_read on public.route_tariffs;
create policy route_tariffs_internal_read
on public.route_tariffs for select
to authenticated
using (
  exists (
    select 1
    from public.routes r
    where r.id = route_id
      and (
        public.is_owner()
        or r.origin_branch_id = public.current_branch_id()
        or r.destination_branch_id = public.current_branch_id()
      )
  )
);

drop policy if exists positions_authenticated_read on public.positions;
create policy positions_authenticated_read
on public.positions for select
to authenticated
using (true);

drop policy if exists expense_categories_authenticated_read on public.expense_categories;
create policy expense_categories_authenticated_read
on public.expense_categories for select
to authenticated
using (is_active = true or public.is_owner());

-- Authenticated browser reads need explicit grants in addition to RLS.
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

-- ============================================================================
-- REFERENCE DATA
-- ============================================================================

insert into public.roles (code, name, description)
values
  ('owner', 'Owner', 'Akses penuh ke seluruh cabang dan pengaturan.'),
  ('branch_manager', 'Kepala Cabang', 'Mengelola operasional cabang.'),
  ('branch_admin', 'Admin Cabang', 'Mengelola administrasi cabang.'),
  ('field_staff', 'Petugas Lapangan', 'Mengambil atau membeli barang.'),
  ('destination_staff', 'Petugas Tujuan', 'Menerima dan menyerahkan barang.')
on conflict (code) do update
set name = excluded.name,
    description = excluded.description;

insert into public.positions (code, name, level, description)
values
  ('owner', 'Owner', 5, 'Penanggung jawab seluruh usaha.'),
  ('branch_manager', 'Kepala Cabang', 4, 'Penanggung jawab operasional cabang.'),
  ('branch_admin', 'Admin Cabang', 3, 'Administrasi pesanan dan cabang.'),
  ('field_staff', 'Petugas Lapangan', 2, 'Pembelian dan pengambilan barang.'),
  ('destination_staff', 'Petugas Tujuan', 2, 'Penerimaan dan serah terima barang.')
on conflict (code) do update
set name = excluded.name,
    level = excluded.level,
    description = excluded.description;

insert into public.expense_categories (code, name, scope, requires_receipt)
values
  ('fuel', 'BBM', 'field', true),
  ('meal', 'Uang Makan', 'field', false),
  ('parking', 'Parkir', 'field', true),
  ('toll', 'Tol', 'field', true),
  ('transport', 'Transportasi Tambahan', 'field', true),
  ('handling', 'Angkut / Bongkar Muat', 'field', true),
  ('packaging', 'Pengemasan', 'both', true),
  ('entry_fee', 'Biaya Masuk Lokasi', 'field', true),
  ('rent', 'Sewa', 'branch', true),
  ('electricity', 'Listrik', 'branch', true),
  ('water', 'Air', 'branch', true),
  ('internet', 'Internet / Wi-Fi', 'branch', true),
  ('cleaning', 'Kebersihan', 'branch', true),
  ('security', 'Keamanan', 'branch', true),
  ('office_supplies', 'ATK / Perlengkapan Kantor', 'branch', true),
  ('maintenance', 'Perawatan', 'branch', true),
  ('other', 'Lainnya', 'both', true)
on conflict (code) do update
set name = excluded.name,
    scope = excluded.scope,
    requires_receipt = excluded.requires_receipt;

commit;
