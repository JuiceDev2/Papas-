-- =========================================================
-- PAPAS DORADAS · Esquema de Supabase
-- Ejecutar completo en: Supabase Dashboard > SQL Editor
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- PERFILES DE PERSONAL (vinculados a auth.users)
-- roles: propietario | admin | colaborador
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('propietario', 'admin', 'colaborador')),
  full_name text not null,
  created_at timestamptz not null default now()
);

-- Funciones "security definer" para evitar recursión en RLS
create or replace function public.current_role_name()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_propietario()
returns boolean language sql security definer set search_path = public stable
as $$ select public.current_role_name() = 'propietario'; $$;

create or replace function public.is_staff()
returns boolean language sql security definer set search_path = public stable
as $$ select public.current_role_name() in ('propietario', 'admin', 'colaborador'); $$;

create or replace function public.can_sell()
returns boolean language sql security definer set search_path = public stable
as $$ select public.current_role_name() in ('propietario', 'colaborador'); $$;

-- ---------------------------------------------------------
-- PRODUCTOS
-- Solo dos presentaciones: bolsa de 150 g y kilo de 1000 g
-- ---------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Papas Doradas',
  flavor text not null,
  presentation text not null check (presentation in ('150g', '1000g')),
  price numeric(10,2) not null check (price > 0),
  popular boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- PEDIDOS / VENTAS
-- source: 'cliente' (tienda pública) | 'pos' (colaborador)
-- status: 'pendiente' | 'cobrado'
-- ---------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique,
  source text not null check (source in ('cliente', 'pos')),
  customer_name text,
  customer_phone text,
  status text not null check (status in ('pendiente', 'cobrado')) default 'pendiente',
  total numeric(10,2) not null,
  received numeric(10,2),
  change numeric(10,2),
  created_by uuid references public.profiles(id),
  cobrado_by uuid references public.profiles(id),
  cobrado_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  name text not null,
  flavor text not null,
  presentation text not null,
  unit_price numeric(10,2) not null,
  qty integer not null check (qty > 0),
  subtotal numeric(10,2) not null
);

-- ---------------------------------------------------------
-- HISTORIAL / AUDITORÍA (solo lectura total para propietario)
-- ---------------------------------------------------------
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  actor_role text not null,
  actor_name text not null,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- FOLIO CORRELATIVO LEGIBLE (ej. PD-0001)
-- ---------------------------------------------------------
create sequence if not exists public.order_folio_seq start 1;

create or replace function public.next_folio()
returns text language sql as $$
  select 'PD-' || lpad(nextval('public.order_folio_seq')::text, 4, '0');
$$;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.audit_log enable row level security;

-- PROFILES: cada quien ve su propio perfil; el propietario ve todos
drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self" on public.profiles
  for select using (id = auth.uid() or public.is_propietario());

-- PRODUCTS: catálogo público de lectura (para la tienda), escritura solo staff
drop policy if exists "products_select_public" on public.products;
create policy "products_select_public" on public.products
  for select using (true);

drop policy if exists "products_insert_staff" on public.products;
create policy "products_insert_staff" on public.products
  for insert with check (public.is_staff());

drop policy if exists "products_update_staff" on public.products;
create policy "products_update_staff" on public.products
  for update using (public.is_staff());

-- Solo el propietario puede eliminar productos (el colaborador NO puede)
drop policy if exists "products_delete_owner" on public.products;
create policy "products_delete_owner" on public.products
  for delete using (public.is_propietario());

-- ORDERS / ORDER_ITEMS / AUDIT_LOG: sin acceso directo desde el cliente.
-- Toda lectura/escritura pasa por las funciones RPC de abajo (security definer)
-- o por el service role usado en Server Actions. No se crean policies de
-- select/insert/update para 'anon'/'authenticated' a propósito.

