begin;

alter table public.orders
  add column if not exists version integer not null default 1 check (version >= 1);

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

drop function if exists public.create_order_with_items(jsonb, uuid, text, text, text, text);
create or replace function public.create_order_with_items(
  p_payload jsonb,
  p_actor_profile_id uuid,
  p_request_id text,
  p_idempotency_key text default null,
  p_ip_address text default null,
  p_user_agent text default null
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
  v_order_version integer;
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
  if p_actor_profile_id is null then
    raise exception 'Actor profile is required';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Payload pesanan tidak valid';
  end if;

  v_request_hash := encode(digest(p_payload::text, 'sha256'), 'hex');

  if nullif(btrim(coalesce(p_idempotency_key, '')), '') is not null then
    select *
      into v_existing
    from public.idempotency_keys
    where scope = v_scope
      and idempotency_key = btrim(p_idempotency_key)
      and actor_profile_id = p_actor_profile_id
      and expires_at > timezone('utc', now());

    if found then
      if v_existing.request_hash <> v_request_hash then
        raise exception 'Idempotency key digunakan dengan payload berbeda';
      end if;

      return v_existing.response;
    end if;
  end if;

  v_service_type := public.validate_order_service_type(p_payload ->> 'serviceType');
  v_fulfillment_method := public.validate_order_fulfillment_method(coalesce(p_payload ->> 'fulfillmentMethod', 'branch_pickup'));
  v_origin_branch_id := (p_payload ->> 'originBranchId')::uuid;
  v_destination_branch_id := (p_payload ->> 'destinationBranchId')::uuid;
  v_route_id := (p_payload ->> 'routeId')::uuid;
  v_sender_customer_id := (p_payload ->> 'senderCustomerId')::uuid;
  v_receiver_customer_id := nullif(p_payload ->> 'receiverCustomerId', '')::uuid;
  v_goods_amount := coalesce((p_payload ->> 'goodsAmount')::bigint, 0);
  v_service_revenue := coalesce((p_payload ->> 'serviceRevenue')::bigint, 0);
  v_additional_service_fees := coalesce((p_payload ->> 'additionalServiceFees')::bigint, 0);
  v_discount_amount := coalesce((p_payload ->> 'discountAmount')::bigint, 0);
  v_items := p_payload -> 'items';

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
    nullif(btrim(coalesce(p_payload ->> 'deliveryAddress', '')), ''),
    nullif(btrim(coalesce(p_payload ->> 'publicNotes', '')), ''),
    nullif(btrim(coalesce(p_payload ->> 'internalNotes', '')), ''),
    p_actor_profile_id,
    p_actor_profile_id
  )
  returning id, total_customer_payment, version
    into v_order_id, v_total_customer_payment, v_order_version;

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
    coalesce(nullif(btrim(p_payload ->> 'initialPublicDescription'), ''), 'Pesanan dicatat oleh admin.'),
    nullif(btrim(coalesce(p_payload ->> 'initialInternalDescription', '')), ''),
    nullif(btrim(coalesce(p_payload ->> 'initialLocation', '')), ''),
    p_actor_profile_id
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
    p_actor_profile_id,
    p_request_id,
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
      'totalCustomerPayment', v_total_customer_payment,
      'version', v_order_version
    ),
    nullif(p_ip_address, '')::inet,
    p_user_agent
  );

  v_response := jsonb_build_object(
    'order',
    jsonb_build_object(
      'id', v_order_id,
      'trackingNumber', v_tracking_number,
      'status', 'recorded',
      'paymentStatus', 'unpaid',
      'totalCustomerPayment', v_total_customer_payment,
      'version', v_order_version
    )
  );

  if nullif(btrim(coalesce(p_idempotency_key, '')), '') is not null then
    insert into public.idempotency_keys (
      scope,
      idempotency_key,
      actor_profile_id,
      request_hash,
      response
    )
    values (
      v_scope,
      btrim(p_idempotency_key),
      p_actor_profile_id,
      v_request_hash,
      v_response
    );
  end if;

  return v_response;
end;
$$;

