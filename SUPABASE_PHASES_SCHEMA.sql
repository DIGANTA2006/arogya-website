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
on public.appointments(date, time);

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
