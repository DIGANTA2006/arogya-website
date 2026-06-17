-- AROGYA PRODUCTION DATABASE SCHEMA
-- Run this in Supabase SQL Editor

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age text,
  phone text not null,
  email text unique not null,
  password_hash text,
  created_at timestamptz default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  patient_email text,
  name text not null,
  age text,
  phone text not null,
  email text,
  service text not null,
  appointment_type text default 'Clinic Visit',
  appointment_date text not null,
  appointment_time text not null,
  message text,
  status text default 'New',
  created_at timestamptz default now()
);

create table if not exists password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone text,
  status text default 'Pending',
  created_at timestamptz default now()
);

create index if not exists appointments_email_idx on appointments(email);
create index if not exists appointments_status_idx on appointments(status);
create index if not exists patients_email_idx on patients(email);

-- =====================================================
-- AROGYA SMART PRESCRIPTION SYSTEM - PHASE 1
-- Prescription visit / QR print / scanner upload foundation
-- =====================================================

create table if not exists prescription_visits (
  id uuid primary key default gen_random_uuid(),
  rx_number text unique not null,
  patient_email text not null,
  patient_name text not null,
  patient_phone text,
  patient_age text,
  appointment_id uuid,
  appointment_type text default 'Clinic Visit',
  upload_token text unique not null,
  status text default 'printed',
  uploaded_prescription_id uuid,
  uploaded_prescription_token text,
  printed_at timestamptz,
  scanned_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists prescription_visits_rx_number_idx
on prescription_visits(rx_number);

create index if not exists prescription_visits_patient_email_idx
on prescription_visits(patient_email);

create index if not exists prescription_visits_upload_token_idx
on prescription_visits(upload_token);

create index if not exists prescription_visits_status_idx
on prescription_visits(status);

alter table prescriptions
add column if not exists prescription_visit_id uuid;

alter table prescriptions
add column if not exists rx_number text;
-- =====================================================
-- Phase 6G: Forgot password + email verification support
-- =====================================================

alter table if exists public.patients
add column if not exists email_verified boolean not null default false;

create table if not exists public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  patient_email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_password_reset_requests_token_hash
on public.password_reset_requests(token_hash);

create index if not exists idx_password_reset_requests_patient_email
on public.password_reset_requests(patient_email);

create table if not exists public.email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  patient_email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_verification_tokens_token_hash
on public.email_verification_tokens(token_hash);

create index if not exists idx_email_verification_tokens_patient_email
on public.email_verification_tokens(patient_email);

alter table public.password_reset_requests enable row level security;
alter table public.email_verification_tokens enable row level security;

drop policy if exists "Service role full access for password reset requests" on public.password_reset_requests;
create policy "Service role full access for password reset requests"
on public.password_reset_requests
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role full access for email verification tokens" on public.email_verification_tokens;
create policy "Service role full access for email verification tokens"
on public.email_verification_tokens
for all
to service_role
using (true)
with check (true);

grant all privileges on table public.password_reset_requests to service_role;
grant all privileges on table public.email_verification_tokens to service_role;

-- =====================================================
-- Phase 6H: Appointment slot lookup optimization
-- =====================================================

create index if not exists idx_appointments_date_time
on public.appointments(appointment_date, appointment_time);

-- =====================================================

-- =====================================================
-- Phase 9A: Critical auth/database hardening
-- Repaired idempotent version
-- Fixes:
-- 1) Wrong appointment date/time index
-- 2) Missing admin_2fa_challenges table
-- 3) Missing reviews table
-- 4) Existing old admin_audit_logs table without table_name column
-- =====================================================

create table if not exists public.admin_audit_logs (
  id bigserial primary key
);

alter table public.admin_audit_logs
add column if not exists table_name text;

alter table public.admin_audit_logs
add column if not exists record_id text;

alter table public.admin_audit_logs
add column if not exists action text;

alter table public.admin_audit_logs
add column if not exists old_data jsonb;

alter table public.admin_audit_logs
add column if not exists new_data jsonb;

alter table public.admin_audit_logs
add column if not exists created_at timestamptz not null default now();

update public.admin_audit_logs
set table_name = 'legacy'
where table_name is null;

update public.admin_audit_logs
set action = 'LEGACY'
where action is null;

alter table public.admin_audit_logs
alter column table_name set not null;

alter table public.admin_audit_logs
alter column action set not null;

drop index if exists public.idx_appointments_date_time;

create index if not exists idx_appointments_date_time
on public.appointments(appointment_date, appointment_time);

create table if not exists public.admin_2fa_challenges (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists admin_2fa_challenges_admin_email_idx
on public.admin_2fa_challenges(admin_email);

create index if not exists admin_2fa_challenges_expires_at_idx
on public.admin_2fa_challenges(expires_at);

alter table public.admin_2fa_challenges enable row level security;

drop policy if exists "Service role full access for admin 2fa challenges"
on public.admin_2fa_challenges;

create policy "Service role full access for admin 2fa challenges"
on public.admin_2fa_challenges
for all
to service_role
using (true)
with check (true);

grant select, insert, update, delete
on table public.admin_2fa_challenges
to service_role;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rating integer not null check (rating between 1 and 5),
  message text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  created_at timestamptz not null default now()
);

create index if not exists reviews_status_created_at_idx
on public.reviews(status, created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "Service role full access for reviews"
on public.reviews;

create policy "Service role full access for reviews"
on public.reviews
for all
to service_role
using (true)
with check (true);

grant select, insert, update, delete
on table public.reviews
to service_role;

create index if not exists admin_audit_logs_table_created_idx
on public.admin_audit_logs(table_name, created_at desc);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "Service role full access for admin audit logs"
on public.admin_audit_logs;

create policy "Service role full access for admin audit logs"
on public.admin_audit_logs
for all
to service_role
using (true)
with check (true);

grant select, insert, update, delete
on table public.admin_audit_logs
to service_role;

do $$
begin
  if to_regclass('public.admin_audit_logs_id_seq') is not null then
    grant usage, select on sequence public.admin_audit_logs_id_seq to service_role;
  end if;
end;
$$;

create or replace function public.write_admin_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  record_identifier text;
begin
  if tg_op = 'DELETE' then
    record_identifier := old.id::text;

    insert into public.admin_audit_logs(table_name, record_id, action, old_data, new_data)
    values (tg_table_name, record_identifier, tg_op, to_jsonb(old), null);

    return old;
  end if;

  record_identifier := new.id::text;

  insert into public.admin_audit_logs(table_name, record_id, action, old_data, new_data)
  values (
    tg_table_name,
    record_identifier,
    tg_op,
    case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
    to_jsonb(new)
  );

  return new;
end;
$$;

do $$
declare
  v_table_names text[] := array[
    'appointments',
    'patients',
    'prescriptions',
    'prescription_visits',
    'appointment_payments',
    'reviews'
  ];
  v_table_name text;
begin
  foreach v_table_name in array v_table_names loop
    if to_regclass('public.' || v_table_name) is not null then
      execute format(
        'drop trigger if exists %I on public.%I;',
        'trg_admin_audit_' || v_table_name,
        v_table_name
      );

      execute format(
        'create trigger %I after insert or update or delete on public.%I for each row execute function public.write_admin_audit_log();',
        'trg_admin_audit_' || v_table_name,
        v_table_name
      );
    end if;
  end loop;
end;
$$;
