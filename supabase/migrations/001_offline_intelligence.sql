create extension if not exists pgcrypto;

create type person_lifecycle as enum ('applicant', 'member', 'alumni', 'prospect');
create type enrichment_status as enum ('not_started', 'processing', 'complete', 'failed');
create type duplicate_level as enum ('exact', 'probable', 'possible');
create type duplicate_status as enum ('pending', 'merged', 'kept_separate', 'review_later');
create type introduction_status as enum ('suggested', 'approved', 'dismissed', 'introduced');

create table people (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null default '',
  full_name text not null,
  email text,
  normalized_email text,
  phone text,
  normalized_phone text,
  linkedin_url text,
  normalized_linkedin_url text,
  company text,
  normalized_company text,
  job_title text,
  location text,
  industry text,
  person_type text check (person_type in ('founder','operator','investor','advisor','other')),
  lifecycle_status person_lifecycle not null,
  bio text,
  application_answer text,
  interests jsonb not null default '[]',
  expertise jsonb not null default '[]',
  looking_for jsonb not null default '[]',
  can_help_with jsonb not null default '[]',
  profile_summary text,
  completeness_score smallint not null default 0 check (completeness_score between 0 and 100),
  data_issues jsonb not null default '[]',
  source text not null,
  enrichment_status enrichment_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index people_normalized_email_unique on people(normalized_email) where normalized_email is not null;
create index people_lifecycle_fit_lookup on people(lifecycle_status, created_at desc);
create index people_company_lookup on people(normalized_company);
create index people_data_issues_gin on people using gin(data_issues);

create table raw_import_records (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null,
  source text not null,
  source_row_number integer,
  raw_payload jsonb not null,
  validation_issues jsonb not null default '[]',
  person_id uuid references people(id) on delete set null,
  created_at timestamptz not null default now()
);
create index raw_import_batch_lookup on raw_import_records(import_batch_id, source_row_number);

create table processing_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('queued','processing','complete','failed')),
  stage text,
  input_count integer not null default 0,
  processed_count integer not null default 0,
  error_summary jsonb not null default '[]',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index processing_runs_recent on processing_runs(created_at desc);

create table duplicate_candidates (
  id uuid primary key default gen_random_uuid(),
  person_a_id uuid not null references people(id) on delete cascade,
  person_b_id uuid not null references people(id) on delete cascade,
  confidence smallint not null check (confidence between 0 and 100),
  level duplicate_level not null,
  reasons jsonb not null default '[]',
  status duplicate_status not null default 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (person_a_id <> person_b_id),
  unique(person_a_id, person_b_id)
);
create index duplicate_review_queue on duplicate_candidates(status, level, confidence desc);

create table fit_assessments (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people(id) on delete cascade,
  model_version text not null,
  total_score smallint not null check (total_score between 0 and 100),
  breakdown jsonb not null,
  ai_inputs jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index fit_assessments_person_recent on fit_assessments(person_id, created_at desc);

create table introduction_recommendations (
  id uuid primary key default gen_random_uuid(),
  person_a_id uuid not null references people(id) on delete cascade,
  person_b_id uuid not null references people(id) on delete cascade,
  compatibility_score smallint not null check (compatibility_score between 0 and 100),
  reasons jsonb not null default '[]',
  explanation text not null,
  draft_message text not null,
  status introduction_status not null default 'suggested',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (person_a_id <> person_b_id),
  unique(person_a_id, person_b_id)
);
create index introductions_review_queue on introduction_recommendations(status, compatibility_score desc);

create table activity_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  event_type text not null,
  subject_type text not null,
  subject_id text,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index activity_events_recent on activity_events(created_at desc);
create index activity_events_subject on activity_events(subject_type, subject_id, created_at desc);
