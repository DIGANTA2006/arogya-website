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
