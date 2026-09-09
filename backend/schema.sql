-- JobMatch backend template (Neon Postgres)
-- Wire after Clerk + Neon. Entitlements live here, not in localStorage.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique,
  email text not null unique,
  plan text not null default 'free' check (plan in ('free', 'founding')),
  founding_locked boolean not null default false,
  free_run_at timestamptz,
  last_run_date date,
  stripe_customer_id text unique,
  stripe_subscription_id text,
  notify_granted boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  blob_url text,
  file_name text,
  raw_text text,
  skills text[] not null default '{}',
  titles text[] not null default '{}',
  seniority text not null default 'mid',
  cities text[] not null default '{}',
  years integer not null default 3,
  created_at timestamptz not null default now()
);

create index if not exists resumes_user_idx on resumes (user_id, created_at desc);

create table if not exists jobs (
  id text primary key,
  title text not null,
  company text not null,
  city text not null,
  province text not null,
  work_style text not null,
  source text not null,
  canonical_url text not null, -- employer careers URL only; never LinkedIn, Indeed, or another board
  skills text[] not null default '{}',
  seniority text not null default 'mid',
  salary text,
  posted_at timestamptz,
  closes_at timestamptz,
  applicants integer,
  summary text not null default '',
  ingested_at timestamptz not null default now()
);

create unique index if not exists jobs_url_idx on jobs (canonical_url);

create table if not exists match_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  seed_date date not null,
  generated_at timestamptz not null default now(),
  unique (user_id, seed_date)
);

create table if not exists match_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references match_runs(id) on delete cascade,
  job_id text not null references jobs(id),
  rank integer not null,
  score integer not null,
  source text not null,
  matched_skills text[] not null default '{}',
  missing_skills text[] not null default '{}'
);

create index if not exists match_items_run_idx on match_items (run_id, rank);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  job_id text not null,
  status text not null check (status in ('saved', 'applied', 'interview', 'offer')),
  at timestamptz not null default now(),
  unique (user_id, job_id)
);

create table if not exists billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  stripe_event_id text unique,
  type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text,
  auth text,
  created_at timestamptz not null default now()
);
