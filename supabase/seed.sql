begin;

insert into public.branches (
  id,
  code,
  name,
  city,
  address,
  whatsapp,
  maps_url,
  opening_hours,
  is_active,
  head_employee_id
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    'MKS',
    'Yukatitip Makassar',
    'Makassar',
    'Jl. Contoh Operasional No. 10, Makassar',
    '6281110001001',
    'https://maps.google.com/?q=Yukatitip+Makassar',
    'Senin-Sabtu 08.00-18.00 WITA',
    true,
    null
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'PIN',
    'Yukatitip Pinrang',
    'Pinrang',
    'Jl. Contoh Titik Layanan No. 25, Pinrang',
    '6281110002001',
    'https://maps.google.com/?q=Yukatitip+Pinrang',
    'Senin-Sabtu 08.00-18.00 WITA',
    true,
    null
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'PRP',
    'Yukatitip Parepare',
    'Parepare',
    'Jl. Contoh Cabang No. 7, Parepare',
    '6281110003001',
    'https://maps.google.com/?q=Yukatitip+Parepare',
    'Senin-Sabtu 08.00-18.00 WITA',
    true,
    null
  )
on conflict (id) do update
set code = excluded.code,
    name = excluded.name,
    city = excluded.city,
    address = excluded.address,
    whatsapp = excluded.whatsapp,
    maps_url = excluded.maps_url,
    opening_hours = excluded.opening_hours,
    is_active = excluded.is_active,
    updated_at = timezone('utc', now());

insert into public.routes (
  id,
  origin_branch_id,
  destination_branch_id,
  name,
  estimated_duration_minutes,
  base_fee,
  is_active
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    'Makassar -> Pinrang',
    300,
    20000,
    true
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    'Pinrang -> Makassar',
    300,
    20000,
    true
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000003',
    'Pinrang -> Parepare',
    60,
    15000,
    true
  ),
  (
    '50000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000002',
    'Parepare -> Pinrang',
    60,
    15000,
    true
  )
on conflict (id) do update
set origin_branch_id = excluded.origin_branch_id,
    destination_branch_id = excluded.destination_branch_id,
    name = excluded.name,
    estimated_duration_minutes = excluded.estimated_duration_minutes,
    base_fee = excluded.base_fee,
    is_active = excluded.is_active,
    updated_at = timezone('utc', now());

insert into public.route_schedules (
  id,
  route_id,
  day_of_week,
  departure_time,
  is_active,
  notes
)
values
  (
    '51000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    5,
    '08:00:00',
    true,
    'Jumat pagi'
  ),
  (
    '51000000-0000-4000-8000-000000000002',
    '50000000-0000-4000-8000-000000000002',
    0,
    '08:00:00',
    true,
    'Minggu pagi'
  ),
  (
    '51000000-0000-4000-8000-000000000003',
    '50000000-0000-4000-8000-000000000003',
    2,
    '09:00:00',
    true,
    'Selasa pagi'
  ),
  (
    '51000000-0000-4000-8000-000000000004',
    '50000000-0000-4000-8000-000000000004',
    6,
    '09:00:00',
    true,
    'Sabtu pagi'
  )
on conflict (id) do update
set route_id = excluded.route_id,
    day_of_week = excluded.day_of_week,
    departure_time = excluded.departure_time,
    is_active = excluded.is_active,
    notes = excluded.notes;

insert into public.route_tariffs (
  id,
  route_id,
  service_type,
  minimum_service_fee,
  percentage_fee,
  local_delivery_fee,
  handling_fee,
  effective_from,
  effective_until,
  is_active
)
values
  (
    '52000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    'purchase',
    25000,
    10.00,
    10000,
    0,
    '2026-07-01',
    null,
    true
  ),
  (
    '52000000-0000-4000-8000-000000000002',
    '50000000-0000-4000-8000-000000000002',
    'pickup',
    20000,
    0.00,
    10000,
    0,
    '2026-07-01',
    null,
    true
  ),
  (
    '52000000-0000-4000-8000-000000000003',
    '50000000-0000-4000-8000-000000000003',
    'delivery',
    15000,
    0.00,
    5000,
    0,
    '2026-07-01',
    null,
    true
  )
on conflict (id) do update
set route_id = excluded.route_id,
    service_type = excluded.service_type,
    minimum_service_fee = excluded.minimum_service_fee,
    percentage_fee = excluded.percentage_fee,
    local_delivery_fee = excluded.local_delivery_fee,
    handling_fee = excluded.handling_fee,
    effective_from = excluded.effective_from,
    effective_until = excluded.effective_until,
    is_active = excluded.is_active;

commit;
