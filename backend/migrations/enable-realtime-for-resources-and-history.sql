-- Enable realtime replication for the learning_resources, resource_history,
-- visitors, and certificate_requests tables so the app re-fetches (via Supabase
-- Realtime postgres_changes) the moment another user adds a remark, checklist
-- tick, new LR, visitor entry, or certificate request.
-- Idempotent (safe to re-run).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'learning_resources'
  ) then
    alter publication supabase_realtime add table public.learning_resources;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'resource_history'
  ) then
    alter publication supabase_realtime add table public.resource_history;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'visitors'
  ) then
    alter publication supabase_realtime add table public.visitors;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'certificate_requests'
  ) then
    alter publication supabase_realtime add table public.certificate_requests;
  end if;
end $$;
