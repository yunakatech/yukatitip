begin;

select plan(7);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name = 'version'
      and is_nullable = 'NO'
  ),
  'orders.version exists and is required'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'increment_orders_version_trigger'
      and not tgisinternal
  ),
  'orders version increment trigger exists'
);

select ok(to_regclass('public.business_number_sequences') is not null, 'business_number_sequences table exists');
select ok(to_regclass('public.idempotency_keys') is not null, 'idempotency_keys table exists');

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'create_order_with_items'
  ),
  'create_order_with_items RPC exists'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'update_order_with_items'
  ),
  'update_order_with_items RPC exists'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'add_order_payment'
  ),
  'add_order_payment RPC exists'
);

select * from finish();

rollback;
