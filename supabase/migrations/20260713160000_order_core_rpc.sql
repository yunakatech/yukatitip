begin;

create table if not exists public.business_number_sequences (
  prefix text not null,
  period text not null,
  current_value bigint not null default 0 check (current_value >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (prefix, period)
);

create table if not exists public.idempotency_keys (
  scope text not null,
  idempotency_key text not null,
  actor_profile_id uuid not null references public.profiles(id) on delete cascade,
  request_hash text not null,
  response jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default timezone('utc', now()) + interval '24 hours',
  primary key (scope, idempotency_key, actor_profile_id)
);

create index if not exists idx_idempotency_keys_expires_at
  on public.idempotency_keys(expires_at);

alter table public.business_number_sequences enable row level security;
alter table public.idempotency_keys enable row level security;

create or replace function public.next_business_number(
  p_prefix text,
  p_timestamp timestamptz default timezone('utc', now())
)
returns text
language plpgsql
set search_path = public
as $$
declare
  v_period text;
  v_next bigint;
begin
  if p_prefix is null or btrim(p_prefix) = '' then
    raise exception 'Business number prefix is required';
  end if;

  v_period := to_char(p_timestamp at time zone 'UTC', 'YYMM');

  insert into public.business_number_sequences (prefix, period, current_value)
  values (upper(btrim(p_prefix)), v_period, 1)
  on conflict (prefix, period)
  do update
    set current_value = public.business_number_sequences.current_value + 1,
        updated_at = timezone('utc', now())
  returning current_value into v_next;

  return upper(btrim(p_prefix)) || '-' || v_period || '-' || lpad(v_next::text, 5, '0');
end;
$$;

create or replace function public.validate_order_service_type(p_value text)
returns public.service_type
language plpgsql
set search_path = public
as $$
begin
  if p_value in ('purchase', 'pickup', 'delivery') then
    return p_value::public.service_type;
  end if;

  raise exception 'Jenis layanan tidak valid';
end;
$$;

create or replace function public.validate_order_fulfillment_method(p_value text)
returns public.fulfillment_method
language plpgsql
set search_path = public
as $$
begin
  if p_value in ('branch_pickup', 'local_delivery') then
    return p_value::public.fulfillment_method;
  end if;

  raise exception 'Metode penerimaan tidak valid';
end;
$$;

create or replace function public.validate_order_status(p_value text)
returns public.order_status
language plpgsql
set search_path = public
as $$
begin
  if p_value in (
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
  ) then
    return p_value::public.order_status;
  end if;

  raise exception 'Status pesanan tidak valid';
end;
$$;

create or replace function public.validate_order_item_status(p_value text)
returns public.order_item_status
language plpgsql
set search_path = public
as $$
begin
  if p_value in (
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
  ) then
    return p_value::public.order_item_status;
  end if;

  raise exception 'Status item pesanan tidak valid';
end;
$$;

create or replace function public.order_status_rank(p_status public.order_status)
returns integer
language sql
immutable
set search_path = public
as $$
  select case p_status
    when 'recorded' then 1
    when 'waiting_payment' then 2
    when 'payment_received' then 3
    when 'waiting_origin_process' then 4
    when 'purchasing_or_collecting' then 5
    when 'received_at_origin' then 6
    when 'waiting_departure' then 7
    when 'in_transit' then 8
    when 'arrived_at_destination' then 9
    when 'ready_for_handover' then 10
    when 'completed' then 11
    when 'problem' then 99
    when 'cancelled' then 100
  end;
$$;

create or replace function public.create_order_with_items(
  payload jsonb,
  actor_profile_id uuid,
  request_id text,
  idempotency_key text default null,
  ip_address text default null,
  user_agent text default null
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_scope text := 'order.create';
  v_request_hash text;
  v_existing public.idempotency_keys%rowtype;
  v_tracking_number text;
  v_order_id uuid;
  v_route record;
  v_sender record;
  v_receiver record;
  v_service_type public.service_type;
  v_fulfillment_method public.fulfillment_method;
  v_origin_branch_id uuid;
  v_destination_branch_id uuid;
  v_route_id uuid;
  v_sender_customer_id uuid;
  v_receiver_customer_id uuid;
  v_goods_amount bigint;
  v_service_revenue bigint;
  v_additional_service_fees bigint;
  v_discount_amount bigint;
  v_total_customer_payment bigint;
  v_items jsonb;
  v_item jsonb;
  v_item_count integer := 0;
  v_response jsonb;
begin
  if actor_profile_id is null then
    raise exception 'Actor profile is required';
  end if;

  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'Payload pesanan tidak valid';
  end if;

  v_request_hash := encode(digest(payload::text, 'sha256'), 'hex');

  if nullif(btrim(coalesce(idempotency_key, '')), '') is not null then
    select *
      into v_existing
    from public.idempotency_keys
    where scope = v_scope
      and idempotency_key = btrim(idempotency_key)
      and actor_profile_id = create_order_with_items.actor_profile_id
      and expires_at > timezone('utc', now());

    if found then
      if v_existing.request_hash <> v_request_hash then
        raise exception 'Idempotency key digunakan dengan payload berbeda';
      end if;

      return v_existing.response;
    end if;
  end if;

  v_service_type := public.validate_order_service_type(payload ->> 'serviceType');
  v_fulfillment_method := public.validate_order_fulfillment_method(coalesce(payload ->> 'fulfillmentMethod', 'branch_pickup'));
  v_origin_branch_id := (payload ->> 'originBranchId')::uuid;
  v_destination_branch_id := (payload ->> 'destinationBranchId')::uuid;
  v_route_id := (payload ->> 'routeId')::uuid;
  v_sender_customer_id := (payload ->> 'senderCustomerId')::uuid;
  v_receiver_customer_id := nullif(payload ->> 'receiverCustomerId', '')::uuid;
  v_goods_amount := coalesce((payload ->> 'goodsAmount')::bigint, 0);
  v_service_revenue := coalesce((payload ->> 'serviceRevenue')::bigint, 0);
  v_additional_service_fees := coalesce((payload ->> 'additionalServiceFees')::bigint, 0);
  v_discount_amount := coalesce((payload ->> 'discountAmount')::bigint, 0);
  v_items := payload -> 'items';

  if v_origin_branch_id = v_destination_branch_id then
    raise exception 'Cabang asal dan tujuan harus berbeda';
  end if;

  if v_goods_amount < 0 or v_service_revenue < 0 or v_additional_service_fees < 0 or v_discount_amount < 0 then
    raise exception 'Nominal pesanan tidak boleh negatif';
  end if;

  if jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 then
    raise exception 'Pesanan wajib memiliki minimal satu item';
  end if;

  select id, origin_branch_id, destination_branch_id, is_active
    into v_route
  from public.routes
  where id = v_route_id;

  if not found or not v_route.is_active then
    raise exception 'Rute tidak ditemukan atau tidak aktif';
  end if;

  if v_route.origin_branch_id <> v_origin_branch_id or v_route.destination_branch_id <> v_destination_branch_id then
    raise exception 'Arah pesanan tidak sesuai dengan rute';
  end if;

  select id, status
    into v_sender
  from public.customers
  where id = v_sender_customer_id;

  if not found or v_sender.status <> 'active' then
    raise exception 'Customer pengirim tidak ditemukan atau tidak aktif';
  end if;

  if v_receiver_customer_id is not null then
    select id, status
      into v_receiver
    from public.customers
    where id = v_receiver_customer_id;

    if not found or v_receiver.status <> 'active' then
      raise exception 'Customer penerima tidak ditemukan atau tidak aktif';
    end if;
  end if;

  v_tracking_number := public.next_business_number('YKT', timezone('utc', now()));

  insert into public.orders (
    tracking_number,
    service_type,
    fulfillment_method,
    origin_branch_id,
    destination_branch_id,
    route_id,
    sender_customer_id,
    receiver_customer_id,
    goods_amount,
    service_revenue,
    additional_service_fees,
    discount_amount,
    delivery_address,
    public_notes,
    internal_notes,
    created_by,
    updated_by
  )
  values (
    v_tracking_number,
    v_service_type,
    v_fulfillment_method,
    v_origin_branch_id,
    v_destination_branch_id,
    v_route_id,
    v_sender_customer_id,
    v_receiver_customer_id,
    v_goods_amount,
    v_service_revenue,
    v_additional_service_fees,
    v_discount_amount,
    nullif(btrim(coalesce(payload ->> 'deliveryAddress', '')), ''),
    nullif(btrim(coalesce(payload ->> 'publicNotes', '')), ''),
    nullif(btrim(coalesce(payload ->> 'internalNotes', '')), ''),
    actor_profile_id,
    actor_profile_id
  )
  returning id, total_customer_payment
    into v_order_id, v_total_customer_payment;

  for v_item in select value from jsonb_array_elements(v_items)
  loop
    if nullif(btrim(coalesce(v_item ->> 'productName', '')), '') is null then
      raise exception 'Nama barang wajib diisi';
    end if;

    if coalesce((v_item ->> 'quantity')::integer, 0) <= 0 then
      raise exception 'Jumlah barang harus lebih dari 0';
    end if;

    if coalesce((v_item ->> 'estimatedUnitPrice')::bigint, 0) < 0 then
      raise exception 'Harga perkiraan barang tidak boleh negatif';
    end if;

    if nullif(v_item ->> 'storeId', '') is not null and not exists (
      select 1 from public.stores s where s.id = (v_item ->> 'storeId')::uuid and s.is_active = true
    ) then
      raise exception 'Toko tidak ditemukan atau tidak aktif';
    end if;

    insert into public.order_items (
      order_id,
      store_id,
      product_name,
      product_url,
      quantity,
      estimated_unit_price,
      actual_unit_price,
      weight_grams,
      attributes,
      notes,
      status
    )
    values (
      v_order_id,
      nullif(v_item ->> 'storeId', '')::uuid,
      btrim(v_item ->> 'productName'),
      nullif(btrim(coalesce(v_item ->> 'productUrl', '')), ''),
      (v_item ->> 'quantity')::integer,
      coalesce((v_item ->> 'estimatedUnitPrice')::bigint, 0),
      nullif(v_item ->> 'actualUnitPrice', '')::bigint,
      nullif(v_item ->> 'weightGrams', '')::integer,
      coalesce(v_item -> 'attributes', '{}'::jsonb),
      nullif(btrim(coalesce(v_item ->> 'notes', '')), ''),
      public.validate_order_item_status(coalesce(v_item ->> 'status', 'recorded'))
    );

    v_item_count := v_item_count + 1;
  end loop;

  insert into public.tracking_events (
    order_id,
    status,
    public_description,
    internal_description,
    location,
    created_by
  )
  values (
    v_order_id,
    'recorded',
    coalesce(nullif(btrim(payload ->> 'initialPublicDescription'), ''), 'Pesanan dicatat oleh admin.'),
    nullif(btrim(coalesce(payload ->> 'initialInternalDescription', '')), ''),
    nullif(btrim(coalesce(payload ->> 'initialLocation', '')), ''),
    actor_profile_id
  );

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
    actor_profile_id,
    request_id,
    'order.created',
    'order',
    v_order_id,
    null,
    jsonb_build_object(
      'trackingNumber', v_tracking_number,
      'serviceType', v_service_type,
      'originBranchId', v_origin_branch_id,
      'destinationBranchId', v_destination_branch_id,
      'routeId', v_route_id,
      'itemCount', v_item_count,
      'goodsAmount', v_goods_amount,
      'serviceRevenue', v_service_revenue,
      'additionalServiceFees', v_additional_service_fees,
      'discountAmount', v_discount_amount,
      'totalCustomerPayment', v_total_customer_payment
    ),
    nullif(ip_address, '')::inet,
    user_agent
  );

  v_response := jsonb_build_object(
    'order',
    jsonb_build_object(
      'id', v_order_id,
      'trackingNumber', v_tracking_number,
      'status', 'recorded',
      'paymentStatus', 'unpaid',
      'totalCustomerPayment', v_total_customer_payment
    )
  );

  if nullif(btrim(coalesce(idempotency_key, '')), '') is not null then
    insert into public.idempotency_keys (
      scope,
      idempotency_key,
      actor_profile_id,
      request_hash,
      response
    )
    values (
      v_scope,
      btrim(idempotency_key),
      actor_profile_id,
      v_request_hash,
      v_response
    );
  end if;

  return v_response;
end;
$$;

create or replace function public.update_order_status_with_event(
  order_id uuid,
  next_status text,
  public_description text,
  internal_description text,
  location text,
  expected_updated_at timestamptz,
  actor_profile_id uuid,
  request_id text,
  ip_address text default null,
  user_agent text default null
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_next_status public.order_status;
begin
  v_next_status := public.validate_order_status(next_status);

  select *
    into v_order
  from public.orders
  where id = order_id
  for update;

  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  if expected_updated_at is not null and v_order.updated_at <> expected_updated_at then
    raise sqlstate '40001' using message = 'Data pesanan telah berubah';
  end if;

  if v_order.status in ('completed', 'cancelled') then
    raise exception 'Status pesanan final tidak dapat diubah';
  end if;

  if public.order_status_rank(v_next_status) - public.order_status_rank(v_order.status) > 1
     and nullif(btrim(coalesce(internal_description, '')), '') is null then
    raise exception 'Catatan internal wajib diisi untuk perubahan status lompat';
  end if;

  update public.orders
  set status = v_next_status,
      updated_by = actor_profile_id
  where id = order_id;

  insert into public.tracking_events (
    order_id,
    status,
    public_description,
    internal_description,
    location,
    created_by
  )
  values (
    order_id,
    v_next_status,
    coalesce(nullif(btrim(public_description), ''), 'Status pesanan diperbarui.'),
    nullif(btrim(coalesce(internal_description, '')), ''),
    nullif(btrim(coalesce(location, '')), ''),
    actor_profile_id
  );

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
    actor_profile_id,
    request_id,
    'order.status_updated',
    'order',
    order_id,
    jsonb_build_object('status', v_order.status),
    jsonb_build_object('status', v_next_status),
    nullif(ip_address, '')::inet,
    user_agent
  );

  return (
    select jsonb_build_object(
      'orderId', o.id,
      'status', o.status,
      'updatedAt', o.updated_at
    )
    from public.orders o
    where o.id = order_id
  );
end;
$$;

create or replace function public.add_order_payment(
  order_id uuid,
  amount bigint,
  payment_method text,
  paid_at timestamptz,
  notes text,
  actor_profile_id uuid,
  request_id text,
  ip_address text default null,
  user_agent text default null
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_payment_id uuid;
begin
  if amount is null or amount <= 0 then
    raise exception 'Nominal pembayaran harus lebih dari 0';
  end if;

  if nullif(btrim(coalesce(payment_method, '')), '') is null then
    raise exception 'Metode pembayaran wajib diisi';
  end if;

  select *
    into v_order
  from public.orders
  where id = order_id
  for update;

  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  insert into public.payments (
    order_id,
    amount,
    payment_method,
    status,
    paid_at,
    notes
  )
  values (
    order_id,
    amount,
    btrim(payment_method),
    'unpaid',
    paid_at,
    nullif(btrim(coalesce(notes, '')), '')
  )
  returning id into v_payment_id;

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
    actor_profile_id,
    request_id,
    'payment.created',
    'payment',
    v_payment_id,
    null,
    jsonb_build_object('orderId', order_id, 'amount', amount, 'paymentMethod', btrim(payment_method)),
    nullif(ip_address, '')::inet,
    user_agent
  );

  return jsonb_build_object('paymentId', v_payment_id, 'orderId', order_id, 'status', 'unpaid');
end;
$$;

create or replace function public.verify_order_payment(
  payment_id uuid,
  decision text,
  notes text,
  actor_profile_id uuid,
  request_id text,
  ip_address text default null,
  user_agent text default null
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_new_payment_status public.payment_status;
  v_paid_total bigint;
  v_order_payment_status public.payment_status;
  v_order_status public.order_status;
begin
  if decision not in ('approve', 'reject') then
    raise exception 'Keputusan verifikasi pembayaran tidak valid';
  end if;

  select *
    into v_payment
  from public.payments
  where id = payment_id
  for update;

  if not found then
    raise exception 'Pembayaran tidak ditemukan';
  end if;

  if v_payment.status <> 'unpaid' then
    raise exception 'Pembayaran sudah diverifikasi';
  end if;

  select *
    into v_order
  from public.orders
  where id = v_payment.order_id
  for update;

  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  v_new_payment_status := case when decision = 'approve' then 'paid'::public.payment_status else 'cancelled'::public.payment_status end;

  update public.payments
  set status = v_new_payment_status,
      verified_by = actor_profile_id,
      verified_at = timezone('utc', now()),
      notes = coalesce(nullif(btrim(notes), ''), notes)
  where id = payment_id;

  select coalesce(sum(amount), 0)
    into v_paid_total
  from public.payments
  where order_id = v_payment.order_id
    and status = 'paid';

  if v_paid_total >= v_order.total_customer_payment and v_order.total_customer_payment > 0 then
    v_order_payment_status := 'paid';
  elsif v_paid_total > 0 then
    v_order_payment_status := 'partial';
  else
    v_order_payment_status := 'unpaid';
  end if;

  v_order_status := v_order.status;

  if decision = 'approve'
     and v_order_payment_status = 'paid'
     and v_order.status in ('recorded', 'waiting_payment') then
    v_order_status := 'payment_received';
  end if;

  update public.orders
  set payment_status = v_order_payment_status,
      status = v_order_status,
      updated_by = actor_profile_id
  where id = v_payment.order_id;

  if v_order_status <> v_order.status then
    insert into public.tracking_events (
      order_id,
      status,
      public_description,
      internal_description,
      location,
      created_by
    )
    values (
      v_payment.order_id,
      v_order_status,
      'Pembayaran telah diterima.',
      nullif(btrim(coalesce(notes, '')), ''),
      null,
      actor_profile_id
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
    actor_profile_id,
    request_id,
    'payment.verified',
    'payment',
    payment_id,
    jsonb_build_object(
      'status', v_payment.status,
      'orderPaymentStatus', v_order.payment_status,
      'orderStatus', v_order.status
    ),
    jsonb_build_object(
      'status', v_new_payment_status,
      'orderPaymentStatus', v_order_payment_status,
      'orderStatus', v_order_status,
      'decision', decision
    ),
    nullif(ip_address, '')::inet,
    user_agent
  );

  return jsonb_build_object(
    'paymentId', payment_id,
    'status', v_new_payment_status,
    'orderPaymentStatus', v_order_payment_status,
    'orderStatus', v_order_status,
    'verifiedAt', timezone('utc', now())
  );
end;
$$;

revoke all on table public.business_number_sequences from anon, authenticated;
revoke all on table public.idempotency_keys from anon, authenticated;
revoke execute on function public.next_business_number(text, timestamptz) from public;
revoke execute on function public.validate_order_service_type(text) from public;
revoke execute on function public.validate_order_fulfillment_method(text) from public;
revoke execute on function public.validate_order_status(text) from public;
revoke execute on function public.validate_order_item_status(text) from public;
revoke execute on function public.order_status_rank(public.order_status) from public;
revoke execute on function public.create_order_with_items(jsonb, uuid, text, text, text, text) from public;
revoke execute on function public.update_order_status_with_event(uuid, text, text, text, text, timestamptz, uuid, text, text, text) from public;
revoke execute on function public.add_order_payment(uuid, bigint, text, timestamptz, text, uuid, text, text, text) from public;
revoke execute on function public.verify_order_payment(uuid, text, text, uuid, text, text, text) from public;

grant execute on function public.next_business_number(text, timestamptz) to service_role;
grant execute on function public.validate_order_service_type(text) to service_role;
grant execute on function public.validate_order_fulfillment_method(text) to service_role;
grant execute on function public.validate_order_status(text) to service_role;
grant execute on function public.validate_order_item_status(text) to service_role;
grant execute on function public.order_status_rank(public.order_status) to service_role;
grant execute on function public.create_order_with_items(jsonb, uuid, text, text, text, text) to service_role;
grant execute on function public.update_order_status_with_event(uuid, text, text, text, text, timestamptz, uuid, text, text, text) to service_role;
grant execute on function public.add_order_payment(uuid, bigint, text, timestamptz, text, uuid, text, text, text) to service_role;
grant execute on function public.verify_order_payment(uuid, text, text, uuid, text, text, text) to service_role;

commit;