-- =========================================================
-- RPC: crear pedido desde la tienda pública (cliente, sin login)
-- =========================================================
create or replace function public.create_cliente_order(
  p_customer_name text,
  p_customer_phone text,
  p_items jsonb -- [{product_id, qty}]
)
returns table (order_id uuid, folio text, total numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_folio text;
  v_total numeric := 0;
  v_item record;
  v_product record;
  v_subtotal numeric;
begin
  if p_customer_name is null or length(trim(p_customer_name)) = 0 then
    raise exception 'El nombre es obligatorio';
  end if;
  if p_customer_phone is null or length(trim(p_customer_phone)) < 7 then
    raise exception 'El teléfono no es válido';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito está vacío';
  end if;

  v_folio := public.next_folio();
  v_order_id := gen_random_uuid();

  -- Calcula el total usando el precio ACTUAL en la base de datos
  -- (nunca se confía en el precio que mande el navegador)
  for v_item in select * from jsonb_to_recordset(p_items) as x(product_id uuid, qty int)
  loop
    select * into v_product from public.products where id = v_item.product_id;
    if v_product is null then
      raise exception 'Producto no encontrado';
    end if;
    v_subtotal := v_product.price * v_item.qty;
    v_total := v_total + v_subtotal;

    insert into public.order_items (order_id, product_id, name, flavor, presentation, unit_price, qty, subtotal)
    values (v_order_id, v_product.id, v_product.name, v_product.flavor, v_product.presentation, v_product.price, v_item.qty, v_subtotal);
  end loop;

  insert into public.orders (id, folio, source, customer_name, customer_phone, status, total, created_at)
  values (v_order_id, v_folio, 'cliente', trim(p_customer_name), trim(p_customer_phone), 'pendiente', v_total, now());

  insert into public.audit_log (actor_id, actor_role, actor_name, action, details)
  values (null, 'cliente', trim(p_customer_name), 'pedido_cliente',
    jsonb_build_object('folio', v_folio, 'total', v_total, 'telefono', trim(p_customer_phone)));

  return query select v_order_id, v_folio, v_total;
end;
$$;

-- Permite a usuarios anónimos (tienda pública) ejecutar esta función
grant execute on function public.create_cliente_order(text, text, jsonb) to anon, authenticated;

-- =========================================================
-- RPC: venta de mostrador (POS) — solo propietario / colaborador
-- =========================================================
create or replace function public.create_pos_sale(
  p_items jsonb, -- [{product_id, qty}]
  p_received numeric
)
returns table (order_id uuid, folio text, total numeric, change numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := public.current_role_name();
  v_actor_name text;
  v_order_id uuid;
  v_folio text;
  v_total numeric := 0;
  v_item record;
  v_product record;
  v_subtotal numeric;
begin
  if v_role not in ('propietario', 'colaborador') then
    raise exception 'No tienes permiso para registrar ventas de mostrador';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'No hay productos seleccionados';
  end if;

  select full_name into v_actor_name from public.profiles where id = auth.uid();

  v_folio := public.next_folio();
  v_order_id := gen_random_uuid();

  for v_item in select * from jsonb_to_recordset(p_items) as x(product_id uuid, qty int)
  loop
    select * into v_product from public.products where id = v_item.product_id;
    if v_product is null then
      raise exception 'Producto no encontrado';
    end if;
    v_subtotal := v_product.price * v_item.qty;
    v_total := v_total + v_subtotal;

    insert into public.order_items (order_id, product_id, name, flavor, presentation, unit_price, qty, subtotal)
    values (v_order_id, v_product.id, v_product.name, v_product.flavor, v_product.presentation, v_product.price, v_item.qty, v_subtotal);
  end loop;

  if p_received < v_total then
    raise exception 'El monto recibido es menor al total';
  end if;

  insert into public.orders (id, folio, source, status, total, received, change, created_by, cobrado_by, cobrado_at, created_at)
  values (v_order_id, v_folio, 'pos', 'cobrado', v_total, p_received, p_received - v_total, auth.uid(), auth.uid(), now(), now());

  insert into public.audit_log (actor_id, actor_role, actor_name, action, details)
  values (auth.uid(), v_role, coalesce(v_actor_name, v_role), 'venta_pos',
    jsonb_build_object('folio', v_folio, 'total', v_total, 'recibido', p_received, 'cambio', p_received - v_total));

  return query select v_order_id, v_folio, v_total, (p_received - v_total);
end;
$$;

grant execute on function public.create_pos_sale(jsonb, numeric) to authenticated;

-- =========================================================
-- RPC: marcar un pedido de cliente como cobrado/despachado
-- Solo propietario / colaborador (el admin solo consulta)
-- =========================================================
create or replace function public.mark_order_cobrado(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := public.current_role_name();
  v_actor_name text;
  v_folio text;
begin
  if v_role not in ('propietario', 'colaborador') then
    raise exception 'No tienes permiso para marcar pedidos como cobrados';
  end if;

  select full_name into v_actor_name from public.profiles where id = auth.uid();

  update public.orders
    set status = 'cobrado', cobrado_by = auth.uid(), cobrado_at = now()
    where id = p_order_id and status = 'pendiente'
    returning folio into v_folio;

  if v_folio is null then
    raise exception 'El pedido ya fue cobrado o no existe';
  end if;

  insert into public.audit_log (actor_id, actor_role, actor_name, action, details)
  values (auth.uid(), v_role, coalesce(v_actor_name, v_role), 'pedido_cobrado', jsonb_build_object('folio', v_folio));
end;
$$;

grant execute on function public.mark_order_cobrado(uuid) to authenticated;

-- =========================================================
-- RPC: listas para el personal (bypassa RLS de orders/audit_log
-- de forma controlada, verificando el rol dentro de la función)
-- =========================================================
create or replace function public.list_orders(p_status text default null)
returns setof public.orders
language sql
security definer
set search_path = public
as $$
  select * from public.orders
  where public.is_staff()
    and (p_status is null or status = p_status)
  order by created_at desc;
$$;

grant execute on function public.list_orders(text) to authenticated;

create or replace function public.list_order_items(p_order_id uuid)
returns setof public.order_items
language sql
security definer
set search_path = public
as $$
  select * from public.order_items
  where public.is_staff() and order_id = p_order_id;
$$;

grant execute on function public.list_order_items(uuid) to authenticated;

create or replace function public.list_audit_log()
returns setof public.audit_log
language sql
security definer
set search_path = public
as $$
  select * from public.audit_log
  where public.is_propietario() or public.current_role_name() = 'admin'
  order by created_at desc;
$$;

grant execute on function public.list_audit_log() to authenticated;

-- =========================================================
-- Seed de productos de ejemplo (puedes borrarlos desde el panel)
-- =========================================================
insert into public.products (name, flavor, presentation, price, popular)
values
  ('Papas Doradas', 'Natural', '150g', 22.00, true),
  ('Papas Doradas', 'Natural', '1000g', 130.00, false),
  ('Papas Doradas', 'Chile Picante', '150g', 24.00, true),
  ('Papas Doradas', 'Chile Picante', '1000g', 140.00, false),
  ('Papas Doradas', 'Limón', '150g', 24.00, true),
  ('Papas Doradas', 'Limón', '1000g', 140.00, false),
  ('Papas Doradas', 'Queso', '150g', 26.00, false),
  ('Papas Doradas', 'Queso', '1000g', 150.00, false),
  ('Papas Doradas', 'BBQ', '150g', 25.00, false),
  ('Papas Doradas', 'BBQ', '1000g', 145.00, false)
on conflict do nothing;
