-- DEMO AND DEVELOPMENT ONLY: Remove before any real deployment.
-- Allows the service role to wipe synthetic data during seed re-runs,
-- safely cascading across applications, step_records, and audit_events.

create or replace function truncate_demo_data() returns void as $$
begin
  set search_path = public;
  truncate table applications cascade;
end;
$$ language plpgsql security definer;

revoke execute on function truncate_demo_data() from public, anon, authenticated;
grant execute on function truncate_demo_data() to service_role;
