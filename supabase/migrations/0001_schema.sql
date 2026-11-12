create extension if not exists pgcrypto;

create type app_role as enum ('halka_karamchari', 'revenue_officer', 'circle_officer');
create type app_step as enum ('SCRUTINY', 'FIELD_ENQUIRY', 'NOTICE_OBJECTION', 'HEARING_RECOMMENDATION', 'FINAL_ORDER');
create type app_status as enum ('IN_PROGRESS', 'APPROVED', 'REJECTED', 'RETURNED_TO_APPLICANT');
create type ai_outcome as enum ('PENDING', 'ACCEPTED', 'EDITED', 'DISCARDED');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role app_role not null,
  anchal text not null default 'डेमो अंचल'
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  case_no text not null unique,
  applicant_name text not null,
  applicant_phone text,
  transaction_type text not null check (transaction_type in ('SALE', 'INHERITANCE', 'GIFT')),
  mauza text not null,
  khata_no text not null,
  khesra_no text not null,
  area_decimal numeric(10,2) not null check (area_decimal > 0),
  deed_no text,
  deed_date date,
  deed_text text,
  received_on date not null,
  due_on date not null,
  current_step app_step not null default 'SCRUTINY',
  status app_status not null default 'IN_PROGRESS',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index applications_queue_idx on applications (status, due_on);

-- one row per step, holds that step's form data as JSON
create table step_records (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications (id) on delete cascade,
  step app_step not null,
  data jsonb not null default '{}'::jsonb,
  updated_by uuid references profiles (id),
  updated_at timestamptz not null default now(),
  unique (application_id, step)
);

-- history: rows are only ever added
create table audit_events (
  id bigint generated always as identity primary key,
  application_id uuid not null references applications (id) on delete cascade,
  actor_id uuid references profiles (id),
  actor_role app_role,
  event_type text not null check (event_type in (
    'CREATED', 'FORWARDED', 'RETURNED', 'APPROVED', 'REJECTED',
    'RETURNED_TO_APPLICANT', 'AI_SUGGESTION_USED', 'NOTE_SAVED')),
  from_step app_step,
  to_step app_step,
  note text,
  created_at timestamptz not null default now()
);
create index audit_app_idx on audit_events (application_id, created_at);

create function block_audit_changes() returns trigger as $$
begin
  raise exception 'audit_events is append-only';
end;
$$ language plpgsql;

create trigger audit_no_update_delete
  before update or delete on audit_events
  for each row execute function block_audit_changes();

-- every AI answer is stored with what the worker did with it
create table ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications (id) on delete cascade,
  step app_step not null,
  kind text not null,
  output jsonb not null,
  provider text not null,
  model text,
  latency_ms integer,
  outcome ai_outcome not null default 'PENDING',
  final_text text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- security: logged-in users can read, nobody can write from the browser
alter table profiles enable row level security;
alter table applications enable row level security;
alter table step_records enable row level security;
alter table audit_events enable row level security;
alter table ai_suggestions enable row level security;

create policy read_profiles on profiles for select to authenticated using (true);
create policy read_applications on applications for select to authenticated using (true);
create policy read_step_records on step_records for select to authenticated using (true);
create policy read_audit on audit_events for select to authenticated using (true);
create policy read_ai on ai_suggestions for select to authenticated using (true);

-- Note: to wipe demo data use: truncate applications cascade;
-- (TRUNCATE is not blocked by the audit trigger; DELETE is, on purpose.)