create or replace function public.update_order_with_items(
  p_order_id uuid,
  p_payload jsonb,
  p_expected_version integer,
  p_actor_profile_id uuid,
  p_request_id text,
  p_ip_address text default null,
  p_user_agent text default null
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
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
  v_items jsonb;
  v_item jsonb;
  v_item_count integer := 0;
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Payload pesanan tidak valid';
  end if;

  select *
    into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  if p_expected_version is not null and v_order.version <> p_expected_version then
    raise sqlstate '40001' using message = 'Data pesanan telah berubah';
  end if;

  if v_order.status not in ('recorded', 'waiting_payment') then
    raise exception 'Pesanan tidak dapat diedit setelah pembayaran atau proses operasional berjalan';
  end if;

  v_service_type := public.validate_order_service_type(p_payload ->> 'serviceType');
  v_fulfillment_method := public.validate_order_fulfillment_method(coalesce(p_payload ->> 'fulfillmentMethod', 'branch_pickup'));
  v_origin_branch_id := (p_payload ->> 'originBranchId')::uuid;
  v_destination_branch_id := (p_payload ->> 'destinationBranchId')::uuid;
  v_route_id := (p_payload ->> 'routeId')::uuid;
  v_sender_customer_id := (p_payload ->> 'senderCustomerId')::uuid;
  v_receiver_customer_id := nullif(p_payload ->> 'receiverCustomerId', '')::uuid;
  v_goods_amount := coalesce((p_payload ->> 'goodsAmount')::bigint, 0);
  v_service_revenue := coalesce((p_payload ->> 'serviceRevenue')::bigint, 0);
  v_additional_service_fees := coalesce((p_payload ->> 'additionalServiceFees')::bigint, 0);
  v_discount_amount := coalesce((p_payload ->> 'discountAmount')::bigint, 0);
  v_items := p_payload -> 'items';

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

  update public.orders
  set service_type = v_service_type,
      fulfillment_method = v_fulfillment_method,
      origin_branch_id = v_origin_branch_id,
      destination_branch_id = v_destination_branch_id,
      route_id = v_route_id,
      sender_customer_id = v_sender_customer_id,
      receiver_customer_id = v_receiver_customer_id,
      goods_amount = v_goods_amount,
      service_revenue = v_service_revenue,
      additional_service_fees = v_additional_service_fees,
      discount_amount = v_discount_amount,
      delivery_address = nullif(btrim(coalesce(p_payload ->> 'deliveryAddress', '')), ''),
      public_notes = nullif(btrim(coalesce(p_payload ->> 'publicNotes', '')), ''),
      internal_notes = nullif(btrim(coalesce(p_payload ->> 'internalNotes', '')), ''),
      updated_by = p_actor_profile_id
  where id = p_order_id;

  delete from public.order_items where order_id = p_order_id;

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
      p_order_id,
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
    p_actor_profile_id,
    p_request_id,
    'order.updated',
    'order',
    p_order_id,
    jsonb_build_object(
      'version', v_order.version,
      'serviceType', v_order.service_type,
      'originBranchId', v_order.origin_branch_id,
      'destinationBranchId', v_order.destination_branch_id,
      'routeId', v_order.route_id,
      'goodsAmount', v_order.goods_amount,
      'serviceRevenue', v_order.service_revenue
    ),
    jsonb_build_object(
      'serviceType', v_service_type,
      'originBranchId', v_origin_branch_id,
      'destinationBranchId', v_destination_branch_id,
      'routeId', v_route_id,
      'itemCount', v_item_count,
      'goodsAmount', v_goods_amount,
      'serviceRevenue', v_service_revenue
    ),
    nullif(p_ip_address, '')::inet,
    p_user_agent
  );

  return (
    select jsonb_build_object(
      'orderId', o.id,
      'version', o.version,
      'updatedAt', o.updated_at
    )
    from public.orders o
    where o.id = p_order_id
  );
end;
$$;

