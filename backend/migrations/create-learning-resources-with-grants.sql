-- Learning resources: core QA-tracked items.
-- Applied live on 2026-10-21 via runMigration. Idempotent (safe to re-run).
create table if not exists public.learning_resources (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text not null,
  resource_type text not null,
  learning_area text not null,
  grade_level text not null,
  quarter text not null,
  developer text not null,
  division text not null default 'SDO Batangas',
  school text not null default '',
  sub_office text not null default '',
  date_submitted timestamptz not null default now(),
  status text not null default 'submitted',
  evaluation_phase text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  checking_items jsonb,
  position text,
  week text,
  additional_authors jsonb default '[]'::jsonb,
  submitted_by_email text
);

alter table public.learning_resources enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'learning_resources' and policyname = 'Public read on learning_resources') then
    create policy "Public read on learning_resources" on public.learning_resources for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'learning_resources' and policyname = 'Public insert on learning_resources') then
    create policy "Public insert on learning_resources" on public.learning_resources for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'learning_resources' and policyname = 'Public update on learning_resources') then
    create policy "Public update on learning_resources" on public.learning_resources for update using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'learning_resources' and policyname = 'Public delete on learning_resources') then
    create policy "Public delete on learning_resources" on public.learning_resources for delete using (true);
  end if;
end $$;

-- Grants for the Supabase API roles (same migration as table creation).
grant select, insert, update, delete on table public.learning_resources to anon, authenticated;
