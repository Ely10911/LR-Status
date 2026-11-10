-- Enable realtime replication for the learning_resources and resource_history
-- tables so the app re-fetches (via Supabase Realtime postgres_changes) the
-- moment another user adds a remark, checklist tick, or new LR.
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
end $$;
