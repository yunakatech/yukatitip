begin;

create extension if not exists btree_gist;

alter table public.employee_assignments
  add column if not exists supervisor_employee_id uuid references public.employees(id) on delete set null,
  add column if not exists reason text not null default '',
  add column if not exists created_by uuid references public.profiles(id),
  add column if not exists updated_by uuid references public.profiles(id);

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

create or replace function public.apply_employee_assignment(
  action text,
  payload jsonb,
  actor_profile_id uuid,
  request_id text,
  ip_address inet default null,
  user_agent text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_action text := lower(coalesce(action, ''));
  v_payload jsonb := coalesce(payload, '{}'::jsonb);
  v_actor_profile_id uuid := actor_profile_id;
  v_request_id text := btrim(coalesce(request_id, ''));
  v_ip_address inet := ip_address;
  v_user_agent text := user_agent;
  v_employee_id uuid;
  v_assignment_id uuid;
  v_branch_id uuid;
  v_position_id uuid;
  v_supervisor_employee_id uuid;
  v_employee_number text;
  v_full_name text;
  v_phone text;
  v_email text;
  v_address text;
  v_join_date date;
  v_bank_name text;
  v_bank_account text;
  v_notes text;
  v_employment_status public.employment_status;
  v_effective_from date;
  v_effective_until date;
  v_reason text;
  v_expected_updated_at timestamptz;
  v_employee public.employees%rowtype;
  v_previous_employee public.employees%rowtype;
  v_current_assignment public.employee_assignments%rowtype;
  v_target_assignment public.employee_assignments%rowtype;
  v_branch_active boolean;
  v_position_active boolean;
  v_supervisor_branch_id uuid;
  v_supervisor_status public.employment_status;
  v_supervisor_position_code text;
  v_old_employee_state jsonb;
  v_old_assignment_state jsonb;
  v_new_employee_state jsonb;
  v_new_assignment_state jsonb;
  v_employee_action text;
  v_assignment_action text;
  v_close_effective_until date;
  v_employment_status public.employment_status;
  v_close_employee_status public.employment_status;
begin
  if v_actor_profile_id is null then
    raise exception 'Actor profile wajib diisi.'
      using errcode = 'P0001';
  end if;

  if v_request_id = '' then
    raise exception 'Request ID wajib diisi.'
      using errcode = 'P0001';
  end if;

  if v_action not in (
    'create_employee',
    'update_employee',
    'create_assignment',
    'transfer_assignment',
    'correct_assignment',
    'close_assignment'
  ) then
    raise exception 'Aksi penempatan karyawan tidak valid.'
      using errcode = 'P0001';
  end if;

  v_employee_id := nullif(btrim(coalesce(v_payload ->> 'employeeId', '')), '')::uuid;
  v_assignment_id := nullif(btrim(coalesce(v_payload ->> 'assignmentId', '')), '')::uuid;
  v_branch_id := nullif(btrim(coalesce(v_payload ->> 'branchId', '')), '')::uuid;
  v_position_id := nullif(btrim(coalesce(v_payload ->> 'positionId', '')), '')::uuid;
  v_supervisor_employee_id := nullif(btrim(coalesce(v_payload ->> 'supervisorEmployeeId', '')), '')::uuid;
  v_employee_number := nullif(btrim(coalesce(v_payload ->> 'employeeNumber', '')), '');
  v_full_name := nullif(btrim(coalesce(v_payload ->> 'fullName', '')), '');
  v_phone := nullif(btrim(coalesce(v_payload ->> 'phone', '')), '');
  v_email := nullif(btrim(coalesce(v_payload ->> 'email', '')), '');
  v_address := nullif(btrim(coalesce(v_payload ->> 'address', '')), '');
  v_join_date := nullif(btrim(coalesce(v_payload ->> 'joinDate', '')), '')::date;
  v_bank_name := nullif(btrim(coalesce(v_payload ->> 'bankName', '')), '');
  v_bank_account := nullif(btrim(coalesce(v_payload ->> 'bankAccount', '')), '');
  v_notes := nullif(btrim(coalesce(v_payload ->> 'notes', '')), '');
  v_reason := nullif(btrim(coalesce(v_payload ->> 'reason', '')), '');
  v_effective_from := nullif(btrim(coalesce(v_payload ->> 'effectiveFrom', '')), '')::date;
  v_effective_until := nullif(btrim(coalesce(v_payload ->> 'effectiveUntil', '')), '')::date;
  v_expected_updated_at := nullif(btrim(coalesce(v_payload ->> 'expectedUpdatedAt', '')), '')::timestamptz;
  v_close_effective_until := nullif(btrim(coalesce(v_payload ->> 'closeEffectiveUntil', '')), '')::date;
  v_employment_status := coalesce(
    nullif(btrim(coalesce(v_payload ->> 'employmentStatus', '')), '')::public.employment_status,
    'active'
  );
  v_employee_action := v_action;
  v_assignment_action := v_action;
  v_close_employee_status := coalesce(nullif(btrim(coalesce(v_payload ->> 'employmentStatus', '')), '')::public.employment_status, 'inactive');

  if v_action in ('create_employee', 'update_employee') then
    if v_employee_number is null then
      raise exception 'Nomor karyawan wajib diisi.'
        using errcode = 'P0001';
    end if;

    if v_full_name is null then
      raise exception 'Nama lengkap wajib diisi.'
        using errcode = 'P0001';
    end if;

    if v_branch_id is null then
      raise exception 'Cabang wajib diisi.'
        using errcode = 'P0001';
    end if;

    if v_position_id is null then
      raise exception 'Jabatan wajib diisi.'
        using errcode = 'P0001';
    end if;

    if v_join_date is null then
      raise exception 'Tanggal bergabung wajib diisi.'
        using errcode = 'P0001';
    end if;
  end if;

  if v_action in ('create_assignment', 'transfer_assignment', 'correct_assignment', 'close_assignment') then
    if v_employee_id is null then
      raise exception 'Employee ID wajib diisi.'
        using errcode = 'P0001';
    end if;
  end if;

  if v_action = 'create_employee' then
    select b.is_active
      into v_branch_active
    from public.branches b
    where b.id = v_branch_id
    for share;

    if not found then
      raise exception 'Cabang tidak ditemukan.'
        using errcode = 'P0002';
    end if;

    if not v_branch_active then
      raise exception 'Cabang harus aktif.'
        using errcode = 'P0001';
    end if;

    select p.is_active
      into v_position_active
    from public.positions p
    where p.id = v_position_id
    for share;

    if not found then
      raise exception 'Jabatan tidak ditemukan.'
        using errcode = 'P0002';
    end if;

    if not v_position_active then
      raise exception 'Jabatan harus aktif.'
        using errcode = 'P0001';
    end if;

    if v_supervisor_employee_id is not null then
      select e.branch_id, e.employment_status, p.code
        into v_supervisor_branch_id, v_supervisor_status, v_supervisor_position_code
      from public.employees e
      join public.positions p on p.id = e.position_id
      where e.id = v_supervisor_employee_id
      for share;

      if not found then
        raise exception 'Supervisor tidak ditemukan.'
          using errcode = 'P0002';
      end if;

      if v_supervisor_employee_id = v_employee_id then
        raise exception 'Supervisor tidak boleh sama dengan karyawan.'
          using errcode = 'P0001';
      end if;

      if v_supervisor_branch_id <> v_branch_id then
        raise exception 'Supervisor harus berada di cabang yang sama.'
          using errcode = 'P0001';
      end if;

      if v_supervisor_status <> 'active' then
        raise exception 'Supervisor harus aktif.'
          using errcode = 'P0001';
      end if;

      if v_supervisor_position_code <> 'branch_manager' then
        raise exception 'Supervisor harus memiliki jabatan branch_manager.'
          using errcode = 'P0001';
      end if;
    end if;

    insert into public.employees (
      employee_number,
      full_name,
      phone,
      email,
      address,
      branch_id,
      position_id,
      supervisor_employee_id,
      join_date,
      employment_status,
      bank_name,
      bank_account,
      notes
    )
    values (
      v_employee_number,
      v_full_name,
      v_phone,
      v_email,
      v_address,
      v_branch_id,
      v_position_id,
      v_supervisor_employee_id,
      v_join_date,
      coalesce(v_employment_status, 'active'),
      v_bank_name,
      v_bank_account,
      v_notes
    )
    returning * into v_employee;

    insert into public.employee_assignments (
      employee_id,
      branch_id,
      position_id,
      supervisor_employee_id,
      effective_from,
      effective_until,
      reason,
      created_by,
      updated_by
    )
    values (
      v_employee.id,
      v_branch_id,
      v_position_id,
      v_supervisor_employee_id,
      v_join_date,
      null,
      coalesce(v_reason, 'Penempatan awal'),
      v_actor_profile_id,
      v_actor_profile_id
    )
    returning * into v_target_assignment;

    v_old_employee_state := null;
    v_old_assignment_state := null;
    v_new_employee_state := jsonb_build_object(
      'id', v_employee.id,
      'employee_number', v_employee.employee_number,
      'full_name', v_employee.full_name,
      'phone', v_employee.phone,
      'email', v_employee.email,
      'address', v_employee.address,
      'branch_id', v_employee.branch_id,
      'position_id', v_employee.position_id,
      'supervisor_employee_id', v_employee.supervisor_employee_id,
      'join_date', v_employee.join_date,
      'employment_status', v_employee.employment_status,
      'bank_name', v_employee.bank_name,
      'bank_account', v_employee.bank_account,
      'notes', v_employee.notes,
      'updated_at', v_employee.updated_at
    );
    v_new_assignment_state := jsonb_build_object(
      'id', v_target_assignment.id,
      'employee_id', v_target_assignment.employee_id,
      'branch_id', v_target_assignment.branch_id,
      'position_id', v_target_assignment.position_id,
      'supervisor_employee_id', v_target_assignment.supervisor_employee_id,
      'effective_from', v_target_assignment.effective_from,
      'effective_until', v_target_assignment.effective_until,
      'reason', v_target_assignment.reason,
      'created_by', v_target_assignment.created_by,
      'updated_by', v_target_assignment.updated_by,
      'created_at', v_target_assignment.created_at,
      'updated_at', v_target_assignment.updated_at
    );
  elsif v_action = 'update_employee' then
    select *
      into v_employee
    from public.employees e
    where e.id = v_employee_id
    for update;

    if not found then
      raise exception 'Karyawan tidak ditemukan.'
        using errcode = 'P0002';
    end if;

    if v_expected_updated_at is not null and v_employee.updated_at <> v_expected_updated_at then
      raise exception 'Data karyawan sudah berubah.'
        using errcode = '40001';
    end if;

    select b.is_active
      into v_branch_active
    from public.branches b
    where b.id = v_branch_id
    for share;

    if not found then
      raise exception 'Cabang tidak ditemukan.'
        using errcode = 'P0002';
    end if;

    if not v_branch_active then
      raise exception 'Cabang harus aktif.'
        using errcode = 'P0001';
    end if;

    select p.is_active
      into v_position_active
    from public.positions p
    where p.id = v_position_id
    for share;

    if not found then
      raise exception 'Jabatan tidak ditemukan.'
        using errcode = 'P0002';
    end if;

    if not v_position_active then
      raise exception 'Jabatan harus aktif.'
        using errcode = 'P0001';
    end if;

    if v_supervisor_employee_id is not null then
      select e.branch_id, e.employment_status, p.code
        into v_supervisor_branch_id, v_supervisor_status, v_supervisor_position_code
      from public.employees e
      join public.positions p on p.id = e.position_id
      where e.id = v_supervisor_employee_id
      for share;

      if not found then
        raise exception 'Supervisor tidak ditemukan.'
          using errcode = 'P0002';
      end if;

      if v_supervisor_employee_id = v_employee.id then
        raise exception 'Supervisor tidak boleh sama dengan karyawan.'
          using errcode = 'P0001';
      end if;

      if v_supervisor_branch_id <> v_branch_id then
        raise exception 'Supervisor harus berada di cabang yang sama.'
          using errcode = 'P0001';
      end if;

      if v_supervisor_status <> 'active' then
        raise exception 'Supervisor harus aktif.'
          using errcode = 'P0001';
      end if;

      if v_supervisor_position_code <> 'branch_manager' then
        raise exception 'Supervisor harus memiliki jabatan branch_manager.'
          using errcode = 'P0001';
      end if;
    end if;

    v_old_employee_state := jsonb_build_object(
      'id', v_employee.id,
      'employee_number', v_employee.employee_number,
      'full_name', v_employee.full_name,
      'phone', v_employee.phone,
      'email', v_employee.email,
      'address', v_employee.address,
      'branch_id', v_employee.branch_id,
      'position_id', v_employee.position_id,
      'supervisor_employee_id', v_employee.supervisor_employee_id,
      'join_date', v_employee.join_date,
      'employment_status', v_employee.employment_status,
      'bank_name', v_employee.bank_name,
      'bank_account', v_employee.bank_account,
      'notes', v_employee.notes,
      'updated_at', v_employee.updated_at
    );

    update public.employees
    set employee_number = v_employee_number,
        full_name = v_full_name,
        phone = v_phone,
        email = v_email,
        address = v_address,
        branch_id = v_branch_id,
        position_id = v_position_id,
        supervisor_employee_id = v_supervisor_employee_id,
        join_date = v_join_date,
        employment_status = coalesce(v_employment_status, v_employee.employment_status),
        bank_name = v_bank_name,
        bank_account = v_bank_account,
        notes = v_notes
    where id = v_employee.id
    returning * into v_employee;

    select *
      into v_current_assignment
    from public.employee_assignments ea
    where ea.employee_id = v_employee.id
      and ea.effective_until is null
    for update;

    if not found then
      insert into public.employee_assignments (
        employee_id,
        branch_id,
        position_id,
        supervisor_employee_id,
        effective_from,
        effective_until,
        reason,
        created_by,
        updated_by
      )
      values (
        v_employee.id,
        v_branch_id,
        v_position_id,
        v_supervisor_employee_id,
        current_date,
        null,
        coalesce(v_reason, 'Penempatan awal'),
        v_actor_profile_id,
        v_actor_profile_id
      )
      returning * into v_target_assignment;
    elsif (
      v_current_assignment.branch_id <> v_branch_id
      or v_current_assignment.position_id <> v_position_id
      or coalesce(v_current_assignment.supervisor_employee_id, '00000000-0000-0000-0000-000000000000'::uuid)
        <> coalesce(v_supervisor_employee_id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) then
      update public.employee_assignments
      set effective_until = current_date - 1,
          reason = coalesce(v_current_assignment.reason, ''),
          updated_by = v_actor_profile_id
      where id = v_current_assignment.id;

      insert into public.employee_assignments (
        employee_id,
        branch_id,
        position_id,
        supervisor_employee_id,
        effective_from,
        effective_until,
        reason,
        created_by,
        updated_by
      )
      values (
        v_employee.id,
        v_branch_id,
        v_position_id,
        v_supervisor_employee_id,
        current_date,
        null,
        coalesce(v_reason, 'Penempatan diperbarui'),
        v_actor_profile_id,
        v_actor_profile_id
      )
      returning * into v_target_assignment;
    else
      update public.employee_assignments
      set reason = coalesce(v_reason, v_current_assignment.reason),
          updated_by = v_actor_profile_id
      where id = v_current_assignment.id
      returning * into v_target_assignment;
    end if;

    v_new_employee_state := jsonb_build_object(
      'id', v_employee.id,
      'employee_number', v_employee.employee_number,
      'full_name', v_employee.full_name,
      'phone', v_employee.phone,
      'email', v_employee.email,
      'address', v_employee.address,
      'branch_id', v_employee.branch_id,
      'position_id', v_employee.position_id,
      'supervisor_employee_id', v_employee.supervisor_employee_id,
      'join_date', v_employee.join_date,
      'employment_status', v_employee.employment_status,
      'bank_name', v_employee.bank_name,
      'bank_account', v_employee.bank_account,
      'notes', v_employee.notes,
      'updated_at', v_employee.updated_at
    );
    v_new_assignment_state := jsonb_build_object(
      'id', v_target_assignment.id,
      'employee_id', v_target_assignment.employee_id,
      'branch_id', v_target_assignment.branch_id,
      'position_id', v_target_assignment.position_id,
      'supervisor_employee_id', v_target_assignment.supervisor_employee_id,
      'effective_from', v_target_assignment.effective_from,
      'effective_until', v_target_assignment.effective_until,
      'reason', v_target_assignment.reason,
      'created_by', v_target_assignment.created_by,
      'updated_by', v_target_assignment.updated_by,
      'created_at', v_target_assignment.created_at,
      'updated_at', v_target_assignment.updated_at
    );
  elsif v_action in ('create_assignment', 'transfer_assignment') then
    if v_employee_id is null then
      raise exception 'Employee ID wajib diisi.'
        using errcode = 'P0001';
    end if;

    if v_reason is null then
      raise exception 'Alasan wajib diisi.'
        using errcode = 'P0001';
    end if;

    if v_effective_from is null then
      raise exception 'Tanggal mulai wajib diisi.'
        using errcode = 'P0001';
    end if;

    select *
      into v_employee
    from public.employees e
    where e.id = v_employee_id
    for update;

    if not found then
      raise exception 'Karyawan tidak ditemukan.'
        using errcode = 'P0002';
    end if;

    if v_expected_updated_at is not null and v_employee.updated_at <> v_expected_updated_at then
      raise exception 'Data karyawan sudah berubah.'
        using errcode = '40001';
    end if;

    if v_employee.employment_status <> 'active' then
      raise exception 'Karyawan harus aktif.'
        using errcode = 'P0001';
    end if;

    select b.is_active
      into v_branch_active
    from public.branches b
    where b.id = v_branch_id
    for share;

    if not found then
      raise exception 'Cabang tidak ditemukan.'
        using errcode = 'P0002';
    end if;

    if not v_branch_active then
      raise exception 'Cabang harus aktif.'
        using errcode = 'P0001';
    end if;

    select p.is_active
      into v_position_active
    from public.positions p
    where p.id = v_position_id
    for share;

    if not found then
      raise exception 'Jabatan tidak ditemukan.'
        using errcode = 'P0002';
    end if;

    if not v_position_active then
      raise exception 'Jabatan harus aktif.'
        using errcode = 'P0001';
    end if;

    if v_supervisor_employee_id is not null then
      select e.branch_id, e.employment_status, p.code
        into v_supervisor_branch_id, v_supervisor_status, v_supervisor_position_code
      from public.employees e
      join public.positions p on p.id = e.position_id
      where e.id = v_supervisor_employee_id
      for share;

      if not found then
        raise exception 'Supervisor tidak ditemukan.'
          using errcode = 'P0002';
      end if;

      if v_supervisor_employee_id = v_employee.id then
        raise exception 'Supervisor tidak boleh sama dengan karyawan.'
          using errcode = 'P0001';
      end if;

      if v_supervisor_branch_id <> v_branch_id then
        raise exception 'Supervisor harus berada di cabang yang sama.'
          using errcode = 'P0001';
      end if;

      if v_supervisor_status <> 'active' then
        raise exception 'Supervisor harus aktif.'
          using errcode = 'P0001';
      end if;

      if v_supervisor_position_code <> 'branch_manager' then
        raise exception 'Supervisor harus memiliki jabatan branch_manager.'
          using errcode = 'P0001';
      end if;
    end if;

    select *
      into v_current_assignment
    from public.employee_assignments ea
    where ea.employee_id = v_employee.id
      and ea.effective_until is null
    for update;

    if not found and v_action = 'transfer_assignment' then
      raise exception 'Karyawan belum memiliki assignment aktif.'
        using errcode = 'P0001';
    end if;

    if found then
      update public.employee_assignments
      set effective_until = v_effective_from - 1,
          updated_by = v_actor_profile_id
      where id = v_current_assignment.id;
    end if;

    insert into public.employee_assignments (
      employee_id,
      branch_id,
      position_id,
      supervisor_employee_id,
      effective_from,
      effective_until,
      reason,
      created_by,
      updated_by
    )
    values (
      v_employee.id,
      v_branch_id,
      v_position_id,
      v_supervisor_employee_id,
      v_effective_from,
      v_effective_until,
      v_reason,
      v_actor_profile_id,
      v_actor_profile_id
    )
    returning * into v_target_assignment;

    update public.employees
    set branch_id = v_branch_id,
        position_id = v_position_id,
        supervisor_employee_id = v_supervisor_employee_id,
        employment_status = v_employee.employment_status
    where id = v_employee.id
    returning * into v_employee;

    v_old_employee_state := jsonb_build_object(
      'branch_id', v_current_assignment.branch_id,
      'position_id', v_current_assignment.position_id,
      'supervisor_employee_id', v_current_assignment.supervisor_employee_id
    );
    v_new_employee_state := jsonb_build_object(
      'id', v_employee.id,
      'employee_number', v_employee.employee_number,
      'full_name', v_employee.full_name,
      'phone', v_employee.phone,
      'email', v_employee.email,
      'address', v_employee.address,
      'branch_id', v_employee.branch_id,
      'position_id', v_employee.position_id,
      'supervisor_employee_id', v_employee.supervisor_employee_id,
      'join_date', v_employee.join_date,
      'employment_status', v_employee.employment_status,
      'bank_name', v_employee.bank_name,
      'bank_account', v_employee.bank_account,
      'notes', v_employee.notes,
      'updated_at', v_employee.updated_at
    );
    v_old_assignment_state := jsonb_build_object(
      'id', v_current_assignment.id,
      'employee_id', v_current_assignment.employee_id,
      'branch_id', v_current_assignment.branch_id,
      'position_id', v_current_assignment.position_id,
      'supervisor_employee_id', v_current_assignment.supervisor_employee_id,
      'effective_from', v_current_assignment.effective_from,
      'effective_until', v_current_assignment.effective_until,
      'reason', v_current_assignment.reason,
      'created_by', v_current_assignment.created_by,
      'updated_by', v_current_assignment.updated_by,
      'created_at', v_current_assignment.created_at,
      'updated_at', v_current_assignment.updated_at
    );
    v_new_assignment_state := jsonb_build_object(
      'id', v_target_assignment.id,
      'employee_id', v_target_assignment.employee_id,
      'branch_id', v_target_assignment.branch_id,
      'position_id', v_target_assignment.position_id,
      'supervisor_employee_id', v_target_assignment.supervisor_employee_id,
      'effective_from', v_target_assignment.effective_from,
      'effective_until', v_target_assignment.effective_until,
      'reason', v_target_assignment.reason,
      'created_by', v_target_assignment.created_by,
      'updated_by', v_target_assignment.updated_by,
      'created_at', v_target_assignment.created_at,
      'updated_at', v_target_assignment.updated_at
    );
  elsif v_action = 'correct_assignment' then
    if v_employee_id is null then
      raise exception 'Employee ID wajib diisi.'
        using errcode = 'P0001';
    end if;

    if v_assignment_id is null then
      raise exception 'Assignment ID wajib diisi.'
        using errcode = 'P0001';
    end if;

    select *
      into v_employee
    from public.employees e
    where e.id = v_employee_id
    for update;

    if not found then
      raise exception 'Karyawan tidak ditemukan.'
        using errcode = 'P0002';
    end if;

    select *
      into v_target_assignment
    from public.employee_assignments ea
    where ea.id = v_assignment_id
      and ea.employee_id = v_employee.id
    for update;

    if not found then
      raise exception 'Assignment tidak ditemukan.'
        using errcode = 'P0002';
    end if;

    if v_target_assignment.effective_until is not null
       and v_target_assignment.effective_until < current_date then
      raise exception 'Assignment historis yang sudah efektif tidak dapat diubah.'
        using errcode = 'P0001';
    end if;

    if v_expected_updated_at is not null and v_target_assignment.updated_at <> v_expected_updated_at then
      raise exception 'Assignment sudah berubah.'
        using errcode = '40001';
    end if;

    if v_branch_id is null then
      v_branch_id := v_target_assignment.branch_id;
    end if;

    if v_position_id is null then
      v_position_id := v_target_assignment.position_id;
    end if;

    if v_supervisor_employee_id is null then
      v_supervisor_employee_id := v_target_assignment.supervisor_employee_id;
    end if;

    select b.is_active
      into v_branch_active
    from public.branches b
    where b.id = v_branch_id
    for share;

    if not found then
      raise exception 'Cabang tidak ditemukan.'
        using errcode = 'P0002';
    end if;

    if not v_branch_active then
      raise exception 'Cabang harus aktif.'
        using errcode = 'P0001';
    end if;

    select p.is_active
      into v_position_active
    from public.positions p
    where p.id = v_position_id
    for share;

    if not found then
      raise exception 'Jabatan tidak ditemukan.'
        using errcode = 'P0002';
    end if;

    if not v_position_active then
      raise exception 'Jabatan harus aktif.'
        using errcode = 'P0001';
    end if;

    if v_supervisor_employee_id is not null then
      select e.branch_id, e.employment_status, p.code
        into v_supervisor_branch_id, v_supervisor_status, v_supervisor_position_code
      from public.employees e
      join public.positions p on p.id = e.position_id
      where e.id = v_supervisor_employee_id
      for share;

      if not found then
        raise exception 'Supervisor tidak ditemukan.'
          using errcode = 'P0002';
      end if;

      if v_supervisor_employee_id = v_employee.id then
        raise exception 'Supervisor tidak boleh sama dengan karyawan.'
          using errcode = 'P0001';
      end if;

      if v_supervisor_branch_id <> v_branch_id then
        raise exception 'Supervisor harus berada di cabang yang sama.'
          using errcode = 'P0001';
      end if;

      if v_supervisor_status <> 'active' then
        raise exception 'Supervisor harus aktif.'
          using errcode = 'P0001';
      end if;

      if v_supervisor_position_code <> 'branch_manager' then
        raise exception 'Supervisor harus memiliki jabatan branch_manager.'
          using errcode = 'P0001';
      end if;
    end if;

    v_old_assignment_state := jsonb_build_object(
      'id', v_target_assignment.id,
      'employee_id', v_target_assignment.employee_id,
      'branch_id', v_target_assignment.branch_id,
      'position_id', v_target_assignment.position_id,
      'supervisor_employee_id', v_target_assignment.supervisor_employee_id,
      'effective_from', v_target_assignment.effective_from,
      'effective_until', v_target_assignment.effective_until,
      'reason', v_target_assignment.reason,
      'created_by', v_target_assignment.created_by,
      'updated_by', v_target_assignment.updated_by,
      'created_at', v_target_assignment.created_at,
      'updated_at', v_target_assignment.updated_at
    );

    update public.employee_assignments
    set branch_id = v_branch_id,
        position_id = v_position_id,
        supervisor_employee_id = v_supervisor_employee_id,
        effective_from = coalesce(v_effective_from, v_target_assignment.effective_from),
        effective_until = coalesce(v_effective_until, v_target_assignment.effective_until),
        reason = coalesce(v_reason, v_target_assignment.reason),
        updated_by = v_actor_profile_id
    where id = v_target_assignment.id
    returning * into v_target_assignment;

    if v_target_assignment.effective_until is null then
      update public.employees
      set branch_id = v_target_assignment.branch_id,
          position_id = v_target_assignment.position_id,
          supervisor_employee_id = v_target_assignment.supervisor_employee_id
      where id = v_employee.id
      returning * into v_employee;
    end if;

    v_new_employee_state := jsonb_build_object(
      'id', v_employee.id,
      'employee_number', v_employee.employee_number,
      'full_name', v_employee.full_name,
      'phone', v_employee.phone,
      'email', v_employee.email,
      'address', v_employee.address,
      'branch_id', v_employee.branch_id,
      'position_id', v_employee.position_id,
      'supervisor_employee_id', v_employee.supervisor_employee_id,
      'join_date', v_employee.join_date,
      'employment_status', v_employee.employment_status,
      'bank_name', v_employee.bank_name,
      'bank_account', v_employee.bank_account,
      'notes', v_employee.notes,
      'updated_at', v_employee.updated_at
    );
    v_new_assignment_state := jsonb_build_object(
      'id', v_target_assignment.id,
      'employee_id', v_target_assignment.employee_id,
      'branch_id', v_target_assignment.branch_id,
      'position_id', v_target_assignment.position_id,
      'supervisor_employee_id', v_target_assignment.supervisor_employee_id,
      'effective_from', v_target_assignment.effective_from,
      'effective_until', v_target_assignment.effective_until,
      'reason', v_target_assignment.reason,
      'created_by', v_target_assignment.created_by,
      'updated_by', v_target_assignment.updated_by,
      'created_at', v_target_assignment.created_at,
      'updated_at', v_target_assignment.updated_at
    );
  elsif v_action = 'close_assignment' then
    if v_employee_id is null then
      raise exception 'Employee ID wajib diisi.'
        using errcode = 'P0001';
    end if;

    if v_assignment_id is null then
      raise exception 'Assignment ID wajib diisi.'
        using errcode = 'P0001';
    end if;

    select *
      into v_employee
    from public.employees e
    where e.id = v_employee_id
    for update;

    if not found then
      raise exception 'Karyawan tidak ditemukan.'
        using errcode = 'P0002';
    end if;

    select *
      into v_target_assignment
    from public.employee_assignments ea
    where ea.id = v_assignment_id
      and ea.employee_id = v_employee.id
    for update;

    if not found then
      raise exception 'Assignment tidak ditemukan.'
        using errcode = 'P0002';
    end if;

    if v_expected_updated_at is not null and v_target_assignment.updated_at <> v_expected_updated_at then
      raise exception 'Assignment sudah berubah.'
        using errcode = '40001';
    end if;

    if v_close_effective_until is null then
      v_close_effective_until := current_date;
    end if;

    if v_close_effective_until < v_target_assignment.effective_from then
      raise exception 'Tanggal berakhir tidak boleh lebih awal dari tanggal mulai.'
        using errcode = 'P0001';
    end if;

    v_old_assignment_state := jsonb_build_object(
      'id', v_target_assignment.id,
      'employee_id', v_target_assignment.employee_id,
      'branch_id', v_target_assignment.branch_id,
      'position_id', v_target_assignment.position_id,
      'supervisor_employee_id', v_target_assignment.supervisor_employee_id,
      'effective_from', v_target_assignment.effective_from,
      'effective_until', v_target_assignment.effective_until,
      'reason', v_target_assignment.reason,
      'created_by', v_target_assignment.created_by,
      'updated_by', v_target_assignment.updated_by,
      'created_at', v_target_assignment.created_at,
      'updated_at', v_target_assignment.updated_at
    );

    update public.employee_assignments
    set effective_until = v_close_effective_until,
        updated_by = v_actor_profile_id
    where id = v_target_assignment.id
    returning * into v_target_assignment;

    if v_close_employee_status is not null then
      update public.employees
      set employment_status = v_close_employee_status
      where id = v_employee.id
      returning * into v_employee;
    end if;

    v_new_employee_state := jsonb_build_object(
      'id', v_employee.id,
      'employee_number', v_employee.employee_number,
      'full_name', v_employee.full_name,
      'phone', v_employee.phone,
      'email', v_employee.email,
      'address', v_employee.address,
      'branch_id', v_employee.branch_id,
      'position_id', v_employee.position_id,
      'supervisor_employee_id', v_employee.supervisor_employee_id,
      'join_date', v_employee.join_date,
      'employment_status', v_employee.employment_status,
      'bank_name', v_employee.bank_name,
      'bank_account', v_employee.bank_account,
      'notes', v_employee.notes,
      'updated_at', v_employee.updated_at
    );
    v_new_assignment_state := jsonb_build_object(
      'id', v_target_assignment.id,
      'employee_id', v_target_assignment.employee_id,
      'branch_id', v_target_assignment.branch_id,
      'position_id', v_target_assignment.position_id,
      'supervisor_employee_id', v_target_assignment.supervisor_employee_id,
      'effective_from', v_target_assignment.effective_from,
      'effective_until', v_target_assignment.effective_until,
      'reason', v_target_assignment.reason,
      'created_by', v_target_assignment.created_by,
      'updated_by', v_target_assignment.updated_by,
      'created_at', v_target_assignment.created_at,
      'updated_at', v_target_assignment.updated_at
    );
  end if;

  insert into public.audit_logs (
    actor_profile_id,
    request_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  )
  values (
    v_actor_profile_id,
    v_request_id,
    case v_action
      when 'create_employee' then 'employee.created'
      when 'update_employee' then 'employee.updated'
      when 'create_assignment' then 'employee_assignment.created'
      when 'transfer_assignment' then 'employee_assignment.transferred'
      when 'correct_assignment' then 'employee_assignment.corrected'
      when 'close_assignment' then 'employee_assignment.closed'
    end,
    case v_action
      when 'create_employee' then 'employee'
      when 'update_employee' then 'employee'
      else 'employee_assignment'
    end,
    coalesce(v_employee.id, v_target_assignment.employee_id),
    v_old_employee_state,
    jsonb_build_object(
      'employee', v_new_employee_state,
      'assignment', v_new_assignment_state
    ),
    v_ip_address,
    v_user_agent
  );

  if v_new_employee_state is not null then
    insert into public.audit_logs (
      actor_profile_id,
      request_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values,
      ip_address,
      user_agent
    )
    values (
      v_actor_profile_id,
      v_request_id,
      'employee.current_state_synchronized',
      'employee',
      coalesce(v_employee.id, v_target_assignment.employee_id),
      v_old_employee_state,
      v_new_employee_state,
      v_ip_address,
      v_user_agent
    );
  end if;

  return jsonb_build_object(
    'employee', v_new_employee_state,
    'assignment', v_new_assignment_state
  );
end;
$$;

revoke execute on function public.apply_employee_assignment(
  text,
  jsonb,
  uuid,
  text,
  inet,
  text
) from public, anon, authenticated;

grant execute on function public.apply_employee_assignment(
  text,
  jsonb,
  uuid,
  text,
  inet,
  text
) to service_role;

commit;
