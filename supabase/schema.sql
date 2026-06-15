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
on public.appointments(date, time);