drop function if exists public.update_order_status_with_event(uuid, text, text, text, text, timestamptz, uuid, text, text, text);
create or replace function public.update_order_status_with_event(
  p_order_id uuid,
  p_next_status text,
  p_public_description text,
  p_internal_description text,
  p_location text,
  p_expected_version integer,
  p_actor_profile_id uuid,
  p_request_id text,
  p_ip_address text default null,
  p_user_agent text default null
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_next_status public.order_status;
begin
  v_next_status := public.validate_order_status(p_next_status);

  select *
    into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  if p_expected_version is not null and v_order.version <> p_expected_version then
    raise sqlstate '40001' using message = 'Data pesanan telah berubah';
  end if;

  if v_order.status in ('completed', 'cancelled') then
    raise exception 'Status pesanan final tidak dapat diubah';
  end if;

  if public.order_status_rank(v_next_status) - public.order_status_rank(v_order.status) > 1
     and nullif(btrim(coalesce(p_internal_description, '')), '') is null then
    raise exception 'Catatan internal wajib diisi untuk perubahan status lompat';
  end if;

  update public.orders
  set status = v_next_status,
      updated_by = p_actor_profile_id
  where id = p_order_id;

  insert into public.tracking_events (
    order_id,
    status,
    public_description,
    internal_description,
    location,
    created_by
  )
  values (
    p_order_id,
    v_next_status,
    coalesce(nullif(btrim(p_public_description), ''), 'Status pesanan diperbarui.'),
    nullif(btrim(coalesce(p_internal_description, '')), ''),
    nullif(btrim(coalesce(p_location, '')), ''),
    p_actor_profile_id
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
    p_actor_profile_id,
    p_request_id,
    'order.status_updated',
    'order',
    p_order_id,
    jsonb_build_object('status', v_order.status, 'version', v_order.version),
    jsonb_build_object('status', v_next_status),
    nullif(p_ip_address, '')::inet,
    p_user_agent
  );

  return (
    select jsonb_build_object(
      'orderId', o.id,
      'status', o.status,
      'version', o.version,
      'updatedAt', o.updated_at
    )
    from public.orders o
    where o.id = p_order_id
  );
end;
$$;

drop function if exists public.add_order_payment(uuid, bigint, text, timestamptz, text, uuid, text, text, text);
create or replace function public.add_order_payment(
  p_order_id uuid,
  p_amount bigint,
  p_payment_method text,
  p_paid_at timestamptz,
  p_notes text,
  p_actor_profile_id uuid,
  p_request_id text,
  p_attachment_object_key text default null,
  p_attachment_original_filename text default null,
  p_attachment_mime_type text default null,
  p_attachment_size_bytes bigint default null,
  p_ip_address text default null,
  p_user_agent text default null
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_payment_id uuid;
  v_attachment_id uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Nominal pembayaran harus lebih dari 0';
  end if;

  if nullif(btrim(coalesce(p_payment_method, '')), '') is null then
    raise exception 'Metode pembayaran wajib diisi';
  end if;

  if nullif(btrim(coalesce(p_attachment_object_key, '')), '') is not null then
    if nullif(btrim(coalesce(p_attachment_original_filename, '')), '') is null
       or nullif(btrim(coalesce(p_attachment_mime_type, '')), '') is null
       or coalesce(p_attachment_size_bytes, 0) <= 0 then
      raise exception 'Metadata bukti pembayaran tidak lengkap';
    end if;
  end if;

  select *
    into v_order
  from public.orders
  where id = p_order_id
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
    p_order_id,
    p_amount,
    btrim(p_payment_method),
    'unpaid',
    p_paid_at,
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning id into v_payment_id;

  if nullif(btrim(coalesce(p_attachment_object_key, '')), '') is not null then
    insert into public.attachments (
      entity_type,
      entity_id,
      object_key,
      original_filename,
      mime_type,
      size_bytes,
      is_private,
      uploaded_by
    )
    values (
      'payment',
      v_payment_id,
      btrim(p_attachment_object_key),
      btrim(p_attachment_original_filename),
      btrim(p_attachment_mime_type),
      p_attachment_size_bytes,
      true,
      p_actor_profile_id
    )
    returning id into v_attachment_id;
  end if;

  update public.orders
  set updated_by = p_actor_profile_id
  where id = p_order_id;

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
    p_actor_profile_id,
    p_request_id,
    'payment.created',
    'payment',
    v_payment_id,
    null,
    jsonb_build_object(
      'orderId', p_order_id,
      'amount', p_amount,
      'paymentMethod', btrim(p_payment_method),
      'attachmentId', v_attachment_id
    ),
    nullif(p_ip_address, '')::inet,
    p_user_agent
  );

  return jsonb_build_object(
    'paymentId', v_payment_id,
    'orderId', p_order_id,
    'status', 'unpaid',
    'attachmentId', v_attachment_id
  );
end;
$$;

drop function if exists public.verify_order_payment(uuid, text, text, uuid, text, text, text);
create or replace function public.verify_order_payment(
  p_payment_id uuid,
  p_decision text,
  p_notes text,
  p_actor_profile_id uuid,
  p_request_id text,
  p_ip_address text default null,
  p_user_agent text default null
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
  if p_decision not in ('approve', 'reject') then
    raise exception 'Keputusan verifikasi pembayaran tidak valid';
  end if;

  select *
    into v_payment
  from public.payments
  where id = p_payment_id
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

  v_new_payment_status := case when p_decision = 'approve' then 'paid'::public.payment_status else 'cancelled'::public.payment_status end;

  update public.payments
  set status = v_new_payment_status,
      verified_by = p_actor_profile_id,
      verified_at = timezone('utc', now()),
      notes = coalesce(nullif(btrim(p_notes), ''), notes)
  where id = p_payment_id;

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

  if p_decision = 'approve'
     and v_order_payment_status = 'paid'
     and v_order.status in ('recorded', 'waiting_payment') then
    v_order_status := 'payment_received';
  end if;

  update public.orders
  set payment_status = v_order_payment_status,
      status = v_order_status,
      updated_by = p_actor_profile_id
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
      nullif(btrim(coalesce(p_notes, '')), ''),
      null,
      p_actor_profile_id
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
    p_actor_profile_id,
    p_request_id,
    'payment.verified',
    'payment',
    p_payment_id,
    jsonb_build_object(
      'status', v_payment.status,
      'orderPaymentStatus', v_order.payment_status,
      'orderStatus', v_order.status,
      'orderVersion', v_order.version
    ),
    jsonb_build_object(
      'status', v_new_payment_status,
      'orderPaymentStatus', v_order_payment_status,
      'orderStatus', v_order_status,
      'decision', p_decision
    ),
    nullif(p_ip_address, '')::inet,
    p_user_agent
  );

  return (
    select jsonb_build_object(
      'paymentId', p_payment_id,
      'status', v_new_payment_status,
      'orderPaymentStatus', v_order_payment_status,
      'orderStatus', v_order_status,
      'orderVersion', o.version,
      'verifiedAt', timezone('utc', now())
    )
    from public.orders o
    where o.id = v_payment.order_id
  );
end;
$$;

revoke execute on function public.increment_order_version() from public;
revoke execute on function public.create_order_with_items(jsonb, uuid, text, text, text, text) from public;
revoke execute on function public.update_order_with_items(uuid, jsonb, integer, uuid, text, text, text) from public;
revoke execute on function public.update_order_status_with_event(uuid, text, text, text, text, integer, uuid, text, text, text) from public;
revoke execute on function public.add_order_payment(uuid, bigint, text, timestamptz, text, uuid, text, text, text, text, bigint, text, text) from public;
revoke execute on function public.verify_order_payment(uuid, text, text, uuid, text, text, text) from public;

grant execute on function public.create_order_with_items(jsonb, uuid, text, text, text, text) to service_role;
grant execute on function public.update_order_with_items(uuid, jsonb, integer, uuid, text, text, text) to service_role;
grant execute on function public.update_order_status_with_event(uuid, text, text, text, text, integer, uuid, text, text, text) to service_role;
grant execute on function public.add_order_payment(uuid, bigint, text, timestamptz, text, uuid, text, text, text, text, bigint, text, text) to service_role;
grant execute on function public.verify_order_payment(uuid, text, text, uuid, text, text, text) to service_role;

commit;
