-- =====================================================================
-- Royal Journey CRM – Supabase schema
-- Run this whole file once in: Supabase Dashboard → SQL Editor → New query
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- PROFILES (one per login user) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  full_name text not null default '',
  email text not null default '',
  role text not null default 'agent' check (role in ('admin','manager','agent')),
  phone text not null default '',
  specialization_areas text not null default '',
  specialization_types text not null default '',
  active boolean not null default true
);

-- Auto-create a profile whenever a user is added in Authentication.
-- The FIRST user ever created becomes the admin.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email,''), '@', 1)),
    case when (select count(*) from public.profiles) = 0 then 'admin' else 'agent' end
  );
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper functions used by the security policies
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active = true
$$;
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('admin','manager'), false)
$$;
create or replace function public.can_see_lead(lid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staff() or exists (
    select 1 from public.leads l where l.id = lid and l.assigned_to = auth.uid()
  )
$$;

-- ---------- LEADS ----------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null default '',
  email text not null default '',
  source text not null default 'Website',
  client_type text not null default 'buyer',          -- buyer | seller | tenant | landlord
  budget numeric not null default 0,
  preferred_area text not null default '',
  property_type text not null default 'Apartment',
  purpose text not null default 'End-use',
  timeline text not null default '',
  temperature text not null default 'warm' check (temperature in ('hot','warm','cold')),
  stage text not null default 'new',
  assigned_to uuid references public.profiles(id) on delete set null,
  follow_up_at timestamptz,
  first_contact_at timestamptz,
  lost_reason text not null default '',
  lost_followup_at timestamptz,
  consent_marketing boolean not null default false,
  notes text not null default '',
  closed_at timestamptz
);
create index if not exists leads_assigned_idx on public.leads(assigned_to);
create index if not exists leads_stage_idx on public.leads(stage);
create index if not exists leads_created_idx on public.leads(created_at desc);

-- ---------- PROPERTIES ----------
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  ref text not null default '',
  title text not null,
  type text not null default 'Apartment',
  listing_type text not null default 'sale' check (listing_type in ('sale','rent')),
  area text not null default '',
  building text not null default '',
  bedrooms int not null default 1,
  size_sqft numeric not null default 0,
  price numeric not null default 0,
  status text not null default 'available' check (status in ('available','reserved','sold','rented')),
  owner_name text not null default '',
  owner_phone text not null default '',
  permit_no text not null default '',
  photos_url text not null default '',
  video_url text not null default '',
  agent_id uuid references public.profiles(id) on delete set null
);

-- ---------- VIEWINGS ----------
create table if not exists public.viewings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  agent_id uuid references public.profiles(id) on delete set null,
  scheduled_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  feedback text not null default '',
  next_action text not null default '',
  reminder_sent boolean not null default false
);

-- ---------- OFFERS ----------
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  amount numeric not null default 0,
  kind text not null default 'offer' check (kind in ('offer','counter')),
  from_party text not null default 'Buyer',
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  notes text not null default ''
);

-- ---------- DEALS ----------
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  agent_id uuid references public.profiles(id) on delete set null,
  agreed_price numeric not null default 0,
  commission_pct numeric not null default 2,
  commission_amount numeric not null default 0,
  status text not null default 'open' check (status in ('open','won','lost')),
  checklist jsonb not null default '{}'::jsonb,
  notes text not null default '',
  closed_at timestamptz
);

-- ---------- TASKS (follow-ups, post-sale 30/90/180, lost-lead re-engagement) ----------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid references public.leads(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  title text not null,
  kind text not null default 'follow_up',
  due_at timestamptz not null,
  done boolean not null default false
);
create index if not exists tasks_due_idx on public.tasks(due_at) where done = false;

-- ---------- ACTIVITIES (timeline / audit log) ----------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  type text not null default 'note',
  text text not null default ''
);
create index if not exists activities_lead_idx on public.activities(lead_id, created_at desc);

-- =====================================================================
-- ROW LEVEL SECURITY
-- admin / manager  → see and edit everything
-- agent            → only leads assigned to them (and the records attached to those leads)
-- =====================================================================
alter table public.profiles   enable row level security;
alter table public.leads      enable row level security;
alter table public.properties enable row level security;
alter table public.viewings   enable row level security;
alter table public.offers     enable row level security;
alter table public.deals      enable row level security;
alter table public.tasks      enable row level security;
alter table public.activities enable row level security;

-- profiles: everyone signed-in can read the team; only admins change profiles
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles for all to authenticated
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- leads
drop policy if exists leads_select on public.leads;
create policy leads_select on public.leads for select to authenticated
  using (public.is_staff() or assigned_to = auth.uid());
drop policy if exists leads_insert on public.leads;
create policy leads_insert on public.leads for insert to authenticated
  with check (public.is_staff() or assigned_to = auth.uid());
drop policy if exists leads_update on public.leads;
create policy leads_update on public.leads for update to authenticated
  using (public.is_staff() or assigned_to = auth.uid())
  with check (public.is_staff() or assigned_to = auth.uid());
drop policy if exists leads_delete on public.leads;
create policy leads_delete on public.leads for delete to authenticated using (public.is_staff());

-- properties: whole team can read & write inventory; only staff delete
drop policy if exists props_rw on public.properties;
create policy props_rw on public.properties for select to authenticated using (public.my_role() is not null);
drop policy if exists props_ins on public.properties;
create policy props_ins on public.properties for insert to authenticated with check (public.my_role() is not null);
drop policy if exists props_upd on public.properties;
create policy props_upd on public.properties for update to authenticated using (public.my_role() is not null);
drop policy if exists props_del on public.properties;
create policy props_del on public.properties for delete to authenticated using (public.is_staff());

-- records attached to a lead: visible to whoever can see the lead
do $$
declare t text;
begin
  foreach t in array array['viewings','offers','deals','activities'] loop
    execute format('drop policy if exists %I_all on public.%I', t, t);
    execute format('create policy %I_all on public.%I for all to authenticated using (public.can_see_lead(lead_id)) with check (public.can_see_lead(lead_id))', t, t);
  end loop;
end $$;

-- tasks: staff see all; agents see their own or those on their leads
drop policy if exists tasks_all on public.tasks;
create policy tasks_all on public.tasks for all to authenticated
  using (public.is_staff() or assigned_to = auth.uid() or (lead_id is not null and public.can_see_lead(lead_id)))
  with check (public.is_staff() or assigned_to = auth.uid() or (lead_id is not null and public.can_see_lead(lead_id)));

-- Done. Now go to Authentication → Users → Add user (your email + password).
-- The first user becomes ADMIN automatically.
