-- BrightSmile Dental Clinic
-- Supabase/Postgres 17 compatible schema.
-- Apply through Supabase SQL editor or your migration workflow.
-- Authorization uses a private helper schema so role checks are not exposed as a public RPC.

create extension if not exists pgcrypto;

create schema if not exists private;

create type public.user_role as enum ('patient','receptionist','doctor','admin','super_admin');
create type public.appointment_status as enum ('pending','confirmed','completed','cancelled','no_show');
create type public.reschedule_status as enum ('requested','approved','rejected','cancelled');
create type public.message_status as enum ('queued','sent','delivered','read','failed');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  role public.user_role not null default 'patient',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null,
  specialty text not null,
  degrees text[] not null default '{}',
  certifications text[] not null default '{}',
  license_number text,
  experience_years integer not null default 0 check (experience_years >= 0),
  bio text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  price numeric(12,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete restrict,
  doctor_id uuid references public.doctors(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  appointment_date date not null,
  appointment_time time not null,
  status public.appointment_status not null default 'pending',
  notes text,
  source text not null default 'website' check (source in ('website','dashboard','phone','whatsapp')),
  created_by uuid references public.profiles(id) on delete set null,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reschedule_requests (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  current_date date not null,
  current_time time not null,
  requested_date date not null,
  requested_time time not null,
  reason text,
  status public.reschedule_status not null default 'requested',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete set null,
  patient_id uuid references public.profiles(id) on delete set null,
  direction text not null check (direction in ('outbound','inbound')),
  template_name text,
  recipient_phone text,
  provider_message_id text,
  status public.message_status not null default 'queued',
  payload jsonb not null default '{}',
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.clinic_settings (
  id integer primary key default 1 check (id = 1),
  clinic_name text not null default 'BrightSmile Dental Clinic',
  phone text,
  email text,
  address text,
  timezone text not null default 'Asia/Kolkata',
  appointment_buffer_minutes integer not null default 10,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists appointments_patient_idx on public.appointments(patient_id);
create index if not exists appointments_date_idx on public.appointments(appointment_date, appointment_time);
create index if not exists appointments_status_idx on public.appointments(status);
create index if not exists reschedule_status_idx on public.reschedule_requests(status);
create index if not exists whatsapp_appointment_idx on public.whatsapp_messages(appointment_id);

create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, private
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke all on function private.current_user_role() from public, anon;
grant execute on function private.current_user_role() to authenticated;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select coalesce(private.current_user_role() in ('receptionist','doctor','admin','super_admin'), false);
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select coalesce(private.current_user_role() in ('admin','super_admin'), false);
$$;

revoke all on function private.is_staff() from public, anon;
grant execute on function private.is_staff() to authenticated;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.reschedule_requests enable row level security;
alter table public.appointment_events enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.clinic_settings enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles
create policy "patients read own profile" on public.profiles
for select to authenticated
using (id = auth.uid() or private.is_staff());

create policy "patients update own profile" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "admins manage profiles" on public.profiles
for all to authenticated
using (private.is_admin())
with check (private.is_admin());

-- Doctors/services can be public to authenticated users; writes are staff/admin only.
create policy "authenticated read active doctors" on public.doctors
for select to authenticated using (is_active = true or private.is_staff());

create policy "staff manage doctors" on public.doctors
for all to authenticated
using (private.is_staff())
with check (private.is_staff());

create policy "authenticated read active services" on public.services
for select to authenticated using (is_active = true or private.is_staff());

create policy "staff manage services" on public.services
for all to authenticated
using (private.is_staff())
with check (private.is_staff());

-- Appointments: patients see only their own; staff sees clinic appointments.
create policy "patient read own appointments" on public.appointments
for select to authenticated
using (patient_id = auth.uid() or private.is_staff());

create policy "patient create own appointments" on public.appointments
for insert to authenticated
with check (patient_id = auth.uid());

create policy "patient update own appointment" on public.appointments
for update to authenticated
using (patient_id = auth.uid())
with check (patient_id = auth.uid());

create policy "staff manage appointments" on public.appointments
for all to authenticated
using (private.is_staff())
with check (private.is_staff());

-- Rescheduling: patient owns request; staff reviews.
create policy "patient read own reschedule" on public.reschedule_requests
for select to authenticated
using (requested_by = auth.uid() or private.is_staff());

create policy "patient create own reschedule" on public.reschedule_requests
for insert to authenticated
with check (requested_by = auth.uid());

create policy "patient cancel own reschedule" on public.reschedule_requests
for update to authenticated
using (requested_by = auth.uid() and status = 'requested')
with check (requested_by = auth.uid());

create policy "staff manage reschedule" on public.reschedule_requests
for all to authenticated
using (private.is_staff())
with check (private.is_staff());

create policy "patient read own events" on public.appointment_events
for select to authenticated
using (
  exists (
    select 1 from public.appointments a
    where a.id = appointment_id and (a.patient_id = auth.uid() or private.is_staff())
  )
);

create policy "staff write events" on public.appointment_events
for insert to authenticated
with check (private.is_staff());

create policy "patient read own whatsapp" on public.whatsapp_messages
for select to authenticated
using (patient_id = auth.uid() or private.is_staff());

create policy "staff write whatsapp" on public.whatsapp_messages
for insert to authenticated
with check (private.is_staff());

create policy "staff read clinic settings" on public.clinic_settings
for select to authenticated using (private.is_staff());

create policy "admin update clinic settings" on public.clinic_settings
for all to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "admin read audit logs" on public.audit_logs
for select to authenticated using (private.is_admin());

create policy "staff create audit logs" on public.audit_logs
for insert to authenticated
with check (private.is_staff());

-- Prevent patients from changing appointment status/ownership by direct client updates.
create or replace function private.guard_appointment_update()
returns trigger
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if not private.is_staff() then
    if new.patient_id <> old.patient_id
       or new.status <> old.status
       or new.doctor_id is distinct from old.doctor_id
       or new.service_id is distinct from old.service_id then
      raise exception 'Patients may only edit appointment notes through the patient workflow';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_appointment_update on public.appointments;
create trigger guard_appointment_update
before update on public.appointments
for each row execute function private.guard_appointment_update();

insert into public.clinic_settings (id, clinic_name, timezone)
values (1, 'BrightSmile Dental Clinic', 'Asia/Kolkata')
on conflict (id) do nothing;

insert into public.services (name, description, duration_minutes) values
('General Check-up','Routine examination and prevention consultation.',30),
('Teeth Cleaning','Professional dental cleaning and plaque removal.',45),
('Root Canal','Endodontic treatment for infected or inflamed pulp.',90),
('Orthodontic Consultation','Assessment and treatment planning for braces or aligners.',30),
('Dental Implant Consultation','Implant assessment and treatment planning.',45),
('Kids Dentistry','Child-focused preventive and restorative care.',30)
on conflict (name) do nothing;
