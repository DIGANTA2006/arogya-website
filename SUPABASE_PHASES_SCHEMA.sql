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
