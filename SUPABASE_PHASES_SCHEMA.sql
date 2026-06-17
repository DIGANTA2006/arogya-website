-- Run in Supabase SQL Editor for full clinic workflow

alter table patients add column if not exists mobile_verified boolean default false;

create table if not exists mobile_otps (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  verified boolean default false,
  created_at timestamptz default now()
);
create index if not exists mobile_otps_phone_idx on mobile_otps(phone);

create table if not exists prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_email text not null,
  appointment_id uuid,
  title text not null,
  file_path text not null,
  secure_token text unique not null,
  next_therapy_date date,
  next_appointment_date date,
  reminder_sent boolean default false,
  created_at timestamptz default now()
);
create index if not exists prescriptions_patient_email_idx on prescriptions(patient_email);
create index if not exists prescriptions_secure_token_idx on prescriptions(secure_token);

-- Create private Supabase Storage bucket named: prescriptions
-- Keep the bucket private. Downloads use signed URLs.

alter table appointments add column if not exists online_link text;
alter table appointments add column if not exists confirmation_sent boolean default false;

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
-- Phase 8D: Simple UPI payment system without Razorpay
-- =====================================================

create table if not exists public.appointment_payments (
  id uuid primary key default gen_random_uuid(),

  appointment_id uuid not null,
  patient_email text not null,
  patient_name text,
  patient_mobile text,

  amount numeric(10,2),
  payment_method text not null default 'upi',
  upi_id text,
  transaction_ref text,
  screenshot_url text,

  status text not null default 'pending',
  admin_note text,

  submitted_at timestamptz,
  verified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint appointment_payments_status_check
    check (status in ('pending', 'submitted', 'paid', 'rejected')),

  constraint appointment_payments_method_check
    check (payment_method in ('upi'))
);

create index if not exists appointment_payments_appointment_id_idx
on public.appointment_payments(appointment_id);

create index if not exists appointment_payments_patient_email_idx
on public.appointment_payments(patient_email);

create index if not exists appointment_payments_status_idx
on public.appointment_payments(status);

create or replace function public.set_appointment_payments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_appointment_payments_updated_at on public.appointment_payments;

create trigger trg_appointment_payments_updated_at
before update on public.appointment_payments
for each row
execute function public.set_appointment_payments_updated_at();

alter table public.appointment_payments enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Access is handled through secure Next.js API routes using portal cookies.
-- Do not add broad public select/insert/update policies for this table.

-- =========================================================
-- FINAL PRODUCTION RLS HARDENING
-- Arogya Speech Therapy & Hearing Care
-- =========================================================
-- Purpose:
-- 1. Enable RLS on sensitive public medical tables.
-- 2. Remove direct anon/authenticated table access.
-- 3. Keep server-side service_role access working.
--
-- Important:
-- Do NOT use FORCE ROW LEVEL SECURITY here because the
-- Next.js server APIs use SUPABASE_SERVICE_ROLE_KEY.
-- =========================================================

do $$
declare
  table_names text[] := array[
    'patients',
    'appointments',
    'prescriptions',
    'prescription_visits',
    'mobile_otps',
    'reviews',
    'appointment_payments',
    'password_reset_requests',
    'email_verification_tokens'
  ];
  table_name text;
begin
  foreach table_name in array table_names
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I enable row level security;', table_name);

      execute format('revoke all on table public.%I from anon;', table_name);
      execute format('revoke all on table public.%I from authenticated;', table_name);

      execute format('grant select, insert, update, delete on table public.%I to service_role;', table_name);
    end if;
  end loop;
end $$;

update storage.buckets
set public = false
where id = 'payment-proofs';

grant select, insert, update, delete
on table storage.objects
to service_role;

grant select
on table storage.buckets
to service_role;

-- Verification query:
-- select schemaname, tablename, rowsecurity as rls_enabled
-- from pg_tables
-- where schemaname = 'public'
--   and tablename in (
--     'patients',
--     'appointments',
--     'prescriptions',
--     'prescription_visits',
--     'mobile_otps',
--     'reviews',
--     'appointment_payments',
--     'password_reset_requests',
--     'email_verification_tokens'
--   )
-- order by tablename;

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

-- =====================================================
-- Phase 9A.2: Safe non-blocking admin audit trigger
-- Purpose:
-- Audit logging must never block payment verification or appointment updates.
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
alter column table_name drop not null;

alter table public.admin_audit_logs
alter column action drop not null;

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
  v_record_identifier text := null;
  v_table_name text := coalesce(TG_TABLE_NAME, TG_RELNAME, 'unknown');
  v_action text := coalesce(TG_OP, 'UNKNOWN');
begin
  begin
    if TG_OP = 'DELETE' then
      v_record_identifier := old.id::text;

      insert into public.admin_audit_logs(
        table_name,
        record_id,
        action,
        old_data,
        new_data
      )
      values (
        v_table_name,
        v_record_identifier,
        v_action,
        to_jsonb(old),
        null
      );

      return old;
    end if;

    v_record_identifier := new.id::text;

    insert into public.admin_audit_logs(
      table_name,
      record_id,
      action,
      old_data,
      new_data
    )
    values (
      v_table_name,
      v_record_identifier,
      v_action,
      case when TG_OP = 'UPDATE' then to_jsonb(old) else null end,
      to_jsonb(new)
    );

    return new;
  exception when others then
    raise warning 'Admin audit log skipped for %.% operation %: %',
      TG_TABLE_SCHEMA,
      TG_TABLE_NAME,
      TG_OP,
      SQLERRM;

    if TG_OP = 'DELETE' then
      return old;
    end if;

    return new;
  end;
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
